#!/usr/bin/env -S node --experimental-strip-types
// camera-bridge.mts — Phase 1 spike: the missing device-side half of the
// camera relay (functions/src/schoolPlatform.ts's createCameraRelaySession /
// cameraRelaySignal already exist; this is what answers them).
//
// NOT YET TESTED against a real camera or a real ffmpeg run - no ffmpeg
// binary was available in the environment this was written in. Written from
// verified library APIs (werift's actual .d.ts files, inspected directly -
// not guessed) but the end-to-end pipeline needs proving on real hardware.
// See docs/CAMERA_RELAY_BRIDGE.md for the full design notes and how to test.
//
// Runs on the SAME LAN as the camera(s) it serves - a Raspberry Pi, a home
// server, a NAS, or the same box as this express-api, your choice. Standalone
// on purpose: it's a separate process from the MQTT broker/API server so it
// can be deployed independently of them.
//
// Pipeline per viewer session:
//   ESP32-CAM MJPEG --ffmpeg (encode+RTP-packetize)--> loopback UDP --> werift
//   RTCPeerConnection --(TURN)--> browser
// ffmpeg does the encode + RTP packetization (a mature, well-tested muxer);
// werift only owns the WebRTC transport (ICE/DTLS-SRTP/signaling). A pure-JS
// software VP8 encoder was the other option (werift's own dependency,
// mediabunny, ships container demux/mux but expects YOU to supply a
// CustomVideoEncoder) - ffmpeg is the more realistic choice on constrained
// hardware (a Pi), not a guess.
//
// Session discovery: createCameraRelaySession only writes to Firestore
// (cameraRelaySessions/{id}), it can't reach into your LAN to tell this
// bridge a viewer is waiting - Cloud Functions have no path to a home
// network. So this bridge listens to Firestore directly (Admin SDK,
// onSnapshot - a real push, not polling) instead. No Cloud Function changes
// were needed for this - the session doc already carries everything.
//
// Prerequisites:
//   - ffmpeg on PATH (apt/brew/choco install ffmpeg, or a static build).
//   - A Firebase service account JSON (FIREBASE_ADMIN_SDK_PATH or
//     GOOGLE_APPLICATION_CREDENTIALS - reuses the same config the rest of
//     express-api already uses).
//   - TURN_URLS / TURN_SHARED_SECRET (same vars as functions/.env - see
//     README's self-hosting section and docs/SCHOOL_PLATFORM_OPERATIONS.md).
//   - CAMERA_BRIDGE_DEVICES="deviceId1=http://cam1.local/stream,deviceId2=http://cam2.local/stream"
//
// Run: npx tsx tools/camera-bridge.mts

import "dotenv/config";
import { spawn, type ChildProcess } from "node:child_process";
import { createHmac } from "node:crypto";
import dgram from "node:dgram";
import admin from "firebase-admin";
import { RTCPeerConnection, MediaStreamTrack, RtpPacket, type RTCIceServer } from "werift";
import { getFirestoreAdmin, initializeFirebaseAdmin } from "../backend/src/config/firebase-admin.js";

interface CameraEntry {
  deviceId: string;
  streamUrl: string;
}

function parseDevices(): CameraEntry[] {
  const raw = process.env.CAMERA_BRIDGE_DEVICES || "";
  const entries = raw.split(",").map((e) => e.trim()).filter(Boolean);
  if (!entries.length) {
    throw new Error('Set CAMERA_BRIDGE_DEVICES="deviceId=http://cam.local/stream,..."');
  }
  return entries.map((entry) => {
    const eq = entry.indexOf("=");
    if (eq < 0) throw new Error(`Invalid CAMERA_BRIDGE_DEVICES entry "${entry}" - want deviceId=url`);
    return { deviceId: entry.slice(0, eq).trim(), streamUrl: entry.slice(eq + 1).trim() };
  });
}

/**
 * Same coturn REST-auth scheme as createCameraRelaySession
 * (functions/src/schoolPlatform.ts) - mirrored here rather than shared
 * across packages, since functions/ and express-api/ are separately
 * deployed. The bridge mints its own short-lived pair; it does not need to
 * match the viewer's credential, only the same TURN_SHARED_SECRET.
 */
function mintTurnCredential(label: string): { username: string; credential: string } {
  const secret = process.env.TURN_SHARED_SECRET || "";
  if (!secret) throw new Error("TURN_SHARED_SECRET is not set");
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const username = `${expiresAt}:bridge:${label}`;
  const credential = createHmac("sha1", secret).update(username).digest("base64");
  return { username, credential };
}

function iceServersFor(deviceId: string): RTCIceServer[] {
  const turnUrls = String(process.env.TURN_URLS || "").split(",").map((u) => u.trim()).filter(Boolean);
  const servers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  if (turnUrls.length) {
    const { username, credential } = mintTurnCredential(deviceId);
    servers.push({ urls: turnUrls, username, credential });
  }
  return servers;
}

interface SignalDoc {
  kind: "offer" | "answer" | "candidate" | "ready" | "close";
  payload: unknown;
  sender: string;
  createdAt: admin.firestore.Timestamp | null;
}

/** One ffmpeg transcode + UDP relay + RTCPeerConnection per active viewer session. */
class ActiveSession {
  private pc: RTCPeerConnection;
  private track: MediaStreamTrack;
  private ffmpeg: ChildProcess | null = null;
  private udp: dgram.Socket | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastSignalMs = 0;
  private lastFfmpegLog = "";
  private stopped = false;

  constructor(private sessionId: string, private streamUrl: string, deviceId: string) {
    this.pc = new RTCPeerConnection({ iceServers: iceServersFor(deviceId) });
    this.track = new MediaStreamTrack({ kind: "video" });
    this.pc.addTrack(this.track);
    this.pc.onIceCandidate.subscribe((candidate) => {
      if (candidate) void this.postSignal("candidate", candidate.toJSON());
    });
  }

  async start(): Promise<void> {
    const initial = await this.readSignals();
    const offer = initial.find((s) => s.kind === "offer");
    if (!offer) throw new Error(`Session ${this.sessionId} has no offer yet`);
    await this.pc.setRemoteDescription(offer.payload as never);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.postSignal("answer", { type: answer.type, sdp: answer.sdp });

    this.startTranscode();
    this.pollTimer = setInterval(() => void this.poll(), 1500);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.ffmpeg?.kill("SIGTERM");
    this.udp?.close();
    void this.pc.close();
  }

  private startTranscode(): void {
    const udpPort = 40000 + Math.floor(Math.random() * 10000);
    this.udp = dgram.createSocket("udp4");
    this.udp.on("message", (msg) => {
      try {
        this.track.writeRtp(RtpPacket.deSerialize(msg));
      } catch {
        // A partial/malformed datagram - drop it, the next packet carries on.
        // Real video codecs (VP8 included) tolerate the occasional lost
        // packet; this is not a fatal condition for the stream.
      }
    });
    this.udp.bind(udpPort, "127.0.0.1");

    this.ffmpeg = spawn("ffmpeg", [
      "-re", "-i", this.streamUrl,
      "-an",
      "-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8",
      "-b:v", "600k",
      "-f", "rtp", `rtp://127.0.0.1:${udpPort}`,
    ], { stdio: ["ignore", "ignore", "pipe"] });

    this.ffmpeg.stderr?.on("data", (chunk: Buffer) => { this.lastFfmpegLog = chunk.toString(); });
    this.ffmpeg.on("exit", (code) => {
      if (code !== 0 && !this.stopped) {
        console.error(`[bridge] ffmpeg exited (${code}) for session ${this.sessionId}:\n${this.lastFfmpegLog.slice(-800)}`);
      }
    });
  }

  private signalsRef() {
    return getFirestoreAdmin().collection("cameraRelaySessions").doc(this.sessionId).collection("signals");
  }

  private async readSignals(): Promise<SignalDoc[]> {
    const snap = await this.signalsRef().orderBy("createdAt", "asc").get();
    const docs = snap.docs.map((d) => d.data() as SignalDoc);
    for (const d of docs) this.lastSignalMs = Math.max(this.lastSignalMs, d.createdAt?.toMillis() ?? 0);
    return docs;
  }

  private async poll(): Promise<void> {
    if (this.stopped) return;
    const snap = await this.signalsRef().orderBy("createdAt", "asc").get();
    for (const doc of snap.docs) {
      const data = doc.data() as SignalDoc;
      const ms = data.createdAt?.toMillis() ?? 0;
      if (ms <= this.lastSignalMs || data.sender !== "viewer") continue;
      this.lastSignalMs = ms;
      if (data.kind === "candidate" && data.payload) {
        await this.pc.addIceCandidate(data.payload as never).catch(() => {});
      } else if (data.kind === "close") {
        this.stop();
      }
    }
  }

  private async postSignal(kind: string, payload: unknown): Promise<void> {
    await this.signalsRef().add({
      kind,
      payload: payload ?? null,
      sender: "bridge",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function main(): Promise<void> {
  const devices = parseDevices();
  initializeFirebaseAdmin();
  const db = getFirestoreAdmin();
  const active = new Map<string, ActiveSession>();

  console.log(`[bridge] watching ${devices.length} camera(s): ${devices.map((d) => d.deviceId).join(", ")}`);

  for (const { deviceId, streamUrl } of devices) {
    db.collection("cameraRelaySessions")
      .where("deviceId", "==", deviceId)
      .where("status", "==", "created")
      .onSnapshot((snap) => {
        for (const change of snap.docChanges()) {
          if (change.type !== "added" || active.has(change.doc.id)) continue;
          const sessionId = change.doc.id;
          console.log(`[bridge] new viewer session ${sessionId} for ${deviceId}`);
          const session = new ActiveSession(sessionId, streamUrl, deviceId);
          active.set(sessionId, session);
          session.start().catch((err) => {
            console.error(`[bridge] session ${sessionId} failed:`, err instanceof Error ? err.message : err);
            session.stop();
            active.delete(sessionId);
          });
        }
      }, (err) => console.error(`[bridge] Firestore listener error for ${deviceId}:`, err));
  }

  process.on("SIGINT", () => {
    for (const session of active.values()) session.stop();
    process.exit(0);
  });
}

void main();

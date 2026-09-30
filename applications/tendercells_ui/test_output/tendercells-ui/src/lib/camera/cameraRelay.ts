// cameraRelay.ts - client half of the authenticated HTTPS/WebRTC camera relay.
//
// Server side (functions/src/schoolPlatform.ts, already built and reviewed):
//   createCameraRelaySession(deviceId)  - callable, verifies device ownership +
//                                         managed-relay access, returns a
//                                         short-lived session token + TURN creds.
//   cameraRelaySignal                   - onRequest HTTPS, exchanges offer/
//                                         answer/ICE for that session only.
//
// This module is the OTHER half: create the RTCPeerConnection, send our offer,
// poll for the device/bridge's answer + ICE candidates, surface the resulting
// video track. It does NOT make cameras go live by itself - nothing on the
// device/bridge side speaks WebRTC yet (see docs/DEVICE_UI_AND_SECURE_VIDEO.md
// "Open work"). Until that exists, this will correctly reach "waiting for
// device" and then time out - that's an honest, expected result, not a bug
// in this file.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/firebaseApp';

export type CameraRelayState =
  | 'idle'
  | 'requesting-session'
  | 'connecting'
  | 'waiting-for-device'
  | 'connected'
  | 'error';

interface RelaySessionResponse {
  sessionId: string;
  token: string;
  expiresAt: number;
  iceServers: RTCIceServer[];
}

interface RelaySignal {
  id: string;
  kind: 'offer' | 'answer' | 'candidate' | 'ready' | 'close';
  payload: unknown;
  sender: string;
  createdAt: number;
}

const POLL_INTERVAL_MS = 1500;
// No device/bridge answers today (see module header) - fail with a clear
// message instead of leaving the viewer spinning forever.
const WAITING_FOR_DEVICE_TIMEOUT_MS = 20_000;

function relayFunctionsBaseUrl(): string {
  const projectId = app?.options.projectId;
  // Matches this project's Cloud Functions deploy - no functions use
  // .region(), so they're all on the SDK default (us-central1).
  return `https://us-central1-${projectId}.cloudfunctions.net`;
}

async function postSignal(sessionId: string, token: string, kind: RelaySignal['kind'], payload: unknown): Promise<void> {
  const res = await fetch(`${relayFunctionsBaseUrl()}/cameraRelaySignal?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId, kind, payload, sender: 'viewer' }),
  });
  if (!res.ok) throw new Error(`Relay signal rejected (${res.status})`);
}

async function getSignals(sessionId: string, token: string, after: number): Promise<RelaySignal[]> {
  const res = await fetch(
    `${relayFunctionsBaseUrl()}/cameraRelaySignal?sessionId=${encodeURIComponent(sessionId)}&after=${after}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Relay poll failed (${res.status})`);
  const data = await res.json() as { signals: RelaySignal[] };
  return data.signals || [];
}

/**
 * Drives one camera relay viewing session for `deviceId` while `enabled` is
 * true. Tears down the peer connection and stops polling on disable/unmount.
 */
export function useCameraRelay(deviceId: string | undefined, enabled: boolean) {
  const [state, setState] = useState<CameraRelayState>('idle');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollTimerRef = useRef<number | undefined>();
  const waitTimeoutRef = useRef<number | undefined>();
  const lastSignalTsRef = useRef(0);
  const stoppedRef = useRef(false);

  const teardown = useCallback(() => {
    stoppedRef.current = true;
    window.clearInterval(pollTimerRef.current);
    window.clearTimeout(waitTimeoutRef.current);
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setVideoStream(null);
  }, []);

  useEffect(() => {
    if (!enabled || !deviceId || !app) {
      teardown();
      setState('idle');
      return;
    }

    stoppedRef.current = false;
    setState('requesting-session');
    setErrorMessage(undefined);

    let sessionId = '';
    let sessionToken = '';

    const fail = (message: string) => {
      if (stoppedRef.current) return;
      setErrorMessage(message);
      setState('error');
      teardown();
    };

    const pollLoop = async () => {
      if (stoppedRef.current) return;
      try {
        const signals = await getSignals(sessionId, sessionToken, lastSignalTsRef.current);
        for (const signal of signals) {
          lastSignalTsRef.current = Math.max(lastSignalTsRef.current, signal.createdAt);
          if (signal.sender === 'viewer' || !pcRef.current) continue;
          if (signal.kind === 'answer') {
            window.clearTimeout(waitTimeoutRef.current);
            await pcRef.current.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
            setState('connected');
          } else if (signal.kind === 'candidate' && signal.payload) {
            await pcRef.current.addIceCandidate(signal.payload as RTCIceCandidateInit).catch(() => {});
          } else if (signal.kind === 'close') {
            fail('The camera bridge ended the session.');
          }
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Lost contact with the relay.');
      }
    };

    (async () => {
      try {
        const createSession = httpsCallable<{ deviceId: string }, RelaySessionResponse>(
          getFunctions(app), 'createCameraRelaySession'
        );
        const { data: session } = await createSession({ deviceId });
        if (stoppedRef.current) return;
        sessionId = session.sessionId;
        sessionToken = session.token;

        setState('connecting');
        const pc = new RTCPeerConnection({ iceServers: session.iceServers });
        pcRef.current = pc;
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.ontrack = (event) => {
          if (stoppedRef.current) return;
          setVideoStream(event.streams[0] ?? null);
          setState('connected');
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) void postSignal(sessionId, sessionToken, 'candidate', event.candidate.toJSON());
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postSignal(sessionId, sessionToken, 'offer', offer);

        setState('waiting-for-device');
        waitTimeoutRef.current = window.setTimeout(
          () => fail('No camera bridge answered. The device-side relay for this camera is not running yet.'),
          WAITING_FOR_DEVICE_TIMEOUT_MS
        );
        pollTimerRef.current = window.setInterval(() => void pollLoop(), POLL_INTERVAL_MS);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Could not start a relay session for this camera.');
      }
    })();

    return () => {
      teardown();
      if (sessionId && sessionToken) void postSignal(sessionId, sessionToken, 'close', null).catch(() => {});
    };
  }, [deviceId, enabled, teardown]);

  return { state, videoStream, errorMessage };
}

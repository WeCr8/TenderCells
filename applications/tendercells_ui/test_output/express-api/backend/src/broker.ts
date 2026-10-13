// broker.ts
// Optional embedded MQTT broker so the whole platform runs with zero external
// install — important for schools and first-time developers who should not have
// to install Mosquitto to see a device work.
//
// Enabled by default. Set EMBED_BROKER=0 to disable and point MQTT_BROKER at an
// external broker (e.g. Mosquitto on a Raspberry Pi) for real deployments.
//
// This file is imported first by server.ts so the broker is listening before the
// MQTT bridge tries to connect. If the port is already taken we assume a real
// broker is running and step aside.

import Aedes from "aedes";
import { createServer } from "net";
import { Bonjour } from "bonjour-service";
import { brokerCredentials, credentialsMatch, keyTopicRefusal } from "./brokerAuth.js";
import { looksLikeApiKey, verifyApiKey, type ApiKeyPrincipal } from "./apiKeys.js";
import { AUTH_ENABLED, loadApiKeyRecord, loadDeviceDoc } from "./middleware/auth.js";
import { deviceOwner } from "./ownership.js";

const EMBED = process.env.EMBED_BROKER !== "0";
const MQTT_PORT = Number(process.env.MQTT_PORT || 1883);
// Advertise the broker over mDNS (_mqtt._tcp) so ESP32 nodes auto-discover it and
// learners never type an IP. Set MDNS_ADVERTISE=0 to disable on locked-down nets.
const MDNS_ADVERTISE = process.env.MDNS_ADVERTISE !== "0";

// Publish the _mqtt._tcp service. Soft-fail: a network that blocks multicast must
// not take down the broker (devices can still be given the IP by hand).
function advertiseBroker() {
  if (!MDNS_ADVERTISE) return;
  try {
    const bonjour = new Bonjour();
    bonjour.publish({ name: "TenderCells Broker", type: "mqtt", port: MQTT_PORT });
    console.log(`✓ mDNS: advertising broker as _mqtt._tcp on port ${MQTT_PORT}`);
    console.log("  (devices can leave Broker IP blank to auto-find it)");
  } catch {
    console.log("• mDNS advertise unavailable — devices must use the broker IP directly");
  }
}

if (EMBED) {
  // Optional device credentials (TC_MQTT_USERNAME / TC_MQTT_PASSWORD, see brokerAuth.ts), and
  // per-device API keys when accounts are on (password = tck_…, fenced to its own topics).
  const creds = brokerCredentials();
  const keyed = new Map<object, ApiKeyPrincipal>();
  const owns = (uid: string) => async (deviceId: string) => deviceOwner(await loadDeviceDoc(deviceId)) === uid;
  const aedes = new Aedes({
    authenticate: (client, username, password, done) => {
      const pass = password?.toString("utf8");
      if (AUTH_ENABLED && looksLikeApiKey(pass)) {
        verifyApiKey(pass, (id) => loadApiKeyRecord(id))
          .then((out) => {
            if ("error" in out) { console.warn(`[broker] refused ${client?.id ?? "?"}: ${out.error}`); return done(null, false); }
            keyed.set(client, out);
            done(null, true);
          })
          .catch(() => done(null, false));
        return;
      }
      if (creds) return done(null, credentialsMatch(creds, username, password));
      // No broker credentials configured: open LAN broker (classroom default) - but a
      // malformed or unusable key is refused rather than silently ignored.
      done(null, !pass?.startsWith("tck_"));
    },
    authorizePublish: (client, packet, done) => {
      const p = client ? keyed.get(client) : undefined;
      if (!p) return done(null);
      keyTopicRefusal(p, "publish", packet.topic, owns(p.uid))
        .then((why) => done(why ? new Error(why) : null))
        .catch(() => done(new Error("ownership check failed")));
    },
    authorizeSubscribe: (client, sub, done) => {
      const p = client ? keyed.get(client) : undefined;
      if (!p) return done(null, sub);
      keyTopicRefusal(p, "subscribe", sub.topic, owns(p.uid))
        .then((why) => done(why ? new Error(why) : null, why ? null : sub))
        .catch(() => done(new Error("ownership check failed"), null));
    },
  });
  if (creds) console.log("✓ MQTT broker requires TC_MQTT_USERNAME / TC_MQTT_PASSWORD (or a device API key)");
  else if (AUTH_ENABLED) console.log("• MQTT broker accepts device API keys; set TC_MQTT_USERNAME / TC_MQTT_PASSWORD to refuse anonymous clients");
  const server = createServer(aedes.handle);

  server.listen(MQTT_PORT, () => {
    console.log(`✓ Embedded MQTT broker listening on mqtt://localhost:${MQTT_PORT}`);
    console.log("  (set EMBED_BROKER=0 to use an external broker instead)");
    advertiseBroker();
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.log(`• Port ${MQTT_PORT} already in use — using the broker already running there`);
    } else {
      console.error("Embedded broker error:", err);
    }
  });

  aedes.on("client", (c) => console.log(`[broker] device connected: ${c?.id ?? "unknown"}`));
  aedes.on("clientDisconnect", (c) => { keyed.delete(c); console.log(`[broker] device left: ${c?.id ?? "unknown"}`); });
  // A revoked or expired key is dropped within a minute (plus the key cache), not at next reconnect.
  setInterval(() => {
    for (const [client, p] of keyed) {
      loadApiKeyRecord(p.keyId).then((r) => {
        if (!r || r.revokedAt || (r.expiresAt && r.expiresAt <= Date.now())) {
          console.warn(`[broker] key ${p.keyId} no longer valid - disconnecting ${(client as { id?: string }).id ?? "?"}`);
          keyed.delete(client);
          (client as { close: () => void }).close();
        }
      }).catch(() => {});
    }
  }, 60_000).unref();
}

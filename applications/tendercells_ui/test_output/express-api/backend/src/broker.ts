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
import { createServer as createTlsServer } from "node:tls";
import { readFileSync, watch } from "node:fs";
import { Bonjour } from "bonjour-service";
import { loadMqttCredentials, topicAllowed, verifyScryptSecret, type MqttCredential } from "./mqttSecurity.js";

const EMBED = process.env.EMBED_BROKER !== "0";
const MQTT_PORT = Number(process.env.MQTT_PORT || 1883);
// Advertise the broker over mDNS (_mqtt._tcp) so ESP32 nodes auto-discover it and
// learners never type an IP. Set MDNS_ADVERTISE=0 to disable on locked-down nets.
const MDNS_ADVERTISE = process.env.MDNS_ADVERTISE !== "0";
const SECURE = process.env.TC_MQTT_SECURE === "1";

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
  const credentialPath = process.env.TC_MQTT_CREDENTIALS_FILE || "";
  let credentials: Map<string, MqttCredential> = SECURE && credentialPath ? loadMqttCredentials(credentialPath) : new Map();
  if (SECURE && !credentials.size) throw new Error("TC_MQTT_SECURE requires a non-empty TC_MQTT_CREDENTIALS_FILE");

  // A device claimed while the broker is already running (edge-bridge claim
  // exchange) writes straight to this file — pick the new credential up
  // without a restart. Soft-fail: a bad edit mid-write must not crash the broker.
  if (SECURE && credentialPath) {
    watch(credentialPath, { persistent: false }, () => {
      try {
        credentials = loadMqttCredentials(credentialPath);
        console.log("[broker] MQTT credentials file reloaded");
      } catch (err) {
        console.error("[broker] failed to reload MQTT credentials file, keeping the previous version:", err);
      }
    });
  }
  const aedes = new Aedes(SECURE ? {
    authenticate(client, username, password, done) {
      const record = credentials.get(client.id);
      const valid = Boolean(record && username === record.username && password && verifyScryptSecret(password.toString(), record.passwordHash));
      done(null, valid);
    },
    authorizePublish(client, packet, done) {
      const record = client && credentials.get(client.id);
      done(record && topicAllowed(packet.topic, record.publishPrefixes) ? null : new Error("MQTT publish denied"));
    },
    authorizeSubscribe(client, subscription, done) {
      const record = credentials.get(client.id);
      done(null, record && topicAllowed(subscription.topic, record.subscribePrefixes) ? subscription : null);
    },
  } : undefined);
  const tlsKey = process.env.MQTT_TLS_KEY_FILE || "";
  const tlsCert = process.env.MQTT_TLS_CERT_FILE || "";
  if (SECURE && (!tlsKey || !tlsCert)) throw new Error("TC_MQTT_SECURE requires MQTT_TLS_KEY_FILE and MQTT_TLS_CERT_FILE");
  const server = SECURE
    ? createTlsServer({ key: readFileSync(tlsKey), cert: readFileSync(tlsCert), minVersion: 'TLSv1.2' }, aedes.handle)
    : createServer(aedes.handle);

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
  aedes.on("clientDisconnect", (c) => console.log(`[broker] device left: ${c?.id ?? "unknown"}`));
}

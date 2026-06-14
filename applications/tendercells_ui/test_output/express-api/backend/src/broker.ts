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

const EMBED = process.env.EMBED_BROKER !== "0";
const MQTT_PORT = Number(process.env.MQTT_PORT || 1883);

if (EMBED) {
  const aedes = new Aedes();
  const server = createServer(aedes.handle);

  server.listen(MQTT_PORT, () => {
    console.log(`✓ Embedded MQTT broker listening on mqtt://localhost:${MQTT_PORT}`);
    console.log("  (set EMBED_BROKER=0 to use an external broker instead)");
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

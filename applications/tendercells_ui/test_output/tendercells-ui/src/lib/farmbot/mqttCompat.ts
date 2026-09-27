// mqttCompat.ts - make MQTT.js loadable by FarmBot's `farmbot` client in the browser.
//
// FIX(2026-09-27): farmbot-js is CommonJS and calls `mqtt_1.default.connect(...)`.
// Vite resolves `mqtt` to MQTT.js's browser ESM build, whose default export wraps the
// library one level deeper, so the call failed with "default.connect is not a
// function". vite.config aliases the bare `mqtt` import to this module, which exposes
// `connect` both as a named export and on `default` - so either interop shape works.
// @ts-expect-error - MQTT.js ships no types for its dist/ ESM bundle
import mqttEsm from 'mqtt/dist/mqtt.esm';

type MqttLib = { connect: (...args: unknown[]) => unknown };

const unwrap = (mod: unknown, depth = 0): MqttLib => {
  const m = mod as { connect?: unknown; default?: unknown } | undefined;
  if (m && typeof m.connect === 'function') return m as MqttLib;
  if (m?.default && depth < 3) return unwrap(m.default, depth + 1);
  throw new Error('MQTT.js could not be loaded (no connect function found)');
};

const lib = unwrap(mqttEsm);

export const connect = lib.connect;
export default lib;

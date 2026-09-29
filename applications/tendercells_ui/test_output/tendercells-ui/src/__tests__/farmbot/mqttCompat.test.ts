// mqttCompat.test.ts - the MQTT.js shim farmbot-js relies on in the browser build.
import { describe, expect, it } from 'vitest';

describe('mqttCompat', () => {
  it('exposes connect() both named and on default (farmbot-js calls default.connect)', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const { default: mqttDefault, connect } = await import('../../lib/farmbot/mqttCompat');
    expect(typeof connect).toBe('function');
    expect(typeof mqttDefault.connect).toBe('function');
  });
});

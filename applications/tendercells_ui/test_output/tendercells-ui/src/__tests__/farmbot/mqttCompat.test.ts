// mqttCompat.test.ts - the MQTT.js shim farmbot-js relies on in the browser build.
import { describe, expect, it } from 'vitest';
import mqttDefault, { connect } from '../../lib/farmbot/mqttCompat';

describe('mqttCompat', () => {
  it('exposes connect() both named and on default (farmbot-js calls default.connect)', () => {
    expect(typeof connect).toBe('function');
    expect(typeof mqttDefault.connect).toBe('function');
  });
});

import { describe, expect, it } from 'vitest';
import { profileIsAllowed, commandRateHz } from '../../control/core/CapabilityGate';
import { CONTROL_PROFILES } from '../../control/profiles/registry';

describe('CapabilityGate', () => {
  it('rejects profile not advertised by a device', () => {
    expect(profileIsAllowed(CONTROL_PROFILES.freetouch, {
      motion:true, kinematics:'differential', allowedProfiles:['arcade']
    })).toBe(false);
  });

  it('caps rate to device capability', () => {
    expect(commandRateHz(CONTROL_PROFILES.freetouch, {
      motion:true, kinematics:'differential', allowedProfiles:['freetouch'], maxCommandHz:10
    })).toBe(10);
  });
});

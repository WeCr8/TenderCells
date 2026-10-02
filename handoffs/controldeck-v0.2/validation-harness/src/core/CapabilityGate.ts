import type { ControlProfile, DeviceControlCapabilities } from '../types.js';

export function profileIsAllowed(
  profile: ControlProfile,
  capabilities: DeviceControlCapabilities,
): boolean {
  if (!capabilities.motion) return false;
  if (!capabilities.allowedProfiles.includes(profile.id)) return false;
  if (capabilities.kinematics && capabilities.kinematics !== profile.kinematics) {
    // Gamepad is an input source, not a separate kinematics mode. Profiles should
    // declare the actual vehicle kinematics.
    return false;
  }
  return true;
}

export function commandRateHz(profile: ControlProfile, capabilities: DeviceControlCapabilities): number {
  const cap = capabilities.maxCommandHz ?? profile.defaultRateHz;
  return Math.max(1, Math.min(profile.defaultRateHz, cap));
}

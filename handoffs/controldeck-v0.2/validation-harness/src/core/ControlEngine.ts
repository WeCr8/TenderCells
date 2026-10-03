import type { ControlFrame, ControlProfile, RawInput } from '../types.js';
import { shapeAxis } from './math.js';

export class ControlEngine {
  private seq = 0;

  constructor(
    readonly sessionId: string,
    readonly deviceId: string,
    readonly profile: ControlProfile,
  ) {}

  next(input: RawInput, now = Date.now()): ControlFrame {
    const axes: ControlFrame['axes'] = {};
    for (const axis of this.profile.inputAxes) {
      axes[axis] = shapeAxis(
        input.axes[axis] ?? 0,
        this.profile.deadzone,
        this.profile.expo,
        this.profile.speedLimit,
      );
    }
    return {
      v: 1,
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      profileId: this.profile.id,
      seq: ++this.seq,
      sentAtMs: now,
      deadman: input.active,
      axes,
    };
  }

  neutral(now = Date.now()): ControlFrame {
    return {
      v: 1,
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      profileId: this.profile.id,
      seq: ++this.seq,
      sentAtMs: now,
      deadman: false,
      axes: {},
    };
  }
}

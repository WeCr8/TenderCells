import { shapeAxis } from './math.js';
export class ControlEngine {
    sessionId;
    deviceId;
    profile;
    seq = 0;
    constructor(sessionId, deviceId, profile) {
        this.sessionId = sessionId;
        this.deviceId = deviceId;
        this.profile = profile;
    }
    next(input, now = Date.now()) {
        const axes = {};
        for (const axis of this.profile.inputAxes) {
            axes[axis] = shapeAxis(input.axes[axis] ?? 0, this.profile.deadzone, this.profile.expo, this.profile.speedLimit);
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
    neutral(now = Date.now()) {
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

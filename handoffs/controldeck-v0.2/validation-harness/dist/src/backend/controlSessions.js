export class ControlSessionManager {
    staleMs;
    neutralize;
    byDevice = new Map();
    timer = null;
    constructor(staleMs = 500, neutralize = () => { }) {
        this.staleMs = staleMs;
        this.neutralize = neutralize;
    }
    open(sessionId, deviceId, profileId, now = Date.now()) {
        const existing = this.byDevice.get(deviceId);
        if (existing && existing.sessionId !== sessionId) {
            throw new Error('device already has an active controller lease');
        }
        const record = existing ?? {
            sessionId, deviceId, profileId, openedAtMs: now, lastFrameAtMs: now, lastSeq: 0,
        };
        this.byDevice.set(deviceId, record);
        return record;
    }
    accept(frame, now = Date.now()) {
        const current = this.byDevice.get(frame.deviceId);
        if (!current || current.sessionId !== frame.sessionId)
            return { ok: false, reason: 'no active lease' };
        if (frame.profileId !== current.profileId)
            return { ok: false, reason: 'profile changed during session' };
        if (frame.seq <= current.lastSeq)
            return { ok: false, reason: 'out-of-order or duplicate frame' };
        if (now - frame.sentAtMs > this.staleMs)
            return { ok: false, reason: 'stale frame' };
        current.lastSeq = frame.seq;
        current.lastFrameAtMs = now;
        return { ok: true };
    }
    close(deviceId, sessionId, reason = 'controller disconnected') {
        const current = this.byDevice.get(deviceId);
        if (!current || current.sessionId !== sessionId)
            return;
        this.byDevice.delete(deviceId);
        this.neutralize(deviceId, reason);
    }
    sweep(now = Date.now()) {
        const expired = [];
        for (const [deviceId, s] of this.byDevice) {
            if (now - s.lastFrameAtMs > this.staleMs) {
                this.byDevice.delete(deviceId);
                expired.push(deviceId);
                this.neutralize(deviceId, 'control stream stale');
            }
        }
        return expired;
    }
    startWatchdog(periodMs = 100) {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.sweep(), Math.max(25, periodMs));
    }
    stopWatchdog() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    get(deviceId) {
        return this.byDevice.get(deviceId);
    }
}

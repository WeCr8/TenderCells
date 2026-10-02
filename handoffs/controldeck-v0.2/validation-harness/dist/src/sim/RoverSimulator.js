import { differentialMix, mecanumMix, tankMix } from '../core/mixers.js';
export class RoverSimulator {
    pose = { x: 0, y: 0, headingRad: 0 };
    step(frame, dtSec) {
        if (!frame.deadman)
            return this.pose;
        const dt = Math.max(0, Math.min(0.2, dtSec));
        const profile = frame.profileId;
        if (profile === 'tank') {
            const m = tankMix(frame.axes.leftTrack ?? 0, frame.axes.rightTrack ?? 0);
            return this.integrateDifferential(m.left, m.right, dt);
        }
        if (profile === 'mecanum') {
            const m = mecanumMix(frame.axes.y ?? 0, frame.axes.strafe ?? 0, frame.axes.yaw ?? 0);
            const forward = (m.frontLeft + m.frontRight + m.rearLeft + m.rearRight) / 4;
            const strafe = (m.frontLeft - m.frontRight - m.rearLeft + m.rearRight) / 4;
            const yaw = (m.frontLeft - m.frontRight + m.rearLeft - m.rearRight) / 4;
            this.pose.headingRad += yaw * dt;
            const c = Math.cos(this.pose.headingRad), s = Math.sin(this.pose.headingRad);
            this.pose.x += (forward * c - strafe * s) * dt;
            this.pose.y += (forward * s + strafe * c) * dt;
            return this.pose;
        }
        const m = differentialMix(frame.axes.throttle ?? 0, frame.axes.steering ?? 0);
        return this.integrateDifferential(m.left, m.right, dt);
    }
    integrateDifferential(left, right, dt) {
        const linear = (left + right) / 2;
        const angular = (right - left) / 2;
        this.pose.headingRad += angular * dt;
        this.pose.x += linear * Math.cos(this.pose.headingRad) * dt;
        this.pose.y += linear * Math.sin(this.pose.headingRad) * dt;
        return this.pose;
    }
}

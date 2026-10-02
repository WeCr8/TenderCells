export class Deadman {
    timeoutMs;
    lastPulse = 0;
    constructor(timeoutMs = 250) {
        this.timeoutMs = timeoutMs;
    }
    pulse(now = Date.now()) {
        this.lastPulse = now;
    }
    clear() {
        this.lastPulse = 0;
    }
    active(now = Date.now()) {
        return this.lastPulse > 0 && now - this.lastPulse <= this.timeoutMs;
    }
}

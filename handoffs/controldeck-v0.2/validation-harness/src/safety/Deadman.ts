export class Deadman {
  private lastPulse = 0;

  constructor(private readonly timeoutMs = 250) {}

  pulse(now = Date.now()): void {
    this.lastPulse = now;
  }

  clear(): void {
    this.lastPulse = 0;
  }

  active(now = Date.now()): boolean {
    return this.lastPulse > 0 && now - this.lastPulse <= this.timeoutMs;
  }
}

export interface ControlFrame {
  v: 1;
  sessionId: string;
  deviceId: string;
  profileId: string;
  seq: number;
  sentAtMs: number;
  deadman: boolean;
  axes: Record<string, number>;
  actions?: string[];
}

export interface ControlAck {
  type: 'ack';
  seq: number;
  serverAtMs: number;
  echoSentAtMs: number;
}

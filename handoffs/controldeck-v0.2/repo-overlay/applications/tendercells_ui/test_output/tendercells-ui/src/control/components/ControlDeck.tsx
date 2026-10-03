import { useEffect, useMemo, useState } from 'react';
import type { DeviceControlCapabilities, RawInput } from '../types';
import { ControlEngine } from '../core/ControlEngine';
import { profileIsAllowed, commandRateHz } from '../core/CapabilityGate';
import { getControlProfile } from '../profiles/registry';
import { ControlSession } from '../session/ControlSession';
import { MockTransport } from '../transports/MockTransport';
import { WebSocketControlTransport } from '../transports/WebSocketControlTransport';
import { FreeTouchSurface } from './FreeTouchSurface';

export interface ControlDeckProps {
  deviceId: string;
  capabilities: DeviceControlCapabilities;
  profileId?: string;
  controlSocketUrl?: string;
  simulation?: boolean;
  onEmergencyStop: () => void | Promise<void>;
  cameraSlot?: React.ReactNode;
}

export function ControlDeck({
  deviceId,
  capabilities,
  profileId = 'freetouch',
  controlSocketUrl = '/api/control/ws',
  simulation = true,
  onEmergencyStop,
  cameraSlot,
}: ControlDeckProps) {
  const [input, setInput] = useState<RawInput>({ source:'touch', axes:{}, active:false, timestampMs:0 });
  const [sessionState, setSessionState] = useState<'idle'|'active'|'error'>('idle');
  const profile = getControlProfile(profileId);

  const session = useMemo(() => {
    if (!profile || !profileIsAllowed(profile, capabilities)) return null;
    const id = crypto.randomUUID();
    const engine = new ControlEngine(id, deviceId, profile);
    const transport = simulation
      ? new MockTransport()
      : new WebSocketControlTransport(`${controlSocketUrl}?deviceId=${encodeURIComponent(deviceId)}&profileId=${encodeURIComponent(profile.id)}`);
    return new ControlSession(engine, transport, commandRateHz(profile, capabilities));
  }, [deviceId, profile, capabilities, controlSocketUrl, simulation]);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    session.start().then(() => alive && setSessionState('active')).catch(() => alive && setSessionState('error'));
    return () => { alive = false; session.stop(); };
  }, [session]);

  useEffect(() => {
    session?.updateInput(input);
  }, [input, session]);

  useEffect(() => {
    const neutral = () => setInput({ source:'touch', axes:{}, active:false, timestampMs:Date.now() });
    const hidden = () => { if (document.visibilityState !== 'visible') neutral(); };
    window.addEventListener('blur', neutral);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', neutral);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  if (!profile || !session) {
    return <div role="alert">This controller profile is not allowed for this device.</div>;
  }

  return (
    <section style={{ position:'relative', width:'100%', minHeight:480, background:'#0D2B1E', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0 }}>{cameraSlot}</div>
      <FreeTouchSurface onInput={setInput} disabled={sessionState !== 'active'} />
      <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', gap:8, alignItems:'center', pointerEvents:'none' }}>
        <strong style={{ color:'#F0EDE4' }}>Control Deck · {profile.label}</strong>
        <span style={{ color: sessionState === 'active' ? '#6BBF59' : '#E8A020' }}>{sessionState.toUpperCase()}</span>
        <span style={{ marginLeft:'auto', color:'#F0EDE4' }}>{simulation ? 'SIM' : 'LIVE'}</span>
      </div>
      <button
        type="button"
        aria-label="Emergency stop"
        onClick={() => void onEmergencyStop()}
        style={{
          position:'absolute', right:16, bottom:16, minWidth:120, minHeight:56,
          border:0, borderRadius:12, background:'#CC3333', color:'white',
          fontWeight:800, fontSize:16, zIndex:5,
        }}
      >
        E-STOP
      </button>
    </section>
  );
}

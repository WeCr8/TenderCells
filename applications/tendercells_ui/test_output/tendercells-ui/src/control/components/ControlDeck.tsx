import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ControlFrame, DeviceControlCapabilities, RawInput } from '../types';
import { ControlEngine } from '../core/ControlEngine';
import { profileIsAllowed, commandRateHz } from '../core/CapabilityGate';
import { getControlProfile } from '../profiles/registry';
import { ControlSession } from '../session/ControlSession';
import { MockTransport } from '../transports/MockTransport';
import { WebSocketControlTransport } from '../transports/WebSocketControlTransport';
import { FreeTouchSurface } from './FreeTouchSurface';
import { keyboardToArcadeRaw } from '../inputs/keyboardAdapter';
import { gamepadToRawInput } from '../inputs/gamepadAdapter';
import { controlColors as C } from '../tokens';
export interface ControlDeckProps {
  deviceId: string; capabilities: DeviceControlCapabilities; profileId?: string;
  controlSocketUrl?: string; controlToken?: string; simulation?: boolean; onEmergencyStop: () => void | Promise<void>;
  cameraSlot?: ReactNode; onFrame?: (frame: ControlFrame) => void;
}
export function ControlDeck({ deviceId, capabilities, profileId = 'freetouch', controlSocketUrl, controlToken, simulation = true, onEmergencyStop, cameraSlot, onFrame }: ControlDeckProps) {
  const session = useRef<ControlSession | null>(null);
  const [active, setActive] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [armed, setArmed] = useState(simulation);
  const [readyConfirmed, setReadyConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'touch'|'keyboard'|'gamepad'>('touch');
  const profile = getControlProfile(profileId);
  const allowed = !!profile && profileIsAllowed(profile, capabilities) && profile.kinematics === 'differential'
    && (simulation || (!!controlSocketUrl && !!controlToken));
  const input = useCallback((value: RawInput) => { session.current?.updateInput(value); }, []);
  useEffect(() => {
    if (!allowed || !profile || stopped || !armed) return;
    const transport = simulation
      ? new MockTransport(onFrame)
      : new WebSocketControlTransport(controlSocketUrl!, controlToken);
    const current = new ControlSession(new ControlEngine(crypto.randomUUID(), deviceId, profile), transport, commandRateHz(profile, capabilities));
    session.current = current;
    let alive = true;
    setError(null);
    void current.start().then(() => { if (alive) setActive(true); }).catch((cause: unknown) => {
      if (alive) {
        setError(cause instanceof Error ? cause.message : 'Control connection failed.');
        setArmed(false);
      }
      current.stop();
    });
    return () => { alive = false; current.stop(); session.current = null; setActive(false); };
  }, [allowed, profile, deviceId, capabilities, stopped, onFrame, source, simulation, controlSocketUrl, controlToken, armed]);
  useEffect(() => {
    const keys = new Set<string>();
    let suspended = false;
    const neutral = () => { suspended = true; keys.clear(); input({ source, axes: {}, active: false, timestampMs: Date.now() }); };
    const hidden = () => { if (document.visibilityState !== 'visible') neutral(); };
    const down = (e: KeyboardEvent) => {
      if (source !== 'keyboard' || !active || stopped || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) return;
      if ((e.target as HTMLElement).closest('input,select,textarea,button')) return;
      suspended = false; keys.add(e.key); e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keys.delete(e.key); if (e.key === ' ') input({ source, axes: {}, active: false, timestampMs: Date.now() }); };
    const poll = setInterval(() => {
      if (!active || stopped || document.visibilityState !== 'visible') return;
      if (source === 'keyboard') {
        const raw = keyboardToArcadeRaw({ forward: keys.has('ArrowUp'), back: keys.has('ArrowDown'), left: keys.has('ArrowLeft'), right: keys.has('ArrowRight') });
        raw.active = raw.active && keys.has(' ') && !suspended; input(raw);
      } else if (source === 'gamepad') {
        const pad = navigator.getGamepads?.().find(p => p?.connected);
        const held = !!pad?.buttons[4]?.pressed;
        if (!held) suspended = false;
        const raw = gamepadToRawInput({ axes: pad ? [...pad.axes] : [], buttons: pad ? pad.buttons.map(b => b.pressed) : [] }, 'arcade');
        raw.active = raw.active && held && !suspended; input(raw);
      }
    }, 50);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', neutral); document.addEventListener('visibilitychange', hidden);
    return () => { clearInterval(poll); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', neutral); document.removeEventListener('visibilitychange', hidden); neutral(); };
  }, [source, input, active, stopped]);
  if (!allowed) return <div role="alert">{simulation ? 'Control Deck is unavailable for this simulation profile.' : 'Live Control Deck requires a signed-in user, a device ID, and a configured hardware API.'}</div>;
  const disconnect = () => { session.current?.stop(); setActive(false); setArmed(false); setReadyConfirmed(false); };
  const emergencyStop = async () => {
  session.current?.stop(); setActive(false); setArmed(false); setStopped(true); setError(null);
  try { await onEmergencyStop(); }
  catch (cause) { setError(cause instanceof Error ? `E-STOP request failed: ${cause.message}` : 'E-STOP request failed.'); }
  };
  return <section aria-label={simulation ? 'Control Deck simulator' : 'Live Roaming Roost controls'} style={{ color: C.text, background: C.bg, borderRadius: 16, overflow: 'hidden' }}>
  <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <strong>{simulation ? 'Control Deck - Simulated' : 'Roaming Roost - Live controls'}</strong>
    <label>Input <select aria-label="Control input" value={source} onChange={e => { session.current?.stop(); setActive(false); if (!simulation) { setArmed(false); setReadyConfirmed(false); } setSource(e.target.value as typeof source); }}>{['touch','keyboard','gamepad'].map(s => <option key={s}>{s}</option>)}</select></label>
    <span role="status">{stopped ? (simulation ? 'Emergency stop latched' : 'Control stopped after E-STOP') : active ? 'Connected' : armed ? 'Connecting' : 'Disarmed'}</span>
    </div>
  <p style={{ margin: 12 }}>{source === 'touch' ? 'Left half: drag up/down to drive. Right half: drag sideways to turn. Release to stop.' : source === 'keyboard' ? 'Hold Space and use the arrow keys. Release Space to stop.' : 'Hold the left bumper and use the left stick. Release the bumper to stop.'}</p>
  <div style={{ position: 'relative', height: 360 }}>{cameraSlot}{source === 'touch' && <FreeTouchSurface onInput={input} disabled={!active || stopped} />}</div>
  {!simulation && !armed && !stopped && <div style={{ padding: 12 }}>
    <label><input type="checkbox" checked={readyConfirmed} onChange={event => setReadyConfirmed(event.target.checked)} /> I am beside the rover, the test area is clear, and I can reach its physical E-STOP.</label>
    <button type="button" disabled={!readyConfirmed} onClick={() => { setError(null); setArmed(true); }}>Confirm and connect</button>
  </div>}
  <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <button type="button" onClick={() => { if (simulation) { session.current?.stop(); setActive(false); setStopped(true); void onEmergencyStop(); } else { void emergencyStop(); } }} style={{ minHeight: 56, padding: '12px 24px', background: C.danger, color: C.text, border: 0, borderRadius: 8, fontWeight: 800 }}>{simulation ? 'E-STOP simulation' : 'E-STOP rover'}</button>
    {simulation && stopped && <button type="button" onClick={() => setStopped(false)}>Reset simulation stop</button>}
    {!simulation && active && <button type="button" onClick={disconnect}>Disconnect</button>}
  </div>
  {error && <p role="alert" style={{ color: C.danger, padding: 12 }}>{error}</p>}
  </section>;
}

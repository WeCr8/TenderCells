import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ControlFrame, DeviceControlCapabilities, RawInput } from '../types';
import { ControlEngine } from '../core/ControlEngine';
import { profileIsAllowed, commandRateHz } from '../core/CapabilityGate';
import { getControlProfile } from '../profiles/registry';
import { ControlSession } from '../session/ControlSession';
import { MockTransport } from '../transports/MockTransport';
import { FreeTouchSurface } from './FreeTouchSurface';
import { keyboardToArcadeRaw } from '../inputs/keyboardAdapter';
import { gamepadToRawInput } from '../inputs/gamepadAdapter';
import { controlColors as C } from '../tokens';
export interface ControlDeckProps {
  deviceId: string; capabilities: DeviceControlCapabilities; profileId?: string;
  controlSocketUrl?: string; simulation?: boolean; onEmergencyStop: () => void | Promise<void>;
  cameraSlot?: ReactNode; onFrame?: (frame: ControlFrame) => void;
}
export function ControlDeck({ deviceId, capabilities, profileId = 'freetouch', simulation = true, onEmergencyStop, cameraSlot, onFrame }: ControlDeckProps) {
  const session = useRef<ControlSession | null>(null);
  const [active, setActive] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [source, setSource] = useState<'touch'|'keyboard'|'gamepad'>('touch');
  const profile = getControlProfile(profileId);
  const allowed = simulation && !!profile && profileIsAllowed(profile, capabilities) && profile.kinematics === 'differential';
  const input = useCallback((value: RawInput) => { session.current?.updateInput(value); }, []);
  useEffect(() => {
    if (!allowed || !profile || stopped) return;
    const current = new ControlSession(new ControlEngine(crypto.randomUUID(), deviceId, profile), new MockTransport(onFrame), commandRateHz(profile, capabilities));
    session.current = current;
    let alive = true;
    void current.start().then(() => { if (alive) setActive(true); });
    return () => { alive = false; current.stop(); session.current = null; setActive(false); };
  }, [allowed, profile, deviceId, capabilities, stopped, onFrame, source]);
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
  if (!allowed) return <div role="alert">Live Control Deck is unavailable. Use an allowed differential simulation profile.</div>;
  return <section aria-label="Control Deck simulator" style={{ color: C.text, background: C.bg, borderRadius: 16, overflow: 'hidden' }}>
    <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <strong>Control Deck - Simulated</strong>
      <label>Input <select aria-label="Control input" value={source} onChange={e => { setActive(false); session.current?.stop(); setSource(e.target.value as typeof source); }}>{['touch','keyboard','gamepad'].map(s => <option key={s}>{s}</option>)}</select></label>
      <span role="status">{stopped ? 'Emergency stop latched' : active ? 'Ready' : 'Connecting'}</span>
    </div>
    <p style={{ margin: 12 }}>{source === 'touch' ? 'Left half: drag up/down to drive. Right half: drag sideways to turn. Release to stop.' : source === 'keyboard' ? 'Hold Space and use the arrow keys. Release Space to stop.' : 'Hold the left bumper and use the left stick. Release the bumper to stop.'}</p>
    <div style={{ position: 'relative', height: 360 }}>{cameraSlot}{source === 'touch' && <FreeTouchSurface onInput={input} disabled={!active || stopped} />}</div>
    <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <button type="button" onClick={() => { session.current?.stop(); setActive(false); setStopped(true); void onEmergencyStop(); }} style={{ minHeight: 56, padding: '12px 24px', background: C.danger, color: C.text, border: 0, borderRadius: 8, fontWeight: 800 }}>E-STOP simulation</button>
      {stopped && <button type="button" onClick={() => setStopped(false)}>Reset simulation stop</button>}
    </div>
  </section>;
}

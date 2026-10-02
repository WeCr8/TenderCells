import { useCallback, useEffect, useRef, useState } from 'react';
import type { RawInput } from '../types';
import { floatingStickAxes, type Point } from '../inputs/pointerMath';
import { controlColors as C } from '../tokens';
type Stick = { pointerId: number; origin: Point; current: Point } | null;
export interface FreeTouchSurfaceProps { onInput: (input: RawInput) => void; disabled?: boolean; radiusPx?: number; showGuides?: boolean }
export function FreeTouchSurface({ onInput, disabled = false, radiusPx = 72, showGuides = true }: FreeTouchSurfaceProps) {
  const host = useRef<HTMLDivElement>(null);
  const sticks = useRef<[Stick, Stick]>([null, null]);
  const [visual, setVisual] = useState<[Stick, Stick]>([null, null]);
  const emit = useCallback(() => {
    const [l, r] = sticks.current;
    const la = l ? floatingStickAxes(l.origin, l.current, radiusPx) : { x: 0, y: 0 };
    const ra = r ? floatingStickAxes(r.origin, r.current, radiusPx) : { x: 0, y: 0 };
    onInput({ source: 'touch', axes: { throttle: la.y, steering: ra.x }, active: !!l || !!r, timestampMs: Date.now() });
  }, [onInput, radiusPx]);
  const neutral = useCallback(() => { sticks.current = [null, null]; setVisual([null, null]); emit(); }, [emit]);
  useEffect(() => {
    if (disabled) neutral();
    const hidden = () => { if (document.visibilityState !== 'visible') neutral(); };
    window.addEventListener('blur', neutral);
    document.addEventListener('visibilitychange', hidden);
    const heartbeat = setInterval(() => { if (!disabled && sticks.current.some(Boolean)) emit(); }, 50);
    return () => { clearInterval(heartbeat); window.removeEventListener('blur', neutral); document.removeEventListener('visibilitychange', hidden); };
  }, [disabled, emit, neutral]);
  const release = (id: number) => {
    if (!sticks.current.some(s => s?.pointerId === id)) return;
    sticks.current = sticks.current.map(s => s?.pointerId === id ? null : s) as [Stick, Stick];
    setVisual([...sticks.current]); emit();
  };
  return <div ref={host} data-testid="freetouch-surface" aria-label="Touch drive surface"
    onPointerDown={e => {
      if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const side = point.x < rect.width / 2 ? 0 : 1;
      if (sticks.current[side]) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      sticks.current[side] = { pointerId: e.pointerId, origin: point, current: point };
      setVisual([...sticks.current]); emit();
    }}
    onPointerMove={e => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      for (const s of sticks.current) if (s?.pointerId === e.pointerId) s.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setVisual([...sticks.current]); emit();
    }}
    onPointerUp={e => release(e.pointerId)} onPointerCancel={neutral} onLostPointerCapture={e => release(e.pointerId)}
    onContextMenu={e => e.preventDefault()} style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none', cursor: disabled ? 'not-allowed' : 'crosshair' }}>
    {showGuides && visual.map((s, i) => s && <span key={i} style={{ position: 'absolute', left: s.origin.x-radiusPx, top: s.origin.y-radiusPx, width: radiusPx*2, height: radiusPx*2, border: `2px solid ${C.guide}`, borderRadius: '50%', pointerEvents: 'none' }} />)}
  </div>;
}

import { useCallback, useRef, useState } from 'react';
import type { RawInput } from '../types';
import { floatingStickAxes, type Point } from '../inputs/pointerMath';

type Stick = { pointerId: number; origin: Point; current: Point } | null;

export interface FreeTouchSurfaceProps {
  onInput: (input: RawInput) => void;
  disabled?: boolean;
  radiusPx?: number;
  showGuides?: boolean;
}

export function FreeTouchSurface({
  onInput,
  disabled = false,
  radiusPx = 72,
  showGuides = true,
}: FreeTouchSurfaceProps) {
  const host = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<Stick>(null);
  const [right, setRight] = useState<Stick>(null);

  const emit = useCallback((l: Stick, r: Stick) => {
    const la = l ? floatingStickAxes(l.origin, l.current, radiusPx) : { x: 0, y: 0 };
    const ra = r ? floatingStickAxes(r.origin, r.current, radiusPx) : { x: 0, y: 0 };
    onInput({
      source: 'touch',
      axes: { throttle: la.y, steering: ra.x },
      active: !!l || !!r,
      timestampMs: Date.now(),
    });
  }, [onInput, radiusPx]);

  const neutralize = useCallback(() => {
    setLeft(null); setRight(null);
    onInput({ source: 'touch', axes: {}, active: false, timestampMs: Date.now() });
  }, [onInput]);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !host.current) return;
    host.current.setPointerCapture(e.pointerId);
    const rect = host.current.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const stick = { pointerId: e.pointerId, origin: p, current: p };
    if (p.x < rect.width / 2 && !left) {
      setLeft(stick); emit(stick, right);
    } else if (!right) {
      setRight(stick); emit(left, stick);
    }
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!host.current) return;
    const rect = host.current.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (left?.pointerId === e.pointerId) {
      const next = { ...left, current: p }; setLeft(next); emit(next, right);
    } else if (right?.pointerId === e.pointerId) {
      const next = { ...right, current: p }; setRight(next); emit(left, next);
    }
  };

  const release = (pointerId: number) => {
    const l = left?.pointerId === pointerId ? null : left;
    const r = right?.pointerId === pointerId ? null : right;
    setLeft(l); setRight(r); emit(l, r);
  };

  const stickVisual = (stick: Stick) => {
    if (!stick || !showGuides) return null;
    const axes = floatingStickAxes(stick.origin, stick.current, radiusPx);
    const knobX = stick.origin.x + axes.x * radiusPx;
    const knobY = stick.origin.y - axes.y * radiusPx;
    return <>
      <span style={{
        position:'absolute', left:stick.origin.x-radiusPx, top:stick.origin.y-radiusPx,
        width:radiusPx*2, height:radiusPx*2, border:'2px solid rgba(255,255,255,.3)',
        borderRadius:'50%', pointerEvents:'none'
      }}/>
      <span style={{
        position:'absolute', left:knobX-24, top:knobY-24, width:48, height:48,
        borderRadius:'50%', background:'rgba(255,255,255,.35)', pointerEvents:'none'
      }}/>
    </>;
  };

  return (
    <div
      ref={host}
      data-testid="freetouch-surface"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(e) => release(e.pointerId)}
      onPointerCancel={(e) => release(e.pointerId)}
      onLostPointerCapture={(e) => release(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position:'absolute', inset:0, touchAction:'none', userSelect:'none',
        cursor: disabled ? 'not-allowed' : 'crosshair',
      }}
      onBlur={neutralize}
    >
      {stickVisual(left)}
      {stickVisual(right)}
    </div>
  );
}

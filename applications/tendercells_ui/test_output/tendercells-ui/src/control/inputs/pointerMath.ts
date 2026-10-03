import { clampUnit } from '../core/math';

export interface Point { x: number; y: number; }

export function floatingStickAxes(origin: Point, current: Point, radiusPx: number): { x: number; y: number } {
  const r = Math.max(1, radiusPx);
  const dx = current.x - origin.x;
  const dy = current.y - origin.y;
  const mag = Math.hypot(dx, dy);
  const scale = mag > r ? r / mag : 1;
  return {
    x: clampUnit((dx * scale) / r),
    y: clampUnit(-(dy * scale) / r) || 0,
  };
}

// WatchTowerLayer.tsx - predator-monitor layer for the 2D yard map.
//
// Each WatchTower draws its three 120° camera sectors (camera 1 faces map north unless
// the tower is installed with another TOWER_HEADING_DEG) and places recent predator
// detections by bearing + distance from the tower - the same data the 3D view uses.
import type { PropertyItem } from './propertyLayoutStore';
import { WATCHTOWER_RANGE_FT, type YardFlag } from '../../lib/yard/yardTypes';

interface Props {
  items: PropertyItem[];
  flags: YardFlag[];
  scaleX: number;
  scaleY: number;
}

const TINTS = ['#CC3333', '#E8A020', '#C8B882'];

/** SVG layer: WatchTower coverage + located detections (feet → px via scale). */
export default function WatchTowerSvgLayer({ items, flags, scaleX, scaleY }: Props) {
  const towers = items.filter((i) => i.type === 'watchtower');
  return (
    <g aria-label="Predator monitor" pointerEvents="none">
      {towers.map((t) => {
        const cx = (t.x + t.width / 2) * scaleX;
        const cy = (t.y + t.depth / 2) * scaleY;
        const r = t.scan?.radiusFt ?? WATCHTOWER_RANGE_FT;
        // Bearing b (0 = up, clockwise) → SVG point (y grows downward).
        const at = (b: number, d: number) => {
          const rad = (b * Math.PI) / 180;
          return { x: cx + Math.sin(rad) * d * scaleX, y: cy - Math.cos(rad) * d * scaleY };
        };
        const detections = flags.filter((f) => f.itemId === t.id && f.type === 'alert' && f.bearingDeg != null);
        return (
          <g key={t.id}>
            {[0, 1, 2].map((cam) => {
              const a = at(cam * 120 - 60, r), b = at(cam * 120 + 60, r);
              return (
                <path key={cam} d={`M${cx},${cy} L${a.x},${a.y} A${r * scaleX},${r * scaleY} 0 0 1 ${b.x},${b.y} Z`}
                  fill={TINTS[cam]} fillOpacity={0.07} stroke="#CC3333" strokeOpacity={0.35} strokeDasharray="4 4" />
              );
            })}
            {detections.map((f) => {
              const p = at(f.bearingDeg!, f.distanceFt ?? r * 0.6);
              const active = f.status === 'active';
              return (
                <g key={f.id}>
                  <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={active ? '#CC3333' : '#8A7D55'} strokeOpacity={active ? 0.7 : 0.3} strokeDasharray="3 3" />
                  <circle cx={p.x} cy={p.y} r={active ? 7 : 4} fill={active ? '#CC3333' : '#8A7D55'} fillOpacity={active ? 0.9 : 0.5} />
                  {active && (
                    <text x={p.x + 10} y={p.y + 4} fill="#F0EDE4" fontSize={11} fontWeight={700} fontFamily="monospace">
                      {f.label ?? 'Predator'}{f.confidence != null ? ` ${Math.round(f.confidence * 100)}%` : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

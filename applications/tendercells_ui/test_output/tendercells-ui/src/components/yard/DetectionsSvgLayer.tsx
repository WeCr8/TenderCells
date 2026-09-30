// DetectionsSvgLayer.tsx - robot detections placed on a 2D property map (SVG, feet → px).
//
// Weeds found by a rover weed patrol, animals it saw on the route (flock, pets, wildlife,
// predators), water leaks at water points and other sightings reported with a property
// position (propFt), plus where each rover is right now. Used by the Property
// Layout 2D map and the Weed Patrol property map. Same data as the 3D pins.
import type { YardFlag } from '../../lib/yard/yardTypes';
import { detectionColor } from '../../lib/yard/detections';

export interface RoverMarker { itemId: string; name: string; xFt: number; yFt: number; headingDeg: number; running: boolean }

interface Props {
  flags: YardFlag[];
  rovers?: RoverMarker[];
  scaleX: number;
  scaleY: number;
  selectedId?: string | null;
  onSelect?: (flag: YardFlag) => void;
}

/** SVG group: one marker per located detection + rover positions. */
export default function DetectionsSvgLayer({ flags, rovers = [], scaleX, scaleY, selectedId, onSelect }: Props) {
  const located = flags.filter((f) => f.propFt && (f.type === 'weed_detected' || f.type === 'alert'));
  return (
    <g aria-label="Robot detections" data-testid="detections-layer">
      {located.map((f) => {
        const cx = f.propFt!.x * scaleX, cy = f.propFt!.y * scaleY;
        const open = f.status === 'pending_review' || f.status === 'active';
        const color = detectionColor(f);
        const sel = selectedId === `${f.deviceId}:${f.id}`;
        return (
          <g key={`${f.deviceId}:${f.id}`} transform={`translate(${cx},${cy})`}
            style={{ cursor: onSelect ? 'pointer' : 'default' }} onClick={onSelect ? () => onSelect(f) : undefined}
            data-testid={f.type === 'weed_detected' ? 'weed-marker' : f.finding === 'leak' ? 'leak-marker' : 'sighting-marker'}>
            <title>{`${f.title}${f.confidence != null ? ` · ${Math.round(f.confidence * 100)}%` : ''} · ${f.status.replace('_', ' ')}`}</title>
            {open && <circle r={11} fill="none" stroke={color} strokeWidth={2} opacity={0.5}>
              <animate attributeName="r" values="7;14;7" dur="1.8s" repeatCount="indefinite" />
            </circle>}
            {f.type === 'weed_detected'
              ? <path d="M0,-7 L6,5 L-6,5 Z" fill={color} stroke={sel ? '#F0EDE4' : '#0D2B1E'} strokeWidth={sel ? 2.5 : 1.2} />
              : f.finding === 'leak'
                // Water droplet
                ? <path d="M0,-8 C4,-2 6,1 6,3 A6,6 0 0 1 -6,3 C-6,1 -4,-2 0,-8 Z" fill={color} stroke={sel ? '#F0EDE4' : '#0D2B1E'} strokeWidth={sel ? 2.5 : 1.2} />
                : <circle r={6} fill={color} stroke={sel ? '#F0EDE4' : '#0D2B1E'} strokeWidth={sel ? 2.5 : 1.2} />}
          </g>
        );
      })}
      {rovers.map((r) => {
        const cx = r.xFt * scaleX, cy = r.yFt * scaleY;
        return (
          <g key={r.itemId} transform={`translate(${cx},${cy}) rotate(${r.headingDeg})`} data-testid="rover-marker">
            <title>{`${r.name}${r.running ? ' - patrolling' : ''}`}</title>
            <circle r={9} fill="#9CCC65" stroke="#0D2B1E" strokeWidth={1.5} opacity={r.running ? 1 : 0.6} />
            <path d="M0,-13 L4,-6 L-4,-6 Z" fill="#F0EDE4" />
          </g>
        );
      })}
    </g>
  );
}

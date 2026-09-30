// WeedPropertyMap2D.tsx - whole-property 2D map for a rover weed patrol: every item and
// exclusion zone, water point, the rover's position and a marker per weed, animal and
// water leak it found.
// Usage: WeedPatrolPage when a mobile robot (not a garden bed) is selected.
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { PropertyLayoutState } from '../property/propertyLayoutStore';
import { zonesFromLayout } from '../../lib/yard/exclusionZones';
import type { YardFlag } from '../../lib/yard/yardTypes';
import { WATER_POINT_TYPES } from '../../lib/yard/roverFindings';
import DetectionsSvgLayer, { type RoverMarker } from './DetectionsSvgLayer';

const ZONE_FILL = { 'no-go': 'rgba(204,51,51,0.28)', 'keep-out': 'rgba(232,160,32,0.16)', 'no-laser': 'rgba(200,184,130,0.10)' } as const;

interface Props { layout: PropertyLayoutState; flags: YardFlag[]; rovers: RoverMarker[] }

export default function WeedPropertyMap2D({ layout, flags, rovers }: Props) {
  const { widthFt: W, depthFt: D, name } = layout.property;
  const S = 10; // px per ft in the SVG's own coordinates (scaled by the viewBox)
  const zones = useMemo(() => zonesFromLayout(layout), [layout]);
  const [selected, setSelected] = useState<YardFlag | null>(null);
  const weeds = flags.filter((f) => f.type === 'weed_detected' && f.propFt);
  const open = weeds.filter((f) => f.status === 'pending_review').length;
  const active = flags.filter((f) => f.type === 'alert' && f.status === 'active' && f.propFt);
  const animals = active.filter((f) => f.finding === 'animal').length;
  const leaks = active.filter((f) => f.finding === 'leak').length;
  return (
    <Stack spacing={1.25} data-testid="weed-property-map-2d">
      <Box sx={{ position: 'relative', border: '1px solid #4A7C59', borderRadius: 1, overflow: 'hidden', bgcolor: '#173624' }}>
        <svg viewBox={`0 0 ${W * S} ${D * S}`} width="100%" role="img" aria-label={`${name} 2D weed map with ${weeds.length} weeds`}
          style={{ display: 'block', maxHeight: 560 }}>
          <defs>
            <pattern id="wpm-grid" width={S * 5} height={S * 5} patternUnits="userSpaceOnUse">
              <path d={`M${S * 5},0 L0,0 0,${S * 5}`} fill="none" stroke="#4A7C5933" strokeWidth={1} />
            </pattern>
          </defs>
          <rect width={W * S} height={D * S} fill="url(#wpm-grid)" />
          {zones.map((z) => (
            <polygon key={z.id} points={z.poly.map(([x, y]) => `${x * S},${y * S}`).join(' ')}
              fill={ZONE_FILL[z.kind]} stroke={z.kind === 'no-go' ? '#CC3333' : 'none'} strokeDasharray="6 4" />
          ))}
          {layout.items.map((it) => (
            <g key={it.id}>
              <rect x={it.x * S} y={it.y * S} width={it.width * S} height={it.depth * S} rx={4}
                fill={it.kind === 'hardware' ? '#2A5C3B' : '#3a2e1f'} stroke="#4A7C59" strokeWidth={1} opacity={0.85} />
              <text x={(it.x + it.width / 2) * S} y={(it.y + it.depth / 2) * S} fill="#C8B882" fontSize={11}
                textAnchor="middle" dominantBaseline="middle">{it.name.slice(0, 18)}</text>
              {WATER_POINT_TYPES.has(it.type) && (
                <circle cx={(it.x + it.width / 2) * S} cy={(it.y + it.depth / 2) * S} r={4} fill="#4FC3F7" opacity={0.8}>
                  <title>{`${it.name} - water point checked for leaks`}</title>
                </circle>
              )}
            </g>
          ))}
          <DetectionsSvgLayer flags={flags} rovers={rovers} scaleX={S} scaleY={S}
            selectedId={selected ? `${selected.deviceId}:${selected.id}` : null} onSelect={setSelected} />
        </svg>
        <Typography sx={{ position: 'absolute', top: 8, left: 10, color: '#C8B882', fontSize: 13, fontWeight: 700, bgcolor: '#0D2B1Ecc', px: 0.75, borderRadius: 0.5 }}>
          {name} · {W} × {D} ft · {open} weed{open === 1 ? '' : 's'} waiting
          {animals > 0 && ` · ${animals} animal${animals === 1 ? '' : 's'} seen`}
          {leaks > 0 && ` · ${leaks} leak${leaks === 1 ? '' : 's'}`}
        </Typography>
      </Box>
      {selected && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Typography sx={{ color: '#F0EDE4', flex: 1, fontSize: 14 }}>
            {selected.title} at {Math.round(selected.propFt!.x)}, {Math.round(selected.propFt!.y)} ft · {selected.status.replace('_', ' ')}
          </Typography>
          {selected.confidence != null && (
            <Chip size="small" label={`${Math.round(selected.confidence * 100)}% confidence`} sx={{ color: '#F0EDE4', border: '1px solid #4A7C59' }} />
          )}
        </Stack>
      )}
    </Stack>
  );
}

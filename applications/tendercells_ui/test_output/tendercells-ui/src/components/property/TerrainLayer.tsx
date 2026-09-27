// TerrainLayer.tsx - 2D terrain zones + elevation for the Property Layout editor.
//
// <TerrainSvgLayer>   draws zones (tinted areas) and elevation points (contour rings)
//                     under the items on the yard map.
// <TerrainEditorPanel> sidebar editor: add / edit / remove zones and elevation points.
// Robot-mapped terrain (source: 'robot') shows read-only here; a mapping robot owns it.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import type { PropertyConfig } from './propertyLayoutStore';
import {
  TERRAIN_KINDS, normalizePoint, normalizeZone,
  type ElevationPoint, type TerrainKind, type TerrainZone,
} from './terrain';

interface SvgProps { property: PropertyConfig; scaleX: number; scaleY: number }

/** Terrain zones + elevation contours for the SVG yard map (feet → px via scale). */
export function TerrainSvgLayer({ property, scaleX, scaleY }: SvgProps) {
  const zones = property.terrainZones ?? [];
  const points = property.elevationPoints ?? [];
  return (
    <g aria-label="Terrain" pointerEvents="none">
      {zones.map((z) => {
        const color = TERRAIN_KINDS[z.kind]?.color ?? '#4A7C59';
        const label = `${z.name}${z.elevationFt ? ` (${z.elevationFt > 0 ? '+' : ''}${z.elevationFt} ft)` : ''}`;
        return (
          <g key={z.id}>
            {z.polygon && z.polygon.length >= 3 ? (
              <polygon points={z.polygon.map((p) => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                fill={color} fillOpacity={0.45} stroke={color} strokeDasharray="6 4" />
            ) : (
              <rect x={z.x * scaleX} y={z.y * scaleY} width={z.width * scaleX} height={z.depth * scaleY}
                fill={color} fillOpacity={0.45} stroke={color} strokeOpacity={0.9} strokeDasharray="6 4" rx={4} />
            )}
            <text x={(z.polygon?.[0]?.x ?? z.x) * scaleX + 6} y={(z.polygon?.[0]?.y ?? z.y) * scaleY + 13}
              fill="#F0EDE4" fillOpacity={0.8} fontSize={10} fontFamily="monospace">{label}</text>
          </g>
        );
      })}
      {points.map((p) => {
        const up = p.heightFt >= 0;
        const stroke = up ? '#C8B882' : '#6FA8DC';
        return (
          <g key={p.id}>
            {[1, 0.66, 0.33].map((k) => (
              <ellipse key={k} cx={p.x * scaleX} cy={p.y * scaleY} rx={p.radiusFt * k * scaleX} ry={p.radiusFt * k * scaleY}
                fill="none" stroke={stroke} strokeOpacity={0.35 + (1 - k) * 0.5} strokeWidth={1.2} />
            ))}
            <text x={p.x * scaleX} y={p.y * scaleY + 4} textAnchor="middle" fill={stroke} fontSize={11} fontWeight={700} fontFamily="monospace">
              {up ? '▲' : '▼'} {up ? '+' : ''}{p.heightFt} ft
            </text>
          </g>
        );
      })}
    </g>
  );
}

interface EditorProps {
  property: PropertyConfig;
  onChange: (updates: Pick<PropertyConfig, 'terrainZones' | 'elevationPoints'>) => void;
}

const num = (v: string) => (v === '' || v === '-' ? 0 : Number(v));
const field = { size: 'small' as const, sx: { minWidth: 0 } };

/** Sidebar editor for terrain zones and elevation points. */
export function TerrainEditorPanel({ property, onChange }: EditorProps) {
  const [open, setOpen] = useState<string | null>(null);
  const zones = property.terrainZones ?? [];
  const points = property.elevationPoints ?? [];
  const W = property.widthFt, D = property.depthFt;

  const setZones = (next: TerrainZone[]) => onChange({ terrainZones: next.map((z) => normalizeZone(z, W, D)) });
  const setPoints = (next: ElevationPoint[]) => onChange({ elevationPoints: next.map((p) => normalizePoint(p, W, D)) });
  const patchZone = (id: string, patch: Partial<TerrainZone>) => setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const patchPoint = (id: string, patch: Partial<ElevationPoint>) => setPoints(points.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addZone = () => {
    const id = `zone-${Date.now().toString(36)}`;
    setZones([...zones, { id, name: 'New zone', kind: 'mulch', x: Math.round(W / 2 - 5), y: Math.round(D / 2 - 5), width: 10, depth: 10, source: 'user' }]);
    setOpen(id);
  };
  const addPoint = () => {
    const id = `elev-${Date.now().toString(36)}`;
    setPoints([...points, { id, x: Math.round(W / 2), y: Math.round(D / 2), heightFt: 2, radiusFt: 10, label: 'Mound', source: 'user' }]);
    setOpen(id);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, border: '1px solid #1A3D2B' }} data-testid="terrain-editor">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 4, height: 20, bgcolor: '#8c7650', borderRadius: 1, flexShrink: 0 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>Terrain</Typography>
        <Chip size="small" label="Robot mapping: coming soon" sx={{ fontSize: 10, height: 20, color: '#8A7D55', border: '1px solid #2A5C3B' }} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Mark where the ground changes (soil, mulch, gravel, paving) and where it rises or dips. The 3D view follows.
        A mapping robot will later fill in measured elevation and outlines automatically.
      </Typography>

      <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ flex: 1, color: '#C8B882' }}>Zones ({zones.length})</Typography>
        <Button size="small" onClick={addZone}>+ Zone</Button>
      </Stack>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        {zones.map((z) => {
          const robot = z.source === 'robot';
          return (
            <Box key={z.id} sx={{ border: '1px solid #1A3D2B', borderRadius: 1, p: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={1} onClick={() => setOpen(open === z.id ? null : z.id)} sx={{ cursor: 'pointer' }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: TERRAIN_KINDS[z.kind]?.color }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{z.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {TERRAIN_KINDS[z.kind]?.label}{z.elevationFt ? ` · ${z.elevationFt > 0 ? '+' : ''}${z.elevationFt} ft` : ''}{robot ? ' · robot' : ''}
                </Typography>
                {!robot && (
                  <IconButton size="small" aria-label={`Delete ${z.name}`} onClick={(e) => { e.stopPropagation(); setZones(zones.filter((o) => o.id !== z.id)); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {open === z.id && !robot && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField {...field} label="Name" value={z.name} onChange={(e) => patchZone(z.id, { name: e.target.value })} sx={{ flex: 1 }} />
                    <TextField {...field} select label="Surface" value={z.kind} onChange={(e) => patchZone(z.id, { kind: e.target.value as TerrainKind })} sx={{ width: 140 }}>
                      {(Object.keys(TERRAIN_KINDS) as TerrainKind[]).map((k) => <MenuItem key={k} value={k}>{TERRAIN_KINDS[k].label}</MenuItem>)}
                    </TextField>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {(['x', 'y', 'width', 'depth'] as const).map((k) => (
                      <TextField key={k} {...field} type="number" label={`${k === 'width' ? 'W' : k === 'depth' ? 'D' : k.toUpperCase()} ft`} value={z[k]}
                        onChange={(e) => patchZone(z.id, { [k]: num(e.target.value) })} />
                    ))}
                  </Stack>
                  <TextField {...field} type="number" label="Raise / lower (ft)" value={z.elevationFt ?? 0}
                    helperText="e.g. 1 for a raised bed area, -0.5 for a low spot"
                    onChange={(e) => patchZone(z.id, { elevationFt: num(e.target.value) })} />
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ flex: 1, color: '#C8B882' }}>Elevation ({points.length})</Typography>
        <Button size="small" onClick={addPoint}>+ Mound / dip</Button>
      </Stack>
      <Stack spacing={0.75}>
        {points.map((p) => {
          const robot = p.source === 'robot';
          return (
            <Box key={p.id} sx={{ border: '1px solid #1A3D2B', borderRadius: 1, p: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={1} onClick={() => setOpen(open === p.id ? null : p.id)} sx={{ cursor: 'pointer' }}>
                <Typography variant="body2" sx={{ color: p.heightFt >= 0 ? '#C8B882' : '#6FA8DC' }}>{p.heightFt >= 0 ? '▲' : '▼'}</Typography>
                <Typography variant="body2" sx={{ flex: 1 }}>{p.label || 'Elevation'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.heightFt > 0 ? '+' : ''}{p.heightFt} ft · r {p.radiusFt} ft{robot ? ' · robot' : ''}
                </Typography>
                {!robot && (
                  <IconButton size="small" aria-label={`Delete ${p.label || 'elevation point'}`} onClick={(e) => { e.stopPropagation(); setPoints(points.filter((o) => o.id !== p.id)); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {open === p.id && !robot && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField {...field} label="Label" value={p.label ?? ''} onChange={(e) => patchPoint(p.id, { label: e.target.value })} />
                  <Stack direction="row" spacing={1}>
                    <TextField {...field} type="number" label="X ft" value={p.x} onChange={(e) => patchPoint(p.id, { x: num(e.target.value) })} />
                    <TextField {...field} type="number" label="Y ft" value={p.y} onChange={(e) => patchPoint(p.id, { y: num(e.target.value) })} />
                    <TextField {...field} type="number" label="Height ft" value={p.heightFt} onChange={(e) => patchPoint(p.id, { heightFt: num(e.target.value) })} />
                    <TextField {...field} type="number" label="Radius ft" value={p.radiusFt} onChange={(e) => patchPoint(p.id, { radiusFt: num(e.target.value) })} />
                  </Stack>
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
      {property.elevationGrid && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#6BBF59' }}>
          Measured elevation grid from {property.elevationGrid.deviceId ?? 'a robot'} ({property.elevationGrid.cols}×{property.elevationGrid.rows} @ {property.elevationGrid.stepFt} ft) overrides the points where it has data.
        </Typography>
      )}
    </Paper>
  );
}

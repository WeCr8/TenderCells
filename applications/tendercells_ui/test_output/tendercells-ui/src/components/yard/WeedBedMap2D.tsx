import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { YardFlag } from '../../lib/yard/yardTypes';

const MM_PER_FOOT = 304.8;

const markerColor = (flag: YardFlag) => {
  if (flag.status === 'treated') return '#4A7C59';
  if (flag.status === 'rejected') return '#8A7D55';
  return '#E8A020';
};

type Props = {
  name: string;
  widthFt: number;
  depthFt: number;
  flags: YardFlag[];
};

export default function WeedBedMap2D({ name, widthFt, depthFt, flags }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const widthMm = Math.max(widthFt * MM_PER_FOOT, 1);
  const depthMm = Math.max(depthFt * MM_PER_FOOT, 1);
  const selected = flags.find((flag) => flag.id === selectedId);
  const markers = useMemo(() => flags.filter((flag) => flag.bedMm), [flags]);

  return (
    <Stack spacing={1.25} data-testid="weed-bed-map-2d">
      <Box
        role="group"
        aria-label={`${name} 2D detection map with ${markers.length} markers`}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${Math.max(widthFt, 1)} / ${Math.max(depthFt, 1)}`,
          minHeight: 260,
          maxHeight: 520,
          overflow: 'hidden',
          border: '1px solid #4A7C59',
          borderRadius: 1,
          bgcolor: '#173624',
          backgroundImage: 'linear-gradient(#4A7C5933 1px, transparent 1px), linear-gradient(90deg, #4A7C5933 1px, transparent 1px)',
          backgroundSize: '10% 10%',
        }}
      >
        <Typography sx={{ position: 'absolute', top: 10, left: 12, color: '#C8B882', fontSize: 13, fontWeight: 700 }}>
          {name} · {widthFt} × {depthFt} ft
        </Typography>
        {markers.map((flag) => {
          const x = Math.min(100, Math.max(0, ((flag.bedMm?.x ?? 0) / widthMm) * 100));
          const y = Math.min(100, Math.max(0, ((flag.bedMm?.y ?? 0) / depthMm) * 100));
          const confidence = flag.confidence == null ? 'confidence unavailable' : `${Math.round(flag.confidence * 100)}% confidence`;
          return (
            <Box
              component="button"
              type="button"
              key={flag.id}
              onClick={() => setSelectedId(flag.id)}
              aria-label={`${flag.title}, ${confidence}, ${Math.round(flag.bedMm?.x ?? 0)} by ${Math.round(flag.bedMm?.y ?? 0)} millimeters`}
              sx={{
                position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                bgcolor: markerColor(flag), border: selectedId === flag.id ? '3px solid #F0EDE4' : '2px solid #0D2B1E',
                boxShadow: '0 0 0 3px #0005',
                '&:focus-visible': { outline: '3px solid #F0EDE4', outlineOffset: 2 },
              }}
            />
          );
        })}
        {!markers.length && (
          <Typography sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#8A7D55', px: 2, textAlign: 'center' }}>
            No detections yet. Start a camera pass to scan this bed.
          </Typography>
        )}
      </Box>
      {selected && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Typography sx={{ color: '#F0EDE4', flex: 1, fontSize: 14 }}>
            {selected.title} at {Math.round(selected.bedMm?.x ?? 0)}, {Math.round(selected.bedMm?.y ?? 0)} mm
          </Typography>
          <Chip size="small" label={selected.confidence == null ? 'Confidence unavailable' : `${Math.round(selected.confidence * 100)}% confidence`}
            sx={{ color: '#F0EDE4', border: '1px solid #4A7C59' }} />
        </Stack>
      )}
    </Stack>
  );
}

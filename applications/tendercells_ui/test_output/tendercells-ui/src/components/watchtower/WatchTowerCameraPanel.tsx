// WatchTowerCameraPanel.tsx - WatchTower camera feeds + recent predator detections.
//
// Live (hardware API configured): each camera node (firmware/camera-node) publishes
// its MJPEG streamUrl in its heartbeat on tc/{towerId}_cam{n}/sensors; this panel shows
// those streams. Demo: the 3D view above renders what each tower camera sees.
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MQTT_API_BASE, hardwareAuthHeaders } from '../../lib/api/hardwareApi';
import { YARD_LIVE } from '../../lib/yard/yardTypes';
import { useYardEvents } from '../../hooks/useYardEvents';
import { loadPropertyLayout } from '../property/propertyLayoutStore';

const CAMS = ['North', 'South-east', 'South-west'];

/** Camera feeds (live MJPEG or demo note) and the tower's recent detections. */
export default function WatchTowerCameraPanel({ towerId = 'wt_001' }: { towerId?: string }) {
  const [streams, setStreams] = useState<(string | null)[]>([null, null, null]);
  const towers = useMemo(() => loadPropertyLayout().items.filter((i) => i.type === 'watchtower'), []);
  const { flags, act } = useYardEvents(towers);
  const detections = flags.filter((f) => f.type === 'alert').sort((a, b) => b.ts - a.ts).slice(0, 6);

  useEffect(() => {
    if (!YARD_LIVE) return;
    let alive = true;
    const load = async () => {
      const urls = await Promise.all([1, 2, 3].map(async (n) => {
        try {
          const res = await fetch(`${MQTT_API_BASE}/devices/${towerId}_cam${n}/telemetry`, { headers: await hardwareAuthHeaders() });
          if (!res.ok) return null;
          const url = ((await res.json()) as { data?: { streamUrl?: string } }).data?.streamUrl;
          return typeof url === 'string' && /^https?:\/\//.test(url) ? url : null;
        } catch { return null; }
      }));
      if (alive) setStreams(urls);
    };
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => { alive = false; clearInterval(t); };
  }, [towerId]);

  const mixedContent = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <Paper elevation={0} sx={{ bgcolor: '#1A3D2B', border: '1px solid #4A7C5944', borderRadius: 2, p: 2, mx: 3, mb: 3, color: '#F0EDE4' }}
      data-testid="watchtower-cameras">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ color: '#C8B882', flex: 1 }}>Tower cameras</Typography>
        <Chip size="small" label={YARD_LIVE ? 'Live' : 'Simulated'} sx={{ color: '#F0EDE4', border: '1px solid #CC3333' }} />
      </Stack>
      {YARD_LIVE ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
          {CAMS.map((label, i) => (
            <Box key={label} sx={{ bgcolor: '#0D2B1E', borderRadius: 1, overflow: 'hidden', aspectRatio: '4 / 3', position: 'relative' }}>
              {streams[i]
                ? <Box component="img" src={streams[i]!} alt={`WatchTower camera ${i + 1} (${label})`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Typography variant="caption" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, textAlign: 'center', color: '#8A7D55' }}>
                    No stream from {towerId}_cam{i + 1} yet.
                  </Typography>}
              <Box component="span" sx={{ position: 'absolute', top: 4, left: 6, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.55)', px: 0.5 }}>
                CAM {i + 1} · {label}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: '#A5B1A9' }}>
          The 3D view above shows what each of the tower&apos;s three 120° cameras sees (Tower cams). With hardware, each camera
          node streams MJPEG from the tower and its feed appears here.
        </Typography>
      )}
      {YARD_LIVE && mixedContent && streams.some(Boolean) && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#E8A020' }}>
          Streams are plain http on your network; if they stay blank on the https site, open the OS from your local hub.
        </Typography>
      )}

      <Typography variant="subtitle2" sx={{ color: '#C8B882', mt: 2, mb: 1 }}>Recent detections</Typography>
      {detections.length === 0
        ? <Typography variant="body2" sx={{ color: '#8A7D55' }}>No predators seen recently.</Typography>
        : detections.map((d) => (
          <Stack key={`${d.deviceId}:${d.id}`} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5, borderBottom: '1px solid #4A7C5933' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.status === 'active' ? '#CC3333' : '#8A7D55' }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {d.title}{d.confidence != null ? ` · ${Math.round(d.confidence * 100)}%` : ''} · {d.detail}
              {d.bearingDeg != null ? ` · bearing ${Math.round(d.bearingDeg)}°` : ''} · {new Date(d.ts).toLocaleTimeString()}
            </Typography>
            {d.status === 'active' && <Button size="small" onClick={() => void act(d, 'ack')} sx={{ color: '#C8B882' }}>Seen it</Button>}
          </Stack>
        ))}
    </Paper>
  );
}

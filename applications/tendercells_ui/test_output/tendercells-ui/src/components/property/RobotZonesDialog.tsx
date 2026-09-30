// RobotZonesDialog.tsx - toolbar buttons for the property layout: "Robot zones" sends each
// robot its exclusion zones (no-go, keep-out, no-laser around animal housing) over MQTT, after
// a confirmation, and flags patrol routes that cross a zone; "Isaac Sim" downloads the layout
// as OpenUSD (.usda). Usage: PropertyLayoutBuilder toolbar.
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BlockIcon from '@mui/icons-material/Block';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import type { PropertyLayoutState } from './propertyLayoutStore';
import { ZONE_ROBOT_TYPES, routeConflict, zonesFromLayout, zonesPayload } from '../../lib/yard/exclusionZones';
import { effectiveBoundary, itemsOutside } from '../../lib/yard/boundary';
import { sendZones } from '../../lib/yard/yardApi';
import { YARD_LIVE } from '../../lib/yard/yardTypes';
import { downloadUsda } from '../../lib/yard/usdExport';

const KIND_COLOR = { 'no-go': '#CC3333', 'keep-out': '#E8A020', 'no-laser': '#C8B882' } as const;

export default function RobotZonesDialog({ layout }: { layout: PropertyLayoutState }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const zones = useMemo(() => zonesFromLayout(layout), [layout]);
  const robots = layout.items.filter((i) => ZONE_ROBOT_TYPES.has(i.type) && i.deviceId);
  const conflicts = layout.items
    .filter((i) => i.patrolPath && i.patrolPath.length > 1)
    .map((i) => ({ item: i, hit: routeConflict(layout, i.patrolPath!, i.id) }))
    .filter((c) => c.hit);

  const boundary = effectiveBoundary(layout);
  const outside = itemsOutside(layout, boundary);
  const send = async () => {
    setBusy(true);
    const out: string[] = [];
    for (const r of robots) {
      try {
        const res = await sendZones(r.deviceId!, zonesPayload(layout, r));
        out.push(`${r.name}: ${res.acked ? 'robot confirmed' : 'sent (robot will load it when online - retained)'}`);
      } catch (err) {
        out.push(`${r.name}: ${(err as Error).message}`);
      }
    }
    setResult(out);
    setBusy(false);
  };

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<BlockIcon />} onClick={() => { setResult([]); setOpen(true); }}
        data-testid="robot-zones-button"
        sx={{ borderColor: '#CC3333', color: '#F2B8B5', '&:hover': { borderColor: '#FF6666' } }}>
        Robot zones ({zones.length})
      </Button>
      <Button variant="outlined" size="small" startIcon={<ViewInArIcon />} onClick={() => downloadUsda(layout)}
        data-testid="isaac-export-button"
        sx={{ borderColor: '#2A5C3B', color: '#A5B1A9', '&:hover': { borderColor: '#4A7C59', color: '#E4E7E5' } }}>
        Isaac Sim (.usda)
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Robot exclusion zones</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Robots keep out of <strong>no-go</strong> zones and obstacle <strong>keep-out</strong> footprints, and never fire a laser or
            aiming dot inside any zone - including the <strong>no-laser</strong> buffer around every animal house. Zones are stored on the
            robot, so they still apply if the network drops.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }} data-testid="zones-boundary">
            <strong>Property boundary</strong> ({boundary.source === 'layout' ? 'property rectangle' : boundary.source === 'drawn' ? 'drawn by you' : 'robot survey you accepted'},{' '}
            {boundary.poly.length} corners): robots never drive or aim outside it, or within {boundary.marginFt} ft of its edge.
          </Typography>
          {outside.map((it) => (
            <Typography key={it.id} variant="body2" sx={{ color: '#E8A020' }}>⚠ {it.name} sits partly outside the boundary - move it or widen the boundary.</Typography>
          ))}
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            {zones.map((z) => <Chip key={z.id} size="small" label={`${z.name} · ${z.kind}`} sx={{ border: `1px solid ${KIND_COLOR[z.kind]}` }} />)}
            {zones.length === 0 && <Typography variant="caption">No zones yet - add a No-Go Zone or obstacles to the map.</Typography>}
          </Stack>
          {conflicts.map(({ item, hit }) => (
            <Typography key={item.id} variant="body2" sx={{ color: '#E8A020' }} data-testid="zone-conflict">
              ⚠ {item.name}&apos;s patrol path {hit!.zone.id === 'boundary' ? 'leaves the property boundary' : <>crosses {hit!.zone.kind} zone &quot;{hit!.zone.name}&quot;</>} (segment {hit!.segment + 1}) - the robot will stop there. Redraw the path.
            </Typography>
          ))}
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="subtitle2">Robots ({robots.length})</Typography>
            {robots.length === 0
              ? <Typography variant="caption">Link a device ID to a Roaming Roost, rover, robot mower, custom robot, garden robot or rail module to send it zones and the boundary.</Typography>
              : robots.map((r) => <Typography key={r.id} variant="body2">• {r.name} ({r.deviceId})</Typography>)}
          </Box>
          {!YARD_LIVE && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#8A7D55' }}>Demo mode: connect the hardware API to send zones.</Typography>}
          {result.map((r) => <Typography key={r} variant="body2" sx={{ mt: 0.5 }}>{r}</Typography>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button variant="contained" color="error" disabled={busy || !YARD_LIVE || robots.length === 0} onClick={() => void send()}
            data-testid="send-zones">
            Send to {robots.length} robot{robots.length === 1 ? '' : 's'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

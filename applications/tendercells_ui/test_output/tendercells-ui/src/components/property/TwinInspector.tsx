// TwinInspector.tsx - compact inspector for the twin selected on the Property Twin.
// Shows the entity, that it is SIMULATED (demo) or a design item, its current state, and three
// ways in: OPEN SYSTEM (its page), WHY THIS STATE? (the latest event that changed it, at kid /
// farmer / engineer depth) and SEE HARDWARE ("How this becomes real": the physical path, wiring,
// firmware, flasher and source - lib/twin/physical.ts). Twin ID and provenance are one tap away
// for advanced users. Usage: PropertyLayoutBuilder, above the selected item's editor.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { PropertyItem } from './propertyLayoutStore';
import WhyPanel from '../demo/WhyPanel';
import { EVENT_LOG_EVENT, readEventLog, type EventLogEntry } from '../../lib/demo/eventSimulator';
import { trackDemo } from '../../lib/demo/track';
import { deviceTwinId, twinId } from '../../lib/twin/twin';
import { STATUS_LABEL, physicalLinks, physicalPath } from '../../lib/twin/physical';
import { DEMO_EVENT, getDemoEquipment, isDemoSeeded } from '../../services/demo/demoEnvironment';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4', warning: '#E8A020' };

/** OS page for each product family (where "Open system" goes). */
const SYSTEM_PATH: Record<string, string> = {
  'chicken-tender': '/chicken-tender', 'roaming-roost': '/roaming-roost', 'duck-dock': '/duck-dock',
  'goat-guardian': '/goat-guardian', 'bunny-burrow': '/bunny-burrow', 'turkey-tower': '/turkey-tower',
  'pigeon-palace': '/pigeon-palace', watchtower: '/predator-monitor', 'weed-rover': '/weed-patrol',
  'robot-mower': '/mowers', 'farmbot-genesis': '/weed-patrol', 'farmbot-genesis-xl': '/weed-patrol', 'rail-module': '/rail-system-modules',
};
const LINK_EVENT: Record<string, string> = { build: 'build_guide_opened', wiring: 'wiring_viewed', firmware: 'firmware_viewed', flash: 'flash_clicked', source: 'github_clicked', docs: 'integration_viewed' };

/** The twin ID for a layout item: device twins by device id, otherwise by item id. */
const itemTwinId = (item: PropertyItem): string => (item.deviceId ? deviceTwinId(item.deviceId) : twinId('device', item.type, item.id));

export default function TwinInspector({ item }: { item: PropertyItem }) {
  const navigate = useNavigate();
  const demo = isDemoSeeded();
  const twin = itemTwinId(item);
  const [log, setLog] = useState<EventLogEntry[]>(() => readEventLog());
  const [, setTick] = useState(0);
  const [dialog, setDialog] = useState<'why' | 'hardware' | null>(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => { trackDemo('entity_opened', { type: item.type }); }, [item.id, item.type]);
  useEffect(() => {
    const onLog = () => setLog(readEventLog());
    const onDemo = () => setTick((t) => t + 1);
    window.addEventListener(EVENT_LOG_EVENT, onLog);
    window.addEventListener(DEMO_EVENT, onDemo);
    return () => { window.removeEventListener(EVENT_LOG_EVENT, onLog); window.removeEventListener(DEMO_EVENT, onDemo); };
  }, []);

  const eq = item.deviceId ? getDemoEquipment(item.deviceId)[0] : undefined;
  const rows: Array<[string, string]> = [];
  if (eq) {
    rows.push(['Door', eq.door === 'open' ? 'Open' : eq.door === 'closed' ? 'Closed' : 'Unknown']);
    if (eq.sensors?.tempF !== undefined) rows.push(['Temperature', `${Math.round(eq.sensors.tempF)}°F`]);
    if (eq.waterLevelPct !== undefined) rows.push(['Water', eq.waterLevelPct < 20 ? `Low (${eq.waterLevelPct}%)` : `Normal (${eq.waterLevelPct}%)`]);
    if (eq.feedLevelPct !== undefined) rows.push(['Feed', `${eq.feedLevelPct}%`]);
  }
  rows.push(['Size', `${item.width} × ${item.depth} ft`]);
  const lastEvent = useMemo(() => log.find((e) => e.twin === twin), [log, twin]);
  const path = physicalPath(item.type);
  const system = SYSTEM_PATH[item.type];

  if (item.kind !== 'hardware') return null;
  return (
    <Paper elevation={3} sx={{ p: 2, border: `1px solid ${C.accent}` }} data-testid="twin-inspector">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 800, color: C.gold, flex: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 14 }}>{item.name}</Typography>
        <Chip size="small" label={demo ? 'SIMULATED' : 'DESIGN'} sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: `${C.warning}26`, color: C.warning }} />
      </Stack>
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.25, fontSize: 13 }}>
        {rows.map(([k, v]) => (
          <Box key={k} sx={{ display: 'contents' }}>
            <Box component="dt" sx={{ color: C.goldMuted }}>{k}</Box>
            <Box component="dd" sx={{ m: 0, color: C.white }}>{v}</Box>
          </Box>
        ))}
      </Box>
      <Typography sx={{ color: C.goldMuted, fontSize: 11, mt: 1 }}>
        Source: {demo ? 'Simulation' : 'Your layout'} ·{' '}
        <Box component="button" type="button" onClick={() => setAdvanced((a) => !a)}
          sx={{ background: 'none', border: 0, p: 0, color: C.gold, cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>
          {advanced ? 'hide details' : 'twin details'}
        </Box>
      </Typography>
      {advanced && (
        <Typography data-testid="twin-details" sx={{ color: C.goldMuted, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
          {twin} · mode {demo ? 'SIMULATED' : 'USER_ENTERED'}{item.deviceId ? ` · topics tc/${item.deviceId}/…` : ''}
          {lastEvent ? ` · last changed ${new Date(lastEvent.at).toLocaleTimeString()}` : ''}
        </Typography>
      )}
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
        {system && <Button size="small" variant="contained" onClick={() => navigate(system)} sx={{ bgcolor: C.accent }}>Open system</Button>}
        <Button size="small" variant="outlined" data-testid="twin-why" onClick={() => { setDialog('why'); trackDemo('why_opened', { from: 'inspector', type: item.type }); }}
          sx={{ borderColor: C.accent, color: C.gold }}>Why this state?</Button>
        <Button size="small" variant="outlined" data-testid="twin-hardware" onClick={() => { setDialog('hardware'); trackDemo('hardware_viewed', { type: item.type }); }}
          sx={{ borderColor: C.accent, color: C.gold }}>See hardware</Button>
      </Stack>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
        {dialog === 'why' && (
          <>
            <DialogTitle sx={{ color: C.gold }}>Why is {item.name} like this?</DialogTitle>
            <DialogContent>
              {lastEvent ? (
                <>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>{lastEvent.emoji} {lastEvent.outcome}</Typography>
                  <WhyPanel scenarioId={lastEvent.scenarioId} steps={lastEvent.steps} twin={lastEvent.twin} />
                </>
              ) : (
                <Typography sx={{ color: C.goldMuted }}>
                  Nothing has changed it yet - this is its starting state{demo ? ' in the demo' : ''}. Trigger an event to see cause and effect.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => navigate('/simulator')} sx={{ color: C.gold }}>Trigger an event</Button>
              <Button onClick={() => setDialog(null)} sx={{ color: C.goldMuted }}>Close</Button>
            </DialogActions>
          </>
        )}
        {dialog === 'hardware' && (
          <>
            <DialogTitle sx={{ color: C.gold }}>How {item.name} becomes real</DialogTitle>
            <DialogContent>
              <Chip size="small" label={STATUS_LABEL[path.status]} sx={{ mb: 1.5, bgcolor: `${C.accent}33`, color: C.gold, fontWeight: 700 }} data-testid="hardware-status" />
              <Stack spacing={0.25} component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }} data-testid="hardware-chain">
                {path.chain.map((step, i) => (
                  <Box component="li" key={step}>
                    {i > 0 && <Typography aria-hidden sx={{ color: C.goldMuted, pl: 1.5, lineHeight: 1 }}>↓</Typography>}
                    <Box sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}55`, borderRadius: 1, px: 1.25, py: 0.6, fontSize: 14,
                      fontWeight: i === path.chain.length - 1 ? 800 : 500, color: i === path.chain.length - 1 ? C.gold : C.white }}>
                      {step.split('{id}').join(item.deviceId ?? '{id}')}
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {physicalLinks(path).map((l) => (
                  <Button key={l.id} size="small" variant="outlined" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => trackDemo(LINK_EVENT[l.id] ?? 'hardware_link', { type: item.type, link: l.id })}
                    sx={{ borderColor: C.accent, color: C.gold }}>{l.label}</Button>
                ))}
              </Stack>
              <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 1.5 }}>
                The twin here is simulated. Connected hardware reports through the same topics; a command shows as requested, then
                acknowledged, and only counts as done when the device confirms it.
              </Typography>
            </DialogContent>
            <DialogActions><Button onClick={() => setDialog(null)} sx={{ color: C.goldMuted }}>Close</Button></DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
}

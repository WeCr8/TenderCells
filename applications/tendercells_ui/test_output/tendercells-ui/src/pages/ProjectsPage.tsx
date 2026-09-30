// ProjectsPage.tsx - DIY habitat projects (terrarium, enclosure camera, sound monitor,
// pond, activity wheel) and their live feeds. Usage: /projects (side menu "DIY Projects"),
// linked from library species pages.
//
// Feeds are local-first: the camera / audio stream loads straight from the device on the
// viewer's network (free), and only JSON telemetry + AI events come through the Tender
// Cells API. "Cloud" live view relays media for viewers away from home - a paid plan
// feature (CLOUD_FEED in shared/library/projects.ts), shown here as coming soon.
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import HandymanIcon from '@mui/icons-material/Handyman';
import { GROUP_LABEL, type AnimalGroup } from '../../../shared/library/animals';
import { CLOUD_FEED, PROJECTS, feedBudget, formatBytes, hfUrl, projectById, type HabitatProject } from '../../../shared/library/projects';
import { MQTT_API_BASE, hardwareAuthHeaders } from '../lib/api/hardwareApi';
import { fetchYardEvents } from '../lib/yard/yardApi';
import { YARD_LIVE, type YardEvent } from '../lib/yard/yardTypes';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', warning: '#E8A020', white: '#F0EDE4' };
const card = { bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, color: C.white };
const STORE_KEY = 'tc_diy_projects_v1';

/** A built project connected to the OS (kept per browser for now). */
export interface ProjectDevice { deviceId: string; projectId: string; name: string; streamUrl?: string; audioUrl?: string }

function loadDevices(): ProjectDevice[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as ProjectDevice[]; } catch { return []; }
}
function saveDevices(list: ProjectDevice[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* private mode - session only */ }
}

const isHttpUrl = (u?: string) => !!u && /^https?:\/\//.test(u);

/** Demo telemetry so the feed card works without hardware. */
function simValues(p: HabitatProject, t: number): Record<string, number | string | boolean> {
  const w = Math.sin(t / 60000);
  const v: Record<string, number | string | boolean> = {
    warmF: 88 + 2 * w, coolF: 76 + w, baskF: 100 + 3 * w, humidity: 45 + 5 * w, uvbOn: new Date(t).getHours() >= 7 && new Date(t).getHours() < 19,
    waterF: 76 + w, waterLevel: 92, ph: 7.2, aeratorOn: true, wheelTurns: 1200 + Math.round(300 * (1 + w)), distanceM: 850,
    lastSeen: 'demo', count: 2, soundLabel: 'Chicken, rooster', score: 0.82,
  };
  return Object.fromEntries(p.publishes.filter((k) => k !== 'streamUrl').map((k) => [k, v[k] ?? '—']));
}

function Feed({ dev, onRemove }: { dev: ProjectDevice; onRemove: () => void }) {
  const project = projectById(dev.projectId);
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<YardEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setNow(Date.now());
      if (!YARD_LIVE) return;
      try {
        const res = await fetch(`${MQTT_API_BASE}/devices/${encodeURIComponent(dev.deviceId)}/telemetry`, { headers: await hardwareAuthHeaders() });
        if (res.ok && alive) setData(((await res.json()) as { data?: Record<string, unknown> }).data ?? null);
        const ev = await fetchYardEvents(dev.deviceId);
        if (alive) setEvents(ev.events.slice(0, 5));
      } catch { /* offline - keep the last values */ }
    };
    void load();
    const t = setInterval(() => void load(), 10000); // JSON only, matches the 10 s publish
    return () => { alive = false; clearInterval(t); };
  }, [dev.deviceId]);

  if (!project) return null;
  const values = YARD_LIVE ? (data ?? {}) : simValues(project, now);
  const stream = isHttpUrl(dev.streamUrl) ? dev.streamUrl : (isHttpUrl(data?.streamUrl as string) ? (data!.streamUrl as string) : undefined);
  const httpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <Paper elevation={0} sx={card} data-testid="project-feed">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 700, flex: 1 }}>{project.emoji} {dev.name} <Typography component="span" variant="caption" sx={{ color: C.goldMuted }}>· {dev.deviceId}</Typography></Typography>
        <Chip size="small" label={YARD_LIVE ? 'Live' : 'Simulated'} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
        {(project.video || project.audio) && (
          <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
            <ToggleButton value="local" sx={{ color: C.white, py: 0.25 }}>Local</ToggleButton>
            <ToggleButton value="cloud" sx={{ color: C.white, py: 0.25 }}>Cloud</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      {project.video && mode === 'local' && (
        <Box sx={{ bgcolor: C.bg, borderRadius: 1, overflow: 'hidden', aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', mb: 1 }}>
          {stream
            ? <Box component="img" src={stream} alt={`${dev.name} camera`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Typography variant="caption" sx={{ color: C.goldMuted, p: 2, textAlign: 'center' }}>
                {YARD_LIVE ? `Waiting for ${dev.deviceId} to publish its streamUrl (or add it below).` : 'Demo - connect a camera to see its stream here.'}
              </Typography>}
        </Box>
      )}
      {project.audio && mode === 'local' && isHttpUrl(dev.audioUrl) && (
        <Box component="audio" controls preload="none" src={dev.audioUrl} sx={{ width: '100%', mb: 1 }} />
      )}
      {mode === 'local' && stream?.startsWith('http:') && httpsPage && (
        <Typography variant="caption" sx={{ display: 'block', color: C.warning, mb: 1 }}>
          The stream is plain http on your network. If it stays blank here, <a href={stream} target="_blank" rel="noreferrer" style={{ color: C.warning }}>open it directly</a> or use the OS from your local hub.
        </Typography>
      )}
      {mode === 'cloud' && (
        <Box sx={{ bgcolor: C.bg, borderRadius: 1, p: 1.5, mb: 1 }} data-testid="cloud-feed-upsell">
          <Typography variant="body2" sx={{ fontWeight: 700, color: C.gold }}>Cloud live view - coming soon (paid plans)</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Watch from anywhere without opening your network. {CLOUD_FEED.starter_monthly.label} includes {CLOUD_FEED.starter_monthly.liveHoursPerMonth} h/month
            of cloud live view and {CLOUD_FEED.starter_monthly.clipDays}-day clips; {CLOUD_FEED.school_annual.label} {CLOUD_FEED.school_annual.liveHoursPerMonth} h.
            Free keeps local live view, AI events and {CLOUD_FEED.free.snapshotDays}-day event snapshots. Plans: Account → Billing.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
        {Object.entries(values).filter(([k]) => k !== 'streamUrl').map(([k, v]) => (
          <Box key={k} sx={{ bgcolor: C.bg, borderRadius: 1, p: 1 }}>
            <Typography variant="caption" sx={{ color: C.goldMuted }}>{k}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{typeof v === 'number' ? Math.round(v * 10) / 10 : String(v)}</Typography>
          </Box>
        ))}
        {YARD_LIVE && !data && <Typography variant="caption" sx={{ color: C.goldMuted }}>No telemetry from {dev.deviceId} yet.</Typography>}
      </Box>
      {events.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {events.map((e) => <Typography key={e.id} variant="caption" sx={{ display: 'block' }}>• {e.type}{e.label ? ` · ${e.label}` : ''} · {new Date(e.ts).toLocaleTimeString()}</Typography>)}
        </Box>
      )}
      <Button size="small" onClick={onRemove} sx={{ mt: 1, color: C.goldMuted }}>Disconnect</Button>
    </Paper>
  );
}

export default function ProjectsPage() {
  const [params] = useSearchParams();
  const [group, setGroup] = useState<AnimalGroup | 'all'>((params.get('group') as AnimalGroup) || 'all');
  const [devices, setDevices] = useState<ProjectDevice[]>(loadDevices);
  const [form, setForm] = useState<ProjectDevice>({ deviceId: '', projectId: params.get('project') ?? PROJECTS[0].id, name: '', streamUrl: '', audioUrl: '' });
  const shown = useMemo(() => PROJECTS.filter((p) => group === 'all' || p.groups.includes(group)), [group]);
  const budget = feedBudget({ video: { fps: 5, kbPerFrame: 30 }, audioKbps: 64 });

  const update = (list: ProjectDevice[]) => { setDevices(list); saveDevices(list); };
  const connect = () => {
    const deviceId = form.deviceId.trim();
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(deviceId)) return;
    update([...devices.filter((d) => d.deviceId !== deviceId), { ...form, deviceId, name: form.name.trim() || projectById(form.projectId)?.title || deviceId }]);
    setForm({ ...form, deviceId: '', name: '', streamUrl: '', audioUrl: '' });
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <HandymanIcon sx={{ color: C.accent, fontSize: 30 }} />
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>DIY Projects</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Terrariums, indoor small animals, ponds and coops - build it, connect it, watch the feed.</Typography>
          </Box>
        </Stack>

        {devices.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {devices.map((d) => <Feed key={d.deviceId} dev={d} onRemove={() => update(devices.filter((x) => x.deviceId !== d.deviceId))} />)}
          </Box>
        )}

        <Paper elevation={0} sx={card}>
          <Typography variant="subtitle1" sx={{ color: C.gold, mb: 1 }}>Connect a project</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField select size="small" label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} sx={{ minWidth: 220 }}>
              {PROJECTS.map((p) => <MenuItem key={p.id} value={p.id}>{p.emoji} {p.title}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Device ID" placeholder="terra_001" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} inputProps={{ 'data-testid': 'project-device-id' }} />
            <TextField size="small" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {projectById(form.projectId)?.video && <TextField size="small" label="Local stream URL (optional)" placeholder="http://192.168.1.50:81/stream" value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} />}
            {projectById(form.projectId)?.audio && <TextField size="small" label="Local audio URL (optional)" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />}
            <Button variant="contained" onClick={connect} sx={{ bgcolor: C.accent }} data-testid="project-connect">Connect</Button>
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: C.goldMuted }}>
            The device publishes JSON on tc/&lt;deviceId&gt;/sensors every 10 s. Video and audio load straight from the device on your network - about {formatBytes(budget.cloudBytes)}/day
            goes through Tender Cells instead of ~{formatBytes(budget.relayedBytes)}/day if a camera and microphone were relayed through the cloud.
          </Typography>
        </Paper>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {(['all', ...Object.keys(GROUP_LABEL)] as (AnimalGroup | 'all')[]).map((g) => (
            <Chip key={g} label={g === 'all' ? 'All animals' : GROUP_LABEL[g]} clickable onClick={() => setGroup(g)}
              sx={{ color: C.white, bgcolor: group === g ? C.accent : 'transparent', border: `1px solid ${C.accent}` }} />
          ))}
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {shown.map((p) => (
            <Paper key={p.id} elevation={0} sx={card} data-testid="project-card">
              <Typography sx={{ fontWeight: 700 }}>{p.emoji} {p.title}</Typography>
              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ my: 0.75 }}>
                <Chip size="small" label={p.level} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
                {p.video && <Chip size="small" label="Video" sx={{ color: C.white, border: `1px solid ${C.accent}` }} />}
                {p.audio && <Chip size="small" label="Audio" sx={{ color: C.white, border: `1px solid ${C.accent}` }} />}
                {p.groups.map((g) => <Chip key={g} size="small" label={GROUP_LABEL[g]} sx={{ color: C.goldMuted }} />)}
              </Stack>
              <Typography variant="body2">{p.summary}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: C.goldMuted }}>Parts: {p.parts.join(' · ')}</Typography>
              {p.hf.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {p.hf.map((m) => (
                    <Typography key={m.id} variant="caption" sx={{ display: 'block' }}>
                      🤗 <a href={hfUrl(m)} target="_blank" rel="noreferrer" style={{ color: C.gold }}>{m.id}</a> - {m.use}
                    </Typography>
                  ))}
                </Box>
              )}
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: C.warning }}>Safety: {p.safety}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" variant="contained" sx={{ bgcolor: C.accent }} onClick={() => setForm({ ...form, projectId: p.id })}>Connect one</Button>
                {p.lessons.map((l) => <Button key={l} size="small" href={`/lessons/${l}`} sx={{ color: C.gold }}>Lesson</Button>)}
                <Button size="small" component={RouterLink} to="/library" sx={{ color: C.gold }}>Species care</Button>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

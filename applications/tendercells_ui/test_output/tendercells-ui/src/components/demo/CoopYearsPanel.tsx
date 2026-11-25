// CoopYearsPanel.tsx - "Coop through the years" on /demo/coop: a kid-readable, clearly
// labelled ESTIMATE of eggs, feed, chores and DoorCell/gantry upkeep for the 4-hen flock
// over 1-5 years. The model and its sources live in lib/coop/yearsSim.ts.

import { Alert, Box, Button, Checkbox, Chip, Paper, Slider, Stack, Switch, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import {
  BREEDS,
  BREED_IDS,
  LOCATIONS,
  eggsByYear,
  flockTip,
  hasGantry,
  type BreedId,
  type CoopTierId,
  type SimWeek,
} from '../../lib/coop/yearsSim';

const C = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  warning: '#E8A020',
  white: '#F0EDE4',
};

const SEASON_EMOJI = { Spring: '🌱', Summer: '☀️', Autumn: '🍂', Winter: '❄️' } as const;
const KG_TO_LB = 2.20462;

export type LocationId = (typeof LOCATIONS)[number]['id'];

type Props = {
  weeks: SimWeek[];
  index: number;
  onIndex: (i: number) => void;
  playing: boolean;
  onPlaying: (p: boolean) => void;
  years: number;
  onYears: (y: number) => void;
  location: LocationId;
  onLocation: (l: LocationId) => void;
  coopLight: boolean;
  onCoopLight: (v: boolean) => void;
  flock: BreedId[];
  onFlock: (f: BreedId[]) => void;
  tier: CoopTierId;
};

const toggleSx = {
  '& .MuiToggleButton-root': { color: C.goldMuted, borderColor: `${C.accent}88`, px: 1.25 },
  '& .Mui-selected': { color: `${C.white} !important`, bgcolor: `${C.accent} !important` },
};

function Stat({ label, value, sub, testId }: { label: string; value: string; sub?: string; testId?: string }) {
  return (
    <Box data-testid={testId} sx={{ bgcolor: C.bg, borderRadius: 1.5, p: 1.25, minWidth: 0 }}>
      <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{label}</Typography>
      <Typography sx={{ color: C.white, fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography sx={{ color: C.goldMuted, fontSize: 11.5 }}>{sub}</Typography>}
    </Box>
  );
}

/** Weekly eggs as a tiny line chart with a cursor at the current week. */
function EggSparkline({ weeks, index }: { weeks: SimWeek[]; index: number }) {
  const W = 600;
  const H = 70;
  const max = Math.max(1, ...weeks.map((w) => w.eggs));
  const x = (i: number) => (weeks.length > 1 ? (i / (weeks.length - 1)) * W : 0);
  const y = (v: number) => H - 4 - (v / max) * (H - 10);
  const pts = weeks.map((w, i) => `${x(i).toFixed(1)},${y(w.eggs).toFixed(1)}`).join(' ');
  return (
    <Box component="svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" sx={{ width: '100%', height: 70, display: 'block' }} aria-label="Eggs per week over the whole simulation" role="img">
      {weeks.map((w, i) => (i % 52 === 0 && i > 0 ? <line key={i} x1={x(i)} x2={x(i)} y1={0} y2={H} stroke={C.goldMuted} strokeOpacity={0.35} strokeDasharray="3 3" /> : null))}
      <polyline points={pts} fill="none" stroke={C.gold} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <line x1={x(index)} x2={x(index)} y1={0} y2={H} stroke={C.white} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </Box>
  );
}

export default function CoopYearsPanel(p: Props) {
  const week = p.weeks[Math.min(p.index, p.weeks.length - 1)];
  const totalWeeks = p.weeks.length;
  const perYear = eggsByYear(p.weeks);
  const firstYearPeak = Math.max(0, ...p.weeks.filter((w) => w.year === 1).map((w) => w.eggs));
  const tip = week ? flockTip(week, firstYearPeak) : null;
  const gantry = hasGantry(p.tier);
  const upcoming = p.weeks.slice(p.index + 1).find((w) => w.reminders.length);
  if (!week) return null;

  const feedLbWeek = week.feedKg * KG_TO_LB;
  const bags = (week.totalFeedKg * KG_TO_LB) / 50;
  const yearMarks = Array.from({ length: p.years + 1 }, (_, y) => ({ value: Math.min(y * 52, totalWeeks - 1), label: y === 0 ? 'Start' : `Yr ${y}` }));

  return (
    <Paper
      elevation={0}
      data-testid="coop-years"
      data-week={week.index}
      data-season={week.season}
      data-eggs-week={week.eggs.toFixed(1)}
      data-hens={week.hens.length}
      sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
          <Box>
            <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700 }}>Coop through the years</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
              Watch the flock grow up: seasons, eggs, feed, chores and upkeep, one week at a time.
            </Typography>
          </Box>
          <Chip label="Estimate · not a promise" variant="outlined" data-testid="coop-years-estimate" sx={{ color: C.warning, borderColor: C.warning, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <Box>
            <Typography sx={{ color: C.goldMuted, fontSize: 12, mb: 0.5 }}>How many years</Typography>
            <ToggleButtonGroup exclusive size="small" value={p.years} onChange={(_, v: number | null) => v && p.onYears(v)} aria-label="Years to simulate" sx={toggleSx}>
              {[1, 2, 3, 4, 5].map((y) => <ToggleButton key={y} value={y} data-testid={`years-${y}`}>{y}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography sx={{ color: C.goldMuted, fontSize: 12, mb: 0.5 }}>Where the coop is</Typography>
            <ToggleButtonGroup exclusive size="small" value={p.location} onChange={(_, v: LocationId | null) => v && p.onLocation(v)} aria-label="Coop location" sx={toggleSx}>
              {LOCATIONS.map((l) => <ToggleButton key={l.id} value={l.id} data-testid={`loc-${l.id}`}>{l.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Stack direction="row" alignItems="center">
            <Switch checked={p.coopLight} onChange={(_, v) => p.onCoopLight(v)} inputProps={{ 'aria-label': 'Coop light to 14 hours' }} data-testid="coop-light" />
            <Typography sx={{ color: C.white, fontSize: 14 }}>Coop light tops days up to 14 h</Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            onClick={() => p.onPlaying(!p.playing)}
            data-testid="coop-years-play"
            startIcon={p.playing ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ bgcolor: C.accent, minWidth: 104, '&:hover': { bgcolor: '#5a8c69' } }}
          >
            {p.playing ? 'Pause' : 'Play'}
          </Button>
          <Slider
            value={week.index}
            min={0}
            max={totalWeeks - 1}
            step={1}
            marks={yearMarks}
            onChange={(_, v) => { p.onPlaying(false); p.onIndex(Array.isArray(v) ? v[0] : v); }}
            aria-label="Week of the simulation"
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `Week ${v + 1}`}
            sx={{ color: C.accent, mx: 1, '& .MuiSlider-markLabel': { color: C.goldMuted, fontSize: 12 } }}
          />
        </Stack>

        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' } }}>
          <Stat testId="coop-years-when" label={`Year ${week.year} · week ${(week.index % 52) + 1}`} value={`${SEASON_EMOJI[week.season]} ${week.season}`} sub={`Week of ${week.date}`} />
          <Stat label="Daylight" value={`${week.dayLengthH.toFixed(1)} h`} sub={p.coopLight && week.dayLengthH < 14 ? 'Coop light adds the rest to 14 h' : week.dayLengthH < 14 ? 'Under 14 h: hens lay less' : 'Long days: full laying'} />
          <Stat testId="coop-years-eggs" label="Eggs this week" value={week.eggs.toFixed(1)} sub={`${Math.round(week.totalEggs)} eggs so far (${(week.totalEggs / 12).toFixed(0)} dozen)`} />
          <Stat label="Feed" value={`${feedLbWeek.toFixed(1)} lb/week`} sub={`${bags.toFixed(1)} bags of 50 lb so far`} />
          <Stat testId="coop-years-door" label="DoorCell pop door" value={`${week.doorOpen} → ${week.doorClose}`} sub={`Opens at sunrise, shuts after dusk (sun time) · ${week.doorCycles} cycles`} />
          <Stat
            label="Robot chores"
            value={gantry ? `${week.cleanRuns} CLEAN · ${week.eggRuns} EGG` : 'By hand'}
            sub={gantry ? 'Bedding stir 1×/day, egg pick 2×/day' : 'Base and Starter have no gantry arm'}
          />
          <Stat label="Bedding" value={`${week.beddingTopUps} top-ups`} sub={`${week.beddingChanges} big clean-outs (April + October)`} />
          <Stat label="Hens in the flock" value={`${week.hens.length} of 4`} sub="Tick a hen to add or remove her" />
        </Box>

        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>The flock</Typography>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', lg: 'repeat(4, minmax(0,1fr))' } }}>
            {BREED_IDS.map((id) => {
              const b = BREEDS[id];
              const h = week.hens.find((x) => x.breed === id);
              const on = p.flock.includes(id);
              const status = !h ? 'Not in this flock' : h.molting ? 'Molting: resting, no eggs' : h.laying ? 'Laying' : 'Too young to lay yet';
              const ageWeeks = h?.ageWeeks ?? null;
              const ageText = ageWeeks === null ? '' : ageWeeks < 52 ? `${ageWeeks} weeks old` : `${(ageWeeks / 52).toFixed(1)} years old`;
              return (
                <Stack key={id} direction="row" spacing={1} alignItems="center" data-testid={`hen-${id}`} data-on={on ? '1' : '0'} sx={{ bgcolor: C.bg, borderRadius: 1.5, p: 1, opacity: on ? 1 : 0.55 }}>
                  <Checkbox
                    size="small"
                    checked={on}
                    onChange={(_, v) => p.onFlock(v ? BREED_IDS.filter((x) => x === id || p.flock.includes(x)) : p.flock.filter((x) => x !== id))}
                    inputProps={{ 'aria-label': `${b.name} in the flock` }}
                    sx={{ color: C.goldMuted, '&.Mui-checked': { color: C.accent } }}
                  />
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: b.color, border: `2px solid ${C.goldMuted}`, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{b.name}</Typography>
                    <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                      {h ? `${ageText} · ${status} · ${h.eggs.toFixed(1)} ${b.eggColor} eggs/wk` : status}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Box>
        </Box>

        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, mb: 0.5 }}>Eggs per week, whole run</Typography>
          <EggSparkline weeks={p.weeks} index={week.index} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1} data-testid="coop-years-per-year">
            {perYear.map((r) => (
              <Chip key={r.year} size="small" label={`Year ${r.year}: ~${Math.round(r.total)} eggs`} sx={{ bgcolor: r.year === week.year ? C.accent : C.bg, color: C.white }} />
            ))}
          </Stack>
        </Box>

        <Box data-testid="coop-years-reminders">
          <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>Upkeep this week</Typography>
          {week.reminders.length ? (
            <Stack spacing={0.75}>
              {week.reminders.map((r) => (
                <Alert key={r.id} severity={r.kind === 'safety' || r.kind === 'predator' ? 'warning' : 'info'} variant="outlined" sx={{ color: C.white, py: 0, '& .MuiAlert-icon': { color: C.warning } }}>
                  {r.text}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>
              Nothing extra this week.{upcoming ? ` Next: ${upcoming.reminders[0].text} (week of ${upcoming.date})` : ''}
            </Typography>
          )}
          {tip && <Alert severity="success" variant="outlined" sx={{ mt: 1, color: C.white }}>{tip}</Alert>}
        </Box>

        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
          How we guessed: egg numbers per breed, how laying slows with age and short days, molting and feed come from university
          extension guides (Utah State, UNH, UF/IFAS, Wisconsin, Penn State, Alabama). Chore counts, DoorCell rack wear and upkeep
          dates are our planned schedule for this coop, not measurements. Real hens vary with weather, health and care.
        </Typography>
      </Stack>
    </Paper>
  );
}

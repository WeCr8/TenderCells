// WatershedPage.tsx - Watershed & Drainage: where rain goes on the property.
//
// Usage: route /watershed. Pick a rain scenario (light, heavy, flood storm) and see
// standing water (puddles), flow paths and erosion risk from the property's terrain -
// hand-drawn in Property Layout, or measured by a robot scan (much more accurate).
// Try fixes (drain, rain garden, swale, berm, fill) and compare against the current yard:
// the goal is fewer puddles WITHOUT more erosion.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import WaterIcon from '@mui/icons-material/Water';
import DeleteIcon from '@mui/icons-material/Delete';
import WatershedMap, { type WatershedLayers } from '../components/watershed/WatershedMap';
import Viewport3D from '../components/viewport/Viewport3D';
import {
  loadPropertyLayout, savePropertyLayout, PROPERTY_LAYOUT_EVENT, type PropertyLayoutState,
} from '../components/property/propertyLayoutStore';
import { heightAt, simulateRobotScan } from '../components/property/terrain';
import {
  analyzeWatershed, compareWatershed, swalePlan, FIX_INFO, RAIN_SCENARIOS,
  type DrainageFix, type FixKind, type RainScenario,
} from '../components/property/watershed';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55',
  danger: '#CC3333', warning: '#E8A020', white: '#F0EDE4',
};
const card = { bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, color: C.white };

const FIX_DEFAULTS: Record<FixKind, { sizeFt: number; depthFt: number }> = {
  drain: { sizeFt: 1.5, depthFt: 0 },
  'rain-garden': { sizeFt: 4, depthFt: 0.5 },
  swale: { sizeFt: 2, depthFt: 0.5 },
  berm: { sizeFt: 1.5, depthFt: 0.75 },
  fill: { sizeFt: 6, depthFt: 0.5 },
};

const gal = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString());
const signed = (v: number, unit: string) => `${v > 0 ? '+' : ''}${Math.round(v)} ${unit}`;

function useLayout(): [PropertyLayoutState, (next: PropertyLayoutState) => void] {
  const [layout, setLayout] = useState<PropertyLayoutState>(() => loadPropertyLayout());
  useEffect(() => {
    const on = (e: Event) => setLayout((e as CustomEvent<PropertyLayoutState>).detail ?? loadPropertyLayout());
    window.addEventListener(PROPERTY_LAYOUT_EVENT, on);
    return () => window.removeEventListener(PROPERTY_LAYOUT_EVENT, on);
  }, []);
  return [layout, (next) => { setLayout(next); savePropertyLayout(next); }];
}

export default function WatershedPage() {
  const navigate = useNavigate();
  const [layout, saveLayout] = useLayout();
  const { property, items } = layout;
  const [scenario, setScenario] = useState<RainScenario>('heavy');
  const [layers, setLayers] = useState<WatershedLayers>({ water: true, flow: true, erosion: true });
  const [tool, setTool] = useState<FixKind | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [showPlan, setShowPlan] = useState(true);
  const [focus, setFocus] = useState<{ x: number; y: number } | null>(null);
  const fixes = useMemo(() => property.drainagePlan ?? [], [property.drainagePlan]);

  const input = useMemo(() => ({
    widthFt: property.widthFt, depthFt: property.depthFt, terrain: property, items,
    baseSurface: property.terrain ?? 'lawn', scenario,
  }), [property, items, scenario]);
  const before = useMemo(() => analyzeWatershed(input), [input]);
  const after = useMemo(() => (fixes.length ? analyzeWatershed({ ...input, fixes }) : before), [input, fixes, before]);
  const shown = showPlan ? after : before;
  const cmp = compareWatershed(before, after);
  const baseAt = (x: number, y: number) => heightAt(property, x, y);

  const setFixes = (next: DrainageFix[]) => saveLayout({ ...layout, property: { ...property, drainagePlan: next } });
  const onPick = (p: { x: number; y: number }) => {
    if (!tool) { setFocus(p); return; }
    const d = FIX_DEFAULTS[tool];
    if (FIX_INFO[tool].linear) {
      if (!pending) { setPending(p); return; }
      setFixes([...fixes, { id: `fix-${Date.now().toString(36)}`, kind: tool, x: pending.x, y: pending.y, x2: p.x, y2: p.y, ...d }]);
      setPending(null);
    } else {
      setFixes([...fixes, { id: `fix-${Date.now().toString(36)}`, kind: tool, x: p.x, y: p.y, ...d }]);
    }
    setShowPlan(true);
  };
  const patchFix = (id: string, patch: Partial<DrainageFix>) => setFixes(fixes.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const robotGrid = property.elevationGrid;
  const scan = () => saveLayout({ ...layout, property: { ...property, elevationGrid: simulateRobotScan(property, property.widthFt, property.depthFt) } });
  const clearScan = () => saveLayout({ ...layout, property: { ...property, elevationGrid: undefined } });

  const s = shown.summary;
  const stat = (label: string, value: string, tone?: string) => (
    <Box sx={{ bgcolor: C.bg, borderRadius: 1, p: 1, minWidth: 110, flex: 1 }}>
      <Typography variant="caption" sx={{ color: C.goldMuted }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, color: tone ?? C.white }}>{value}</Typography>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1250, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap">
          <WaterIcon sx={{ color: '#64B5F6', fontSize: 30 }} />
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Watershed &amp; Drainage</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
              Where rain collects, where it runs and where it could wash soil away. Try fixes before you dig.
            </Typography>
          </Box>
          <Chip
            data-testid="terrain-source"
            label={robotGrid ? `Robot-measured terrain · ${robotGrid.deviceId ?? 'robot'} · ${robotGrid.cols}×${robotGrid.rows} @ ${robotGrid.stepFt} ft` : 'Hand-drawn terrain (approximate)'}
            sx={{ bgcolor: robotGrid ? `${C.accent}44` : `${C.warning}22`, color: C.white, border: `1px solid ${robotGrid ? C.accent : C.warning}` }}
          />
        </Stack>

        {!robotGrid && (
          <Alert severity="info" sx={{ bgcolor: C.surface, color: C.white }}
            action={<Button size="small" onClick={scan} sx={{ color: C.gold }}>Run robot scan (demo)</Button>}>
            This uses the terrain you drew in Property Layout. A robot scan (Roaming Roost driving the yard, or a gantry
            probing a bed) measures the small dips and slopes that decide where puddles form.
          </Alert>
        )}

        <Paper elevation={0} sx={card}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} useFlexGap flexWrap="wrap">
            <ToggleButtonGroup exclusive size="small" value={scenario} onChange={(_, v) => v && setScenario(v)}
              sx={{ bgcolor: C.bg, '& .MuiToggleButton-root': { color: C.goldMuted }, '& .Mui-selected': { color: `${C.white} !important` } }}>
              {(Object.keys(RAIN_SCENARIOS) as RainScenario[]).map((k) => (
                <ToggleButton key={k} value={k}>{RAIN_SCENARIOS[k].label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: C.goldMuted }}>{RAIN_SCENARIOS[scenario].note}</Typography>
            <Box sx={{ flex: 1 }} />
            {(['water', 'flow', 'erosion'] as const).map((k) => (
              <FormControlLabel key={k} label={k === 'water' ? 'Standing water' : k === 'flow' ? 'Flow paths' : 'Erosion risk'}
                control={<Switch size="small" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} />} />
            ))}
            {robotGrid && <Button size="small" onClick={clearScan} sx={{ color: C.goldMuted }}>Clear robot scan</Button>}
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
          <Paper elevation={0} sx={{ ...card, flex: 2, minWidth: 0, width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} useFlexGap flexWrap="wrap">
              <Typography variant="subtitle2" sx={{ color: C.gold, flex: 1 }}>
                {tool ? (FIX_INFO[tool].linear ? (pending ? `Click the ${tool} end point` : `Click where the ${tool} starts`) : `Click to place a ${FIX_INFO[tool].label.toLowerCase()}`) : 'Rain map'}
              </Typography>
              {fixes.length > 0 && (
                <ToggleButtonGroup exclusive size="small" value={showPlan ? 'plan' : 'now'} onChange={(_, v) => v && setShowPlan(v === 'plan')}>
                  <ToggleButton value="now">Current yard</ToggleButton>
                  <ToggleButton value="plan">With plan</ToggleButton>
                </ToggleButtonGroup>
              )}
            </Stack>
            <WatershedMap result={shown} widthFt={property.widthFt} depthFt={property.depthFt} terrain={property}
              items={items} fixes={showPlan ? fixes : []} layers={layers} pending={pending} highlight={focus} onPick={onPick} />
            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
              {[['#1976D2', 'Standing water'], ['#90CAF9', 'Flow path'], ['#E8A020', 'Moderate erosion'], ['#CC3333', 'High erosion']].map(([c, l]) => (
                <Stack key={l} direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, bgcolor: c, borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ color: C.goldMuted }}>{l}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Stack spacing={2} sx={{ flex: 1, minWidth: 300, width: '100%' }}>
            <Paper elevation={0} sx={card} data-testid="watershed-summary">
              <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1 }}>
                {showPlan && fixes.length ? 'With your plan' : 'Current yard'} · {s.rainIn} in of rain
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {stat('Puddles', `${shown.puddles.length} · ${Math.round(s.puddleAreaSqFt)} sq ft`, s.puddleAreaSqFt ? '#64B5F6' : undefined)}
                {stat('Deepest', `${s.maxPuddleDepthIn.toFixed(1)} in`)}
                {stat('Held on site', `${gal(s.pondedGal)} gal`)}
                {stat('Runoff', `${gal(s.runoffGal)} gal`)}
                {stat('High erosion', `${Math.round(s.erosionHighSqFt)} sq ft`, s.erosionHighSqFt ? C.danger : undefined)}
                {stat('Moderate erosion', `${Math.round(s.erosionModerateSqFt)} sq ft`, s.erosionModerateSqFt ? C.warning : undefined)}
              </Stack>
              {fixes.length > 0 && (
                <Box sx={{ mt: 1.5 }} data-testid="watershed-compare">
                  <Typography variant="body2">
                    Plan vs now: puddles {signed(cmp.puddleAreaChangeSqFt, 'sq ft')}, held water {signed(cmp.pondedChangeGal, 'gal')},
                    high erosion {signed(cmp.erosionHighChangeSqFt, 'sq ft')} ({cmp.erosionIndexChangePct > 0 ? '+' : ''}{cmp.erosionIndexChangePct.toFixed(0)}% erosion index)
                  </Typography>
                  {cmp.erosionWorse
                    ? <Alert severity="warning" sx={{ mt: 1 }}>This plan moves water faster somewhere else and raises erosion. Try a grassed swale at a gentle grade, a rain garden, or mulch/plants on the bare slope.</Alert>
                    : cmp.puddleAreaChangeSqFt < 0 && <Alert severity="success" sx={{ mt: 1 }}>Fewer puddles without adding erosion.</Alert>}
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={card}>
              <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1 }}>Try a fix</Typography>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                {(Object.keys(FIX_INFO) as FixKind[]).map((k) => (
                  <Chip key={k} label={FIX_INFO[k].label} onClick={() => { setTool(tool === k ? null : k); setPending(null); }}
                    variant={tool === k ? 'filled' : 'outlined'} title={FIX_INFO[k].help}
                    sx={{ color: C.white, borderColor: C.accent, bgcolor: tool === k ? C.accent : 'transparent' }} />
                ))}
              </Stack>
              <Typography variant="caption" sx={{ color: C.goldMuted, display: 'block', mb: 1 }}>
                {tool ? FIX_INFO[tool].help : 'Pick a fix, then click the map. Fixes are a plan - nothing is built until you do it.'}
              </Typography>
              <Stack spacing={0.75}>
                {fixes.map((f) => {
                  const plan = f.kind === 'swale' ? swalePlan(f, baseAt) : null;
                  return (
                    <Box key={f.id} sx={{ bgcolor: C.bg, borderRadius: 1, p: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ flex: 1 }}>{FIX_INFO[f.kind].label}</Typography>
                        <IconButton size="small" aria-label={`Remove ${FIX_INFO[f.kind].label}`} onClick={() => setFixes(fixes.filter((o) => o.id !== f.id))}>
                          <DeleteIcon fontSize="small" sx={{ color: C.goldMuted }} />
                        </IconButton>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <TextField size="small" type="number" label={FIX_INFO[f.kind].linear ? 'Half-width ft' : 'Radius ft'} value={f.sizeFt}
                          onChange={(e) => patchFix(f.id, { sizeFt: Math.max(0.5, Number(e.target.value) || 0.5) })} />
                        {f.kind !== 'drain' && (
                          <TextField size="small" type="number" label={f.kind === 'berm' || f.kind === 'fill' ? 'Height ft' : 'Depth ft'} value={f.depthFt}
                            onChange={(e) => patchFix(f.id, { depthFt: Math.max(0, Number(e.target.value) || 0) })} />
                        )}
                      </Stack>
                      {plan && (
                        <Typography variant="caption" sx={{ color: plan.capped ? C.warning : C.goldMuted, display: 'block', mt: 0.5 }}>
                          {Math.round(plan.lengthFt)} ft at 1% fall · deepest cut {plan.maxCutFt.toFixed(1)} ft{plan.capped ? ' (limited to 3 ft - water may not get out)' : ''}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={card}>
              <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1 }}>Puddles ({shown.puddles.length})</Typography>
              {shown.puddles.length === 0
                ? <Typography variant="body2" sx={{ color: C.goldMuted }}>No standing water in this scenario.</Typography>
                : shown.puddles.slice(0, 8).map((p, i) => (
                  <Box key={p.id} onClick={() => setFocus({ x: p.x, y: p.y })} sx={{ cursor: 'pointer', py: 0.5, borderBottom: `1px solid ${C.accent}33` }}>
                    <Typography variant="body2">
                      #{i + 1} · {Math.round(p.areaSqFt)} sq ft · {p.maxDepthIn.toFixed(1)} in deep · {gal(p.volumeGal)} gal
                    </Typography>
                    <Typography variant="caption" sx={{ color: C.goldMuted }}>at {p.x.toFixed(0)}, {p.y.toFixed(0)} ft</Typography>
                  </Box>
                ))}
            </Paper>
          </Stack>
        </Stack>

        <Box>
          <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1 }}>3D view</Typography>
          <Viewport3D initialWorkspaceMode="products" showAttentionPanel={false} hydrology={shown}
            title={`${property.name} - ${RAIN_SCENARIOS[scenario].label.toLowerCase()}`} height={{ xs: 380, md: 480 }} />
        </Box>

        <Typography variant="caption" sx={{ color: C.goldMuted }}>
          Planning estimate from the terrain on file and typical soak-in rates per surface - use it to compare options on
          this yard, not as an engineered drainage design. Check local rules before regrading or redirecting water toward
          neighbours. <Button size="small" onClick={() => navigate('/layout')} sx={{ color: C.gold }}>Edit terrain</Button>
        </Typography>
      </Stack>
    </Box>
  );
}

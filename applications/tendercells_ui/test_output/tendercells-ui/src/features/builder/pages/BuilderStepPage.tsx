// BuilderStepPage (/builder/:id) - plays one Builder mission or project, one action per screen:
// new parts, the instruction image with its cues, the instruction at the learner's depth
// (young / beginner / advanced / teacher), safety gates that must be acknowledged, an optional
// link into the live demo (run the event / open the page), checkpoints ("Does yours look like
// this?"), and Back / Help / Next (← → keys). Progress and milestones stay in this browser.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import StepFigure from '../components/StepFigure';
import { builderItem, instructionAt } from '../lib/registry';
import { assetFor } from '../lib/assets';
import { DEPTH_KEY, complete, readProgress, resetItem, saveStep } from '../lib/progress';
import type { LearnerDepth, SafetyGate } from '../types';
import { runScenario } from '../../../lib/demo/eventSimulator';
import { trackDemo } from '../../../lib/demo/track';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4', warning: '#E8A020', danger: '#CC3333' };
const REPO = 'https://github.com/WeCr8/TenderCells';
const DEPTHS: Array<{ id: LearnerDepth; label: string }> = [
  { id: 'young', label: 'Young' }, { id: 'beginner', label: 'Beginner' }, { id: 'advanced', label: 'Advanced' }, { id: 'teacher', label: 'Teacher' },
];
const GATE: Record<SafetyGate, { text: string; ack?: string }> = {
  CHILD_OK: { text: 'Safe for kids' },
  SUPERVISION_RECOMMENDED: { text: 'An adult nearby is a good idea' },
  ADULT_REQUIRED: { text: 'An adult must do or supervise this step', ack: 'An adult is helping with this step' },
  POWER_OFF_REQUIRED: { text: 'Power must be off', ack: 'The USB cable is unplugged / power is off' },
  MOTION_LOCKOUT_REQUIRED: { text: 'Motion locked out (E-STOP on)', ack: 'E-STOP is on and nothing can move' },
};
/** OS routes (everything else under / is a website page). */
const OS_PREFIXES = ['/demo', '/layout', '/simulator', '/mowers', '/chicken-tender', '/dashboard', '/analytics', '/builder', '/missions', '/predator-monitor'];
const linkFor = (ref: string): { label: string; to?: string; href?: string } => {
  if (/^(firmware|docs|applications)\//.test(ref)) return { label: ref, href: `${REPO}/blob/main/${ref}` };
  if (OS_PREFIXES.some((p) => ref === p || ref.startsWith(`${p}?`) || ref.startsWith(`${p}/`))) return { label: ref, to: ref };
  return { label: ref, href: ref };
};

const readDepth = (): LearnerDepth => {
  try { return (localStorage.getItem(DEPTH_KEY) as LearnerDepth) || 'beginner'; } catch { return 'beginner'; }
};

export default function BuilderStepPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const item = useMemo(() => builderItem(id), [id]);
  const total = item?.steps.length ?? 0;
  const [index, setIndex] = useState(() => Math.min(readProgress()[id]?.step ?? 0, Math.max(0, total - 1)));
  const [depth, setDepth] = useState<LearnerDepth>(readDepth);
  const [acked, setAcked] = useState(false);
  const [help, setHelp] = useState(false);
  const [demoDone, setDemoDone] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [ticked, setTicked] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (item) trackDemo('mission_started', { mission: item.id, kind: item.kind }); }, [item]);
  useEffect(() => { setAcked(false); setHelp(false); setDemoDone(null); setTicked(new Set()); setCopied(false); }, [index]);

  const step = item?.steps[index];
  const gates = (step?.safety ?? []).filter((g) => GATE[g].ack);
  const blocked = gates.length > 0 && !acked;

  const go = useCallback((to: number) => {
    if (!item) return;
    if (to >= total) {
      complete(item.id);
      trackDemo('mission_completed', { mission: item.id, milestone: item.milestone });
      setFinished(true);
      return;
    }
    const next = Math.max(0, to);
    saveStep(item.id, next, total);
    setIndex(next);
    window.scrollTo?.({ top: 0 });
  }, [item, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable=true]')) return;
      if (e.key === 'ArrowRight' && !blocked) go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, blocked]);

  if (!item || !step) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">That Builder item does not exist. <RouterLink to="/builder">Back to Builder</RouterLink></Alert>
      </Box>
    );
  }

  const chooseDepth = (d: LearnerDepth) => {
    setDepth(d);
    try { localStorage.setItem(DEPTH_KEY, d); } catch { /* storage unavailable */ }
  };
  const runDemo = async () => {
    const b = step.demo!;
    if (b.run) {
      trackDemo('simulation_action_requested', { action: b.run, from: 'builder' });
      const entry = await runScenario(b.run);
      trackDemo('simulation_action_completed', { action: b.run, from: 'builder' });
      setDemoDone(`${entry.emoji} ${entry.outcome}`);
    } else if (b.open) {
      navigate(b.open);
    }
  };
  const bridge = item.bridge;

  if (finished) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 760, mx: 'auto' }} data-testid="builder-complete">
        <Paper sx={{ p: 3, bgcolor: C.surface, color: C.white, border: `1px solid ${C.gold}`, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 48 }} aria-hidden>🏅</Typography>
          <Typography variant="h5" sx={{ color: C.gold, fontWeight: 800 }}>{item.milestone}</Typography>
          <Typography sx={{ mb: 2 }}>You finished <strong>{item.title}</strong>.</Typography>
          {item.outcomes.length > 0 && (
            <Box component="ul" sx={{ textAlign: 'left', display: 'inline-block', m: 0, mb: 2, color: C.goldMuted }}>
              {item.outcomes.map((o) => <li key={o}>{o}</li>)}
            </Box>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
            {bridge && (bridge.path
              ? <Button variant="contained" onClick={() => navigate(bridge.path!)} sx={{ bgcolor: C.accent }}>{bridge.label}</Button>
              : <Button variant="contained" href={bridge.href} sx={{ bgcolor: C.accent }}>{bridge.label}</Button>)}
            <Button variant="outlined" onClick={() => navigate('/builder')} sx={{ borderColor: C.accent, color: C.gold }}>Back to Builder</Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 900, mx: 'auto' }} data-testid="builder-step" aria-label={`Builder step ${index + 1} of ${total}: ${step.action}`}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Button size="small" component={RouterLink} to="/builder" sx={{ color: C.goldMuted, minWidth: 0 }}>← Builder</Button>
        <Typography variant="h5" component="h1" sx={{ color: C.gold, fontWeight: 800, flex: 1, fontSize: { xs: 20, sm: 24 } }}>{item.title}</Typography>
        <Chip size="small" label={item.hardware ? 'Hardware build' : 'No hardware needed'} sx={{ bgcolor: `${C.accent}33`, color: C.gold }} />
        <Typography data-testid="step-counter" sx={{ color: C.white, fontWeight: 800, fontFamily: 'monospace' }}>STEP {index + 1} / {total}</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={((index + 1) / total) * 100} aria-hidden
        sx={{ mb: 1.5, bgcolor: C.surface, '& .MuiLinearProgress-bar': { bgcolor: C.accent } }} />

      {item.concept && (
        <Alert severity="warning" sx={{ mb: 1.5 }} data-testid="builder-concept-note">
          {item.conceptNote}
        </Alert>
      )}

      {item.kind === 'mission' && (
        <ToggleButtonGroup exclusive size="small" value={depth} onChange={(_, v: LearnerDepth | null) => v && chooseDepth(v)}
          aria-label="Explanation depth" sx={{ mb: 1.5, flexWrap: 'wrap' }}>
          {DEPTHS.map((d) => (
            <ToggleButton key={d.id} value={d.id} data-testid={`depth-${d.id}`}
              sx={{ color: C.goldMuted, borderColor: `${C.accent}66`, textTransform: 'none', '&.Mui-selected': { bgcolor: C.accent, color: C.white } }}>
              {d.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {step.parts && step.parts.length > 0 && (
        <Box sx={{ mb: 1.5 }} data-testid="new-parts">
          <Typography sx={{ color: C.goldMuted, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>NEW PARTS</Typography>
          {step.parts.map((p) => (
            <Typography key={p.asset_id} sx={{ color: C.white }}>{p.qty}× {assetFor(p.asset_id)?.label ?? p.asset_id}</Typography>
          ))}
        </Box>
      )}

      <StepFigure step={step} concept={item.concept} />

      <Box sx={{ mt: 2 }}>
        {step.stage && <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{step.stage}</Typography>}
        <Typography sx={{ color: C.goldMuted, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
          {step.checkpoint ? 'Check your work' : step.action}
        </Typography>
        <Typography variant="h5" component="h2" data-testid="step-instruction" sx={{ color: C.white, fontWeight: 700, fontSize: { xs: 20, sm: 26 }, lineHeight: 1.3 }}>
          {item.kind === 'mission' ? instructionAt(step, depth) : step.instruction}
        </Typography>
        {item.kind === 'mission' && depth !== 'teacher' && step.instruction_layers?.teacher && (
          <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 0.5 }}>Teacher note available - switch to Teacher.</Typography>
        )}
        {step.concept && (
          <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, bgcolor: C.surface, color: C.white, border: `1px solid ${C.accent}55` }}>
            <Typography sx={{ color: C.gold, fontWeight: 800 }}>{step.concept.title}</Typography>
            <Typography sx={{ fontSize: 14 }}>{step.concept.text}</Typography>
          </Paper>
        )}
      </Box>

      {index === 0 && item.partsList && item.partsList.length > 0 && (
        <Paper elevation={0} data-testid="parts-list" sx={{ mt: 2, p: 1.5, bgcolor: C.surface, color: C.white, border: `1px solid ${C.gold}66` }}>
          <Typography sx={{ color: C.gold, fontWeight: 800, mb: 0.5 }}>What you need for this build</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {item.partsList.map((p) => (
              <li key={p.asset_id}><strong>{p.qty}×</strong> {assetFor(p.asset_id)?.label ?? p.asset_id}{p.note ? <Box component="span" sx={{ color: C.goldMuted }}> - {p.note}</Box> : null}</li>
            ))}
          </Box>
        </Paper>
      )}

      {step.details && step.details.length > 0 && (
        <Box sx={{ mt: 2 }} data-testid="step-details">
          <Typography sx={{ color: C.goldMuted, fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>STEP BY STEP</Typography>
          <Box component="ol" sx={{ m: 0, mt: 0.5, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
            {step.details.map((d, i) => {
              const on = ticked.has(i);
              return (
                <Box component="li" key={i}>
                  <Box component="label" sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', cursor: 'pointer', p: 1, borderRadius: 1.5,
                    bgcolor: on ? `${C.accent}33` : C.surface, border: `1px solid ${on ? C.gold : `${C.accent}55`}` }}>
                    <Box component="span" aria-hidden sx={{ flex: '0 0 30px', height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 900,
                      bgcolor: on ? C.gold : C.accent, color: on ? C.bg : C.white }}>{on ? '✓' : i + 1}</Box>
                    <input type="checkbox" checked={on} aria-label={`Done: ${d}`} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                      onChange={() => setTicked((t) => { const n = new Set(t); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                    <Typography sx={{ color: C.white, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.45, textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.75 : 1 }}>{d}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {step.code && (
        <Box sx={{ mt: 2, position: 'relative' }} data-testid="step-code">
          <Box component="pre" sx={{ m: 0, p: 1.5, pr: 9, bgcolor: '#08170F', color: '#E8F0E8', borderRadius: 1.5, overflowX: 'auto', fontSize: 15, lineHeight: 1.5, border: `1px solid ${C.accent}66` }}>{step.code}</Box>
          <Button size="small" variant="outlined" onClick={() => { void navigator.clipboard?.writeText(step.code!).then(() => setCopied(true)).catch(() => {}); }}
            sx={{ position: 'absolute', top: 8, right: 8, borderColor: C.accent, color: C.gold }}>{copied ? 'Copied ✓' : 'Copy'}</Button>
        </Box>
      )}

      {(step.look_for || step.watch_out) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
          {step.look_for && (
            <Paper elevation={0} data-testid="step-look-for" sx={{ flex: 1, p: 1.25, bgcolor: `${C.accent}26`, color: C.white, border: `1px solid ${C.accent}` }}>
              <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 13 }}>✓ YOU SHOULD SEE</Typography>
              <Typography sx={{ fontSize: 15 }}>{step.look_for}</Typography>
            </Paper>
          )}
          {step.watch_out && (
            <Paper elevation={0} data-testid="step-watch-out" sx={{ flex: 1, p: 1.25, bgcolor: `${C.warning}1A`, color: C.white, border: `1px solid ${C.warning}88` }}>
              <Typography sx={{ color: C.warning, fontWeight: 800, fontSize: 13 }}>⚠ WATCH OUT</Typography>
              <Typography sx={{ fontSize: 15 }}>{step.watch_out}</Typography>
            </Paper>
          )}
        </Stack>
      )}

      {(step.safety ?? []).length > 0 && (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }} data-testid="safety">
          {step.safety!.map((g) => (
            <Chip key={g} size="small" label={`⚠ ${GATE[g].text}`}
              sx={{ bgcolor: g === 'CHILD_OK' ? `${C.accent}33` : `${C.warning}26`, color: g === 'CHILD_OK' ? C.gold : C.warning, fontWeight: 700 }} />
          ))}
        </Stack>
      )}
      {gates.length > 0 && (
        <FormControlLabel sx={{ mt: 1, color: C.white }} data-testid="safety-ack"
          control={<Checkbox checked={acked} onChange={(e) => setAcked(e.target.checked)} />}
          label={gates.map((g) => GATE[g].ack).join(' · ')} />
      )}

      {step.demo && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mt: 1.5 }}>
          <Button variant="contained" onClick={() => { void runDemo(); }} data-testid="step-demo" sx={{ bgcolor: C.gold, color: C.bg, fontWeight: 800 }}>
            {step.demo.run ? '▶ ' : '↗ '}{step.demo.label}
          </Button>
          <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Simulation only - nothing real moves.</Typography>
        </Stack>
      )}
      {demoDone && <Alert severity="success" sx={{ mt: 1 }} data-testid="step-demo-result">{demoDone}</Alert>}

      {step.source_refs && step.source_refs.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
          {step.source_refs.map((r) => {
            const l = linkFor(r);
            return l.to
              ? <Button key={r} size="small" component={RouterLink} to={l.to} sx={{ color: C.gold, textTransform: 'none' }}>{l.label}</Button>
              : <Button key={r} size="small" href={l.href ?? r} target={l.href!.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  onClick={() => { if (r.startsWith('/flash')) trackDemo('flash_clicked', { from: 'builder' }); }} sx={{ color: C.gold, textTransform: 'none' }}>{l.label}</Button>;
          })}
        </Stack>
      )}

      {help && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          {step.checkpoint
            ? 'Not quite? Go Back one step at a time and compare each one. Every step changes only one thing.'
            : 'Do just this one thing, then press Next. Use Back to see the previous step. Stuck on hardware? Ask an adult and check the linked guide.'}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2.5, position: 'sticky', bottom: 8, bgcolor: C.bg, py: 1, zIndex: 2 }} alignItems="center">
        <Button variant="outlined" disabled={index === 0} onClick={() => go(index - 1)} sx={{ borderColor: C.accent, color: C.gold }}>◀ Back</Button>
        <Button onClick={() => setHelp((h) => !h)} sx={{ color: C.goldMuted }}>? Help</Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={() => { resetItem(item.id); setIndex(0); }} sx={{ color: C.goldMuted }}>Reset</Button>
        <Button variant="contained" disabled={blocked} onClick={() => go(index + 1)} data-testid="step-next" sx={{ bgcolor: C.accent, fontWeight: 800 }}>
          {step.checkpoint ? 'Yes ✓' : index === total - 1 ? 'Finish ✓' : 'Next ▶'}
        </Button>
      </Stack>
    </Box>
  );
}

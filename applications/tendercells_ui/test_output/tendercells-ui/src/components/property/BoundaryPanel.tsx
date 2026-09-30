// BoundaryPanel.tsx - the property boundary every mobile product stays inside, in the Property
// Layout editor. The owner sees the boundary in force (layout rectangle, drawn corners or an
// accepted robot survey), sets the safety margin, types corners, or has a mobile robot survey
// the yard. A survey is only a proposal: measured outline, dimensions, elevation, slope, wet
// spots and suggested keep-outs, shown against today's boundary. The owner accepts or discards
// it; widening needs an explicit confirmation (lib/yard/boundary.ts). Robots get the new
// boundary with their zones (Robot zones button). Usage: PropertyLayoutBuilder side panel.
// BoundarySvgLayer draws the boundary and its margin on the 2D map.
import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MOBILE_ROBOT_TYPES, type PropertyLayoutState } from './propertyLayoutStore';
import {
  DEFAULT_MARGIN_FT, acceptBlocker, applyProposal, bbox, effectiveBoundary, itemsOutside, polyArea, proposalFromSurvey,
  simulateSurvey, type BoundaryProposal, type PropertyBoundary, type Pt,
} from '../../lib/yard/boundary';
import { fetchSurvey } from '../../lib/yard/yardApi';
import { YARD_LIVE } from '../../lib/yard/yardTypes';

const C = { surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4', danger: '#CC3333', warning: '#E8A020', water: '#4A90C8' };
/** Products that move around the yard on their own and must respect the boundary. */
const SURVEY_TYPES = new Set<string>(MOBILE_ROBOT_TYPES);
const SOURCE_LABEL = { layout: 'Property rectangle', drawn: 'Corners you entered', survey: 'Robot survey (accepted)' } as const;

const cornersText = (poly: Pt[]) => poly.map(([x, y]) => `${x}, ${y}`).join('\n');
function parseCorners(text: string): Pt[] | null {
  const pts = text.split(/\n|;/).map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[ ,]+/).map(Number));
  if (pts.length < 3 || pts.length > 256 || pts.some((p) => p.length !== 2 || p.some((v) => !Number.isFinite(v) || v < 0))) return null;
  return pts as Pt[];
}

/** Current boundary (dashed gold) vs a proposal (solid) with its suggested zones. */
function ProposalPreview({ current, proposal, size = 260 }: { current: Pt[]; proposal: BoundaryProposal; size?: number }) {
  const all = [...current, ...proposal.poly];
  const bb = bbox(all);
  const pad = 4;
  const s = (size - pad * 2) / Math.max(bb.width, bb.depth, 1);
  const pts = (p: Pt[]) => p.map(([x, y]) => `${pad + (x - bb.x) * s},${pad + (y - bb.y) * s}`).join(' ');
  return (
    <svg width={size} height={bb.depth * s + pad * 2} role="img" aria-label="Current boundary compared with the survey" data-testid="boundary-preview"
      style={{ background: '#0D2B1E', borderRadius: 6, maxWidth: '100%' }}>
      <polygon points={pts(proposal.poly)} fill={`${C.accent}55`} stroke={C.white} strokeWidth={2} />
      {proposal.suggestedZones.map((z) => (
        <polygon key={z.id} points={pts(z.poly)} fill={z.reason === 'water' ? `${C.water}88` : `${C.warning}88`} stroke="none">
          <title>{z.name}</title>
        </polygon>
      ))}
      <polygon points={pts(current)} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="6 4" />
    </svg>
  );
}

export default function BoundaryPanel({ layout, onChange }: { layout: PropertyLayoutState; onChange: (next: PropertyLayoutState) => void }) {
  const boundary = effectiveBoundary(layout);
  const bb = bbox(boundary.poly);
  const outside = itemsOutside(layout, boundary);
  const robots = layout.items.filter((i) => SURVEY_TYPES.has(i.type));
  const [robotId, setRobotId] = useState('');
  const [editing, setEditing] = useState(false);
  const [corners, setCorners] = useState('');
  const [proposal, setProposal] = useState<BoundaryProposal | null>(null);
  const [confirmExpansion, setConfirmExpansion] = useState(false);
  const [addZones, setAddZones] = useState(true);
  const [msg, setMsg] = useState<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const blocker = useMemo(() => (proposal ? acceptBlocker(proposal, confirmExpansion) : null), [proposal, confirmExpansion]);

  const setBoundary = (b: PropertyBoundary | undefined) =>
    onChange({ ...layout, property: { ...layout.property, boundary: b } });

  const survey = async () => {
    setMsg(null);
    const robot = robots.find((r) => r.id === robotId) ?? robots[0];
    if (YARD_LIVE) {
      if (!robot?.deviceId) { setMsg({ tone: 'error', text: 'Pick a mobile robot that is linked to a device.' }); return; }
      setBusy(true);
      try {
        const s = await fetchSurvey(robot.deviceId);
        if (!s) { setMsg({ tone: 'info', text: `${robot.name} has not reported a survey yet. Start a survey pass on the robot, then try again.` }); return; }
        setProposal(proposalFromSurvey(layout, s));
      } catch (e) {
        setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load the survey.' });
      } finally { setBusy(false); }
      return;
    }
    setProposal(proposalFromSurvey(layout, simulateSurvey(layout, robot ? `${robot.name} (demo survey)` : undefined)));
    setConfirmExpansion(false);
  };

  const accept = () => {
    if (!proposal) return;
    try {
      onChange(applyProposal(layout, proposal, { confirmExpansion, addZones }));
      setProposal(null);
      setMsg({ tone: 'success', text: 'Boundary updated. Use Robot zones to send it to your robots - until then they keep the old one.' });
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  };

  const saveCorners = () => {
    const poly = parseCorners(corners);
    if (!poly || polyArea(poly) < 25) { setMsg({ tone: 'error', text: 'Enter at least 3 corners as "x, y" in feet, one per line, enclosing 25 sq ft or more.' }); return; }
    setBoundary({ poly, source: 'drawn', marginFt: boundary.marginFt });
    setEditing(false);
    setMsg({ tone: 'success', text: 'Boundary saved. Use Robot zones to send it to your robots.' });
  };

  const field = { '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted } };
  return (
    <Paper elevation={3} sx={{ p: 2, border: '1px solid #1A3D2B' }} data-testid="boundary-panel">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 4, height: 20, bgcolor: C.gold, borderRadius: 1, flexShrink: 0 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>Property boundary</Typography>
        <Chip size="small" label={SOURCE_LABEL[boundary.source]} data-testid="boundary-source"
          sx={{ fontSize: 10, height: 20, color: C.gold, border: `1px solid ${C.accent}` }} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Mowers, rovers and the Roaming Roost stay inside this line and keep the margin away from it. They never widen it on
        their own - a survey only proposes a better-measured boundary for you to accept.
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 1 }} data-testid="boundary-dims">
        {Math.round(bb.width)} × {Math.round(bb.depth)} ft · {Math.round(polyArea(boundary.poly)).toLocaleString()} sq ft · {boundary.poly.length} corners
        {boundary.source === 'survey' && boundary.confidence !== undefined ? ` · ${Math.round(boundary.confidence * 100)}% confidence` : ''}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" type="number" label="Margin (ft)" value={boundary.marginFt} sx={{ ...field, width: 110 }}
          inputProps={{ min: 0, max: 50, step: 0.5, 'data-testid': 'boundary-margin' }}
          onChange={(e) => {
            const m = Math.max(0, Math.min(50, Number(e.target.value) || 0));
            setBoundary({ ...boundary, marginFt: m });
          }} />
        <Button size="small" onClick={() => { setCorners(cornersText(boundary.poly)); setEditing((v) => !v); }} sx={{ color: C.gold }}>
          {editing ? 'Cancel' : 'Edit corners'}
        </Button>
        {boundary.source !== 'layout' && (
          <Button size="small" onClick={() => { setBoundary(undefined); setMsg({ tone: 'info', text: `Back to the property rectangle with a ${DEFAULT_MARGIN_FT} ft margin.` }); }}
            sx={{ color: C.goldMuted }} data-testid="boundary-reset">Use rectangle</Button>
        )}
      </Stack>
      {editing && (
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          <TextField multiline minRows={4} size="small" label="Corners (x, y in ft, one per line)" value={corners}
            onChange={(e) => setCorners(e.target.value)} sx={field} inputProps={{ 'data-testid': 'boundary-corners' }} />
          <Button size="small" variant="contained" onClick={saveCorners} sx={{ bgcolor: C.accent, alignSelf: 'flex-start' }}>Save corners</Button>
        </Stack>
      )}
      {outside.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5, py: 0 }}>
          Outside or on the edge: {outside.map((i) => i.name).join(', ')}. Robots will not go there.
        </Alert>
      )}

      <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 1, mb: 0.5 }}>Measure with a robot</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        A mobile robot drives the ground inside today&apos;s boundary, records elevation and standing water, and senses the real
        fence line (which may lie further out). {YARD_LIVE ? 'Loads its latest survey from tc/{id}/state/survey.' : 'Demo: a simulated survey.'}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {robots.length > 0 && (
          <TextField select size="small" label="Robot" value={robotId || robots[0].id} onChange={(e) => setRobotId(e.target.value)} sx={{ ...field, minWidth: 160 }}>
            {robots.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
          </TextField>
        )}
        <Button size="small" variant="outlined" disabled={busy || (YARD_LIVE && robots.length === 0)} onClick={survey}
          sx={{ color: C.gold, borderColor: C.accent }} data-testid="boundary-survey">
          {YARD_LIVE ? 'Load survey' : 'Run demo survey'}
        </Button>
      </Stack>
      {YARD_LIVE && robots.length === 0 && (
        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Add a rover, mower or Roaming Roost to the layout to survey.</Typography>
      )}

      {proposal && (
        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: C.surface }} data-testid="boundary-proposal">
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Survey proposal · {proposal.deviceId}</Typography>
          <ProposalPreview current={boundary.poly} proposal={proposal} />
          <Typography sx={{ fontSize: 11, color: C.goldMuted, mt: 0.5 }}>
            Dashed: today&apos;s boundary · solid: measured · orange: too steep · blue: standing water
          </Typography>
          <Box component="ul" sx={{ pl: 2, my: 1, fontSize: 13, '& li': { mb: 0.25 } }}>
            <li>{proposal.widthFt} × {proposal.depthFt} ft, {proposal.areaSqFt.toLocaleString()} sq ft, {proposal.perimeterFt} ft of edge</li>
            <li>Elevation {proposal.elevation.minFt} to {proposal.elevation.maxFt} ft (mean {proposal.elevation.meanFt}); steepest {proposal.maxSlopePct}%</li>
            <li>{proposal.lowSpots} low samples, {proposal.wetSpots} with standing water</li>
            <li>Ground covered {proposal.coveragePct}% · confidence {Math.round(proposal.confidence * 100)}%</li>
            <li data-testid="boundary-change">
              {proposal.expandsFt > 0.5 ? `Widens by up to ${proposal.expandsFt} ft` : 'Does not widen'}
              {proposal.shrinksFt > 0.5 ? ` · shrinks by up to ${proposal.shrinksFt} ft` : ''}
            </li>
          </Box>
          {proposal.expandsFt > 0.5 && (
            <FormControlLabel sx={{ display: 'flex', mb: 0.5 }}
              control={<Checkbox size="small" checked={confirmExpansion} onChange={(e) => setConfirmExpansion(e.target.checked)} inputProps={{ 'aria-label': 'Confirm widening' } as never} data-testid="boundary-confirm-expand" />}
              label={<Typography sx={{ fontSize: 13 }}>The wider area is mine and safe for robots (no road, pond edge or neighbour&apos;s yard)</Typography>} />
          )}
          {proposal.suggestedZones.length > 0 && (
            <FormControlLabel sx={{ display: 'flex', mb: 0.5 }}
              control={<Checkbox size="small" checked={addZones} onChange={(e) => setAddZones(e.target.checked)} />}
              label={<Typography sx={{ fontSize: 13 }}>Add {proposal.suggestedZones.length} suggested no-go zone{proposal.suggestedZones.length > 1 ? 's' : ''} (steep / wet)</Typography>} />
          )}
          {blocker && <Typography sx={{ color: C.warning, fontSize: 13, mb: 1 }} data-testid="boundary-blocker">{blocker}</Typography>}
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" disabled={!!blocker} onClick={accept} sx={{ bgcolor: C.accent }} data-testid="boundary-accept">Accept boundary</Button>
            <Button size="small" onClick={() => setProposal(null)} sx={{ color: C.goldMuted }}>Discard</Button>
          </Stack>
        </Box>
      )}
      {msg && <Alert severity={msg.tone} sx={{ mt: 1.5, py: 0 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
    </Paper>
  );
}

/** The boundary line (gold, dashed) and its margin (thin) on the 2D layout map. */
export function BoundarySvgLayer({ layout, scaleX, scaleY }: { layout: PropertyLayoutState; scaleX: number; scaleY: number }) {
  const b = effectiveBoundary(layout);
  const pts = b.poly.map(([x, y]) => `${x * scaleX},${y * scaleY}`).join(' ');
  return (
    <g pointerEvents="none" data-testid="boundary-layer">
      <polygon points={pts} fill="none" stroke={C.gold} strokeWidth={Math.max(2, b.marginFt * Math.min(scaleX, scaleY) * 2)} strokeOpacity={0.15} strokeLinejoin="round" />
      <polygon points={pts} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="10 6" strokeOpacity={0.85}>
        <title>Property boundary ({SOURCE_LABEL[b.source]}), robots stay {b.marginFt} ft inside</title>
      </polygon>
    </g>
  );
}

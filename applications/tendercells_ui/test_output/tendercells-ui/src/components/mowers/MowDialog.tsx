// MowDialog - "Mow now" with Basic and Advanced modes. Basic: mow now, optionally for a set
// time. Advanced depends on what the mower's connection supports (capabilities.patterns):
//   custom       native / OpenMower-style mowers: pattern, stripe angle, edge passes, overlap,
//                cutting height and the area to mow - with a live preview
//   vendor-area  Husqvarna: pick a work area; its pattern is set in the Automower Connect app
//   vendor-plan  Mammotion: pick a plan saved in the Mammotion app (pattern included)
//   null         basic only (GARDENA, Home Assistant)
// Starting is a hardware action: the owner confirms, and the hub still checks the interlock.
import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Slider, Stack, Tab, Tabs, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { capsOf, type MowPattern, type MowerView, type StartOptions } from "../../lib/mower/mower";
import { PATTERN_INFO, laneSpacingFt, pathLength, patternPaths } from "../../lib/mower/patterns";
import PatternPreview from "./PatternPreview";

const C = { bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55", white: "#F0EDE4", warning: "#E8A020" };
const field = { "& .MuiInputBase-root": { color: C.white }, "& label": { color: C.goldMuted }, "& .MuiFormHelperText-root": { color: C.goldMuted } };
const DURATIONS = [0, 30, 60, 120, 180, 240];
const PATTERNS: MowPattern[] = ["auto", "stripes", "checkerboard", "diamond", "spiral", "perimeter"];
/** Area used when none is drawn on the Property Twin (feet). */
const DEFAULT_AREA = { x: 0, y: 0, width: 60, depth: 40 };

export default function MowDialog({ open, m, onClose, onStart }: {
  open: boolean; m: MowerView; onClose: () => void; onStart: (opts: StartOptions) => void;
}) {
  const caps = capsOf(m);
  const advancedKind = caps.patterns;
  const details = m.state?.details;
  const [tab, setTab] = useState<"basic" | "advanced">("basic");
  const [duration, setDuration] = useState(0);
  const [pattern, setPattern] = useState<MowPattern>("stripes");
  const [angle, setAngle] = useState(0);
  const [edges, setEdges] = useState(1);
  const [overlap, setOverlap] = useState(10);
  const [heightMm, setHeightMm] = useState(50);
  const [area, setArea] = useState(DEFAULT_AREA);
  const [workArea, setWorkArea] = useState<number | "">("");
  const [plan, setPlan] = useState("");

  useEffect(() => { if (open) setTab(advancedKind === "vendor-plan" ? "advanced" : "basic"); }, [open, advancedKind]);

  const spacing = laneSpacingFt(overlap);
  const estimateMin = useMemo(() => {
    // ~1 ft/s typical robot mower speed; purely indicative.
    const ft = pathLength(patternPaths(area, pattern, angle, edges, spacing));
    return Math.max(1, Math.round(ft / 60));
  }, [area, pattern, angle, edges, spacing]);

  const build = (): StartOptions => {
    const basic = duration && caps.startDuration ? { durationMin: duration } : {};
    if (tab === "basic") return basic;
    if (advancedKind === "custom") {
      return { ...basic, pattern, ...(pattern === "stripes" || pattern === "checkerboard" || pattern === "diamond" ? { angleDeg: angle } : {}),
        edgePasses: edges, overlapPct: overlap, cuttingHeightMm: heightMm, area };
    }
    if (advancedKind === "vendor-area") return { ...basic, ...(workArea !== "" ? { workAreaId: workArea } : {}) };
    if (advancedKind === "vendor-plan") return { vendorTask: plan };
    return basic;
  };
  const canStart = !(tab === "advanced" && advancedKind === "vendor-plan" && !plan)
    && !(advancedKind === "vendor-plan" && tab === "basic");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
      <DialogTitle sx={{ color: C.gold }}>Mow now: {m.link.name}</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, "& .MuiTab-root": { color: C.goldMuted }, "& .Mui-selected": { color: `${C.gold} !important` } }}>
          <Tab value="basic" label="Basic" data-testid="mow-tab-basic" />
          <Tab value="advanced" label="Advanced" data-testid="mow-tab-advanced" />
        </Tabs>

        {tab === "basic" && (
          <Stack spacing={2}>
            {advancedKind === "vendor-plan" ? (
              <Alert severity="info">This mower starts from a plan saved in its own app - use Advanced to pick one.</Alert>
            ) : (
              <>
                <Typography>Mow the whole lawn now with the mower's own settings.</Typography>
                {caps.startDuration ? (
                  <TextField select label="For how long" value={duration} onChange={(e) => setDuration(Number(e.target.value))} sx={{ ...field, maxWidth: 260 }}>
                    {DURATIONS.map((d) => <MenuItem key={d} value={d}>{d ? `${d >= 60 ? `${d / 60} h` : `${d} min`}` : "Until done (mower decides)"}</MenuItem>)}
                  </TextField>
                ) : (
                  <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>This connection starts the mower until it decides it is done.</Typography>
                )}
              </>
            )}
          </Stack>
        )}

        {tab === "advanced" && advancedKind === "custom" && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <Box>
                <Typography sx={{ color: C.goldMuted, fontSize: 13, mb: 0.5 }}>Pattern</Typography>
                <ToggleButtonGroup exclusive size="small" value={pattern} onChange={(_, v) => v && setPattern(v)} sx={{ flexWrap: "wrap" }}>
                  {PATTERNS.map((p) => (
                    <ToggleButton key={p} value={p} data-testid={`pattern-${p}`} sx={{ color: C.goldMuted, borderColor: `${C.accent}66`, "&.Mui-selected": { bgcolor: C.accent, color: C.white } }}>
                      {PATTERN_INFO[p].label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 0.5 }}>{PATTERN_INFO[pattern].hint}</Typography>
              </Box>
              {(pattern === "stripes" || pattern === "checkerboard" || pattern === "diamond") && (
                <Box>
                  <Typography sx={{ fontSize: 13 }}>Stripe direction: {angle}°</Typography>
                  <Slider value={angle} min={0} max={179} step={15} onChange={(_, v) => setAngle(v as number)} sx={{ color: C.gold }} aria-label="Stripe direction" />
                </Box>
              )}
              <Box>
                <Typography sx={{ fontSize: 13 }}>Edge passes first: {edges}</Typography>
                <Slider value={edges} min={0} max={5} step={1} marks onChange={(_, v) => setEdges(v as number)} sx={{ color: C.gold }} aria-label="Edge passes" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13 }}>Lane overlap: {overlap}%</Typography>
                <Slider value={overlap} min={0} max={50} step={5} onChange={(_, v) => setOverlap(v as number)} sx={{ color: C.gold }} aria-label="Lane overlap" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13 }}>Cutting height: {heightMm} mm</Typography>
                <Slider value={heightMm} min={20} max={100} step={5} onChange={(_, v) => setHeightMm(v as number)} sx={{ color: C.gold }} aria-label="Cutting height" />
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField type="number" label="Area width (ft)" value={area.width} sx={{ ...field, width: 140 }}
                  onChange={(e) => setArea((a) => ({ ...a, width: Math.max(3, Math.min(5000, Number(e.target.value) || 3)) }))} />
                <TextField type="number" label="Area depth (ft)" value={area.depth} sx={{ ...field, width: 140 }}
                  onChange={(e) => setArea((a) => ({ ...a, depth: Math.max(3, Math.min(5000, Number(e.target.value) || 3)) }))} />
              </Stack>
            </Stack>
            <Stack spacing={1} alignItems="center">
              <PatternPreview area={area} pattern={pattern} angleDeg={angle} edgePasses={edges} spacing={spacing} />
              <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Preview (lanes drawn wider apart) · roughly {estimateMin} min at 1 ft/s</Typography>
            </Stack>
          </Stack>
        )}

        {tab === "advanced" && advancedKind === "vendor-area" && (
          <Stack spacing={2}>
            <Alert severity="info">
              This mower's pattern (stripes, checkerboard, triangles...) is set per work area in its own app. Pick the area and Tender
              Cells starts it there.
            </Alert>
            <TextField select label="Work area" value={workArea} onChange={(e) => setWorkArea(e.target.value === "" ? "" : Number(e.target.value))}
              sx={{ ...field, maxWidth: 360 }} data-testid="mow-work-area">
              <MenuItem value="">Whole lawn</MenuItem>
              {(details?.workAreas ?? []).map((w) => <MenuItem key={w.id} value={w.id}>{w.name}{w.cuttingHeight ? ` · ${w.cuttingHeight} mm` : ""}</MenuItem>)}
            </TextField>
            {caps.startDuration && (
              <TextField select label="For how long" value={duration} onChange={(e) => setDuration(Number(e.target.value))} sx={{ ...field, maxWidth: 260 }}>
                {DURATIONS.map((d) => <MenuItem key={d} value={d}>{d ? `${d >= 60 ? `${d / 60} h` : `${d} min`}` : "Mower default"}</MenuItem>)}
              </TextField>
            )}
          </Stack>
        )}

        {tab === "advanced" && advancedKind === "vendor-plan" && (
          <Stack spacing={2}>
            <Alert severity="info">Plans (area, pattern, height) are saved in the mower's own app. Pick one to run it now.</Alert>
            <TextField select label="Saved plan" value={plan} onChange={(e) => setPlan(e.target.value)} sx={{ ...field, maxWidth: 360 }} data-testid="mow-plan">
              {(details?.plans ?? []).map((p) => <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>)}
            </TextField>
            {!details?.plans?.length && <Typography sx={{ color: C.warning, fontSize: 13 }}>No saved plans yet - create one in the mower's app.</Typography>}
          </Stack>
        )}

        {tab === "advanced" && advancedKind === null && (
          <Alert severity="info">
            This mower's connection only supports basic start, pause and dock - pick patterns in its own app. Mowers with advanced
            control: Husqvarna (work areas), Mammotion (saved plans) and native / OpenMower-style mowers (every pattern).
          </Alert>
        )}

        <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 2 }}>
          This will activate hardware. Look at the lawn first. Tender Cells sends the mower home by itself if a guarded coop opens,
          an animal is seen, quiet hours begin or E-STOP is pressed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: C.goldMuted }}>Cancel</Button>
        <Button variant="contained" disabled={!canStart} onClick={() => onStart(build())} sx={{ bgcolor: C.accent }} data-testid="mow-confirm">
          Start mowing
        </Button>
      </DialogActions>
    </Dialog>
  );
}

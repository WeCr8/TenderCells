// WhyPanel.tsx - "Why did this happen?" for any demo event, at three depths: a child's
// sentence, a farmer's summary, and the engineer's full chain (trigger -> twin state -> rule ->
// command) with provenance. Used by the event simulator, the demo landing and missions.
import { useState } from "react";
import { Box, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import {
  DEMO_SOURCE, LIVE_SOURCE, WHY, type ChainKind, type ChainStep, type WhyLevel,
} from "../../lib/demo/eventSimulator";
import { trackDemo } from "../../lib/demo/track";
import { SOURCE_LABEL } from "../../lib/twin/twin";

const C = {
  bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55",
  warning: "#E8A020", danger: "#CC3333", white: "#F0EDE4",
};

const KIND: Record<ChainKind, { label: string; color: string }> = {
  device: { label: "Device", color: C.accent },
  signal: { label: "Signal", color: C.accent },
  ai: { label: "AI", color: "#7E9CD8" },
  rule: { label: "Rule", color: C.warning },
  os: { label: "Tender Cells OS", color: C.gold },
  actuator: { label: "Actuator", color: "#D08A5C" },
  action: { label: "Physical action", color: "#D08A5C" },
  notify: { label: "Notification", color: C.white },
};

/** Which twin changed and where the data came from (docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md). */
export function Provenance({ twin }: { twin?: string }) {
  return (
    <Typography data-testid="event-provenance" sx={{ color: C.goldMuted, fontSize: 12, fontFamily: "monospace", mb: 1, wordBreak: "break-all" }}>
      {twin && <>Twin {twin} · </>}Source: {DEMO_SOURCE.source} · Mode: {DEMO_SOURCE.mode}
    </Typography>
  );
}

/** The cause -> effect chain, top to bottom. `shown` limits how many steps are visible. */
export function Chain({ steps, shown = steps.length }: { steps: ChainStep[]; shown?: number }) {
  return (
    <Stack spacing={0.5} component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {steps.slice(0, shown).map((s, i) => (
        <Box component="li" key={i}>
          {i > 0 && <Typography aria-hidden sx={{ color: C.goldMuted, pl: 1.5, lineHeight: 1 }}>↓</Typography>}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: C.bg, border: `1px solid ${KIND[s.kind].color}55`, borderRadius: 1, px: 1.25, py: 0.75 }}>
            <Chip size="small" label={KIND[s.kind].label} sx={{ bgcolor: `${KIND[s.kind].color}22`, color: KIND[s.kind].color, fontWeight: 700, minWidth: 104 }} />
            <Box>
              <Typography sx={{ color: C.white, fontWeight: 600, fontSize: 14 }}>{s.actor}</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{s.detail}</Typography>
            </Box>
            <Typography title={`Live: ${SOURCE_LABEL[LIVE_SOURCE[s.kind]]}. Here: ${SOURCE_LABEL.SIMULATED}.`}
              sx={{ ml: "auto !important", color: C.goldMuted, fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}>
              {LIVE_SOURCE[s.kind]} · sim
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

const LEVELS: Array<{ id: WhyLevel; label: string }> = [
  { id: "kid", label: "For kids" },
  { id: "farmer", label: "For farmers" },
  { id: "engineer", label: "For engineers" },
];

/**
 * "Why did this happen?" for one event.
 *
 * @param scenarioId - Event scenario id (eventSimulator SCENARIOS)
 * @param steps      - Its cause -> effect chain
 * @param twin       - Twin ID the event changed
 */
export default function WhyPanel({ scenarioId, steps, twin, initial = "farmer" }: {
  scenarioId: string; steps: ChainStep[]; twin?: string; initial?: WhyLevel;
}) {
  const [level, setLevel] = useState<WhyLevel>(initial);
  const why = WHY[scenarioId];
  return (
    <Box data-testid="why-panel">
      <ToggleButtonGroup exclusive size="small" value={level} sx={{ mb: 1, flexWrap: "wrap" }}
        onChange={(_, v: WhyLevel | null) => { if (v) { setLevel(v); trackDemo("why_opened", { event: scenarioId, level: v }); } }}>
        {LEVELS.map((l) => (
          <ToggleButton key={l.id} value={l.id} data-testid={`why-${l.id}`}
            sx={{ color: C.goldMuted, borderColor: `${C.accent}66`, textTransform: "none", "&.Mui-selected": { bgcolor: C.accent, color: C.white } }}>
            {l.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {level !== "engineer" && why ? (
        <Typography data-testid="why-text" sx={{ color: C.white, fontSize: 15, lineHeight: 1.5 }}>{why[level]}</Typography>
      ) : (
        <>
          <Provenance twin={twin} />
          <Chain steps={steps} />
        </>
      )}
    </Box>
  );
}

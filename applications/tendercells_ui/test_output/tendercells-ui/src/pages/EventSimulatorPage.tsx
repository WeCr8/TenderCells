// EventSimulatorPage (/simulator) - "Trigger an event" in the public demo. Pick an event;
// its cause -> effect chain plays through Tender Cells OS step by step, the demo devices
// change, and every logged event can answer "Why did this happen?". Simulation only.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  EVENT_LOG_EVENT, SCENARIOS, clearEventLog, markExplained, readEventLog, runScenario, scenarioById,
  type EventLogEntry, type Scenario,
} from "../lib/demo/eventSimulator";
import { trackDemo } from "../lib/demo/track";
import WhyPanel, { Chain, Provenance } from "../components/demo/WhyPanel";

const C = {
  bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55",
  warning: "#E8A020", danger: "#CC3333", white: "#F0EDE4",
};

const STEP_MS = 450;

function Links({ s }: { s: Scenario }) {
  const navigate = useNavigate();
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
      <Button variant="contained" onClick={() => navigate(s.see.path)} sx={{ bgcolor: C.accent, color: C.white }}>See it: {s.see.label}</Button>
      <Button variant="outlined" href={s.learn.href} sx={{ borderColor: C.accent, color: C.gold }}>How it works</Button>
      <Button variant="outlined" href={s.build.href} onClick={() => trackDemo("build_guide_opened", { from: "simulator", event: s.id })}
        sx={{ borderColor: C.accent, color: C.gold }}>Build this</Button>
    </Stack>
  );
}

export default function EventSimulatorPage() {
  const [log, setLog] = useState<EventLogEntry[]>(() => readEventLog());
  const [playing, setPlaying] = useState<{ scenario: Scenario; shown: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onLog = () => setLog(readEventLog());
    window.addEventListener(EVENT_LOG_EVENT, onLog);
    return () => { window.removeEventListener(EVENT_LOG_EVENT, onLog); window.clearInterval(timer.current); };
  }, []);

  const trigger = async (s: Scenario) => {
    window.clearInterval(timer.current);
    trackDemo("event_triggered", { event: s.id });
    setPlaying({ scenario: s, shown: 1 });
    // Play the chain one step at a time, then apply the effect and log it.
    timer.current = window.setInterval(() => {
      setPlaying((p) => {
        if (!p) return p;
        if (p.shown >= p.scenario.steps.length) { window.clearInterval(timer.current); return p; }
        return { ...p, shown: p.shown + 1 };
      });
    }, STEP_MS);
    await runScenario(s.id);
  };

  const done = playing && playing.shown >= playing.scenario.steps.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: C.white }}>
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ color: C.gold, fontWeight: 800 }}>Trigger an event</Typography>
        <Typography sx={{ maxWidth: 820 }}>
          Pick something that happens on a farm. Watch it travel from the device, through the rules in
          Tender Cells OS, to a physical action and an alert - then ask why it happened.
        </Typography>
        <Typography variant="caption" sx={{ color: C.goldMuted }}>Simulation: the demo devices change, nothing is sent to real hardware.</Typography>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1.25}>
            {SCENARIOS.map((s) => (
              <Grid item xs={12} sm={6} key={s.id}>
                <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${playing?.scenario.id === s.id ? C.gold : C.accent + "44"}`, borderRadius: 2, p: 1.5, height: "100%" }}>
                  <Stack spacing={1} height="100%">
                    <Typography sx={{ color: C.gold, fontWeight: 700 }}>{s.emoji} {s.title}</Typography>
                    <Typography sx={{ color: C.goldMuted, fontSize: 13, flex: 1 }}>{s.summary}</Typography>
                    <Button variant="outlined" onClick={() => void trigger(s)} sx={{ borderColor: C.accent, color: C.gold }}
                      data-testid={`trigger-${s.id}`}>Trigger</Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, position: { md: "sticky" }, top: 16 }}>
            {!playing && (
              <Typography sx={{ color: C.goldMuted }}>
                Trigger an event to watch it move through the system: device → signal → rule → Tender Cells OS → action → alert. Each step shows where its data would come from on a live farm (sensed, inferred, calculated, command) - here, all of it is simulated.
              </Typography>
            )}
            {playing && (
              <Box data-testid="event-chain">
                <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>{playing.scenario.emoji} {playing.scenario.title}</Typography>
                <Provenance twin={playing.scenario.twin} />
                <Chain steps={playing.scenario.steps} shown={playing.shown} />
                {done && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ color: C.white, fontWeight: 700 }}>✓ {playing.scenario.outcome}</Typography>
                    <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 0.5 }}>You just saw: {playing.scenario.concepts.join(", ")}.</Typography>
                    <Links s={playing.scenario} />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
        <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700 }}>Event log</Typography>
        {log.length > 0 && <Button size="small" onClick={clearEventLog} sx={{ color: C.goldMuted }}>Clear</Button>}
      </Stack>
      {!log.length && <Typography sx={{ color: C.goldMuted }}>Nothing has happened yet.</Typography>}
      <Stack spacing={1}>
        {log.slice(0, 12).map((e) => {
          const s = scenarioById(e.scenarioId);
          return (
            <Accordion key={e.id} disableGutters
              onChange={(_, open) => { if (open && !e.explained) { markExplained(e.id); trackDemo("event_explanation_opened", { event: e.scenarioId }); } }}
              sx={{ bgcolor: C.surface, color: C.white, border: `1px solid ${C.accent}44`, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.gold }} />}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.5 }} alignItems={{ sm: "center" }} sx={{ width: "100%" }}>
                  <Typography sx={{ fontWeight: 700 }}>{e.emoji} {e.outcome}</Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{new Date(e.at).toLocaleTimeString()}</Typography>
                  <Typography sx={{ color: C.gold, fontSize: 13, ml: { sm: "auto !important" }, pr: 1 }}>Why did this happen?</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <WhyPanel scenarioId={e.scenarioId} steps={e.steps} twin={e.twin} />
                {s && <Links s={s} />}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
}

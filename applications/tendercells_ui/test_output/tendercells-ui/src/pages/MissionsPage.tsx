// MissionsPage (/missions) - short guided missions through the demo for students, families
// and first-time visitors. Steps tick themselves off (event triggered, "Why?" opened, page
// visited); each mission ends with how to build it for real.
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Grid, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { EVENT_LOG_EVENT, readEventLog } from "../lib/demo/eventSimulator";
import { MISSIONS, missionProgress, readVisited, stepDone, type Mission } from "../lib/demo/missions";
import { trackDemo } from "../lib/demo/track";

const C = { bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55", white: "#F0EDE4" };

function MissionCard({ m }: { m: Mission }) {
  const navigate = useNavigate();
  const [log, setLog] = useState(() => readEventLog());
  const visited = readVisited();
  useEffect(() => {
    const on = () => setLog(readEventLog());
    window.addEventListener(EVENT_LOG_EVENT, on);
    return () => window.removeEventListener(EVENT_LOG_EVENT, on);
  }, []);
  const { done, total } = missionProgress(m, log, visited);
  const complete = done === total;
  useEffect(() => { if (complete) trackDemo("mission_completed", { mission: m.id }); }, [complete, m.id]);

  return (
    <Paper elevation={0} data-testid={`mission-${m.id}`} sx={{ bgcolor: C.surface, border: `1px solid ${complete ? C.gold : C.accent + "44"}`, borderRadius: 2, p: 2, height: "100%" }}>
      <Stack spacing={1.25} height="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>{m.emoji} {m.title}</Typography>
          <Chip size="small" label={complete ? "Complete 🏆" : `${done}/${total}`} sx={{ bgcolor: complete ? C.gold : C.bg, color: complete ? C.bg : C.gold, fontWeight: 700 }} />
        </Stack>
        <Typography sx={{ color: C.white }}><strong>Goal:</strong> {m.goal}</Typography>
        <LinearProgress variant="determinate" value={(done / total) * 100} sx={{ bgcolor: C.bg, "& .MuiLinearProgress-bar": { bgcolor: C.gold } }} />
        <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5, flex: 1 }}>
          {m.steps.map((s, i) => {
            const ok = stepDone(s, log, visited);
            const go = () => {
              if (i === 0) trackDemo("mission_started", { mission: m.id });
              navigate(s.kind === "visit" ? s.path : "/simulator");
            };
            return (
              <Box component="li" key={i} sx={{ color: ok ? C.gold : C.white }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, textDecoration: ok ? "line-through" : "none", opacity: ok ? 0.8 : 1 }}>{ok ? "✓ " : ""}{s.text}</Typography>
                  {!ok && <Button size="small" onClick={go} sx={{ color: C.gold, minWidth: 0 }}>Go</Button>}
                </Stack>
              </Box>
            );
          })}
        </Stack>
        <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>You learn: {m.concepts.join(", ")}</Typography>
        <Button variant={complete ? "contained" : "outlined"} href={m.build.href}
          onClick={() => trackDemo("build_guide_opened", { from: "mission", mission: m.id })}
          sx={complete ? { bgcolor: C.gold, color: C.bg } : { borderColor: C.accent, color: C.gold }}>
          See how to build it: {m.build.label}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function MissionsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: C.white }}>
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ color: C.gold, fontWeight: 800 }}>Missions</Typography>
        <Typography sx={{ maxWidth: 820 }}>
          Short challenges in the demo farm. Trigger events, find out why things happened, then see how to build
          the real device. Steps tick off by themselves as you go.
        </Typography>
        <Typography sx={{ maxWidth: 820, color: C.goldMuted, fontSize: 14 }}>
          Want it one step at a time, with explanations for kids, beginners, engineers and teachers - and a path to
          real hardware? <Button size="small" component={RouterLink} to="/builder" sx={{ color: C.gold }}>Open the Builder →</Button>
        </Typography>
      </Stack>
      <Grid container spacing={1.5}>
        {MISSIONS.map((m) => <Grid item xs={12} md={6} lg={4} key={m.id}><MissionCard m={m} /></Grid>)}
      </Grid>
    </Box>
  );
}

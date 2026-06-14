// DemoLandingPage.tsx
//
// Public, no-signup front door. A visitor hits /demo (or /try) and lands inside
// a fully-seeded Tender Cells environment — products, flocks, eggs, schedules,
// property layout and equipment sim-state across every product family — running
// entirely in their own browser. No account, no hardware, no cloud.
//
// This is the open-source on-ramp made one-click: it calls the demo-environment
// orchestrator, then drops the guest on the dashboard. Idempotent, so a repeat
// visit is instant and never duplicates data.
//
// Deployment note: a PUBLIC demo must run sim-only (localStorage) so each visitor
// gets a private, isolated sandbox and no unauthenticated writes hit Firestore.
// Deploy the public demo build with VITE_FIREBASE_PROJECT_ID UNSET. If the build
// is Firebase-backed, an unauthenticated seed will fail (PERMISSION_DENIED); we
// surface that here rather than spinning forever.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import YardIcon from "@mui/icons-material/Yard";
import PetsIcon from "@mui/icons-material/Pets";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { seedDemoEnvironment, type DemoReport } from "../services/demo/demoEnvironment";

const C = {
  bg: "#0D2B1E",
  surface: "#1A3D2B",
  accent: "#4A7C59",
  gold: "#C8B882",
  goldMuted: "#8A7D55",
  warning: "#E8A020",
  danger: "#CC3333",
  white: "#F0EDE4",
};

type Phase = "seeding" | "ready" | "error";

const DEMO_TIMEOUT_MS = 12000;

const useCases = [
  { label: "Command Center", detail: "All registered demo systems, alerts, and quick actions", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Chicken Tender", detail: "Coop automation, cameras, doors, feed, cleaning, and egg map", path: "/chicken-tender", icon: <PetsIcon /> },
  { label: "ChickenEye AI", detail: "Vision simulation, identity, health, and nest-box egg detection", path: "/chicken-eye", icon: <VisibilityIcon /> },
  { label: "Property Layout", detail: "Full yard layout with every product family placed on the grid", path: "/layout", icon: <YardIcon /> },
  { label: "Schedules", detail: "Automated doors, feed, cleaning, water, and routines", path: "/schedules", icon: <ScheduleIcon /> },
  { label: "WatchTower", detail: "Predator-monitor view and yard security scenario", path: "/predator-monitor", icon: <VisibilityIcon /> },
];

/** Fire a GA4 event if analytics is present. No-op otherwise. */
function track(event: string, params?: Record<string, unknown>) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", event, params ?? {});
}

export default function DemoLandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("seeding");
  const [error, setError] = useState<string>("");
  const [report, setReport] = useState<DemoReport | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard StrictMode double-invoke
    started.current = true;

    (async () => {
      track("demo_load_start");
      try {
        const seeded = await Promise.race([
          seedDemoEnvironment(),
          new Promise<never>((_, reject) =>
            window.setTimeout(() => reject(new Error("Demo seed timed out. You can still explore the app, or reload the demo.")), DEMO_TIMEOUT_MS),
          ),
        ]);
        setReport(seeded);
        track("demo_loaded", { ok: seeded.ok, devices: seeded.devices.length });
        setPhase("ready");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        track("demo_load_error", { message: msg });
        setError(msg);
        setPhase("error");
      }
    })();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: C.bg,
        p: 4,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 460, textAlign: "center" }}>
        {phase === "seeding" && (
          <>
            <CircularProgress sx={{ color: C.gold }} />
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>
              Building your live demo yard...
            </Typography>
            <Typography sx={{ color: C.white }}>
              Seeding a full Tender Cells environment — every product family, flocks,
              eggs, schedules and layout — right here in your browser.
            </Typography>
            <Typography variant="caption" sx={{ color: C.goldMuted }}>
              Private &amp; local-first. Nothing leaves your machine. No account needed.
            </Typography>
          </>
        )}

        {phase === "ready" && (
          <Stack spacing={2.5} sx={{ width: "min(1080px, 92vw)" }}>
            <Stack spacing={1} alignItems="center">
              <Chip
                label={report?.ok ? "Demo environment verified" : "Demo loaded with gaps"}
                sx={{ bgcolor: report?.ok ? C.accent + "33" : C.warning + "33", color: report?.ok ? C.accent : C.warning, fontWeight: 700 }}
              />
              <Typography variant="h4" sx={{ color: C.gold, fontWeight: 800, textAlign: "center" }}>
                Tender Cells Demo Yard
              </Typography>
              <Typography sx={{ color: C.white, textAlign: "center", maxWidth: 760 }}>
                Explore the full no-signup simulation: coops, animals, nest boxes, schedules,
                property layout, vision AI, and predator monitoring. All data is local to this browser.
              </Typography>
            </Stack>

            <Grid container spacing={1.5}>
              {[
                { label: "Systems", value: report?.devices.length ?? 0 },
                { label: "Coherent", value: report?.devices.filter((d) => d.product.ok && d.layout.ok && d.equipment.ok).length ?? 0 },
                { label: "Animal Packs", value: report?.devices.filter((d) => d.flock.detail !== "0 animals").length ?? 0 },
                { label: "Egg Maps", value: report?.devices.filter((d) => d.eggs.detail.includes("nest boxes")).length ?? 0 },
              ].map((item) => (
                <Grid item xs={6} sm={3} key={item.label}>
                  <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 1.5, textAlign: "center" }}>
                    <Typography sx={{ color: C.gold, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{item.value}</Typography>
                    <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{item.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {!report?.ok && (
              <Alert severity="warning" sx={{ bgcolor: C.warning + "22", color: C.white }}>
                Some demo layers did not verify. You can still explore, or reload the demo to reseed local state.
              </Alert>
            )}

            <Grid container spacing={1.5}>
              {useCases.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.path}>
                  <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, height: "100%" }}>
                    <Stack spacing={1.25} height="100%">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ color: C.accent, display: "flex" }}>{item.icon}</Box>
                        <Typography sx={{ color: C.gold, fontWeight: 700 }}>{item.label}</Typography>
                      </Stack>
                      <Typography sx={{ color: C.goldMuted, fontSize: 13, flex: 1 }}>{item.detail}</Typography>
                      <Button variant="outlined" onClick={() => navigate(item.path)} sx={{ borderColor: C.accent, color: C.accent }}>
                        Open
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ bgcolor: C.accent, color: C.white }}>
                Start at Dashboard
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderColor: C.goldMuted, color: C.gold }}>
                Reload Demo
              </Button>
            </Stack>
          </Stack>
        )}

        {phase === "error" && (
          <>
            <Typography variant="h5" sx={{ color: C.danger, fontWeight: 700 }}>
              Couldn’t load the demo
            </Typography>
            <Typography sx={{ color: C.white }}>
              This build is connected to a cloud backend that needs sign-in. The public
              demo runs sim-only — try again, or explore the app directly.
            </Typography>
            <Box
              component="pre"
              sx={{
                color: C.goldMuted,
                fontSize: 12,
                bgcolor: C.surface,
                p: 1.5,
                borderRadius: 1,
                maxWidth: "100%",
                overflowX: "auto",
              }}
            >
              {error}
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={() => navigate("/dashboard", { replace: true })}
                sx={{ bgcolor: C.accent, color: C.white, "&:hover": { bgcolor: C.gold, color: C.bg } }}
              >
                Explore anyway
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}

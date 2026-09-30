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
// The public-demo build sets VITE_SIM_DATA_ONLY=true for that (Firebase Auth stays
// configured so accounts still work). If the data backend is Firestore, an
// unauthenticated seed will fail (PERMISSION_DENIED); we surface that here rather
// than spinning forever.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import YardIcon from "@mui/icons-material/Yard";
import PetsIcon from "@mui/icons-material/Pets";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { seedDemoEnvironment, type DemoReport } from "../services/demo/demoEnvironment";
import { safeDemoNext } from "../lib/demo/demoNext";
import { trackDemo } from "../lib/demo/track";
import Viewport3D from "../components/viewport/Viewport3D";

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
  { label: "Property Twin", detail: "Full yard layout with every product family placed on the grid", path: "/layout", icon: <YardIcon /> },
  { label: "Schedules", detail: "Automated doors, feed, cleaning, water, and routines", path: "/schedules", icon: <ScheduleIcon /> },
  { label: "WatchTower", detail: "Predator-monitor view and yard security scenario", path: "/predator-monitor", icon: <VisibilityIcon /> },
];

const track = trackDemo;

// What the 3D Property Twin connects to. Status is honest: "sim" means the demo shows it running
// in simulation; the page it opens explains how the real connection works.
const connections: { id: string; label: string; detail: string; path?: string; href?: string }[] = [
  { id: "robots", label: "🤖 Robots", detail: "Weed rover, robot mower and Roaming Roost - inside your boundary", path: "/weed-patrol" },
  { id: "mowers", label: "🏠 Home Assistant", detail: "Bring your own robot mower (Home Assistant, Husqvarna, GARDENA, Mammotion)", path: "/mowers" },
  { id: "devices", label: "📡 MQTT · ESP32 · Pi hub", detail: "Coops, doors, feeders and sensors on the local network", href: "/os#developers" },
  { id: "garden", label: "🌱 FarmBot gardens", detail: "Garden beds and my.farm.bot on the same map", path: "/layout" },
  { id: "cameras", label: "📷 Cameras & WatchTower", detail: "Predator watch with detections on the map", path: "/predator-monitor" },
  { id: "sim", label: "🧪 Isaac Sim · Hugging Face", detail: "Export the yard as OpenUSD; run robot policies", href: "/os#developers" },
];

// Guided entrances into the same simulation (not separate apps). OS pages use the router;
// website pages (same origin) load normally.
const personas: { id: string; emoji: string; title: string; who: string; detail: string; cta: string; path?: string; href?: string }[] = [
  { id: "run-the-farm", emoji: "🚜", title: "Run the farm", who: "Farmers · backyard flocks · homesteaders", detail: "Alerts, animals, feed, water, doors, schedules, predators and system health in one view.", cta: "Open the dashboard", path: "/dashboard" },
  { id: "mission", emoji: "🏁", title: "Take a mission", who: "Kids · families · first-time visitors", detail: "Protect the flock, close the coop before sunset, find today's eggs, fix a low-water alert.", cta: "Pick a mission", path: "/missions" },
  { id: "4h-ffa", emoji: "🎓", title: "Build a 4-H / FFA project", who: "4-H · FFA · schools · homeschool", detail: "Project plans with a question, variables, data to collect and the lessons that build the device.", cta: "See project plans", href: "/science-fair" },
  { id: "hardware", emoji: "🔧", title: "Explore the hardware", who: "Makers · engineers · parents · teachers", detail: "Boards, wiring, flashing, the MQTT contract and how a device shows up here - step by step.", cta: "Build a device", href: "/os#build" },
  { id: "code", emoji: "💻", title: "Hack the code", who: "Developers · robotics students · contributors", detail: "Topics and payloads, the backend API, firmware, simulation and how to contribute.", cta: "Developer path", href: "/os#developers" },
  { id: "platform", emoji: "🧭", title: "Explore Tender Cells OS", who: "Partners · investors · media", detail: "The platform, product families, the shared device and event layer, and the open-source approach.", cta: "About the OS", href: "/os" },
];

const countFrom = (detail: string) => Number(/(\d+)/.exec(detail)?.[1] ?? 0);

/** Real-world state of the demo property, from the seed report. */
function demoStats(report: DemoReport | null) {
  const devices = report?.devices ?? [];
  return [
    { label: "Systems online", value: devices.length },
    { label: "Animals monitored", value: devices.reduce((n, d) => n + countFrom(d.flock.detail), 0) },
    { label: "Nest boxes watched", value: devices.reduce((n, d) => n + (d.eggs.detail.includes("nest boxes") ? countFrom(d.eggs.detail) : 0), 0) },
    { label: "Automations scheduled", value: devices.reduce((n, d) => n + countFrom(d.schedules.detail), 0) },
  ];
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
        // Deep link from the website: open the requested OS page with the demo data loaded.
        const next = safeDemoNext(new URLSearchParams(window.location.search).get("next"));
        if (next) navigate(next, { replace: true });
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
        alignItems: phase === "ready" ? "flex-start" : "center",
        justifyContent: "center",
        bgcolor: C.bg,
        p: { xs: 2, sm: 3 },
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
          <Stack spacing={3} sx={{ width: "min(1080px, 92vw)" }}>
            {/* The first thing a visitor sees: the property itself, live, in 2D and 3D. */}
            <Box data-testid="demo-hero-twin" sx={{ textAlign: "left" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-end" }} justifyContent="space-between" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ color: C.gold, fontWeight: 800, fontSize: { xs: 24, md: 32 } }}>
                    Your whole property, live in 2D and 3D
                  </Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 14, maxWidth: 720 }}>
                    A 3D property operating system: robots mow, scan and patrol inside your boundary while coops, docks
                    and cameras run on their own. Switch 2D / 3D, drag to rotate, scroll to zoom. Everything here is simulated.
                  </Typography>
                </Box>
                <Button variant="contained" onClick={() => { trackDemo("persona_selected", { persona: "property-twin" }); navigate("/layout"); }}
                  sx={{ bgcolor: C.accent, color: C.white, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Open the Property Twin
                </Button>
              </Stack>
              <Box sx={{ borderRadius: 2, overflow: "hidden", border: `1px solid ${C.accent}` }}>
                <Viewport3D initialWorkspaceMode="products" overview showAttentionPanel={false}
                  title="Demo farm" height={{ xs: "min(58dvh, 420px)", sm: "min(62dvh, 520px)", md: 560 }} />
              </Box>
              <Grid container spacing={1} sx={{ mt: 0.5 }} data-testid="demo-connections">
                {connections.map((c) => (
                  <Grid item xs={6} sm={4} md={2} key={c.id}>
                    <Paper elevation={0} component="button" type="button"
                      onClick={() => { trackDemo("persona_selected", { persona: `connect-${c.id}` }); if (c.path) navigate(c.path); else window.location.href = c.href!; }}
                      sx={{ width: "100%", height: "100%", textAlign: "left", cursor: "pointer", bgcolor: C.surface, color: C.white,
                        border: `1px solid ${C.accent}44`, borderRadius: 1.5, p: 1, font: "inherit", "&:hover": { borderColor: C.gold } }}>
                      <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{c.label}</Typography>
                      <Typography sx={{ color: C.goldMuted, fontSize: 11, lineHeight: 1.35 }}>{c.detail}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Stack spacing={1.25} alignItems="center" sx={{ textAlign: "center" }}>
              <Chip
                label={report?.ok ? "Simulated property · data stays in this browser" : "Demo loaded with gaps"}
                sx={{ bgcolor: report?.ok ? C.accent + "33" : C.warning + "33", color: report?.ok ? C.gold : C.warning, fontWeight: 700 }}
              />
              <Typography variant="h3" component="h2" sx={{ color: C.gold, fontWeight: 800, fontSize: { xs: 26, md: 36 } }}>
                A farm that can sense, think, and act.
              </Typography>
              <Typography sx={{ color: C.white, fontWeight: 700, maxWidth: 760 }}>
                Tender Cells OS connects animals, sensors, cameras, automation, and robotics through one open platform.
              </Typography>
              <Typography sx={{ color: C.goldMuted, maxWidth: 760 }}>
                Meet the demo farm: everything here has a digital identity - animals, habitats, cameras, sensors,
                robots and automations. It runs entirely in simulation; connect real devices later and the same
                entities can reflect what is physically happening.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 0.5 }}>
                <Button variant="contained" onClick={() => { trackDemo("demo_started", { via: "enter" }); navigate("/dashboard"); }}
                  sx={{ bgcolor: C.accent, color: C.white, fontWeight: 700 }}>Enter demo</Button>
                <Button variant="contained" onClick={() => navigate("/simulator")} sx={{ bgcolor: C.gold, color: C.bg, fontWeight: 700 }}>Trigger an event</Button>
                <Button variant="outlined" href="/digital-twin" sx={{ borderColor: C.accent, color: C.gold }}>How digital twins work</Button>
                <Button variant="outlined" href="/os#build" onClick={() => trackDemo("build_guide_opened", { from: "demo_hero" })}
                  sx={{ borderColor: C.accent, color: C.gold }}>Build a system</Button>
                <Button variant="outlined" href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer"
                  onClick={() => trackDemo("github_clicked", { from: "demo_hero" })} sx={{ borderColor: C.accent, color: C.gold }}>View source</Button>
              </Stack>
            </Stack>

            {/* Real-world state of the simulated property (not internal verification labels). */}
            <Grid container spacing={1.5}>
              {demoStats(report).map((item) => (
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

            <Box>
              <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>Choose how to explore</Typography>
              <Grid container spacing={1.5}>
                {personas.map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p.id}>
                    <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, height: "100%" }}>
                      <Stack spacing={1} height="100%">
                        <Typography sx={{ color: C.gold, fontWeight: 800 }}>{p.emoji} {p.title}</Typography>
                        <Typography sx={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{p.who}</Typography>
                        <Typography sx={{ color: C.goldMuted, fontSize: 13, flex: 1 }}>{p.detail}</Typography>
                        <Button variant="outlined"
                          {...(p.path ? { onClick: () => { trackDemo("persona_selected", { persona: p.id }); navigate(p.path!); } }
                            : { href: p.href, onClick: () => trackDemo("persona_selected", { persona: p.id }) })}
                          sx={{ borderColor: C.accent, color: C.gold }}>{p.cta}</Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>Jump to a system</Typography>
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
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
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

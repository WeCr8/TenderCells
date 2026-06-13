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
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { seedDemoEnvironment } from "../services/demo/demoEnvironment";

const C = {
  bg: "#0D2B1E",
  surface: "#1A3D2B",
  accent: "#4A7C59",
  gold: "#C8B882",
  goldMuted: "#8A7D55",
  danger: "#CC3333",
  white: "#F0EDE4",
};

type Phase = "seeding" | "error";

/** Fire a GA4 event if analytics is present. No-op otherwise. */
function track(event: string, params?: Record<string, unknown>) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", event, params ?? {});
}

export default function DemoLandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("seeding");
  const [error, setError] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard StrictMode double-invoke
    started.current = true;

    (async () => {
      track("demo_load_start");
      try {
        const report = await seedDemoEnvironment();
        track("demo_loaded", { ok: report.ok, devices: report.devices.length });
        navigate("/dashboard", { replace: true });
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
              Spinning up your demo coop…
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

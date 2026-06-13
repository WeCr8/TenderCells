// SettingsPage.tsx — full settings: profile, notifications, thresholds, MQTT, preferences, password, danger zone
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Stack, Typography, Button, Switch, FormControlLabel,
  TextField, Alert, CircularProgress, Snackbar,
  Select, MenuItem, FormControl, InputLabel, Accordion,
  AccordionSummary, AccordionDetails, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TuneIcon from "@mui/icons-material/Tune";
import RouterIcon from "@mui/icons-material/Router";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningIcon from "@mui/icons-material/Warning";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import ScienceIcon from "@mui/icons-material/Science";
import { useAuth } from "../contexts/AuthContext";
import { settingsService, DEFAULT_SETTINGS, type UserSettings } from "../services/settingsService";
import {
  seedDemoEnvironment,
  resetDemoEnvironment,
  verifyDemoEnvironment,
  isDemoSeeded,
  demoSeededAt,
  DEMO_EVENT,
  type DemoReport,
} from "../services/demo/demoEnvironment";

const C = {
  bg: "#0D2B1E",
  surface: "#1A3D2B",
  accent: "#4A7C59",
  gold: "#C8B882",
  goldMuted: "#8A7D55",
  danger: "#CC3333",
  white: "#F0EDE4",
};

const inputSx = {
  "& label": { color: C.goldMuted },
  "& input": { color: C.white },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
  "& .MuiSelect-select": { color: C.white },
};

const accordSx = {
  bgcolor: C.surface,
  mb: 1,
  borderRadius: "8px !important",
  "&:before": { display: "none" },
  border: "1px solid " + C.accent + "44",
};

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: C.accent }}>{icon}</Box>
      <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>{label}</Typography>
    </Stack>
  );
}

function DangerConfirmDialog({
  open, title, onConfirm, onClose, children,
}: {
  open: boolean; title: string; onConfirm: () => void; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
      <DialogTitle sx={{ color: C.danger }}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: C.goldMuted }}>Cancel</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" sx={{ bgcolor: C.danger }}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; ok: boolean } | null>(null);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Password change
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Delete account dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");

  // Demo / developer environment
  const [demoSeeded, setDemoSeeded] = useState(isDemoSeeded());
  const [demoAt, setDemoAt] = useState<string | null>(demoSeededAt());
  const [demoBusy, setDemoBusy] = useState<"" | "seed" | "verify" | "reset">("");
  const [demoReport, setDemoReport] = useState<DemoReport | null>(null);
  const [demoResetOpen, setDemoResetOpen] = useState(false);

  const uid = user?.uid ?? "";

  const load = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const s = await settingsService.getSettings(uid);
      setSettings(s);
      setDisplayName(user?.displayName ?? "");
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, [uid, user]);

  useEffect(() => { load(); }, [load]);

  const patch = <K extends keyof UserSettings>(section: K, updates: Partial<UserSettings[K]>) => {
    setSettings(prev => ({ ...prev, [section]: { ...(prev[section] as object), ...updates } }));
    setDirty(true);
  };

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await settingsService.saveSettings(uid, settings);
      setDirty(false);
      setSnack({ msg: "Settings saved", ok: true });
    } catch { setSnack({ msg: "Save failed", ok: false }); }
    finally { setSaving(false); }
  };

  const saveDisplayName = async () => {
    setSavingName(true);
    try {
      await settingsService.updateDisplayName(displayName);
      setSnack({ msg: "Display name updated", ok: true });
    } catch { setSnack({ msg: "Name update failed", ok: false }); }
    finally { setSavingName(false); }
  };

  const savePassword = async () => {
    if (pwNew !== pwConfirm) { setSnack({ msg: "Passwords do not match", ok: false }); return; }
    if (pwNew.length < 8) { setSnack({ msg: "New password must be 8+ characters", ok: false }); return; }
    setSavingPw(true);
    try {
      await settingsService.changePassword(pwCurrent, pwNew);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      setSnack({ msg: "Password changed successfully", ok: true });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : "Password change failed", ok: false });
    } finally { setSavingPw(false); }
  };

  const deleteAccount = async () => {
    try {
      await settingsService.deleteAccount(deletePw);
      await logout();
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : "Delete failed — check password", ok: false });
    }
  };

  // Keep the demo status chip in sync if seeding happens elsewhere (e.g. a
  // per-page "Load Demo" button delegating to the orchestrator).
  useEffect(() => {
    const refresh = () => { setDemoSeeded(isDemoSeeded()); setDemoAt(demoSeededAt()); };
    window.addEventListener(DEMO_EVENT, refresh);
    return () => window.removeEventListener(DEMO_EVENT, refresh);
  }, []);

  const handleDemoSeed = async () => {
    setDemoBusy("seed");
    try {
      const report = await seedDemoEnvironment();
      setDemoReport(report);
      setDemoSeeded(true);
      setDemoAt(demoSeededAt());
      setSnack({ msg: report.ok ? "Demo environment loaded — all layers verified" : "Demo loaded with warnings — see report", ok: report.ok });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : "Demo load failed", ok: false });
    } finally { setDemoBusy(""); }
  };

  const handleDemoVerify = async () => {
    setDemoBusy("verify");
    try {
      const report = await verifyDemoEnvironment();
      setDemoReport(report);
      setSnack({ msg: report.ok ? "Verify passed — every device coherent" : "Verify found gaps — see report", ok: report.ok });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : "Verify failed", ok: false });
    } finally { setDemoBusy(""); }
  };

  const handleDemoReset = async () => {
    setDemoBusy("reset");
    try {
      await resetDemoEnvironment();
      setDemoReport(null);
      setDemoSeeded(false);
      setDemoAt(null);
      setSnack({ msg: "Demo data cleared (your own records untouched)", ok: true });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : "Reset failed", ok: false });
    } finally { setDemoBusy(""); }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: C.goldMuted }}>Sign in to access settings.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  const notifKeys: Array<[keyof UserSettings["notifications"], string]> = [
    ["predatorAlert",      "Predator detected (WatchTower AI)"],
    ["faultAlert",         "Hardware fault / diagnostic codes"],
    ["healthNotice",       "Animal health warnings"],
    ["emailNotifications", "Email notifications (in addition to push)"],
  ];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: "100dvh", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ maxWidth: 780, mx: "auto" }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Settings</Typography>
            <Typography variant="body2" sx={{ color: C.goldMuted }}>{user?.email}</Typography>
          </Box>
          {dirty && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
              onClick={save}
              disabled={saving}
              sx={{ bgcolor: C.accent }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </Stack>

        {/* Profile */}
        <Accordion sx={accordSx} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<PersonIcon />} label="Profile" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-end" }}>
                <TextField
                  label="Display Name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  size="small"
                  sx={{ ...inputSx, flex: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={saveDisplayName}
                  disabled={savingName || !displayName.trim()}
                  sx={{ borderColor: C.accent, color: C.accent, whiteSpace: "nowrap" }}
                >
                  {savingName ? "..." : "Update Name"}
                </Button>
              </Stack>
              <TextField
                label="Email"
                value={user?.email ?? ""}
                disabled
                size="small"
                sx={inputSx}
                helperText="Email cannot be changed here"
                FormHelperTextProps={{ sx: { color: C.goldMuted } }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Notifications */}
        <Accordion sx={accordSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<NotificationsIcon />} label="Notifications" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {notifKeys.map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={settings.notifications[key]}
                      onChange={e => patch("notifications", { [key]: e.target.checked })}
                      sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: C.accent } }}
                    />
                  }
                  label={<Typography sx={{ color: C.white, fontSize: 14 }}>{label}</Typography>}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Alert Thresholds */}
        <Accordion sx={accordSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<TuneIcon />} label="Alert Thresholds" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ color: C.goldMuted, display: "block", mb: 1 }}>
                  Temperature range (°F) — alert outside this range
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min °F" type="number" size="small"
                    value={settings.thresholds.tempMinF}
                    onChange={e => patch("thresholds", { tempMinF: Number(e.target.value) })}
                    inputProps={{ min: -20, max: 120 }}
                    sx={{ ...inputSx, width: 120 }}
                  />
                  <TextField
                    label="Max °F" type="number" size="small"
                    value={settings.thresholds.tempMaxF}
                    onChange={e => patch("thresholds", { tempMaxF: Number(e.target.value) })}
                    inputProps={{ min: -20, max: 120 }}
                    sx={{ ...inputSx, width: 120 }}
                  />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: C.goldMuted, display: "block", mb: 1 }}>
                  Ammonia thresholds (ppm)
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Warning ppm" type="number" size="small"
                    value={settings.thresholds.ammoniaWarningPpm}
                    onChange={e => patch("thresholds", { ammoniaWarningPpm: Number(e.target.value) })}
                    inputProps={{ min: 1, max: 50 }}
                    sx={{ ...inputSx, width: 140 }}
                  />
                  <TextField
                    label="Critical ppm" type="number" size="small"
                    value={settings.thresholds.ammoniaCriticalPpm}
                    onChange={e => patch("thresholds", { ammoniaCriticalPpm: Number(e.target.value) })}
                    inputProps={{ min: 1, max: 100 }}
                    sx={{ ...inputSx, width: 140 }}
                  />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: C.goldMuted, display: "block", mb: 1 }}>
                  Low-level alerts
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Feed low %" type="number" size="small"
                    value={settings.thresholds.feedLowPct}
                    onChange={e => patch("thresholds", { feedLowPct: Number(e.target.value) })}
                    inputProps={{ min: 5, max: 50 }}
                    sx={{ ...inputSx, width: 130 }}
                  />
                  <TextField
                    label="Water low %" type="number" size="small"
                    value={settings.thresholds.waterLowPct}
                    onChange={e => patch("thresholds", { waterLowPct: Number(e.target.value) })}
                    inputProps={{ min: 5, max: 50 }}
                    sx={{ ...inputSx, width: 130 }}
                  />
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* MQTT Config */}
        <Accordion sx={accordSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<RouterIcon />} label="MQTT Broker" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="info" sx={{ bgcolor: C.accent + "22", color: C.white, fontSize: 12 }}>
                Default: <code>mqtt://localhost:1883</code> (Raspberry Pi on local network). Override only if your Pi has a different IP.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Custom broker URL"
                  placeholder="mqtt://192.168.1.100"
                  value={settings.mqtt.customBrokerUrl}
                  onChange={e => patch("mqtt", { customBrokerUrl: e.target.value })}
                  size="small"
                  sx={{ ...inputSx, flex: 1 }}
                  helperText="Leave blank to use default"
                  FormHelperTextProps={{ sx: { color: C.goldMuted } }}
                />
                <TextField
                  label="Port" type="number"
                  value={settings.mqtt.customPort}
                  onChange={e => patch("mqtt", { customPort: Number(e.target.value) })}
                  size="small"
                  sx={{ ...inputSx, width: 100 }}
                  inputProps={{ min: 1, max: 65535 }}
                />
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* App Preferences */}
        <Accordion sx={accordSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<SettingsIcon />} label="App Preferences" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControl size="small" sx={{ maxWidth: 220 }}>
                <InputLabel sx={{ color: C.goldMuted }}>Temperature Unit</InputLabel>
                <Select
                  value={settings.preferences.temperatureUnit}
                  label="Temperature Unit"
                  onChange={e => patch("preferences", { temperatureUnit: e.target.value as "F" | "C" })}
                  sx={{ color: C.white, ".MuiOutlinedInput-notchedOutline": { borderColor: C.accent } }}
                >
                  <MenuItem value="F">Fahrenheit (°F)</MenuItem>
                  <MenuItem value="C">Celsius (°C)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Timezone"
                value={settings.preferences.timezone}
                onChange={e => patch("preferences", { timezone: e.target.value })}
                size="small"
                sx={{ ...inputSx, maxWidth: 340 }}
                helperText="Used for schedule display and telemetry timestamps"
                FormHelperTextProps={{ sx: { color: C.goldMuted } }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Change Password */}
        <Accordion sx={accordSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<LockIcon />} label="Change Password" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2} sx={{ maxWidth: 400 }}>
              <TextField
                label="Current password" type="password" size="small"
                value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
                sx={inputSx}
              />
              <TextField
                label="New password (8+ characters)" type="password" size="small"
                value={pwNew} onChange={e => setPwNew(e.target.value)}
                sx={inputSx}
              />
              <TextField
                label="Confirm new password" type="password" size="small"
                value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                sx={inputSx}
              />
              <Button
                variant="outlined"
                onClick={savePassword}
                disabled={savingPw || !pwCurrent || !pwNew || !pwConfirm}
                sx={{ borderColor: C.accent, color: C.accent, alignSelf: "flex-start" }}
              >
                {savingPw ? "Updating..." : "Update Password"}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Demo & Developer */}
        <Accordion sx={accordSx} data-testid="demo-panel">
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
            <SectionHeader icon={<ScienceIcon />} label="Demo & Developer" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="info" sx={{ bgcolor: C.accent + "22", color: C.white, fontSize: 12 }}>
                Loads a complete, coherent starter across every product family — structures,
                flocks, eggs, schedules, property-grid placement and equipment sim-state — so you
                can explore the whole app with no hardware. Everything stays local to this browser
                (<code>telemetry_consent: local_only</code>); your own records are never overwritten.
              </Alert>

              {/* Status chip */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: demoSeeded ? C.accent : C.goldMuted }} />
                <Typography data-testid="demo-status" data-seeded={demoSeeded ? "true" : "false"} sx={{ color: C.white, fontSize: 14 }}>
                  {demoSeeded
                    ? `Demo data active${demoAt ? ` — seeded ${new Date(demoAt).toLocaleString()}` : ""}`
                    : "No demo data loaded"}
                </Typography>
              </Stack>

              {/* Actions */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  data-testid="demo-load"
                  variant="contained"
                  onClick={handleDemoSeed}
                  disabled={demoBusy !== ""}
                  startIcon={demoBusy === "seed" ? <CircularProgress size={16} color="inherit" /> : <ScienceIcon />}
                  sx={{ bgcolor: C.accent }}
                >
                  {demoBusy === "seed" ? "Loading..." : demoSeeded ? "Reload Demo" : "Load Demo Environment"}
                </Button>
                <Button
                  data-testid="demo-verify"
                  variant="outlined"
                  onClick={handleDemoVerify}
                  disabled={demoBusy !== ""}
                  startIcon={demoBusy === "verify" ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                  sx={{ borderColor: C.accent, color: C.accent }}
                >
                  {demoBusy === "verify" ? "Verifying..." : "Verify Demo"}
                </Button>
                <Button
                  data-testid="demo-reset"
                  variant="outlined"
                  onClick={() => setDemoResetOpen(true)}
                  disabled={demoBusy !== "" || !demoSeeded}
                  sx={{ borderColor: C.danger, color: C.danger }}
                >
                  {demoBusy === "reset" ? "Resetting..." : "Reset Demo"}
                </Button>
              </Stack>

              {/* Verification report */}
              {demoReport && (
                <Box data-testid="demo-report" data-ok={demoReport.ok ? "true" : "false"} sx={{ border: "1px solid " + C.accent + "44", borderRadius: 1, p: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    {demoReport.ok
                      ? <CheckIcon sx={{ color: C.accent, fontSize: 18 }} />
                      : <WarningIcon sx={{ color: C.danger, fontSize: 18 }} />}
                    <Typography sx={{ color: demoReport.ok ? C.accent : C.danger, fontWeight: 700, fontSize: 13 }}>
                      {demoReport.ok ? "All devices coherent" : "Gaps found"} — {demoReport.devices.length} devices
                    </Typography>
                  </Stack>
                  <Stack spacing={0.75}>
                    {demoReport.devices.map((d) => {
                      const layers: Array<[string, { ok: boolean; detail: string }]> = [
                        ["product", d.product], ["flock", d.flock], ["eggs", d.eggs],
                        ["schedules", d.schedules], ["layout", d.layout], ["equipment", d.equipment],
                      ];
                      const allOk = layers.every(([, l]) => l.ok);
                      return (
                        <Box key={d.deviceId}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            {allOk
                              ? <CheckIcon sx={{ color: C.accent, fontSize: 14 }} />
                              : <CloseIcon sx={{ color: C.danger, fontSize: 14 }} />}
                            <Typography sx={{ color: C.gold, fontSize: 12.5, fontWeight: 600 }}>
                              {d.deviceId} <Box component="span" sx={{ color: C.goldMuted, fontWeight: 400 }}>({d.family})</Box>
                            </Typography>
                          </Stack>
                          <Typography sx={{ color: C.goldMuted, fontSize: 11, pl: 2.5 }}>
                            {layers.map(([name, l]) => `${l.ok ? "✓" : "✗"} ${name}: ${l.detail}`).join("  ·  ")}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Danger Zone */}
        <Accordion sx={{ ...accordSx, border: "1px solid " + C.danger + "44" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.danger + "aa" }} />}>
            <SectionHeader icon={<WarningIcon sx={{ color: C.danger }} />} label="Danger Zone" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="error" sx={{ bgcolor: C.danger + "18", color: C.white }}>
                Permanent and irreversible. All devices, schedules, and data will be deleted.
              </Alert>
              <Button
                variant="outlined"
                onClick={() => setDeleteOpen(true)}
                sx={{ borderColor: C.danger, color: C.danger, alignSelf: "flex-start" }}
              >
                Delete My Account
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Sticky save bar */}
        {dirty && (
          <Paper sx={{ position: "sticky", bottom: 16, bgcolor: C.surface, p: 2, borderRadius: 2, border: "1px solid " + C.accent }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: C.goldMuted }}>You have unsaved changes</Typography>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => { void load(); setDirty(false); }} sx={{ color: C.goldMuted }}>Discard</Button>
                <Button
                  variant="contained"
                  onClick={save}
                  disabled={saving}
                  sx={{ bgcolor: C.accent }}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>

      {/* Delete account dialog */}
      <DangerConfirmDialog
        open={deleteOpen}
        title="Delete Account Permanently"
        onConfirm={deleteAccount}
        onClose={() => setDeleteOpen(false)}
      >
        <Stack spacing={2}>
          <Typography sx={{ color: C.white }}>
            All your data, devices, and schedules will be permanently deleted.
          </Typography>
          <TextField
            label="Enter your password to confirm"
            type="password"
            size="small"
            value={deletePw}
            onChange={e => setDeletePw(e.target.value)}
            sx={inputSx}
          />
        </Stack>
      </DangerConfirmDialog>

      {/* Reset demo confirm dialog */}
      <DangerConfirmDialog
        open={demoResetOpen}
        title="Reset Demo Environment"
        onConfirm={handleDemoReset}
        onClose={() => setDemoResetOpen(false)}
      >
        <Typography sx={{ color: C.white }}>
          Removes only demo-seeded structures, flocks, eggs, schedules, grid placement and
          equipment state. Your own (non-demo) records are left untouched.
        </Typography>
      </DangerConfirmDialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        message={snack?.msg}
        ContentProps={{ sx: { bgcolor: snack?.ok ? C.accent : C.danger, color: C.white } }}
      />
    </Box>
  );
}

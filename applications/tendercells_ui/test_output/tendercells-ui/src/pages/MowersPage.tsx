// MowersPage (/mowers) - "Bring your own robot mower". Link a mower you already own - any
// mower Home Assistant exposes as a lawn_mower entity, or one that speaks the Tender Cells
// MQTT contract - and Tender Cells keeps it off the lawn while animals could be there:
// it refuses to start it, and sends it home, during E-STOP, quiet hours, while a guarded
// coop door is open, or after an animal is seen. The mower keeps its own navigation and
// blade safety. Live: express-api /mowers (lib/mower/mowerApi.ts). Demo: lib/mower/mowerSim.ts.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Grid, LinearProgress, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { DEMO_EVENT, DEMO_SPECS } from "../services/demo/demoEnvironment";
import { useProducts } from "../hooks/useProducts";
import { ACTIVITY_LABEL, DEFAULT_QUIET_HOURS, MOWER_LIVE, hh, type MowerAction, type MowerView } from "../lib/mower/mower";
import * as api from "../lib/mower/mowerApi";
import type { NewMower } from "../lib/mower/mowerApi";
import {
  MOWER_SIM_EVENT, simClearEstop, simCommand, simEstop, simEstopActive, simLink, simMowers, simUnlink, simUpdate,
} from "../lib/mower/mowerSim";
import { deviceTwinId } from "../lib/twin/twin";

const C = {
  bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55",
  danger: "#CC3333", warning: "#E8A020", white: "#F0EDE4",
};
const field = { "& .MuiInputBase-root": { color: C.white }, "& label": { color: C.goldMuted }, "& .MuiFormHelperText-root": { color: C.goldMuted } };

/** Linked mowers: from the hub (live) or the demo simulator, refreshed on every change. */
function useMowers() {
  const [mowers, setMowers] = useState<MowerView[]>([]);
  const [homeAssistant, setHomeAssistant] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!MOWER_LIVE) { setMowers(simMowers()); return; }
    try {
      const r = await api.fetchMowers();
      setMowers(r.mowers); setHomeAssistant(r.homeAssistant); setError(null);
    } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), MOWER_LIVE ? 5_000 : 1_000);
    const on = () => void refresh();
    window.addEventListener(MOWER_SIM_EVENT, on);
    window.addEventListener(DEMO_EVENT, on);
    return () => { clearInterval(t); window.removeEventListener(MOWER_SIM_EVENT, on); window.removeEventListener(DEMO_EVENT, on); };
  }, [refresh]);
  return { mowers, homeAssistant, error, refresh };
}

/** Coops / habitats a mower can guard: demo animal housing, or your registered devices. */
function useHabitatOptions(): { id: string; label: string }[] {
  const { products } = useProducts();
  return useMemo(() => {
    if (!MOWER_LIVE) return DEMO_SPECS.filter((d) => d.animals.length > 0).map((d) => ({ id: d.deviceId, label: `${d.label} (${d.deviceId})` }));
    return products.filter((p) => p.device_id && !p.device_id.startsWith("mw_"))
      .map((p) => ({ id: p.device_id as string, label: `${p.product_name} (${p.device_id})` }));
  }, [products]);
}

function Provenance({ m }: { m: MowerView }) {
  const src = !MOWER_LIVE ? "Tender Cells demo simulator · SIMULATED"
    : m.link.adapter === "home-assistant" ? `Home Assistant ${m.link.entityId ?? ""} · EXTERNAL` : "The mower itself (MQTT) · SENSED";
  return (
    <Typography sx={{ color: C.goldMuted, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
      Twin {deviceTwinId(m.link.deviceId)} · Source: {src}
    </Typography>
  );
}

function MowerCard({ m, onChanged, onEdit }: { m: MowerView; onChanged: () => void; onEdit: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const st = m.state;
  const estop = !MOWER_LIVE && simEstopActive(m.link.deviceId);

  const run = async (action: MowerAction) => {
    setBusy(true); setMsg(null);
    try {
      if (MOWER_LIVE) {
        const r = await api.commandMower(m.link.deviceId, action);
        setMsg({ ok: true, text: r.message ?? `${action === "start" ? "Start" : action === "pause" ? "Pause" : "Return to dock"} sent.` });
      } else {
        simCommand(m.link.deviceId, action);
        setMsg({ ok: true, text: action === "start" ? "Mowing (simulated)." : action === "pause" ? "Paused." : "Returning to dock." });
      }
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false); onChanged();
  };
  const stop = async () => {
    setBusy(true);
    try {
      if (MOWER_LIVE) await api.estopMower(m.link.deviceId); else simEstop(m.link.deviceId);
      setMsg({ ok: true, text: "E-STOP: the mower was told to stop and go home. Its own blade stop is the last line of safety." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false); onChanged();
  };

  const mowing = st?.activity === "mowing";
  return (
    <Paper elevation={0} data-testid={`mower-${m.link.deviceId}`} sx={{ bgcolor: C.surface, border: `1px solid ${mowing ? C.gold : C.accent + "44"}`, borderRadius: 2, p: 2, height: "100%" }}>
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>🚜 {m.link.name}</Typography>
          <Chip size="small" label={m.link.adapter === "home-assistant" ? "Home Assistant" : "Tender Cells MQTT"} sx={{ bgcolor: C.bg, color: C.gold }} />
        </Stack>
        <Provenance m={m} />
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip data-testid="mower-activity" label={st ? ACTIVITY_LABEL[st.activity] : "No data yet"}
            sx={{ bgcolor: mowing ? C.gold : C.bg, color: mowing ? C.bg : C.white, fontWeight: 700 }} />
          <Chip size="small" label={st?.online ? "Online" : "Offline"} sx={{ bgcolor: C.bg, color: st?.online ? C.white : C.warning }} />
          {estop && <Chip size="small" label="E-STOP latched" sx={{ bgcolor: C.danger, color: C.white }} />}
          {typeof st?.battery === "number" && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Battery {st.battery}%</Typography>}
        </Stack>
        {typeof st?.battery === "number" && <LinearProgress variant="determinate" value={st.battery} sx={{ bgcolor: C.bg, "& .MuiLinearProgress-bar": { bgcolor: C.accent } }} />}
        {st?.error && <Alert severity="warning" sx={{ py: 0 }}>{st.error}</Alert>}

        <Box data-testid="mower-interlock" sx={{ bgcolor: C.bg, borderRadius: 1, p: 1.25, border: `1px solid ${m.blocked ? C.warning : C.accent}66` }}>
          <Typography sx={{ color: m.blocked ? C.warning : C.gold, fontWeight: 700, fontSize: 14 }}>
            {m.blocked ? "Not clear to mow" : "✓ Clear to mow"}
          </Typography>
          <Typography sx={{ color: C.white, fontSize: 13 }}>
            {m.blocked ?? `Guarding ${m.link.guardHabitats.length ? m.link.guardHabitats.join(", ") : "no coops (you confirmed no animals roam here)"}`}
          </Typography>
          <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 0.5 }}>
            Quiet hours: {m.link.quietHours ? `${hh(m.link.quietHours.start)}-${hh(m.link.quietHours.end)}` : "off"}
          </Typography>
        </Box>
        {st?.lastInterlock && (
          <Typography data-testid="mower-last-interlock" sx={{ color: C.goldMuted, fontSize: 12 }}>
            {st.lastInterlock.action === "sent-home" ? "Sent home" : "Start refused"} at {new Date(st.lastInterlock.at).toLocaleTimeString()}: {st.lastInterlock.reason}
          </Typography>
        )}
        {msg && <Alert severity={msg.ok ? "success" : "warning"} sx={{ py: 0 }}>{msg.text}</Alert>}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" disabled={busy || !!m.blocked || mowing} onClick={() => setConfirm(true)} sx={{ bgcolor: C.accent, color: C.white }} data-testid="mower-start">Start mowing</Button>
          <Button variant="outlined" disabled={busy} onClick={() => void run("pause")} sx={{ borderColor: C.accent, color: C.gold }}>Pause</Button>
          <Button variant="outlined" disabled={busy} onClick={() => void run("dock")} sx={{ borderColor: C.accent, color: C.gold }}>Return to dock</Button>
          <Button variant="contained" disabled={busy} onClick={() => void stop()} sx={{ bgcolor: C.danger, color: C.white }}>E-STOP</Button>
          {estop && <Button size="small" onClick={() => { simClearEstop(m.link.deviceId); onChanged(); }} sx={{ color: C.goldMuted }}>Clear E-STOP</Button>}
          <Button size="small" onClick={onEdit} sx={{ color: C.goldMuted, ml: "auto !important" }}>Settings</Button>
        </Stack>
      </Stack>

      <Dialog open={confirm} onClose={() => setConfirm(false)} PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
        <DialogTitle sx={{ color: C.gold }}>Start {m.link.name}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>This will activate hardware: the mower leaves its dock and mows with its own map and boundary.</Typography>
          <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>
            Tender Cells will send it home by itself if a guarded coop door opens, an animal is seen, quiet hours begin or
            E-STOP is pressed. Look at the lawn first - pets, children and toys are yours to check.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)} sx={{ color: C.goldMuted }}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConfirm(false); void run("start"); }} sx={{ bgcolor: C.accent }} data-testid="mower-confirm-start">Start mowing</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

const EMPTY: NewMower = { name: "", adapter: "home-assistant", entityId: "", guardHabitats: [], noAnimalsConfirmed: false, quietHours: DEFAULT_QUIET_HOURS };

/** Link a new mower, or change an existing one's settings. */
function MowerDialog({ open, editing, onClose, onSaved, homeAssistant }: {
  open: boolean; editing: MowerView | null; onClose: () => void; onSaved: () => void; homeAssistant: boolean | null;
}) {
  const habitats = useHabitatOptions();
  const [form, setForm] = useState<NewMower>(EMPTY);
  const [entities, setEntities] = useState<{ entityId: string; name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setForm(editing ? { ...EMPTY, ...editing.link } : EMPTY);
    if (MOWER_LIVE && homeAssistant) api.fetchHaMowerEntities().then((r) => setEntities(r.entities)).catch(() => setEntities([]));
  }, [open, editing, homeAssistant]);

  const set = (patch: Partial<NewMower>) => setForm((f) => ({ ...f, ...patch }));
  const quiet = form.quietHours;
  const guardOk = form.guardHabitats.length > 0 || form.noAnimalsConfirmed;
  const valid = form.name.trim() && guardOk && (form.adapter !== "home-assistant" || /^lawn_mower\.[a-z0-9_]+$/.test(form.entityId ?? ""));

  const save = async () => {
    setSaving(true); setErr(null);
    const body: NewMower = { ...form, name: form.name.trim(), entityId: form.adapter === "home-assistant" ? form.entityId : undefined,
      batteryEntityId: form.batteryEntityId || undefined };
    try {
      if (editing) {
        if (MOWER_LIVE) await api.updateMower(editing.link.deviceId, body); else simUpdate(editing.link.deviceId, body);
      } else if (MOWER_LIVE) await api.linkMower(body); else simLink(body);
      onSaved(); onClose();
    } catch (e) { setErr((e as Error).message); }
    setSaving(false);
  };
  const unlink = async () => {
    if (!editing) return;
    try { if (MOWER_LIVE) await api.unlinkMower(editing.link.deviceId); else simUnlink(editing.link.deviceId); onSaved(); onClose(); }
    catch (e) { setErr((e as Error).message); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
      <DialogTitle sx={{ color: C.gold }}>{editing ? `Settings: ${editing.link.name}` : "Link your robot mower"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => set({ name: e.target.value })} sx={field} inputProps={{ maxLength: 60 }} placeholder="Front lawn mower" />
          {!editing && (
            <TextField select label="How it connects" value={form.adapter} onChange={(e) => set({ adapter: e.target.value as NewMower["adapter"] })} sx={field}
              helperText={form.adapter === "home-assistant"
                ? "Any mower Home Assistant controls as a lawn_mower entity. The hub talks to Home Assistant; your token stays on the hub."
                : "A DIY or bridged mower that speaks the Tender Cells contract: tc/{id}/cmd/mower, tc/{id}/ack, tc/{id}/state/mower."}>
              <MenuItem value="home-assistant">Home Assistant (lawn_mower entity)</MenuItem>
              <MenuItem value="mqtt">Tender Cells MQTT (DIY / bridge)</MenuItem>
            </TextField>
          )}
          {form.adapter === "home-assistant" && (
            <>
              {MOWER_LIVE && homeAssistant === false && (
                <Alert severity="info">Home Assistant is not set up on your hub yet: set HA_URL and HA_TOKEN in the hub's environment, then restart it.</Alert>
              )}
              <Autocomplete freeSolo options={entities.map((e) => e.entityId)} value={form.entityId ?? ""}
                onInputChange={(_, v) => set({ entityId: v.trim() })}
                getOptionLabel={(o) => { const e = entities.find((x) => x.entityId === o); return e ? `${e.name} (${o})` : o; }}
                renderInput={(p) => <TextField {...p} label="Mower entity" placeholder="lawn_mower.front_yard" sx={field} helperText="From Home Assistant: Settings - Devices & services - Entities" />} />
              <TextField label="Battery sensor (optional)" value={form.batteryEntityId ?? ""} onChange={(e) => set({ batteryEntityId: e.target.value.trim() })}
                placeholder="sensor.front_yard_battery" sx={field} />
            </>
          )}
          <Autocomplete multiple freeSolo options={habitats.map((h) => h.id)} value={form.guardHabitats}
            onChange={(_, v) => set({ guardHabitats: (v as string[]).map((s) => s.trim()).filter(Boolean) })}
            getOptionLabel={(o) => habitats.find((h) => h.id === o)?.label ?? o}
            renderInput={(p) => <TextField {...p} label="Coops whose animals can reach this lawn" sx={field}
              helperText="The mower may only run while every one of these has its door closed (animals inside)." />} />
          <FormControlLabel sx={{ color: C.white }}
            control={<Checkbox checked={form.noAnimalsConfirmed} onChange={(e) => set({ noAnimalsConfirmed: e.target.checked })} sx={{ color: C.gold }} />}
            label="No animals ever roam where this mower works" />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControlLabel sx={{ color: C.white, mr: 0 }}
              control={<Checkbox checked={!!quiet} onChange={(e) => set({ quietHours: e.target.checked ? DEFAULT_QUIET_HOURS : null })} sx={{ color: C.gold }} />}
              label="Quiet hours" />
            {quiet && (
              <>
                <TextField type="number" label="From" value={quiet.start} onChange={(e) => set({ quietHours: { ...quiet, start: Math.max(0, Math.min(23, Number(e.target.value))) } })} sx={{ ...field, width: 90 }} />
                <TextField type="number" label="Until" value={quiet.end} onChange={(e) => set({ quietHours: { ...quiet, end: Math.max(0, Math.min(23, Number(e.target.value))) } })} sx={{ ...field, width: 90 }} />
              </>
            )}
          </Stack>
          <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
            Night mowing kills hedgehogs, toads and other wildlife - quiet hours are on by default.
          </Typography>
          {!guardOk && <Alert severity="warning">Pick at least one coop, or confirm no animals ever roam where it mows.</Alert>}
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {editing && <Button onClick={() => void unlink()} sx={{ color: C.danger, mr: "auto" }}>Unlink</Button>}
        <Button onClick={onClose} sx={{ color: C.goldMuted }}>Cancel</Button>
        <Button variant="contained" disabled={!valid || saving} onClick={() => void save()} sx={{ bgcolor: C.accent }} data-testid="mower-save">
          {editing ? "Save" : "Link mower"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MowersPage() {
  const navigate = useNavigate();
  const { mowers, homeAssistant, error, refresh } = useMowers();
  const [dialog, setDialog] = useState<{ open: boolean; editing: MowerView | null }>({ open: false, editing: null });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: C.white }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="h4" sx={{ color: C.gold, fontWeight: 800 }}>Robot Mowers</Typography>
          <Typography sx={{ maxWidth: 820 }}>
            Bring the robot mower you already own. It keeps mowing with its own map, boundary and blade safety; Tender Cells
            adds what it cannot know - whether your animals are out on the lawn - and keeps it docked until they are in.
          </Typography>
          {!MOWER_LIVE && <Typography variant="caption" sx={{ color: C.goldMuted }}>Simulation: these mowers are simulated in this browser; nothing is sent to real hardware.</Typography>}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Button variant="contained" onClick={() => setDialog({ open: true, editing: null })} sx={{ bgcolor: C.gold, color: C.bg, fontWeight: 700 }} data-testid="mower-link">Link a mower</Button>
          <Button variant="outlined" onClick={() => navigate("/layout")} sx={{ borderColor: C.accent, color: C.gold }}>Place on Property Twin</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>Could not reach your hub: {error}</Alert>}

      <Grid container spacing={1.5}>
        {mowers.map((m) => (
          <Grid item xs={12} md={6} lg={4} key={m.link.deviceId}>
            <MowerCard m={m} onChanged={() => void refresh()} onEdit={() => setDialog({ open: true, editing: m })} />
          </Grid>
        ))}
        {!mowers.length && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ bgcolor: C.surface, p: 2, border: `1px dashed ${C.accent}` }}>
              <Typography sx={{ color: C.goldMuted }}>No mowers linked yet. Press "Link a mower" to add yours.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>What Tender Cells adds to your mower</Typography>
        <Grid container spacing={1.5}>
          {[
            ["Flock-out lock", "It will not start - and is sent home - while any guarded coop door is open or the door state is unknown or out of date."],
            ["Animal seen", "If a rover or camera saw an animal on the property in the last 15 minutes, it waits."],
            ["Wildlife quiet hours", "No mowing at night by default (20:00-07:00), when hedgehogs and toads are out."],
            ["E-STOP", "Stops the mower and sends it home. It cannot cut a third-party mower's power - its own lift and tilt blade stops stay the last line of safety."],
          ].map(([t, d]) => (
            <Grid item xs={12} sm={6} md={3} key={t}>
              <Typography sx={{ color: C.white, fontWeight: 700 }}>{t}</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{d}</Typography>
            </Grid>
          ))}
        </Grid>
        <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 1.5 }}>
          Works with any mower Home Assistant controls as a lawn_mower entity - Husqvarna Automower has a built-in Home Assistant
          integration; other brands and OpenMower have community integrations (check yours). DIY mowers can speak the Tender Cells
          MQTT contract directly. Set-up: <a href="/docs/robot-mowers" style={{ color: C.gold }}>Robot mowers guide</a>.
          Native mowers can take the same retained exclusion zones as other robots (tc/{"{id}"}/cfg/zones); for Home Assistant mowers, draw the matching no-go areas in the mower's own app.
        </Typography>
      </Paper>

      <MowerDialog open={dialog.open} editing={dialog.editing} homeAssistant={homeAssistant}
        onClose={() => setDialog({ open: false, editing: null })} onSaved={() => void refresh()} />
    </Box>
  );
}

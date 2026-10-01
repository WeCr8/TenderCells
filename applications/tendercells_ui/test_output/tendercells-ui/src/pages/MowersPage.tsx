// MowersPage (/mowers) - "Bring your own robot mower". Pick your mower brand, link it (official
// vendor APIs for Husqvarna, GARDENA and Mammotion; Home Assistant for Navimow, GOAT, Worx and
// others; MQTT for DIY / OpenMower), then run it from here: basic or advanced mowing (patterns
// where the connection supports them), park modes, resume schedule, cutting height, headlight,
// schedule, stay-out zones. Tender Cells keeps it off the lawn while animals could be there:
// start is refused - and a mowing mower is sent home and held - during E-STOP, quiet hours,
// while a guarded coop door is open, or after an animal is seen. The mower keeps its own
// navigation and blade safety. Live: express-api /mowers (lib/mower/mowerApi.ts). Demo:
// lib/mower/mowerSim.ts.
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackDemo } from "../lib/demo/track";
import { useNavigate } from "react-router-dom";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, Grid, LinearProgress, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DEMO_EVENT, DEMO_SPECS } from "../services/demo/demoEnvironment";
import { useProducts } from "../hooks/useProducts";
import {
  ACTIVITY_LABEL, DEFAULT_QUIET_HOURS, MOWER_LIVE, capsOf, hh,
  type MowerAction, type MowerAdapter, type MowerSettingsPatch, type MowerView, type StartOptions,
} from "../lib/mower/mower";
import * as api from "../lib/mower/mowerApi";
import type { NewMower, VendorStatus } from "../lib/mower/mowerApi";
import { MOWER_BRANDS, TRUST_HINT, type MowerBrand, type Trust } from "../lib/mower/brands";
import { PATTERN_INFO } from "../lib/mower/patterns";
import {
  MOWER_SIM_EVENT, simClearEstop, simCommand, simEstop, simEstopActive, simLink, simMowers, simSettings, simUnlink, simUpdate,
} from "../lib/mower/mowerSim";
import { deviceTwinId } from "../lib/twin/twin";
import MowDialog from "../components/mowers/MowDialog";
import MowerSettingsPanel from "../components/mowers/MowerSettingsPanel";

const C = {
  bg: "#0D2B1E", surface: "#1A3D2B", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55",
  danger: "#CC3333", warning: "#E8A020", white: "#F0EDE4",
};
const field = { "& .MuiInputBase-root": { color: C.white }, "& label": { color: C.goldMuted }, "& .MuiFormHelperText-root": { color: C.goldMuted } };
const TRUST_COLOR: Record<Trust, string> = { OFFICIAL: C.accent, PARTNER: "#5B8DB8", COMMUNITY: C.warning, OPEN: C.gold };
const CONNECTION_LABEL: Record<MowerAdapter, string> = {
  husqvarna: "Husqvarna API", gardena: "GARDENA API", mammotion: "Mammotion API", "home-assistant": "Home Assistant", mqtt: "Tender Cells MQTT",
};
const ACTION_LABEL: Record<MowerAction, string> = {
  start: "Start", resume_schedule: "Resume schedule", pause: "Pause", park_until_next_schedule: "Park until next schedule", dock: "Return to dock",
};

/** Linked mowers: from the hub (live) or the demo simulator, refreshed on every change. */
function useMowers() {
  const [mowers, setMowers] = useState<MowerView[]>([]);
  const [vendors, setVendors] = useState<VendorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!MOWER_LIVE) { setMowers(simMowers()); return; }
    try {
      const r = await api.fetchMowers();
      setMowers(r.mowers); setVendors({ homeAssistant: r.homeAssistant, husqvarna: r.husqvarna, gardena: r.gardena, mammotion: r.mammotion }); setError(null);
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
  return { mowers, vendors, error, refresh };
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
    : m.link.adapter === "mqtt" ? "The mower itself (MQTT) · SENSED"
    : m.link.adapter === "home-assistant" ? `Home Assistant ${m.link.entityId ?? ""} · EXTERNAL`
    : `${CONNECTION_LABEL[m.link.adapter]} · EXTERNAL`;
  return (
    <Typography sx={{ color: C.goldMuted, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
      Twin {deviceTwinId(m.link.deviceId)} · Source: {src}
    </Typography>
  );
}

/** One line describing the last run's plan (native / simulated mowers). */
function planSummary(p: StartOptions | undefined): string | null {
  if (!p || !Object.keys(p).length) return null;
  const bits = [
    p.pattern ? PATTERN_INFO[p.pattern].label : null,
    p.angleDeg !== undefined ? `${p.angleDeg}°` : null,
    p.edgePasses ? `${p.edgePasses} edge pass${p.edgePasses > 1 ? "es" : ""}` : null,
    p.cuttingHeightMm ? `${p.cuttingHeightMm} mm` : null,
    p.workAreaId !== undefined ? `work area ${p.workAreaId}` : null,
    p.vendorTask ? `plan "${p.vendorTask}"` : null,
    p.durationMin ? `${p.durationMin} min` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}

function MowerCard({ m, onChanged, onEdit }: { m: MowerView; onChanged: () => void; onEdit: () => void }) {
  const [mowOpen, setMowOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const st = m.state;
  const caps = capsOf(m);
  const estop = !MOWER_LIVE && simEstopActive(m.link.deviceId);

  const run = async (action: MowerAction, opts: StartOptions = {}) => {
    setBusy(true); setMsg(null);
    try {
      if (MOWER_LIVE) {
        const r = await api.commandMower(m.link.deviceId, action, opts);
        setMsg({ ok: true, text: r.message ?? `${ACTION_LABEL[action]} sent.` });
      } else {
        simCommand(m.link.deviceId, action, opts);
        setMsg({ ok: true, text: `${ACTION_LABEL[action]} (simulated).` });
      }
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false); onChanged();
  };
  const settings = async (patch: MowerSettingsPatch) => {
    try {
      if (MOWER_LIVE) await api.updateMowerSettings(m.link.deviceId, patch); else simSettings(m.link.deviceId, patch);
      setMsg({ ok: true, text: "Saved on the mower." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    onChanged();
  };
  const stop = async () => {
    setBusy(true);
    try {
      if (MOWER_LIVE) await api.estopMower(m.link.deviceId); else simEstop(m.link.deviceId);
      setMsg({ ok: true, text: "E-STOP: the mower was told to stop and go home. Its own blade stop is the last line of safety." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false); onChanged();
  };

  const out = st?.activity === "mowing" || st?.activity === "leaving";
  const has = (a: MowerAction) => caps.actions.includes(a);
  const plan = planSummary(st?.plan);
  return (
    <Paper elevation={0} data-testid={`mower-${m.link.deviceId}`} sx={{ bgcolor: C.surface, border: `1px solid ${out ? C.gold : C.accent + "44"}`, borderRadius: 2, p: 2, height: "100%" }}>
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>🚜 {m.link.name}</Typography>
          <Chip size="small" label={CONNECTION_LABEL[m.link.adapter]} sx={{ bgcolor: C.bg, color: C.gold }} />
        </Stack>
        <Provenance m={m} />
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip data-testid="mower-activity" label={st ? ACTIVITY_LABEL[st.activity] : "No data yet"}
            sx={{ bgcolor: out ? C.gold : C.bg, color: out ? C.bg : C.white, fontWeight: 700 }} />
          <Chip size="small" label={st?.online ? "Online" : "Offline"} sx={{ bgcolor: C.bg, color: st?.online ? C.white : C.warning }} />
          {st?.held && <Chip size="small" data-testid="mower-held" label="Held at home by Tender Cells" sx={{ bgcolor: `${C.warning}33`, color: C.warning }} />}
          {estop && <Chip size="small" label="E-STOP latched" sx={{ bgcolor: C.danger, color: C.white }} />}
          {typeof st?.battery === "number" && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Battery {st.battery}%</Typography>}
        </Stack>
        {typeof st?.battery === "number" && <LinearProgress variant="determinate" value={st.battery} sx={{ bgcolor: C.bg, "& .MuiLinearProgress-bar": { bgcolor: C.accent } }} />}
        {plan && <Typography data-testid="mower-plan" sx={{ color: C.white, fontSize: 13 }}>Last run: {plan}</Typography>}
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
            {" · "}Auto-resume: {m.link.autoResume ? "on" : "off"}
          </Typography>
        </Box>
        {st?.lastInterlock && (
          <Typography data-testid="mower-last-interlock" sx={{ color: C.goldMuted, fontSize: 12 }}>
            {{ "sent-home": "Sent home", held: "Held at home", refused: "Start refused", resumed: "Resumed" }[st.lastInterlock.action]} at{" "}
            {new Date(st.lastInterlock.at).toLocaleTimeString()}: {st.lastInterlock.reason}
          </Typography>
        )}
        {msg && <Alert severity={msg.ok ? "success" : "warning"} sx={{ py: 0 }}>{msg.text}</Alert>}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" disabled={busy || !!m.blocked || out} onClick={() => setMowOpen(true)} sx={{ bgcolor: C.accent, color: C.white }} data-testid="mower-start">Mow now…</Button>
          {has("resume_schedule") && <Button variant="outlined" disabled={busy || !!m.blocked} onClick={() => void run("resume_schedule")} sx={{ borderColor: C.accent, color: C.gold }}>Resume schedule</Button>}
          {has("pause") && <Button variant="outlined" disabled={busy} onClick={() => void run("pause")} sx={{ borderColor: C.accent, color: C.gold }}>Pause</Button>}
          {has("park_until_next_schedule") && <Button variant="outlined" disabled={busy} onClick={() => void run("park_until_next_schedule")} sx={{ borderColor: C.accent, color: C.gold }}>Park until next schedule</Button>}
          <Button variant="outlined" disabled={busy} onClick={() => void run("dock")} sx={{ borderColor: C.accent, color: C.gold }}>Return to dock</Button>
          <Button variant="contained" disabled={busy} onClick={() => void stop()} sx={{ bgcolor: C.danger, color: C.white }}>E-STOP</Button>
          {estop && <Button size="small" onClick={() => { simClearEstop(m.link.deviceId); onChanged(); }} sx={{ color: C.goldMuted }}>Clear E-STOP</Button>}
          <Button size="small" onClick={onEdit} sx={{ color: C.goldMuted, ml: "auto !important" }}>Link settings</Button>
        </Stack>

        {st?.details && (
          <Accordion disableGutters sx={{ bgcolor: C.bg, color: C.white, "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.gold }} />} data-testid="mower-settings-toggle">
              <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>Mower settings (same as its own app)</Typography>
            </AccordionSummary>
            <AccordionDetails><MowerSettingsPanel m={m} onSettings={(p) => void settings(p)} /></AccordionDetails>
          </Accordion>
        )}
      </Stack>

      <MowDialog open={mowOpen} m={m} onClose={() => setMowOpen(false)} onStart={(opts) => { setMowOpen(false); void run("start", opts); }} />
    </Paper>
  );
}

const EMPTY: NewMower = { name: "", adapter: "home-assistant", entityId: "", guardHabitats: [], noAnimalsConfirmed: false, quietHours: DEFAULT_QUIET_HOURS, autoResume: false };
const VENDOR_CONFIGURED: Partial<Record<MowerAdapter, keyof VendorStatus>> = {
  "home-assistant": "homeAssistant", husqvarna: "husqvarna", gardena: "gardena", mammotion: "mammotion",
};
const HUB_ENV: Partial<Record<MowerAdapter, string>> = {
  "home-assistant": "HA_URL and HA_TOKEN", husqvarna: "HUSQVARNA_APP_KEY and HUSQVARNA_APP_SECRET",
  gardena: "HUSQVARNA_APP_KEY and HUSQVARNA_APP_SECRET", mammotion: "MAMMOTION_CLIENT_ID and MAMMOTION_CLIENT_SECRET",
};

function BrandPicker({ onPick }: { onPick: (b: MowerBrand) => void }) {
  return (
    <Grid container spacing={1}>
      {MOWER_BRANDS.map((b) => (
        <Grid item xs={12} sm={6} key={b.id}>
          <Paper elevation={0} onClick={() => onPick(b)} role="button" tabIndex={0} data-testid={`brand-${b.id}`}
            onKeyDown={(e) => { if (e.key === "Enter") onPick(b); }}
            sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}55`, p: 1.25, cursor: "pointer", height: "100%", "&:hover": { borderColor: C.gold } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography sx={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{b.name}</Typography>
              <Chip size="small" label={b.trust} title={TRUST_HINT[b.trust]} sx={{ bgcolor: `${TRUST_COLOR[b.trust]}33`, color: TRUST_COLOR[b.trust], fontWeight: 700, fontSize: 10 }} />
            </Stack>
            {b.app !== "-" && <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>App: {b.app}</Typography>}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

/** Link a new mower (brand first), or change an existing link's settings. */
function MowerDialog({ open, editing, onClose, onSaved, vendors }: {
  open: boolean; editing: MowerView | null; onClose: () => void; onSaved: () => void; vendors: VendorStatus | null;
}) {
  const habitats = useHabitatOptions();
  const [brand, setBrand] = useState<MowerBrand | null>(null);
  const [form, setForm] = useState<NewMower>(EMPTY);
  const [found, setFound] = useState<{ id: string; name: string; locationId?: string; detail?: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null); setFound([]);
    setBrand(null);
    setForm(editing ? { ...EMPTY, ...editing.link } : EMPTY);
  }, [open, editing]);

  const set = (patch: Partial<NewMower>) => setForm((f) => ({ ...f, ...patch }));
  const adapter = form.adapter;
  const configured = !MOWER_LIVE || !VENDOR_CONFIGURED[adapter] || vendors?.[VENDOR_CONFIGURED[adapter]!] !== false;

  useEffect(() => {
    if (!open || editing || !brand || !MOWER_LIVE || !VENDOR_CONFIGURED[adapter] || !configured) return;
    api.discoverMowers(adapter as api.Vendor).then((r) => setFound(r.mowers)).catch((e) => setErr((e as Error).message));
  }, [open, editing, brand, adapter, configured]);

  const pickBrand = (b: MowerBrand) => {
    setBrand(b);
    // The demo has no vendor accounts: vendor mowers get a simulated id.
    set({ adapter: b.adapter, name: b.id === "other-ha" || b.id === "diy" ? "" : b.name,
      ...(MOWER_LIVE || b.adapter === "home-assistant" || b.adapter === "mqtt" ? {} : { vendorId: `demo-${b.id}` }) });
  };
  const quiet = form.quietHours;
  const guardOk = form.guardHabitats.length > 0 || form.noAnimalsConfirmed;
  const pickedOk = adapter === "mqtt" || (adapter === "home-assistant" ? /^lawn_mower\.[a-z0-9_]+$/.test(form.entityId ?? "") : !!form.vendorId);
  const valid = !!form.name.trim() && guardOk && (editing || pickedOk);

  const save = async () => {
    setSaving(true); setErr(null);
    const body: NewMower = { ...form, name: form.name.trim(),
      entityId: adapter === "home-assistant" ? form.entityId : undefined, batteryEntityId: form.batteryEntityId || undefined };
    try {
      if (editing) {
        const { name, guardHabitats, noAnimalsConfirmed, quietHours, autoResume } = body;
        const patch = { name, guardHabitats, noAnimalsConfirmed, quietHours, autoResume };
        if (MOWER_LIVE) await api.updateMower(editing.link.deviceId, patch); else simUpdate(editing.link.deviceId, patch);
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

  const showForm = !!editing || !!brand;
  const canResume = (editing ? capsOf(editing) : undefined)?.actions.includes("resume_schedule") ?? adapter !== "home-assistant";
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
      <DialogTitle sx={{ color: C.gold }}>
        {editing ? `Link settings: ${editing.link.name}` : brand ? `Link: ${brand.name}` : "Which mower do you have?"}
      </DialogTitle>
      <DialogContent>
        {!showForm && (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <BrandPicker onPick={pickBrand} />
            <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
              OFFICIAL = the vendor's API with your own keys. PARTNER = vendor-made Home Assistant integration. COMMUNITY = community
              integration the vendor does not support. OPEN = open-source hardware on your network.
            </Typography>
          </Stack>
        )}
        {showForm && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {brand && (
              <Alert severity={brand.trust === "COMMUNITY" ? "warning" : "info"} sx={{ py: 0.5 }}>
                <strong>{brand.trust}</strong> - {brand.note}
              </Alert>
            )}
            {!editing && MOWER_LIVE && !configured && (
              <Alert severity="info">This connection is not set up on your hub yet: set {HUB_ENV[adapter]} in the hub's environment, then restart it. <a href="/docs/robot-mowers" style={{ color: C.gold }}>How</a></Alert>
            )}
            <TextField label="Name" value={form.name} onChange={(e) => set({ name: e.target.value })} sx={field} inputProps={{ maxLength: 60 }} placeholder="Front lawn mower" />
            {!editing && adapter === "home-assistant" && (
              <>
                <Autocomplete freeSolo options={found.map((e) => e.id)} value={form.entityId ?? ""}
                  onInputChange={(_, v) => set({ entityId: v.trim() })}
                  getOptionLabel={(o) => { const e = found.find((x) => x.id === o); return e ? `${e.name} (${o})` : o; }}
                  renderInput={(p) => <TextField {...p} label="Mower entity" placeholder="lawn_mower.front_yard" sx={field} helperText="From Home Assistant: Settings - Devices & services - Entities" />} />
                <TextField label="Battery sensor (optional)" value={form.batteryEntityId ?? ""} onChange={(e) => set({ batteryEntityId: e.target.value.trim() })}
                  placeholder="sensor.front_yard_battery" sx={field} />
              </>
            )}
            {!editing && MOWER_LIVE && (adapter === "husqvarna" || adapter === "gardena" || adapter === "mammotion") && (
              <TextField select label="Mower on your account" value={form.vendorId ?? ""} sx={field} data-testid="vendor-mower"
                onChange={(e) => { const f = found.find((x) => x.id === e.target.value); set({ vendorId: e.target.value, locationId: f?.locationId, name: form.name || f?.name || "" }); }}
                helperText={found.length ? "" : "Looking for mowers on your account…"}>
                {found.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}{f.detail ? ` · ${f.detail}` : ""}</MenuItem>)}
              </TextField>
            )}
            {!editing && adapter === "mqtt" && (
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
                After linking, the hub shows the mower's id (mw_…). Your mower subscribes to tc/{"{id}"}/cmd/mower, replies on tc/{"{id}"}/ack
                and publishes tc/{"{id}"}/state/mower - see the guide.
              </Typography>
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
            <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Night mowing kills hedgehogs, toads and other wildlife - quiet hours are on by default.</Typography>
            {canResume && (
              <FormControlLabel sx={{ color: C.white }}
                control={<Checkbox checked={!!form.autoResume} onChange={(e) => set({ autoResume: e.target.checked })} sx={{ color: C.gold }} />}
                label="When the animals are back in, put the mower back on its own schedule (auto-resume)" />
            )}
            {!guardOk && <Alert severity="warning">Pick at least one coop, or confirm no animals ever roam where it mows.</Alert>}
            {err && <Alert severity="error">{err}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {editing && <Button onClick={() => void unlink()} sx={{ color: C.danger, mr: "auto" }}>Unlink</Button>}
        {!editing && brand && <Button onClick={() => setBrand(null)} sx={{ color: C.goldMuted, mr: "auto" }}>Back</Button>}
        <Button onClick={onClose} sx={{ color: C.goldMuted }}>Cancel</Button>
        {showForm && (
          <Button variant="contained" disabled={!valid || saving} onClick={() => void save()} sx={{ bgcolor: C.accent }} data-testid="mower-save">
            {editing ? "Save" : "Link mower"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function MowersPage() {
  const navigate = useNavigate();
  const { mowers, vendors, error, refresh } = useMowers();
  useEffect(() => { trackDemo("mower_viewed"); }, []);
  const [dialog, setDialog] = useState<{ open: boolean; editing: MowerView | null }>({ open: false, editing: null });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: C.white }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="h4" sx={{ color: C.gold, fontWeight: 800 }}>Robot Mowers</Typography>
          <Typography sx={{ maxWidth: 860 }}>
            Bring the robot mower you already own and run it from here - mow now, patterns where your mower supports them, park,
            schedule, cutting height and more. It keeps its own map, boundary and blade safety; Tender Cells adds what it cannot
            know - whether your animals are out on the lawn - and holds it at home until they are in.
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
          <Grid item xs={12} lg={6} key={m.link.deviceId}>
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
        <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>What each mower can do here</Typography>
        <Grid container spacing={1}>
          {MOWER_BRANDS.filter((b) => b.id !== "other-ha").map((b) => (
            <Grid item xs={12} md={6} key={b.id}>
              <Typography sx={{ fontSize: 13 }}>
                <strong style={{ color: C.white }}>{b.name}</strong>{" "}
                <span style={{ color: TRUST_COLOR[b.trust], fontWeight: 700, fontSize: 11 }}>{b.trust}</span>
                <span style={{ color: C.goldMuted }}> - {b.note}</span>
              </Typography>
            </Grid>
          ))}
        </Grid>
        <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 1.5 }}>
          Safety: start and resume are refused - and a mowing mower is sent home and held - while a guarded coop door is open or unknown,
          an animal was seen in the last 15 minutes, during quiet hours (default {hh(DEFAULT_QUIET_HOURS.start)}-{hh(DEFAULT_QUIET_HOURS.end)})
          or E-STOP. Tender Cells cannot cut a third-party mower's power: its own lift, tilt and stop-button blade cut-offs stay the last
          line of safety. Set-up: <a href="/docs/robot-mowers" style={{ color: C.gold }}>Robot mowers guide</a>.
        </Typography>
      </Paper>

      <MowerDialog open={dialog.open} editing={dialog.editing} vendors={vendors}
        onClose={() => setDialog({ open: false, editing: null })} onSaved={() => void refresh()} />
    </Box>
  );
}

// MowerSettingsPanel - the mower's own-app settings, shown only where its connection can change
// them (capabilities): cutting height, headlight, weekly schedule, stay-out zones, work areas,
// error confirm, GPS position and next start. None of these move the mower.
import { useState } from "react";
import {
  Box, Button, Checkbox, Chip, IconButton, MenuItem, Slider, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DAYS, HEADLIGHT_LABEL, capsOf, type HeadlightMode, type MowerSettingsPatch, type MowerView, type ScheduleTask } from "../../lib/mower/mower";

const C = { bg: "#0D2B1E", accent: "#4A7C59", gold: "#C8B882", goldMuted: "#8A7D55", white: "#F0EDE4", warning: "#E8A020" };
const field = { "& .MuiInputBase-root": { color: C.white }, "& label": { color: C.goldMuted } };
const hm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (v: string) => { const [h, m] = v.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

function ScheduleEditor({ tasks, editable, onSave }: { tasks: ScheduleTask[]; editable: boolean; onSave: (t: ScheduleTask[]) => void }) {
  const [draft, setDraft] = useState<ScheduleTask[]>(tasks);
  const dirty = JSON.stringify(draft) !== JSON.stringify(tasks);
  const set = (i: number, patch: Partial<ScheduleTask>) => setDraft((d) => d.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <Stack spacing={1}>
      {draft.map((t, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap data-testid="schedule-task">
          <TextField type="time" size="small" label="From" value={hm(t.start)} disabled={!editable} sx={{ ...field, width: 110 }}
            onChange={(e) => set(i, { start: toMin(e.target.value) })} />
          <TextField type="number" size="small" label="Minutes" value={t.duration} disabled={!editable} sx={{ ...field, width: 100 }}
            onChange={(e) => set(i, { duration: Math.max(1, Math.min(1440 - t.start, Number(e.target.value) || 1)) })} />
          {DAYS.map((d) => (
            <Tooltip key={d} title={d}>
              <Checkbox size="small" checked={t[d]} disabled={!editable} onChange={(e) => set(i, { [d]: e.target.checked } as Partial<ScheduleTask>)}
                icon={<Box sx={dayBox(false)}>{d[0].toUpperCase()}</Box>} checkedIcon={<Box sx={dayBox(true)}>{d[0].toUpperCase()}</Box>} sx={{ p: 0.25 }} />
            </Tooltip>
          ))}
          {editable && <IconButton size="small" aria-label="Remove" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))} sx={{ color: C.goldMuted }}><DeleteOutlineIcon fontSize="small" /></IconButton>}
        </Stack>
      ))}
      {!draft.length && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>No scheduled mowing.</Typography>}
      {editable && (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setDraft((d) => [...d, { start: 540, duration: 120, monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false }])}
            sx={{ color: C.gold }}>Add time</Button>
          <Button size="small" variant="outlined" disabled={!dirty || draft.some((t) => !DAYS.some((d) => t[d]))} onClick={() => onSave(draft)}
            sx={{ borderColor: C.accent, color: C.gold }} data-testid="schedule-save">Save schedule</Button>
        </Stack>
      )}
    </Stack>
  );
}

const dayBox = (on: boolean) => ({
  width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700,
  bgcolor: on ? C.accent : "transparent", color: on ? C.white : C.goldMuted, border: `1px solid ${C.accent}`,
});

export default function MowerSettingsPanel({ m, onSettings }: { m: MowerView; onSettings: (p: MowerSettingsPatch) => void }) {
  const caps = capsOf(m);
  const d = m.state?.details;
  const [height, setHeight] = useState<number | null>(null);
  if (!d) return <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>This connection reports no extra settings.</Typography>;
  return (
    <Stack spacing={2}>
      {caps.cuttingHeight && d.cuttingHeight !== undefined && (
        <Box>
          <Typography sx={{ fontSize: 13 }}>Cutting height: level {height ?? d.cuttingHeight} (of {caps.cuttingHeight.max})</Typography>
          <Slider value={height ?? d.cuttingHeight} min={caps.cuttingHeight.min} max={caps.cuttingHeight.max} step={1} marks
            onChange={(_, v) => setHeight(v as number)} onChangeCommitted={(_, v) => { onSettings({ cuttingHeight: v as number }); setHeight(null); }}
            sx={{ color: C.gold, maxWidth: 320 }} aria-label="Cutting height" data-testid="setting-height" />
        </Box>
      )}
      {caps.headlight && d.headlight && (
        <TextField select size="small" label="Headlight" value={d.headlight} sx={{ ...field, maxWidth: 240 }}
          onChange={(e) => onSettings({ headlight: e.target.value as HeadlightMode })}>
          {(Object.keys(HEADLIGHT_LABEL) as HeadlightMode[]).map((k) => <MenuItem key={k} value={k}>{HEADLIGHT_LABEL[k]}</MenuItem>)}
        </TextField>
      )}
      {caps.schedule && d.schedule && (
        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 14, mb: 0.5 }}>Weekly schedule</Typography>
          <ScheduleEditor key={JSON.stringify(d.schedule)} tasks={d.schedule} editable={caps.schedule === "write"} onSave={(schedule) => onSettings({ schedule })} />
          <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 0.5 }}>The mower's own schedule still obeys Tender Cells holds: it will not leave while the flock is out.</Typography>
        </Box>
      )}
      {caps.stayOutZones && d.stayOutZones && (
        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>Stay-out zones</Typography>
          {d.stayOutZones.map((z) => (
            <Stack key={z.id} direction="row" alignItems="center" spacing={1}>
              <Switch checked={z.enabled} onChange={(e) => onSettings({ stayOutZone: { id: z.id, enabled: e.target.checked } })} size="small" />
              <Typography sx={{ fontSize: 13 }}>{z.name}</Typography>
            </Stack>
          ))}
        </Box>
      )}
      {caps.workAreas && d.workAreas?.length ? (
        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>Work areas</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {d.workAreas.map((w) => <Chip key={w.id} size="small" label={`${w.name}${w.cuttingHeight ? ` · ${w.cuttingHeight} mm` : ""}`} sx={{ bgcolor: C.bg, color: C.white }} />)}
          </Stack>
        </Box>
      ) : null}
      {caps.confirmError && d.errorCode !== undefined && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ color: C.warning, fontSize: 13 }}>Error {d.errorCode}</Typography>
          {d.errorConfirmable && <Button size="small" variant="outlined" onClick={() => onSettings({ confirmError: true })} sx={{ borderColor: C.warning, color: C.warning }}>Confirm error</Button>}
        </Stack>
      )}
      {d.position && (
        <Typography sx={{ fontSize: 13 }}>
          Last GPS position: {d.position.lat.toFixed(5)}, {d.position.lon.toFixed(5)}{" "}
          <a href={`https://www.openstreetmap.org/?mlat=${d.position.lat}&mlon=${d.position.lon}#map=19/${d.position.lat}/${d.position.lon}`}
            target="_blank" rel="noopener noreferrer" style={{ color: C.gold }}>map</a>
        </Typography>
      )}
      {d.nextStart && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Next scheduled start: {new Date(d.nextStart).toLocaleString()}</Typography>}
    </Stack>
  );
}

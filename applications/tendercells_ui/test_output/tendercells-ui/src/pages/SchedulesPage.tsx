// SchedulesPage.tsx — Full CRUD for device schedules + Routines
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Stack, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl,
  InputLabel, Switch, Chip, IconButton, Tooltip, Divider,
  Alert, CircularProgress, ToggleButton, ToggleButtonGroup,
  FormControlLabel, TextField, Card, CardContent, CardActions,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EggIcon from '@mui/icons-material/Egg';

import { useProducts } from '../hooks/useProducts';
import {
  schedulesService,
  buildCron,
  parseCron,
  cronToLabel,
  ACTION_LABELS,
  ACTION_COLORS,
  type Schedule,
  type CronParts,
  type CreateScheduleData,
} from '../services/schedulesService';

const colors = {
  bg:        '#0D2B1E',
  surface:   '#1A3D2B',
  accent:    '#4A7C59',
  gold:      '#C8B882',
  goldMuted: '#8A7D55',
  danger:    '#CC3333',
  warning:   '#E8A020',
  white:     '#F0EDE4',
};

const EXPRESS_API = 'http://localhost:3001/api/mqtt';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function fmtHour(h: number) {
  const ampm = h < 12 ? 'AM' : 'PM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:00 ${ampm}`;
}

// ── Cron Builder ──────────────────────────────────────────────────────────────
interface CronBuilderProps {
  value: CronParts;
  onChange: (parts: CronParts) => void;
}

function CronBuilder({ value, onChange }: CronBuilderProps) {
  const handleDayToggle = (_: React.MouseEvent, newDays: number[]) => {
    onChange({ ...value, days: newDays });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel sx={{ color: colors.goldMuted }}>Hour</InputLabel>
          <Select
            value={value.hour}
            label="Hour"
            onChange={(e) => onChange({ ...value, hour: Number(e.target.value) })}
            sx={{ color: colors.white, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}
          >
            {HOUR_OPTIONS.map((h) => (
              <MenuItem key={h} value={h}>{fmtHour(h)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel sx={{ color: colors.goldMuted }}>Minute</InputLabel>
          <Select
            value={value.minute}
            label="Minute"
            onChange={(e) => onChange({ ...value, minute: Number(e.target.value) })}
            sx={{ color: colors.white, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}
          >
            {MINUTE_OPTIONS.map((m) => (
              <MenuItem key={m} value={m}>:{m.toString().padStart(2, '0')}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Box>
        <Typography variant="caption" sx={{ color: colors.goldMuted, mb: 0.5, display: 'block' }}>
          Days (leave blank for every day)
        </Typography>
        <ToggleButtonGroup
          value={value.days}
          onChange={handleDayToggle}
          size="small"
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {DAY_LABELS.map((label, idx) => (
            <ToggleButton
              key={idx}
              value={idx}
              sx={{
                color: colors.goldMuted,
                borderColor: colors.accent,
                '&.Mui-selected': { bgcolor: colors.accent, color: colors.white },
                minWidth: 44,
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Typography variant="caption" sx={{ color: colors.accent, fontFamily: 'monospace' }}>
        Cron: {buildCron(value)} — {cronToLabel(buildCron(value))}
      </Typography>
    </Stack>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({ open, title, message, destructive, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: colors.surface, color: colors.white } }}>
      <DialogTitle sx={{ color: destructive ? colors.danger : colors.gold }}>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: colors.white }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: colors.goldMuted }}>Cancel</Button>
        <Button
          onClick={() => { onConfirm(); onClose(); }}
          variant="contained"
          sx={{ bgcolor: destructive ? colors.danger : colors.accent }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Schedule Form Dialog ──────────────────────────────────────────────────────
interface ScheduleFormProps {
  open: boolean;
  initial?: Schedule | null;
  deviceId: string;
  onSave: (data: CreateScheduleData) => Promise<void>;
  onClose: () => void;
}

function ScheduleFormDialog({ open, initial, deviceId, onSave, onClose }: ScheduleFormProps) {
  const defaultCron: CronParts = { hour: 8, minute: 0, days: [] };

  const [action, setAction] = useState<Schedule['action']>('feed');
  const [cronParts, setCronParts] = useState<CronParts>(defaultCron);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAction(initial.action);
      setCronParts(parseCron(initial.cronExpression) ?? defaultCron);
      setLabel(initial.label ?? '');
      setAmount(initial.amount ?? 100);
      setEnabled(initial.enabled);
    } else {
      setAction('feed');
      setCronParts(defaultCron);
      setLabel('');
      setAmount(100);
      setEnabled(true);
    }
  }, [open, initial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        deviceId,
        action,
        cronExpression: buildCron(cronParts),
        enabled,
        label: label.trim() || undefined,
        amount: action === 'feed' || action === 'water' ? amount : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { bgcolor: colors.surface, color: colors.white } }}
    >
      <DialogTitle sx={{ color: colors.gold }}>
        {initial ? 'Edit Schedule' : 'New Schedule'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ color: colors.goldMuted }}>Action</InputLabel>
            <Select
              value={action}
              label="Action"
              onChange={(e) => setAction(e.target.value as Schedule['action'])}
              sx={{ color: colors.white, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}
            >
              <MenuItem value="feed">Feed</MenuItem>
              <MenuItem value="water">Water</MenuItem>
              <MenuItem value="door">Door Open</MenuItem>
              <MenuItem value="clean">Clean</MenuItem>
            </Select>
          </FormControl>

          {(action === 'feed' || action === 'water') && (
            <TextField
              label={action === 'feed' ? 'Amount (grams)' : 'Amount (ml)'}
              type="number"
              size="small"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              inputProps={{ min: 1, max: action === 'feed' ? 5000 : 10000 }}
              sx={{
                '& label': { color: colors.goldMuted },
                '& input': { color: colors.white },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
              }}
            />
          )}

          <TextField
            label="Label (optional)"
            size="small"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Morning Feed"
            sx={{
              '& label': { color: colors.goldMuted },
              '& input': { color: colors.white },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
            }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.gold, mb: 1 }}>Schedule Time</Typography>
            <CronBuilder value={cronParts} onChange={setCronParts} />
          </Box>

          <FormControlLabel
            control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="success" />}
            label={<Typography sx={{ color: colors.white }}>Enabled</Typography>}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: colors.goldMuted }}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ bgcolor: colors.accent }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Saving…' : 'Save Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Schedule Row ──────────────────────────────────────────────────────────────
interface ScheduleRowProps {
  schedule: Schedule;
  onToggle: (s: Schedule) => void;
  onEdit: (s: Schedule) => void;
  onDelete: (s: Schedule) => void;
  onRunNow: (s: Schedule) => void;
}

function ScheduleRow({ schedule, onToggle, onEdit, onDelete, onRunNow }: ScheduleRowProps) {
  const color = ACTION_COLORS[schedule.action];
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        bgcolor: schedule.enabled ? 'rgba(74,124,89,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${schedule.enabled ? colors.accent + '44' : 'rgba(255,255,255,0.06)'}`,
        opacity: schedule.enabled ? 1 : 0.65,
        transition: 'all 0.2s',
      }}
    >
      <Chip
        label={ACTION_LABELS[schedule.action]}
        size="small"
        sx={{ bgcolor: color + '22', color, borderColor: color + '66', border: '1px solid', minWidth: 64 }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: colors.white, fontWeight: 500 }} noWrap>
          {schedule.label || cronToLabel(schedule.cronExpression)}
        </Typography>
        {schedule.label && (
          <Typography variant="caption" sx={{ color: colors.goldMuted, fontFamily: 'monospace' }}>
            {cronToLabel(schedule.cronExpression)}
          </Typography>
        )}
      </Box>

      {schedule.lastRun && (
        <Typography variant="caption" sx={{ color: colors.goldMuted, whiteSpace: 'nowrap' }}>
          Last: {new Date(schedule.lastRun.toMillis()).toLocaleDateString()}
        </Typography>
      )}

      <Switch
        size="small"
        checked={schedule.enabled}
        onChange={() => onToggle(schedule)}
        color="success"
      />

      <Tooltip title="Run now">
        <span>
          <IconButton size="small" onClick={() => onRunNow(schedule)} sx={{ color: colors.accent }}>
            <PlayArrowIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEdit(schedule)} sx={{ color: colors.goldMuted }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton size="small" onClick={() => onDelete(schedule)} sx={{ color: colors.danger + 'aa' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── Routine Card ──────────────────────────────────────────────────────────────
interface RoutineCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  deviceId: string;
  onRun: (routineName: string) => void;
}

function RoutineCard({ name, description, icon, deviceId, onRun }: RoutineCardProps) {
  return (
    <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.accent}33`, flex: 1, minWidth: 220 }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ color: colors.accent, mt: 0.25 }}>{icon}</Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.gold, fontWeight: 700 }}>{name}</Typography>
            <Typography variant="caption" sx={{ color: colors.goldMuted }}>{description}</Typography>
          </Box>
        </Stack>
      </CardContent>
      <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PlayArrowIcon />}
          disabled={!deviceId}
          onClick={() => onRun(name)}
          sx={{ borderColor: colors.accent, color: colors.accent, '&:hover': { bgcolor: colors.accent + '22' } }}
        >
          Run Now
        </Button>
      </CardActions>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SchedulesPage() {
  const { products, loading: productsLoading } = useProducts();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [runNowTarget, setRunNowTarget] = useState<Schedule | null>(null);
  const [routineTarget, setRoutineTarget] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  // Select first device by default
  useEffect(() => {
    if (products.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(products[0].id);
    }
  }, [products, selectedDeviceId]);

  const loadSchedules = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    setLoadingSchedules(true);
    try {
      const data = await schedulesService.getSchedules(deviceId);
      setSchedules(data);
    } catch {
      setSnack({ msg: 'Failed to load schedules', severity: 'error' });
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDeviceId) loadSchedules(selectedDeviceId);
  }, [selectedDeviceId, loadSchedules]);

  const handleToggle = async (s: Schedule) => {
    try {
      await schedulesService.toggleSchedule(s.deviceId, s.id, !s.enabled);
      setSchedules((prev) => prev.map((x) => x.id === s.id ? { ...x, enabled: !s.enabled } : x));
    } catch {
      setSnack({ msg: 'Failed to toggle schedule', severity: 'error' });
    }
  };

  const handleSave = async (data: CreateScheduleData) => {
    if (editTarget) {
      await schedulesService.updateSchedule(data.deviceId, editTarget.id, {
        action: data.action,
        cronExpression: data.cronExpression,
        enabled: data.enabled,
        label: data.label,
        amount: data.amount,
      });
      setSnack({ msg: 'Schedule updated', severity: 'success' });
    } else {
      await schedulesService.createSchedule(data.deviceId, data);
      setSnack({ msg: 'Schedule created', severity: 'success' });
    }
    await loadSchedules(selectedDeviceId);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await schedulesService.deleteSchedule(deleteTarget.deviceId, deleteTarget.id);
      setSchedules((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setSnack({ msg: 'Schedule deleted', severity: 'success' });
    } catch {
      setSnack({ msg: 'Failed to delete schedule', severity: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleRunNow = async () => {
    if (!runNowTarget) return;
    try {
      const s = runNowTarget;
      let endpoint = '';
      let body: Record<string, unknown> = {};

      switch (s.action) {
        case 'door':
          endpoint = `${EXPRESS_API}/devices/${s.deviceId}/door`;
          body = { state: 'open' };
          break;
        case 'feed':
          endpoint = `${EXPRESS_API}/devices/${s.deviceId}/feed`;
          body = { amount: s.amount ?? 100 };
          break;
        case 'water':
          endpoint = `${EXPRESS_API}/devices/${s.deviceId}/feed`;
          body = { amount: s.amount ?? 500 };
          break;
        case 'clean':
          endpoint = `${EXPRESS_API}/devices/${s.deviceId}/clean`;
          body = { action: 'start' };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setSnack({ msg: `${ACTION_LABELS[s.action]} command sent`, severity: 'success' });
    } catch (err) {
      setSnack({ msg: `Failed to run: ${err instanceof Error ? err.message : 'unknown error'}`, severity: 'error' });
    }
    setRunNowTarget(null);
  };

  const handleRunRoutine = async (routineName: string) => {
    const deviceId = selectedDeviceId;
    if (!deviceId) return;
    try {
      const res = await fetch(`${EXPRESS_API}/devices/${deviceId}/routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine: routineName }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setSnack({ msg: `Routine "${routineName}" started`, severity: 'success' });
    } catch (err) {
      setSnack({ msg: `Routine failed: ${err instanceof Error ? err.message : 'unknown error'}`, severity: 'error' });
    }
    setRoutineTarget(null);
  };

  const selectedProduct = products.find((p) => p.id === selectedDeviceId);
  const isChickenTender = selectedProduct?.metadata?.product_family === 'chicken-tender' ||
    selectedProduct?.metadata?.product_family?.includes('chicken');

  return (
    <Box sx={{ bgcolor: colors.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h5" sx={{ color: colors.gold, fontWeight: 700 }}>
              Schedules &amp; Routines
            </Typography>
            <Typography variant="body2" sx={{ color: colors.goldMuted }}>
              Automate feed, water, door, and cleaning tasks
            </Typography>
          </Box>

          {selectedDeviceId && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              sx={{ bgcolor: colors.accent }}
            >
              New Schedule
            </Button>
          )}
        </Stack>

        {/* Device selector */}
        <Paper sx={{ bgcolor: colors.surface, p: 2, borderRadius: 2 }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel sx={{ color: colors.goldMuted }}>Device</InputLabel>
            <Select
              value={selectedDeviceId}
              label="Device"
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={productsLoading}
              sx={{ color: colors.white, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.accent } }}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.product_name || p.id} — {p.metadata?.product_family ?? p.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Schedules list */}
        <Paper sx={{ bgcolor: colors.surface, p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <AccessTimeIcon sx={{ color: colors.accent }} />
            <Typography variant="subtitle1" sx={{ color: colors.gold, fontWeight: 700 }}>
              Schedules
            </Typography>
            <Chip
              label={schedules.filter((s) => s.enabled).length + ' active'}
              size="small"
              sx={{ bgcolor: colors.accent + '33', color: colors.accent }}
            />
          </Stack>

          {loadingSchedules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: colors.accent }} />
            </Box>
          ) : schedules.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: colors.goldMuted }}>
                {selectedDeviceId ? 'No schedules yet. Add one above.' : 'Select a device to manage its schedules.'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {schedules.map((s) => (
                <ScheduleRow
                  key={s.id}
                  schedule={s}
                  onToggle={handleToggle}
                  onEdit={(target) => { setEditTarget(target); setFormOpen(true); }}
                  onDelete={setDeleteTarget}
                  onRunNow={setRunNowTarget}
                />
              ))}
            </Stack>
          )}
        </Paper>

        {/* Routines section */}
        <Paper sx={{ bgcolor: colors.surface, p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <CleaningServicesIcon sx={{ color: colors.accent }} />
            <Typography variant="subtitle1" sx={{ color: colors.gold, fontWeight: 700 }}>
              Routines
            </Typography>
            <Chip
              label="One-tap"
              size="small"
              sx={{ bgcolor: '#C8B88233', color: colors.gold }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: colors.goldMuted, display: 'block', mb: 2 }}>
            Predefined multi-step robot arm sequences. Requires Chicken Tender with arm online.
          </Typography>

          {!isChickenTender && selectedDeviceId && (
            <Alert severity="info" sx={{ mb: 2, bgcolor: colors.accent + '22', color: colors.white }}>
              Routines are only available on Chicken Tender with a connected robot arm.
            </Alert>
          )}

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <RoutineCard
              name="egg_collection_routine"
              description="Move to nest boxes → grip each egg → transfer to basket"
              icon={<EggIcon />}
              deviceId={isChickenTender ? selectedDeviceId : ''}
              onRun={setRoutineTarget}
            />
            <RoutineCard
              name="cleaning_sweep_routine"
              description="XY sweep with scraper attachment — full floor coverage"
              icon={<CleaningServicesIcon />}
              deviceId={isChickenTender ? selectedDeviceId : ''}
              onRun={setRoutineTarget}
            />
          </Stack>
        </Paper>

        {/* Safety notice */}
        <Alert
          severity="warning"
          sx={{ bgcolor: colors.warning + '18', color: colors.white, '& .MuiAlert-icon': { color: colors.warning } }}
        >
          <strong>Safety:</strong> All scheduled commands are blocked if device is in E-STOP or error state.
          Clean and routine commands require chickens to be clear of the work area (verified via live headcount sensor).
        </Alert>

      </Stack>

      {/* Dialogs */}
      <ScheduleFormDialog
        open={formOpen}
        initial={editTarget}
        deviceId={selectedDeviceId}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Schedule"
        message={`Delete "${deleteTarget?.label || cronToLabel(deleteTarget?.cronExpression ?? '')}"? This cannot be undone.`}
        destructive
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!runNowTarget}
        title="Run Schedule Now"
        message={`Send "${runNowTarget ? ACTION_LABELS[runNowTarget.action] : ''}" command to device immediately? This will activate hardware.`}
        onConfirm={handleRunNow}
        onClose={() => setRunNowTarget(null)}
      />

      <ConfirmDialog
        open={!!routineTarget}
        title="Run Routine"
        message={`Start "${routineTarget}"? The robot arm will move. Ensure chickens are clear of the work area before confirming.`}
        onConfirm={() => routineTarget && handleRunRoutine(routineTarget)}
        onClose={() => setRoutineTarget(null)}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.msg}
        ContentProps={{
          sx: {
            bgcolor: snack?.severity === 'error' ? colors.danger : colors.accent,
            color: colors.white,
          },
        }}
      />
    </Box>
  );
}

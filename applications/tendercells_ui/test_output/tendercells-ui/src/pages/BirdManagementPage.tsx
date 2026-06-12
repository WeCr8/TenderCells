// BirdManagementPage.tsx — Flock roster: list, add, edit individual birds
import { useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Avatar, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PetsIcon from '@mui/icons-material/Pets';
import EggIcon from '@mui/icons-material/Egg';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

type Sex = 'hen' | 'rooster' | 'unknown';
type HealthStatus = 'healthy' | 'watch' | 'sick' | 'quarantine';
type Species = 'chicken' | 'duck' | 'turkey' | 'goose' | 'quail' | 'pigeon' | 'rabbit' | 'goat';

interface Bird {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  hatchDate: string;
  color: string;
  weight: string;
  health: HealthStatus;
  notes: string;
  eggColor: string;
  avgEggsPerWeek: number;
  bandId: string;
  device: string;
}

const EMPTY_BIRD: Omit<Bird, 'id'> = {
  name: '', species: 'chicken', breed: '', sex: 'hen', hatchDate: '',
  color: '', weight: '', health: 'healthy', notes: '',
  eggColor: '', avgEggsPerWeek: 0, bandId: '', device: 'ct_001',
};

const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: '#4CAF50', watch: C.warning, sick: C.danger, quarantine: '#9C27B0',
};

const SPECIES_EMOJI: Record<Species, string> = {
  chicken: '🐔', duck: '🦆', turkey: '🦃', goose: '🪿',
  quail: '🐦', pigeon: '🕊️', rabbit: '🐇', goat: '🐐',
};

const BREEDS_BY_SPECIES: Record<Species, string[]> = {
  chicken: ['Rhode Island Red', 'Barred Rock', 'Buff Orpington', 'Leghorn', 'Easter Egger', 'Silkie', 'Australorp', 'Plymouth Rock', 'Other'],
  duck: ['Pekin', 'Khaki Campbell', 'Muscovy', 'Runner', 'Rouen', 'Other'],
  turkey: ['Broad Breasted White', 'Heritage', 'Narragansett', 'Bronze', 'Other'],
  goose: ['Toulouse', 'Embden', 'Chinese', 'Pilgrim', 'Other'],
  quail: ['Coturnix', 'Bobwhite', 'Button', 'Other'],
  pigeon: ['Racing Homer', 'King', 'Fantail', 'Roller', 'Other'],
  rabbit: ['Rex', 'Holland Lop', 'Flemish Giant', 'New Zealand', 'Other'],
  goat: ['Boer', 'Nubian', 'LaMancha', 'Nigerian Dwarf', 'Other'],
};

const DEMO_BIRDS: Bird[] = [
  { id: 'b1', name: 'Henrietta', species: 'chicken', breed: 'Rhode Island Red', sex: 'hen', hatchDate: '2023-03-15', color: 'Mahogany red', weight: '6.5 lbs', health: 'healthy', notes: 'Top of pecking order. Reliable layer.', eggColor: 'Brown', avgEggsPerWeek: 5, bandId: 'RIR-001', device: 'ct_001' },
  { id: 'b2', name: 'Dotty', species: 'chicken', breed: 'Barred Rock', sex: 'hen', hatchDate: '2023-03-15', color: 'Black/white barred', weight: '7 lbs', health: 'healthy', notes: 'Very calm. Great forager.', eggColor: 'Brown', avgEggsPerWeek: 4, bandId: 'BR-002', device: 'ct_001' },
  { id: 'b3', name: 'Goldie', species: 'chicken', breed: 'Buff Orpington', sex: 'hen', hatchDate: '2023-04-02', color: 'Golden buff', weight: '8 lbs', health: 'watch', notes: 'Showing mild lethargy — monitor for 48h.', eggColor: 'Light brown', avgEggsPerWeek: 3, bandId: 'BO-003', device: 'ct_001' },
  { id: 'b4', name: 'Bluebell', species: 'chicken', breed: 'Easter Egger', sex: 'hen', hatchDate: '2023-05-10', color: 'Blue-grey mottled', weight: '5.5 lbs', health: 'healthy', notes: 'Lays blue-green eggs. Shy but friendly.', eggColor: 'Blue-green', avgEggsPerWeek: 4, bandId: 'EE-004', device: 'ct_001' },
];

function BirdCard({ bird, onEdit, onDelete }: { bird: Bird; onEdit: () => void; onDelete: () => void }) {
  const hc = HEALTH_COLORS[bird.health];
  const emoji = SPECIES_EMOJI[bird.species];
  const age = bird.hatchDate
    ? Math.floor((Date.now() - new Date(bird.hatchDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  return (
    <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${hc}44`, borderRadius: 2, p: 2 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: C.bg, fontSize: 24, width: 44, height: 44 }}>{emoji}</Avatar>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>{bird.name}</Typography>
              {bird.sex === 'hen' ? <FemaleIcon sx={{ color: '#F48FB1', fontSize: 16 }} /> : bird.sex === 'rooster' ? <MaleIcon sx={{ color: '#90CAF9', fontSize: 16 }} /> : null}
            </Stack>
            <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{bird.breed}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit} sx={{ color: C.goldMuted }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove from flock">
            <IconButton size="small" onClick={onDelete} sx={{ color: C.danger + 'aa' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
        <Chip label={bird.health} size="small" sx={{ bgcolor: hc + '22', color: hc, border: `1px solid ${hc}44`, fontSize: 10, fontWeight: 700 }} />
        {bird.eggColor && bird.sex === 'hen' && (
          <Chip icon={<EggIcon sx={{ fontSize: 12 }} />} label={bird.eggColor} size="small" sx={{ bgcolor: C.bg, color: C.goldMuted, fontSize: 10 }} />
        )}
        {bird.bandId && <Chip label={`Band: ${bird.bandId}`} size="small" sx={{ bgcolor: C.bg, color: C.goldMuted, fontSize: 10 }} />}
        {age != null && <Chip label={`${age} mo`} size="small" sx={{ bgcolor: C.bg, color: C.goldMuted, fontSize: 10 }} />}
      </Stack>

      {bird.sex === 'hen' && bird.avgEggsPerWeek > 0 && (
        <Stack direction="row" spacing={0.5} mt={1} alignItems="center">
          <EggIcon sx={{ color: '#D4A574', fontSize: 14 }} />
          <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{bird.avgEggsPerWeek} eggs/week avg</Typography>
        </Stack>
      )}

      {bird.notes && (
        <Typography sx={{ color: C.goldMuted, fontSize: 11, mt: 1, fontStyle: 'italic' }}>
          {bird.notes.slice(0, 80)}{bird.notes.length > 80 ? '…' : ''}
        </Typography>
      )}
    </Paper>
  );
}

interface EditDialogProps {
  open: boolean;
  bird: Omit<Bird, 'id'> | Bird;
  onClose: () => void;
  onSave: (b: Omit<Bird, 'id'>) => void;
}

function EditDialog({ open, bird, onClose, onSave }: EditDialogProps) {
  const [form, setForm] = useState<Omit<Bird, 'id'>>({ ...bird });
  const set = (k: keyof Omit<Bird, 'id'>, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));
  const breeds = BREEDS_BY_SPECIES[form.species] ?? ['Other'];

  const inputSx = {
    '& label': { color: C.goldMuted },
    '& input, & textarea': { color: C.white },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent + '88' },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
      <DialogTitle sx={{ color: C.gold }}>{'name' in bird && (bird as Bird).id ? `Edit ${form.name}` : 'Add Bird'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" value={form.name} onChange={e => set('name', e.target.value)} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: C.goldMuted }}>Species</InputLabel>
              <Select value={form.species} label="Species" onChange={e => set('species', e.target.value as Species)} sx={{ color: C.white }}>
                {(Object.keys(SPECIES_EMOJI) as Species[]).map(s => (
                  <MenuItem key={s} value={s}>{SPECIES_EMOJI[s]} {s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: C.goldMuted }}>Breed</InputLabel>
              <Select value={form.breed || breeds[0]} label="Breed" onChange={e => set('breed', e.target.value)} sx={{ color: C.white }}>
                {breeds.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: C.goldMuted }}>Sex</InputLabel>
              <Select value={form.sex} label="Sex" onChange={e => set('sex', e.target.value as Sex)} sx={{ color: C.white }}>
                {(['hen', 'rooster', 'unknown'] as Sex[]).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Hatch Date" type="date" value={form.hatchDate} onChange={e => set('hatchDate', e.target.value)}
              fullWidth size="small" sx={inputSx} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: C.goldMuted }}>Health</InputLabel>
              <Select value={form.health} label="Health" onChange={e => set('health', e.target.value as HealthStatus)} sx={{ color: C.white }}>
                {(['healthy', 'watch', 'sick', 'quarantine'] as HealthStatus[]).map(h => (
                  <MenuItem key={h} value={h}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: HEALTH_COLORS[h] }} />
                      <span>{h}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Plumage Color" value={form.color} onChange={e => set('color', e.target.value)} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Weight (lbs)" value={form.weight} onChange={e => set('weight', e.target.value)} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Egg Color" value={form.eggColor} onChange={e => set('eggColor', e.target.value)} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Avg Eggs/Week" type="number" value={form.avgEggsPerWeek}
              onChange={e => set('avgEggsPerWeek', Number(e.target.value))} fullWidth size="small" sx={inputSx} inputProps={{ min: 0, max: 7 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Band ID" value={form.bandId} onChange={e => set('bandId', e.target.value)} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
              fullWidth size="small" multiline rows={2} sx={inputSx} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: C.goldMuted }}>Cancel</Button>
        <Button onClick={() => { onSave(form); onClose(); }} variant="contained"
          disabled={!form.name.trim()} sx={{ bgcolor: C.accent }}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BirdManagementPage() {
  const [birds, setBirds] = useState<Bird[]>(DEMO_BIRDS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bird | null>(null);
  const [filter, setFilter] = useState<HealthStatus | 'all'>('all');

  const totalEggs = birds.filter(b => b.sex === 'hen').reduce((a, b) => a + b.avgEggsPerWeek, 0);
  const hens = birds.filter(b => b.sex === 'hen').length;
  const watchList = birds.filter(b => b.health !== 'healthy').length;

  const visible = filter === 'all' ? birds : birds.filter(b => b.health === filter);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (b: Bird) => { setEditing(b); setDialogOpen(true); };

  const handleSave = (data: Omit<Bird, 'id'>) => {
    if (editing) {
      setBirds(prev => prev.map(b => b.id === editing.id ? { ...data, id: editing.id } : b));
    } else {
      setBirds(prev => [...prev, { ...data, id: `b${Date.now()}` }]);
    }
  };

  const handleDelete = (id: string) => setBirds(prev => prev.filter(b => b.id !== id));

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PetsIcon sx={{ color: C.accent, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Flock Roster</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Individual bird records, health tracking, and egg data</Typography>
            </Box>
          </Stack>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd} sx={{ bgcolor: C.accent }}>
            Add Bird
          </Button>
        </Stack>

        {/* Stats */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Grid container spacing={2}>
            {[
              { label: 'Total Birds', value: birds.length, color: C.gold },
              { label: 'Hens', value: hens, color: '#F48FB1' },
              { label: 'Need Attention', value: watchList, color: watchList > 0 ? C.warning : '#4CAF50' },
              { label: 'Eggs/Week (avg)', value: totalEggs, color: '#D4A574' },
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Typography sx={{ color: s.color, fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{s.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Filter chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(['all', 'healthy', 'watch', 'sick', 'quarantine'] as const).map(f => (
            <Chip key={f} label={f === 'all' ? 'All' : f} clickable onClick={() => setFilter(f)}
              sx={{
                bgcolor: filter === f ? (f === 'all' ? C.accent : HEALTH_COLORS[f]) : C.surface,
                color: filter === f ? C.white : C.goldMuted,
                border: `1px solid ${f === 'all' ? C.accent : HEALTH_COLORS[f as HealthStatus] ?? C.accent}44`,
                fontWeight: filter === f ? 700 : 400,
              }} />
          ))}
          <Typography sx={{ color: C.goldMuted, fontSize: 12, alignSelf: 'center', ml: 1 }}>
            {visible.length} bird{visible.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>

        {/* Bird grid */}
        {visible.length === 0 ? (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 4, textAlign: 'center' }}>
            <LocalHospitalIcon sx={{ color: C.goldMuted, fontSize: 40, mb: 1 }} />
            <Typography sx={{ color: C.goldMuted }}>No birds match this filter.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {visible.map(b => (
              <Grid item xs={12} sm={6} md={4} key={b.id}>
                <BirdCard bird={b} onEdit={() => openEdit(b)} onDelete={() => handleDelete(b.id)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <EditDialog
        open={dialogOpen}
        bird={editing ?? EMPTY_BIRD}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}

// LibraryPage.tsx - OS library: animal health by species and the plant library (crops,
// weeds Weed Patrol targets, plants toxic to animals). Same data as tendercells.com/library
// (shared/library). Usage: /library, /library/animals/:id, /library/plants/:id - linked
// from the flock roster and Weed Patrol.
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { GROUP_LABEL, TOXIC_PLANT_IDS_BY_SPECIES, animalById, animalsIn, type AnimalGroup } from '../../../shared/library/animals';
import { PLANTS, plantById, type PlantKind } from '../../../shared/library/plants';
import { OS_SCREENS, PLANT_PAGES, WILDLIFE_PAGES, animalPages, type PageLink } from '../../../shared/library/links';
import { WILDLIFE, threatsTo, wildlifeById } from '../../../shared/library/wildlife';
import { projectsFor } from '../../../shared/library/projects';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333', white: '#F0EDE4' };
const card = { bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, color: C.white };
const KIND_LABEL: Record<PlantKind, string> = { crop: 'Garden crops', weed: 'Weeds (Weed Patrol targets)', toxic: 'Toxic to animals' };

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: C.gold, mt: 1.5 }}>{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{items.map((i) => <li key={i}><Typography variant="body2">{i}</Typography></li>)}</Box>
    </Box>
  );
}

/** tendercells.com pages for this entry (same origin as the OS, outside the /app router). */
function Related({ links }: { links: PageLink[] }) {
  return (
    <Box data-testid="library-related">
      <Typography variant="subtitle2" sx={{ color: C.gold, mt: 1.5 }}>On tendercells.com</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
        {links.map((l) => <Chip key={l.href} component="a" href={l.href} clickable size="small" label={l.label} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />)}
      </Stack>
    </Box>
  );
}

function AnimalView({ id }: { id: string }) {
  const a = animalById(id);
  if (!a) return <Typography>Unknown species.</Typography>;
  const toxic = (TOXIC_PLANT_IDS_BY_SPECIES[a.id] ?? []).map(plantById).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <Paper elevation={0} sx={card} data-testid="library-entry">
      <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>{a.emoji} {a.name}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ my: 1 }}>
        <Chip size="small" label={a.product} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
        <Chip size="small" label={`${a.tempNote ? `${a.tempNote[0].toUpperCase()}${a.tempNote.slice(1)}` : 'Comfortable'} ${a.comfortF[0]}–${a.comfortF[1]}°F`} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
        {a.bodyTempF && <Chip size="small" label={`Body temp ${a.bodyTempF[0]}–${a.bodyTempF[1]}°F`} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />}
      </Stack>
      <Typography variant="body2"><strong>Space:</strong> {a.spacePerAnimal}</Typography>
      <List title="Daily checks" items={a.dailyChecks} />
      <List title="Warning signs" items={a.warningSigns} />
      <Typography variant="subtitle2" sx={{ color: C.gold, mt: 1.5 }}>Common conditions</Typography>
      <Stack spacing={1} sx={{ mt: 0.5 }}>
        {a.conditions.map((c) => (
          <Box key={c.name} sx={{ bgcolor: C.bg, borderRadius: 1, p: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>Signs: {c.signs}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>First steps: {c.firstSteps}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#F2B8B5' }}>Call a vet: {c.vetWhen}</Typography>
          </Box>
        ))}
      </Stack>
      {toxic.length > 0 && (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <strong>Keep away:</strong>{' '}
          {toxic.map((p, i) => <span key={p.id}>{i ? ', ' : ''}<RouterLink to={`/library/plants/${p.id}`} style={{ color: C.gold }}>{p.name}</RouterLink></span>)}
        </Typography>
      )}
      <Typography variant="body2" sx={{ mt: 1 }}><strong>What Tender Cells watches:</strong> {a.sensors.join(', ')}</Typography>
      {threatsTo(a.id).length > 0 && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Predators & pests:</strong>{' '}
          {threatsTo(a.id).map((w, i) => <span key={w.id}>{i ? ', ' : ''}<RouterLink to={`/library/wildlife/${w.id}`} style={{ color: C.gold }}>{w.name}</RouterLink></span>)}
        </Typography>
      )}
      {projectsFor(a.group).length > 0 && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>DIY projects:</strong>{' '}
          {projectsFor(a.group).map((p, i) => <span key={p.id}>{i ? ', ' : ''}<RouterLink to={`/projects?project=${p.id}`} style={{ color: C.gold }}>{p.title}</RouterLink></span>)}
        </Typography>
      )}
      <Related links={animalPages(a.id)} />
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: C.goldMuted }}>General care education, not veterinary advice.</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button component={RouterLink} to={OS_SCREENS.animal.path} variant="contained" sx={{ bgcolor: C.accent }}>{OS_SCREENS.animal.label}</Button>
        <Button href={`/library/animals/${a.id}`} variant="outlined" sx={{ color: C.gold, borderColor: C.accent }}>On tendercells.com</Button>
      </Stack>
    </Paper>
  );
}

function PlantView({ id }: { id: string }) {
  const p = plantById(id);
  if (!p) return <Typography>Unknown plant.</Typography>;
  return (
    <Paper elevation={0} sx={card} data-testid="library-entry">
      <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>{p.emoji} {p.name}</Typography>
      <Typography variant="body2" sx={{ color: C.goldMuted, mb: 1 }}>{KIND_LABEL[p.kind]} · {p.summary}</Typography>
      {p.spacingIn && <Typography variant="body2"><strong>Spacing:</strong> {p.spacingIn} in · <strong>Harvest:</strong> {p.daysToHarvest?.join('–')} days</Typography>}
      {p.water && <Typography variant="body2"><strong>Water:</strong> {p.water}</Typography>}
      {p.identify && <Typography variant="body2"><strong>Recognise it:</strong> {p.identify}</Typography>}
      {p.control && <Typography variant="body2"><strong>Control:</strong> {p.control}</Typography>}
      {p.laser && <Typography variant="body2"><strong>Weed Patrol:</strong> {p.laser}</Typography>}
      {p.toxicTo && (
        <Typography variant="body2" sx={{ color: '#F2B8B5' }}>
          <strong>Poisonous to:</strong>{' '}
          {p.toxicTo.map((s, i) => <span key={s}>{i ? ', ' : ''}<RouterLink to={`/library/animals/${s}`} style={{ color: '#F2B8B5' }}>{animalById(s)?.name ?? s}</RouterLink></span>)}
        </Typography>
      )}
      <Related links={PLANT_PAGES[p.kind]} />
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        {p.kind !== 'toxic' && <Button component={RouterLink} to={OS_SCREENS[p.kind].path} variant="contained" sx={{ bgcolor: C.accent }}>{OS_SCREENS[p.kind].label}</Button>}
        <Button href={`/library/plants/${p.id}`} variant="outlined" sx={{ color: C.gold, borderColor: C.accent }}>On tendercells.com</Button>
      </Stack>
    </Paper>
  );
}

function WildlifeView({ id }: { id: string }) {
  const w = wildlifeById(id);
  if (!w) return <Typography>Unknown animal.</Typography>;
  return (
    <Paper elevation={0} sx={card} data-testid="library-entry">
      <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>{w.emoji} {w.name}</Typography>
      <Typography variant="body2" sx={{ color: C.goldMuted, mb: 1 }}>{w.kind === 'pest' ? 'Pest' : w.kind === 'venomous' ? 'Venomous' : 'Predator'} · active {w.active}</Typography>
      <Typography variant="body2"><strong>Signs:</strong> {w.signs}</Typography>
      <Typography variant="body2"><strong>Prevention:</strong> {w.prevention}</Typography>
      <Typography variant="body2"><strong>What Tender Cells does:</strong> {w.patrol}</Typography>
      {w.caution && <Typography variant="body2" sx={{ color: '#F2B8B5', mt: 1 }}><strong>Caution:</strong> {w.caution}</Typography>}
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Threat to:</strong>{' '}
        {w.threatTo.map((s, i) => <span key={s}>{i ? ', ' : ''}<RouterLink to={`/library/animals/${s}`} style={{ color: C.gold }}>{animalById(s)?.name ?? s}</RouterLink></span>)}
      </Typography>
      <Related links={WILDLIFE_PAGES} />
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button component={RouterLink} to={OS_SCREENS.wildlife.path} variant="contained" sx={{ bgcolor: C.accent }}>{OS_SCREENS.wildlife.label}</Button>
        <Button href={`/library/wildlife/${w.id}`} variant="outlined" sx={{ color: C.gold, borderColor: C.accent }}>On tendercells.com</Button>
      </Stack>
    </Paper>
  );
}

const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 };

export default function LibraryPage() {
  const { kind, id } = useParams();
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <MenuBookIcon sx={{ color: C.accent, fontSize: 30 }} />
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Library</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Health by species - poultry, rabbits & rodents, livestock, pond fish, reptiles - plus predators & pests, crops, weeds and toxic plants.</Typography>
          </Box>
        </Stack>
        {kind && id ? (
          <>
            <Button component={RouterLink} to="/library" sx={{ alignSelf: 'flex-start', color: C.gold }}>← All entries</Button>
            {kind === 'animals' ? <AnimalView id={id} /> : kind === 'wildlife' ? <WildlifeView id={id} /> : <PlantView id={id} />}
          </>
        ) : (
          <>
            {(Object.keys(GROUP_LABEL) as AnimalGroup[]).map((g) => (
              <Box key={g}>
                <Typography variant="subtitle1" sx={{ color: C.gold, mb: 1 }}>{GROUP_LABEL[g]}</Typography>
                <Box sx={grid}>
                  {animalsIn(g).map((a) => (
                    <Paper key={a.id} component={RouterLink} to={`/library/animals/${a.id}`} elevation={0} sx={{ ...card, textDecoration: 'none' }}>
                      <Typography sx={{ fontWeight: 700 }}>{a.emoji} {a.name}</Typography>
                      <Typography variant="caption" sx={{ color: C.goldMuted }}>{a.product}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ))}
            <Box>
              <Typography variant="subtitle1" sx={{ color: C.gold, mb: 1 }}>Predators & pests (rodents, snakes, wildlife)</Typography>
              <Box sx={grid}>
                {WILDLIFE.map((w) => (
                  <Paper key={w.id} component={RouterLink} to={`/library/wildlife/${w.id}`} elevation={0} sx={{ ...card, textDecoration: 'none' }}>
                    <Typography sx={{ fontWeight: 700 }}>{w.emoji} {w.name}</Typography>
                    <Typography variant="caption" sx={{ color: C.goldMuted }}>{w.kind} · {w.active}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
            <Button component={RouterLink} to="/projects" variant="outlined" sx={{ alignSelf: 'flex-start', color: C.gold, borderColor: C.accent }}>
              DIY projects: terrariums, enclosure cameras, sound monitors →
            </Button>
            {(['crop', 'weed', 'toxic'] as PlantKind[]).map((k) => (
              <Box key={k}>
                <Typography variant="subtitle1" sx={{ color: C.gold, mb: 1 }}>{KIND_LABEL[k]}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  {PLANTS.filter((p) => p.kind === k).map((p) => (
                    <Paper key={p.id} component={RouterLink} to={`/library/plants/${p.id}`} elevation={0} sx={{ ...card, textDecoration: 'none' }}>
                      <Typography sx={{ fontWeight: 700 }}>{p.emoji} {p.name}</Typography>
                      <Typography variant="caption" sx={{ color: C.goldMuted }}>{p.summary}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ))}
          </>
        )}
      </Stack>
    </Box>
  );
}

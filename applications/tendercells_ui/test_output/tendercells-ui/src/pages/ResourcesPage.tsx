import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PetsIcon from '@mui/icons-material/Pets';
import SearchIcon from '@mui/icons-material/Search';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

type Category = 'animals' | 'plants' | 'rodents' | 'wildlife' | 'health';
type ResourceEntry = {
  category: Category;
  title: string;
  tags: string[];
  summary: string;
  checks: string[];
  source?: { label: string; href: string };
};

const categories: Array<{ id: Category; label: string; icon: React.ReactElement }> = [
  { id: 'animals', label: 'Animals', icon: <PetsIcon /> },
  { id: 'plants', label: 'Plants', icon: <LocalFloristIcon /> },
  { id: 'rodents', label: 'Rodents', icon: <PetsIcon /> },
  { id: 'wildlife', label: 'Wildlife', icon: <TravelExploreIcon /> },
  { id: 'health', label: 'Health & safety', icon: <HealthAndSafetyIcon /> },
];

const entries: ResourceEntry[] = [
  {
    category: 'animals', title: 'Chickens and turkeys', tags: ['poultry', 'coop', 'biosecurity'],
    summary: 'Use a consistent daily check for posture, breathing, appetite, water use, droppings, injuries, egg changes, and housing conditions.',
    checks: ['Count every bird and investigate isolation or a sudden behavior change.', 'Keep feed and water protected from wild birds and rodents.', 'Separate sick birds when safe and contact a veterinarian for severe, sudden, or flock-wide illness.'],
    source: { label: 'USDA Defend the Flock', href: 'https://www.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock/biosecurity-basics' },
  },
  {
    category: 'animals', title: 'Ducks and waterfowl', tags: ['ducks', 'water', 'housing'],
    summary: 'Clean drinking water, dry resting areas, ventilation, secure nighttime housing, and separation from wild waterfowl are core checks.',
    checks: ['Inspect feet, gait, eyes, nostrils, and feather condition.', 'Prevent standing water around feed and sleeping areas.', 'Treat camera or sensor changes as a prompt to inspect, not as a diagnosis.'],
  },
  {
    category: 'animals', title: 'Goats', tags: ['goats', 'pasture', 'fencing'],
    summary: 'Track appetite, rumination, gait, body condition, manure, water use, and herd behavior against each animal’s normal baseline.',
    checks: ['Check fences, gates, shade, dry shelter, and clean water daily.', 'Use species-appropriate feed and minerals; keep unfamiliar plants out of reach.', 'Contact a livestock veterinarian for bloat, breathing distress, inability to stand, or sudden decline.'],
  },
  {
    category: 'animals', title: 'Rabbits', tags: ['rabbits', 'housing', 'temperature'],
    summary: 'A rabbit that stops eating or producing normal droppings needs prompt attention. Heat, poor ventilation, wet bedding, and stress can become serious quickly.',
    checks: ['Check appetite, droppings, posture, breathing, feet, teeth, and water access.', 'Provide shade and airflow without exposing housing to predators.', 'Use a rabbit-experienced veterinarian for illness or meaningful behavior change.'],
  },
  {
    category: 'animals', title: 'Pigeons and other managed birds', tags: ['pigeons', 'birds', 'loft'],
    summary: 'Good loft records pair identification and return activity with appetite, weight trend, droppings, breathing, and feather condition.',
    checks: ['Quarantine new or returning birds before mixing groups.', 'Keep loft surfaces, feed, and water protected from wild birds and pests.', 'Review unusual absence or activity alerts in person.'],
  },
  {
    category: 'plants', title: 'Garden crops', tags: ['vegetables', 'garden', 'crop'],
    summary: 'Identify the crop and growth stage before setting moisture, temperature, feeding, or harvest thresholds.',
    checks: ['Record variety, planting date, location, and expected harvest window.', 'Inspect leaves, stems, soil moisture, and undersides before acting on a sensor alert.', 'Use local extension guidance because climate and pest pressure vary by region.'],
  },
  {
    category: 'plants', title: 'Weeds and unknown plants', tags: ['weeds', 'identification', 'pasture'],
    summary: 'Do not rely on camera classification alone before pulling, spraying, feeding, composting, or allowing animals into an area.',
    checks: ['Photograph leaves, stems, flowers, fruit, and the whole plant.', 'Confirm identification using more than one feature and a local expert when risk is meaningful.', 'Keep livestock and pets away from unidentified plants.'],
  },
  {
    category: 'plants', title: 'Potentially toxic plants', tags: ['toxic', 'poison', 'pets', 'livestock'],
    summary: 'Toxicity can differ by species, plant part, dose, and preparation. Treat suspected ingestion as a time-sensitive veterinary question.',
    checks: ['Preserve a plant sample or clear photos without delaying care.', 'Record the animal, estimated amount, time, and observed signs.', 'Contact a veterinarian or animal poison service instead of inducing vomiting without instruction.'],
    source: { label: 'ASPCA toxic and non-toxic plant database', href: 'https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants' },
  },
  {
    category: 'rodents', title: 'Hamsters, rats, mice, and gerbils', tags: ['hamster', 'pet rodent', 'camera'],
    summary: 'Use cameras to observe activity, food and water visits, and environmental trends while preserving dark periods, hiding places, and normal behavior.',
    checks: ['Check the animal directly every day; a camera is not a welfare check by itself.', 'Wash hands after handling animals, bedding, food, or enclosure supplies.', 'Seek veterinary help for breathing trouble, injury, marked inactivity, or stopped eating or drinking.'],
    source: { label: 'CDC small mammal guidance', href: 'https://www.cdc.gov/healthy-pets/about/small-mammals.html' },
  },
  {
    category: 'rodents', title: 'Wild rodent signs and prevention', tags: ['wild mice', 'rats', 'pest', 'feed storage'],
    summary: 'Droppings, gnaw marks, nesting material, tracks, and damaged feed containers can appear before a live rodent is seen.',
    checks: ['Remove accessible food, water, and shelter; seal entry points.', 'Keep animal feed in durable closed containers and clean spills.', 'Follow safe cleanup guidance; do not sweep or vacuum dry rodent waste.'],
    source: { label: 'CDC wild rodent control', href: 'https://www.cdc.gov/healthy-pets/rodent-control/index.html' },
  },
  {
    category: 'wildlife', title: 'Observe without approaching', tags: ['wildlife', 'camera', 'distance'],
    summary: 'Use remote cameras, zoom, and physical distance. Never crowd, feed, corner, or attempt to handle wildlife.',
    checks: ['Move back if behavior changes because of your presence.', 'Keep children and domestic animals away from wildlife.', 'Contact local wildlife authorities for injured, trapped, or unusually acting wildlife.'],
    source: { label: 'National Park Service wildlife viewing safety', href: 'https://www.nps.gov/thingstodo/all-about-wildlife-watching-safety.htm' },
  },
  {
    category: 'wildlife', title: 'Protect managed animals from wildlife', tags: ['predators', 'wild birds', 'biosecurity'],
    summary: 'Physical barriers, secure feed, repaired openings, and clean water systems are the primary controls. Detection technology is an additional warning layer.',
    checks: ['Inspect screens, netting, fencing, buried edges, and latches.', 'Remove wildlife access to feed spills, open bins, and nesting spaces.', 'Review camera detections before changing automated deterrent behavior.'],
    source: { label: 'USDA wildlife biosecurity', href: 'https://www.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock/biosecurity-basics/protect-your-birds-wildlife' },
  },
  {
    category: 'health', title: 'Urgent animal warning signs', tags: ['urgent', 'veterinarian', 'emergency'],
    summary: 'Sudden death, breathing distress, severe weakness, inability to stand, neurologic signs, major injury, or several animals becoming ill together require prompt professional help.',
    checks: ['Contact a veterinarian or animal-health authority.', 'Separate affected animals when doing so is safe and reduce unnecessary contact.', 'Record timing, affected animals, recent arrivals, feed changes, and sensor trends.'],
  },
  {
    category: 'health', title: 'Using sensors responsibly', tags: ['sensor', 'limits', 'alerts'],
    summary: 'Temperature, humidity, air quality, cameras, weight, feed, and water data can reveal change. They cannot diagnose disease or prove that an animal is healthy.',
    checks: ['Set limits from species, age, housing, season, and professional guidance.', 'Alert on sustained change and rate of change, not only one reading.', 'Require human review before consequential automated actions.'],
  },
];

const C = { bg: '#0D2B1E', surface: '#153A29', border: '#35634A', text: '#F0EDE4', muted: '#B7C7BF', gold: '#C8B882' };

export default function ResourcesPage() {
  const [category, setCategory] = useState<Category>('animals');
  const [query, setQuery] = useState('');
  const visibleEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return entries.filter((entry) => entry.category === category && (!term || [entry.title, entry.summary, ...entry.tags, ...entry.checks].join(' ').toLowerCase().includes(term)));
  }, [category, query]);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: C.bg, color: C.text, p: { xs: 2, md: 3 } }}>
      <Stack spacing={0.75} sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ color: C.gold, fontWeight: 700 }}>Resources</Typography>
        <Typography sx={{ color: C.muted, maxWidth: 820 }}>
          In-app reference notes for animals, plants, rodents, wildlife, and safe monitoring. Search and expand an entry without leaving your workspace.
        </Typography>
      </Stack>

      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search this library"
        inputProps={{ 'aria-label': 'Search resources' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: C.muted }} /></InputAdornment> }}
        sx={{ maxWidth: 720, mb: 2, input: { color: C.text }, '& .MuiOutlinedInput-root': { bgcolor: C.surface }, '& fieldset': { borderColor: C.border } }}
      />

      <Tabs
        value={category}
        onChange={(_, next: Category) => setCategory(next)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Resource categories"
        sx={{ mb: 2, borderBottom: `1px solid ${C.border}`, '& .MuiTab-root': { color: C.muted }, '& .Mui-selected': { color: `${C.gold} !important` } }}
      >
        {categories.map((item) => <Tab key={item.id} value={item.id} icon={item.icon} iconPosition="start" label={item.label} />)}
      </Tabs>

      {category === 'health' && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: 900 }}>
          Educational reference only. For illness, poisoning, injury, or urgent behavior change, contact a veterinarian or the appropriate local authority.
        </Alert>
      )}

      <Stack spacing={1} sx={{ maxWidth: 900 }}>
        {visibleEntries.map((entry) => (
          <Accordion key={entry.title} disableGutters sx={{ bgcolor: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px !important', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.gold }} />}>
              <Box>
                <Typography sx={{ color: C.gold, fontWeight: 700 }}>{entry.title}</Typography>
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                  {entry.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ color: C.muted, borderColor: C.border }} />)}
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: C.muted, mb: 1.5 }}>{entry.summary}</Typography>
              <Box component="ul" sx={{ pl: 2.5, my: 0, color: C.text }}>
                {entry.checks.map((check) => <li key={check}><Typography sx={{ mb: 0.75 }}>{check}</Typography></li>)}
              </Box>
              {entry.source && (
                <Button href={entry.source.href} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />} sx={{ mt: 1, color: C.gold }}>
                  {entry.source.label}
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
        {!visibleEntries.length && <Typography sx={{ color: C.muted, py: 3 }}>No matching resources in this category.</Typography>}
      </Stack>
    </Box>
  );
}

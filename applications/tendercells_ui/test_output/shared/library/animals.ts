// animals.ts - species health library shared by tendercells.com (/library) and the OS
// (/library in the app, linked from the flock roster). General care education, not
// veterinary advice: every entry says when to call a vet.

export type SpeciesId =
  | 'chicken' | 'duck' | 'turkey' | 'goose' | 'quail' | 'pigeon'
  | 'rabbit' | 'guinea-pig' | 'chinchilla' | 'hamster' | 'rat' | 'mouse'
  | 'goat' | 'sheep' | 'pig' | 'alpaca'
  | 'pond-fish'
  | 'tortoise' | 'turtle' | 'bearded-dragon' | 'leopard-gecko' | 'ball-python';

export type AnimalGroup = 'poultry' | 'small-mammal' | 'livestock' | 'aquatic' | 'reptile';

export const GROUP_LABEL: Record<AnimalGroup, string> = {
  poultry: 'Poultry & birds', 'small-mammal': 'Rabbits & rodents', livestock: 'Livestock',
  aquatic: 'Pond & aquatic', reptile: 'Reptiles',
};

export interface Condition {
  name: string;
  signs: string;
  firstSteps: string;
  vetWhen: string;
}

export interface AnimalSpecies {
  id: SpeciesId;
  name: string;
  emoji: string;
  group: AnimalGroup;
  /** Tender Cells product built for this species (or the build-your-own path). */
  product: string;
  /** Comfortable air temperature range for adults, °F. */
  comfortF: [number, number];
  /** What comfortF measures when it is not air around the animal (water, basking gradient). */
  tempNote?: string;
  /** Normal body temperature where owners commonly check it, °F. */
  bodyTempF?: [number, number];
  lifespanYears: [number, number];
  spacePerAnimal: string;
  dailyChecks: string[];
  warningSigns: string[];
  conditions: Condition[];
  /** Which Tender Cells readings matter most for this species. */
  sensors: string[];
}

export const ANIMALS: AnimalSpecies[] = [
  {
    id: 'chicken', name: 'Chickens', emoji: '🐔', group: 'poultry', product: 'Chicken Tender', comfortF: [45, 80], lifespanYears: [5, 10],
    spacePerAnimal: '4 sq ft inside the coop, 10 sq ft in the run, 8-12 in of roost per bird',
    dailyChecks: ['Clean water and feed', 'Collect eggs (fewer broody hens, fewer egg eaters)', 'Headcount at dusk before the door closes', 'Droppings look normal', 'Everyone is active and eating'],
    warningSigns: ['Hunched, fluffed up, eyes closed during the day', 'Not eating or drinking', 'Pale comb (in a laying hen)', 'Diarrhea, blood in droppings', 'Wheezing, discharge from nose or eyes', 'Standing apart from the flock'],
    conditions: [
      { name: 'Heat stress', signs: 'Panting, wings held away from body, drop in eggs', firstSteps: 'Shade, airflow, cool water; add electrolytes', vetWhen: 'A bird collapses or cannot stand' },
      { name: 'Cold stress / frostbite', signs: 'Huddling, pale or black comb tips', firstSteps: 'Draft-free dry coop with ventilation; do not rub frostbite', vetWhen: 'Tissue turns black and smells or the bird stops eating' },
      { name: 'Respiratory illness', signs: 'Sneezing, rattling breath, swollen face', firstSteps: 'Isolate the bird, check ammonia and ventilation', vetWhen: 'More than one bird is affected - some diseases must be reported' },
      { name: 'Egg binding', signs: 'Straining, sitting in the nest for hours, walking like a penguin', firstSteps: 'Warm quiet place, calcium', vetWhen: 'No egg within a few hours of support' },
      { name: 'Mites and lice', signs: 'Pale comb, feather loss, birds reluctant to roost', firstSteps: 'Inspect at night under wings and vent; clean roosts', vetWhen: 'Heavy infestation or anemia' },
    ],
    sensors: ['Coop temperature', 'Humidity', 'Ammonia', 'Headcount', 'Egg map', 'Feed and water level'],
  },
  {
    id: 'duck', name: 'Ducks', emoji: '🦆', group: 'poultry', product: 'Duck Dock', comfortF: [40, 85], lifespanYears: [8, 12],
    spacePerAnimal: '4-6 sq ft inside, 15 sq ft outside, water deep enough to dunk the whole head',
    dailyChecks: ['Drinking water deep enough to clean eyes and nostrils', 'Fresh bedding (ducks are messy)', 'Collect eggs - ducks often lay early morning', 'Pool water clean', 'Feet and legs'],
    warningSigns: ['Limping or reluctance to walk', 'Crusty or closed eyes', 'Tail bobbing with each breath', 'Wings drooping at an angle', 'Not preening'],
    conditions: [
      { name: 'Bumblefoot', signs: 'Swollen foot pad, limping', firstSteps: 'Soft clean bedding, keep the foot clean and dry', vetWhen: 'Swelling with a black scab or heat - it may need treatment' },
      { name: 'Angel wing', signs: 'Wing feathers point outward (young birds)', firstSteps: 'Lower protein feed; wrap early only with guidance', vetWhen: 'Before wrapping, for a demonstration' },
      { name: 'Niacin deficiency', signs: 'Weak legs in ducklings', firstSteps: 'Add niacin (brewer\'s yeast) to feed', vetWhen: 'No improvement within a few days' },
      { name: 'Eye infection', signs: 'Foamy or closed eyes', firstSteps: 'Clean water to dunk the head in', vetWhen: 'Not better in two days' },
    ],
    sensors: ['Pond / water level and quality', 'Temperature', 'Headcount', 'Egg map'],
  },
  {
    id: 'turkey', name: 'Turkeys', emoji: '🦃', group: 'poultry', product: 'Turkey Tower', comfortF: [40, 80], lifespanYears: [3, 10],
    spacePerAnimal: '6-8 sq ft inside, 25 sq ft outside, high roost bar',
    dailyChecks: ['Water and feed', 'Weight and gait (heavy breeds)', 'Keep apart from chickens if blackhead is a risk'],
    warningSigns: ['Yellow sulfur-colored droppings', 'Lethargy, drooping head', 'Leg problems'],
    conditions: [
      { name: 'Blackhead (histomoniasis)', signs: 'Yellow droppings, lethargy', firstSteps: 'Separate from chickens and their ground', vetWhen: 'Immediately - it spreads and is often fatal' },
      { name: 'Leg problems (heavy breeds)', signs: 'Lameness, sitting a lot', firstSteps: 'Room to exercise, correct feed', vetWhen: 'Sudden lameness or swelling' },
    ],
    sensors: ['Temperature', 'Headcount', 'Feed and water level'],
  },
  {
    id: 'goose', name: 'Geese', emoji: '🪿', group: 'poultry', product: 'Duck Dock', comfortF: [35, 85], lifespanYears: [10, 20],
    spacePerAnimal: '6 sq ft inside; geese are grazers - plenty of grass',
    dailyChecks: ['Grass and grit', 'Water for washing', 'Watch aggression in breeding season'],
    warningSigns: ['Limping', 'Not grazing', 'Nasal discharge'],
    conditions: [
      { name: 'Impaction', signs: 'Eating then not passing droppings; firm crop', firstSteps: 'Remove long stringy grass and fibers from pasture', vetWhen: 'No droppings for a day' },
    ],
    sensors: ['Pasture rotation', 'Water level', 'Headcount'],
  },
  {
    id: 'quail', name: 'Quail', emoji: '🐦', group: 'poultry', product: 'Chicken Tender (quail inserts)', comfortF: [50, 85], lifespanYears: [2, 4],
    spacePerAnimal: '1 sq ft per bird, low ceiling or soft top (they flush upward)',
    dailyChecks: ['Water and game-bird feed', 'Collect eggs daily', 'Watch for pecking'],
    warningSigns: ['Scalping injuries', 'Lethargy', 'Watery droppings'],
    conditions: [
      { name: 'Pecking injuries', signs: 'Bloody head or back', firstSteps: 'Separate the injured bird, add hiding spots, reduce light', vetWhen: 'Deep wounds' },
      { name: 'Ulcerative enteritis', signs: 'Sudden deaths, watery white droppings', firstSteps: 'Isolate, clean litter', vetWhen: 'Immediately' },
    ],
    sensors: ['Temperature', 'Humidity', 'Egg map'],
  },
  {
    id: 'pigeon', name: 'Pigeons', emoji: '🕊️', group: 'poultry', product: 'Pigeon Palace', comfortF: [40, 85], lifespanYears: [10, 15],
    spacePerAnimal: 'About 10 cubic ft of loft per bird, one nest box per pair',
    dailyChecks: ['Water (they suck water up - keep it deep enough)', 'Grit and seed', 'Loft dry and draft-free'],
    warningSigns: ['Fluffed up, not flying', 'Green watery droppings', 'Cheesy yellow spots in the mouth'],
    conditions: [
      { name: 'Canker (trichomoniasis)', signs: 'Yellow cheesy growths in the mouth, trouble swallowing', firstSteps: 'Clean waterers daily', vetWhen: 'For treatment - it spreads through shared water' },
      { name: 'Paramyxovirus', signs: 'Twisted neck, trembling', firstSteps: 'Isolate', vetWhen: 'Immediately' },
    ],
    sensors: ['Loft temperature', 'Entry counts', 'Camera identity'],
  },
  {
    id: 'rabbit', name: 'Rabbits', emoji: '🐇', group: 'small-mammal', product: 'Bunny Burrow', comfortF: [50, 75], bodyTempF: [101, 103], lifespanYears: [8, 12],
    spacePerAnimal: 'At least 12 sq ft of hutch plus daily exercise room',
    dailyChecks: ['Unlimited hay', 'Normal round droppings - fewer or none is an emergency', 'Eating and drinking', 'Heat above 80°F is dangerous'],
    warningSigns: ['No droppings or not eating for 12 hours', 'Hunched in pain, teeth grinding', 'Head tilt', 'Drooling or wet chin', 'Panting, ears hot'],
    conditions: [
      { name: 'GI stasis', signs: 'Small or no droppings, not eating, hunched', firstSteps: 'Offer hay and water', vetWhen: 'Right away - it can be fatal within a day' },
      { name: 'Heat stroke', signs: 'Panting, weakness, hot ears', firstSteps: 'Move to shade and cool (not icy) air', vetWhen: 'Right away' },
      { name: 'Overgrown teeth', signs: 'Drooling, dropping food, weight loss', firstSteps: 'More hay to wear teeth', vetWhen: 'For a dental trim' },
      { name: 'Flystrike', signs: 'Maggots around the tail, dirty bottom', firstSteps: 'Check bottoms daily in warm weather', vetWhen: 'Immediately' },
    ],
    sensors: ['Hutch temperature (heat alerts)', 'Feeder level', 'Water level'],
  },
  // ── rabbits & rodents ──
  {
    id: 'guinea-pig', name: 'Guinea pigs', emoji: '🐹', group: 'small-mammal', product: 'Bunny Burrow', comfortF: [65, 75], bodyTempF: [99, 103], lifespanYears: [5, 8],
    spacePerAnimal: 'At least 7.5 sq ft for two; keep at least two - they are herd animals',
    dailyChecks: ['Fresh vitamin C (they cannot make their own) - leafy greens, pepper, or fortified pellets', 'Unlimited hay', 'Eating, drinking and normal droppings', 'Heat above 80°F is dangerous'],
    warningSigns: ['Not eating or not pooping', 'Sneezing, crusty eyes or nose', 'Rough coat, sore swollen joints, reluctant to move', 'Weight loss (weigh weekly)', 'Hunched, fluffed up, quiet'],
    conditions: [
      { name: 'Scurvy (vitamin C deficiency)', signs: 'Rough coat, swollen joints, bleeding gums, weakness', firstSteps: 'Add vitamin C foods daily', vetWhen: 'Right away if weak or not eating' },
      { name: 'Respiratory infection', signs: 'Sneezing, discharge, noisy breathing', firstSteps: 'Warm draft-free housing, clean bedding', vetWhen: 'Same day - it can turn to pneumonia' },
      { name: 'Bumblefoot', signs: 'Swollen red foot pads', firstSteps: 'Soft clean bedding, no wire floors', vetWhen: 'If sores or limping' },
      { name: 'Heat stroke', signs: 'Panting, drooling, collapse', firstSteps: 'Move to cool shade', vetWhen: 'Right away' },
    ],
    sensors: ['Hutch temperature (heat alerts)', 'Water level', 'Feeder level'],
  },
  {
    id: 'chinchilla', name: 'Chinchillas', emoji: '🐭', group: 'small-mammal', product: 'Bunny Burrow', comfortF: [60, 70], lifespanYears: [10, 20],
    spacePerAnimal: 'Tall multi-level cage, at least 3 ft x 2 ft x 3 ft high',
    dailyChecks: ['Dust bath a few times a week - never a water bath', 'Room stays below 75°F', 'Hay, pellets, water', 'Normal dry droppings'],
    warningSigns: ['Lying on side, panting, red ears (overheating)', 'Drooling or wet chin', 'Few or no droppings', 'Patches of fur missing'],
    conditions: [
      { name: 'Heat stroke', signs: 'Panting, red ears, lethargy above ~80°F', firstSteps: 'Cool room, not ice', vetWhen: 'Immediately' },
      { name: 'Dental disease', signs: 'Drooling, dropping food, weight loss', firstSteps: 'Hay and chew blocks', vetWhen: 'For an exam - roots can overgrow' },
      { name: 'GI stasis', signs: 'Not eating, small or no droppings', firstSteps: 'Offer hay and water', vetWhen: 'Same day' },
    ],
    sensors: ['Room temperature and humidity (keep cool and dry)', 'Water level'],
  },
  {
    id: 'hamster', name: 'Hamsters', emoji: '🐹', group: 'small-mammal', product: 'Bunny Burrow (small-animal insert)', comfortF: [65, 75], lifespanYears: [2, 3],
    spacePerAnimal: 'At least 450 sq in of floor with deep bedding; Syrian hamsters live alone',
    dailyChecks: ['Food, water, wheel use at night', 'Deep bedding for burrowing', 'Dry clean tail area', 'Room above 65°F (cold can trigger torpor)'],
    warningSigns: ['Wet, dirty tail area or diarrhea', 'Not eating or hoarding stops', 'Lumps, swellings, overgrown teeth', 'Cold and unmoving (possible torpor - warm slowly)'],
    conditions: [
      { name: 'Wet tail', signs: 'Wet messy tail, diarrhea, hunched', firstSteps: 'Isolate, keep warm, offer water', vetWhen: 'Immediately - it can kill within 48 hours' },
      { name: 'Overgrown teeth', signs: 'Drooling, not eating', firstSteps: 'Chew toys', vetWhen: 'For a trim' },
    ],
    sensors: ['Room temperature', 'Wheel / activity counter (night)'],
  },
  {
    id: 'rat', name: 'Pet rats', emoji: '🐀', group: 'small-mammal', product: 'Bunny Burrow (small-animal insert)', comfortF: [65, 75], lifespanYears: [2, 3],
    spacePerAnimal: 'At least 2 cubic ft each; keep same-sex pairs or groups',
    dailyChecks: ['Food, water, social time', 'Clean dusty-free bedding (no pine or cedar)', 'Check for lumps weekly', 'Breathing is quiet'],
    warningSigns: ['Sneezing, clicking or wheezing', 'Red staining around eyes or nose (porphyrin)', 'New lumps', 'Head tilt'],
    conditions: [
      { name: 'Respiratory infection (Mycoplasma)', signs: 'Sneezing, noisy breathing, porphyrin staining', firstSteps: 'Low-dust bedding, clean cage, good air', vetWhen: 'Same week; right away if breathing is labored' },
      { name: 'Mammary tumors', signs: 'Lumps under the skin, often belly or armpit', firstSteps: 'Note size and date', vetWhen: 'When found - early removal works best' },
    ],
    sensors: ['Room temperature', 'Ammonia (bedding changes)'],
  },
  {
    id: 'mouse', name: 'Pet mice', emoji: '🐁', group: 'small-mammal', product: 'Bunny Burrow (small-animal insert)', comfortF: [65, 75], lifespanYears: [1, 3],
    spacePerAnimal: 'At least 360 sq in for a small group of females; males often fight',
    dailyChecks: ['Food and water', 'Deep nesting material', 'Everyone active at dusk', 'Low ammonia smell'],
    warningSigns: ['Hunched with fluffed fur', 'Scabs or hair loss (fighting or mites)', 'Labored breathing', 'Lumps'],
    conditions: [
      { name: 'Barbering / fight wounds', signs: 'Bald patches, scabs', firstSteps: 'Separate the bully, add enrichment', vetWhen: 'Infected or deep wounds' },
      { name: 'Respiratory infection', signs: 'Chattering, sneezing', firstSteps: 'Clean low-dust bedding', vetWhen: 'Labored breathing' },
    ],
    sensors: ['Room temperature', 'Ammonia (bedding changes)'],
  },
  {
    id: 'goat', name: 'Goats', emoji: '🐐', group: 'livestock', product: 'Goat Guardian', comfortF: [30, 85], bodyTempF: [101.5, 103.5], lifespanYears: [12, 18],
    spacePerAnimal: '15-20 sq ft sheltered, 200+ sq ft outdoors; keep at least two goats',
    dailyChecks: ['Browse or hay, loose minerals', 'Chewing cud', 'Eyelid color (FAMACHA) weekly for worms', 'Hooves every few weeks'],
    warningSigns: ['Not chewing cud or not eating', 'Bloated left side', 'Pale inner eyelids', 'Temperature outside 101.5-103.5°F', 'Grinding teeth, crying'],
    conditions: [
      { name: 'Bloat', signs: 'Swollen left side, discomfort', firstSteps: 'Walk the goat, remove the feed that caused it', vetWhen: 'Immediately - it can kill within hours' },
      { name: 'Barber pole worm', signs: 'Pale eyelids, bottle jaw, weakness', firstSteps: 'Fecal test and FAMACHA check', vetWhen: 'For a dewormer plan that avoids resistance' },
      { name: 'Hoof rot', signs: 'Limping, bad smell from the hoof', firstSteps: 'Dry ground, trim hooves', vetWhen: 'Several goats limping' },
    ],
    sensors: ['Fence and gate', 'Water level', 'Shelter temperature', 'Pasture rotation'],
  },
  {
    id: 'sheep', name: 'Sheep', emoji: '🐑', group: 'livestock', product: 'Goat Guardian', comfortF: [20, 75], bodyTempF: [101.5, 103.5], lifespanYears: [10, 12],
    spacePerAnimal: '15-20 sq ft sheltered; a few sheep per acre of good pasture; keep at least three',
    dailyChecks: ['Grazing or hay, water, minerals made for sheep (goat minerals have too much copper)', 'Everyone with the flock', 'FAMACHA eyelid check weekly in worm season', 'Shear once a year'],
    warningSigns: ['Separated from the flock', 'Not chewing cud', 'Pale eyelids, bottle jaw', 'Limping', 'Dirty wool at the tail in warm weather'],
    conditions: [
      { name: 'Barber pole worm', signs: 'Pale eyelids, weakness, bottle jaw', firstSteps: 'Fecal test, FAMACHA', vetWhen: 'For a dewormer plan' },
      { name: 'Flystrike', signs: 'Maggots in dirty wool', firstSteps: 'Clip, clean, check daily in summer', vetWhen: 'Immediately' },
      { name: 'Foot rot', signs: 'Limping, smell between the toes', firstSteps: 'Dry ground, foot bath, trim', vetWhen: 'Several limping' },
      { name: 'Copper poisoning', signs: 'Weakness, yellow gums, red urine', firstSteps: 'Remove goat/horse feeds and minerals', vetWhen: 'Immediately' },
    ],
    sensors: ['Fence and gate', 'Water level', 'Pasture rotation', 'Shelter temperature'],
  },
  {
    id: 'pig', name: 'Pigs', emoji: '🐖', group: 'livestock', product: 'Goat Guardian (pen automation)', comfortF: [60, 75], bodyTempF: [101.5, 103.5], lifespanYears: [12, 20],
    spacePerAnimal: 'Dry shelter plus outdoor room; shade and a wallow in summer',
    dailyChecks: ['Water always available - pigs dehydrate fast', 'Shade or mud wallow above 80°F (pigs cannot sweat)', 'Sunscreen or shade for light-skinned pigs', 'Eating eagerly'],
    warningSigns: ['Panting, lying flat in heat', 'Not eating', 'Diamond-shaped red skin patches', 'Scratching, crusty ears', 'Limping'],
    conditions: [
      { name: 'Heat stress', signs: 'Rapid breathing, weakness', firstSteps: 'Shade, wet the skin with cool water', vetWhen: 'Collapse or no improvement' },
      { name: 'Erysipelas', signs: 'Fever, diamond skin lesions, lameness', firstSteps: 'Isolate', vetWhen: 'Right away (vaccine available)' },
      { name: 'Mange', signs: 'Itching, crusty skin and ears', firstSteps: 'Check the whole group', vetWhen: 'For treatment' },
    ],
    sensors: ['Water level (critical)', 'Pen temperature', 'Gate'],
  },
  {
    id: 'alpaca', name: 'Alpacas', emoji: '🦙', group: 'livestock', product: 'Goat Guardian', comfortF: [30, 80], bodyTempF: [99.5, 102], lifespanYears: [15, 20],
    spacePerAnimal: 'Keep at least three; about 5-10 per acre of pasture; open shelter',
    dailyChecks: ['Hay or pasture, water', 'Shared dung pile looks normal', 'Shear yearly before summer', 'Toenails every few months'],
    warningSigns: ['Lying apart from the herd', 'Not eating', 'Weakness or wobbling in the hind legs', 'Heavy breathing in heat'],
    conditions: [
      { name: 'Heat stress', signs: 'Open-mouth breathing, lying down, flared nostrils', firstSteps: 'Shade, fans, hose the belly and legs', vetWhen: 'Right away' },
      { name: 'Meningeal worm', signs: 'Wobbly hind end, head tilt', firstSteps: 'Isolate', vetWhen: 'Immediately (common where deer share pasture)' },
    ],
    sensors: ['Pasture rotation', 'Water level', 'Shelter temperature'],
  },
  // ── pond & aquatic ──
  {
    id: 'pond-fish', name: 'Pond fish (koi, goldfish)', emoji: '🐟', group: 'aquatic', product: 'Duck Dock (pond module)', comfortF: [50, 80], tempNote: 'water temperature', lifespanYears: [10, 25],
    spacePerAnimal: 'About 250 gallons per koi; deeper than 3 ft where ponds freeze',
    dailyChecks: ['Fish active and eating (stop feeding below 50°F water)', 'Water clear, pump and aerator running', 'Test ammonia and nitrite weekly - both should be 0', 'Top up with dechlorinated water'],
    warningSigns: ['Gasping at the surface (low oxygen - worst on hot nights)', 'White spots', 'Frayed fins, red streaks', 'Flashing or rubbing on rocks', 'Dead fish'],
    conditions: [
      { name: 'Oxygen depletion', signs: 'Gasping at the surface at dawn', firstSteps: 'Add aeration now, partial water change', vetWhen: 'Fish still gasping after aeration' },
      { name: 'Ammonia / nitrite poisoning', signs: 'Gasping, red gills, lethargy', firstSteps: 'Partial water change, stop feeding, check filter', vetWhen: 'Losses continue' },
      { name: 'Ich (white spot)', signs: 'Salt-grain white spots, flashing', firstSteps: 'Treat the whole pond per the product label', vetWhen: 'Not improving in a week' },
      { name: 'Fin rot', signs: 'Ragged fins, red edges', firstSteps: 'Improve water quality', vetWhen: 'Spreading to the body' },
    ],
    sensors: ['Water temperature', 'Dissolved oxygen / aerator', 'Water level', 'Pond camera'],
  },
  // ── reptiles ── (always wash hands after handling - reptiles can carry Salmonella;
  // not recommended for children under 5)
  {
    id: 'tortoise', name: 'Tortoises', emoji: '🐢', group: 'reptile', product: 'Custom enclosure (build your own)', comfortF: [70, 100], tempNote: 'cool side to basking spot', lifespanYears: [40, 80],
    spacePerAnimal: 'Outdoor pen or indoor table at least 8 sq ft for a small species; secure from dogs and raccoons',
    dailyChecks: ['UVB light 10-12 hours (or direct sun) plus a basking spot', 'Leafy weeds and greens, calcium dust', 'Shallow water dish', 'Wash hands after handling (Salmonella)'],
    warningSigns: ['Bubbles from the nose, open-mouth breathing', 'Soft or pitted shell', 'Swollen eyes', 'Not eating outside normal brumation'],
    conditions: [
      { name: 'Metabolic bone disease', signs: 'Soft shell, lumpy shell growth, weak legs', firstSteps: 'Fix UVB and calcium', vetWhen: 'For an exam and plan' },
      { name: 'Respiratory infection', signs: 'Nasal bubbles, wheezing, lethargy', firstSteps: 'Raise temperatures to the right range', vetWhen: 'Right away' },
      { name: 'Shell rot', signs: 'Soft, smelly or flaking patches', firstSteps: 'Dry clean substrate', vetWhen: 'For treatment' },
    ],
    sensors: ['Basking and cool-side temperature', 'UVB lamp on/off schedule', 'Humidity'],
  },
  {
    id: 'turtle', name: 'Aquatic turtles', emoji: '🐢', group: 'reptile', product: 'Duck Dock (pond module) or custom tank', comfortF: [75, 95], tempNote: 'water to basking spot', lifespanYears: [20, 40],
    spacePerAnimal: 'About 10 gallons of water per inch of shell, plus a dry basking dock',
    dailyChecks: ['Basking dock with heat and UVB', 'Strong filter; water 75-80°F', 'Eats well (pellets, greens, occasional protein)', 'Wash hands after handling (Salmonella)'],
    warningSigns: ['Swollen closed eyes', 'Swimming lopsided, mucus from the nose', 'Soft shell or white fuzzy patches', 'Not basking'],
    conditions: [
      { name: 'Vitamin A deficiency', signs: 'Swollen eyelids', firstSteps: 'Varied diet with leafy greens', vetWhen: 'For treatment' },
      { name: 'Respiratory infection', signs: 'Lopsided swimming, bubbles, gaping', firstSteps: 'Check water and basking temperatures', vetWhen: 'Right away' },
      { name: 'Shell rot', signs: 'Pitting, soft or smelly patches', firstSteps: 'Clean water, dry basking', vetWhen: 'For treatment' },
    ],
    sensors: ['Water temperature', 'Basking temperature', 'Filter / water level', 'UVB schedule'],
  },
  {
    id: 'bearded-dragon', name: 'Bearded dragons', emoji: '🦎', group: 'reptile', product: 'Custom enclosure (build your own)', comfortF: [75, 105], tempNote: 'cool side to basking spot (nights 65-75°F)', lifespanYears: [8, 12],
    spacePerAnimal: 'Adults need about a 4 ft x 2 ft x 2 ft enclosure',
    dailyChecks: ['Basking spot 95-105°F, strong UVB 12 hours', 'Greens daily, insects dusted with calcium', 'Normal droppings', 'Wash hands after handling (Salmonella)'],
    warningSigns: ['Shaky, twitching or bowed legs', 'Not eating outside brumation', 'Swollen belly, no droppings', 'Mouth open with mucus', 'Yellow crusty skin'],
    conditions: [
      { name: 'Metabolic bone disease', signs: 'Twitching, soft jaw, weak legs', firstSteps: 'Correct UVB and calcium', vetWhen: 'Right away' },
      { name: 'Impaction', signs: 'Straining, no droppings, bloated', firstSteps: 'Warm soak, no loose sand', vetWhen: 'No droppings after a soak' },
      { name: 'Yellow fungus', signs: 'Yellow-brown crusty skin', firstSteps: 'Quarantine, clean enclosure', vetWhen: 'When seen' },
    ],
    sensors: ['Basking and cool-side temperature', 'UVB schedule'],
  },
  {
    id: 'leopard-gecko', name: 'Leopard geckos', emoji: '🦎', group: 'reptile', product: 'Custom enclosure (build your own)', comfortF: [72, 92], tempNote: 'cool side to warm-side floor', lifespanYears: [15, 20],
    spacePerAnimal: 'At least a 36 in x 18 in floor for one adult; hides on warm and cool sides plus a humid hide',
    dailyChecks: ['Warm-side floor 88-92°F', 'Insects dusted with calcium', 'Humid hide for shedding', 'Wash hands after handling (Salmonella)'],
    warningSigns: ['Stuck shed on toes or tail tip', 'Thin tail (fat reserve lost)', 'Not eating, lethargic', 'Soft or bent jaw or legs'],
    conditions: [
      { name: 'Stuck shed', signs: 'Rings of old skin on toes', firstSteps: 'Humid hide, warm soak', vetWhen: 'Toes turning dark' },
      { name: 'Metabolic bone disease', signs: 'Rubbery jaw, weak legs', firstSteps: 'Calcium and D3 supplements', vetWhen: 'Right away' },
      { name: 'Impaction', signs: 'No droppings, bloated', firstSteps: 'Warm soak, no loose substrate', vetWhen: 'No droppings after a soak' },
    ],
    sensors: ['Floor and air temperature', 'Humidity (humid hide)'],
  },
  {
    id: 'ball-python', name: 'Ball pythons', emoji: '🐍', group: 'reptile', product: 'Custom enclosure (build your own)', comfortF: [75, 92], tempNote: 'cool side to warm side; humidity 50-70%', lifespanYears: [20, 30],
    spacePerAnimal: 'Adults need at least a 4 ft x 2 ft enclosure with snug hides',
    dailyChecks: ['Warm side 88-92°F, cool side 75-80°F', 'Humidity 50-70%, fresh water', 'Secure lid (escape-proof)', 'Wash hands after handling (Salmonella)'],
    warningSigns: ['Wheezing, bubbles, mouth open', 'Stuck shed or retained eye caps', 'Tiny moving dots (mites)', 'Weight loss (skipping meals in winter can be normal - weigh monthly)'],
    conditions: [
      { name: 'Respiratory infection', signs: 'Wheezing, mucus, gaping', firstSteps: 'Correct temperatures', vetWhen: 'Right away' },
      { name: 'Mites', signs: 'Black specks, soaking a lot', firstSteps: 'Clean enclosure, quarantine', vetWhen: 'For a safe treatment' },
      { name: 'Scale rot', signs: 'Red or brown blistered belly scales', firstSteps: 'Dry clean substrate', vetWhen: 'For treatment' },
    ],
    sensors: ['Warm and cool side temperature', 'Humidity'],
  },
];

/** Species in one group, in library order. */
export const animalsIn = (g: AnimalGroup) => ANIMALS.filter((a) => a.group === g);

export const animalById = (id: string): AnimalSpecies | undefined => ANIMALS.find((a) => a.id === id);

/** Plants poisonous to these animals - keep them out of runs, pastures and hay. */
export const TOXIC_PLANT_IDS_BY_SPECIES: Partial<Record<SpeciesId, string[]>> = {
  chicken: ['avocado', 'nightshade', 'yew', 'rhubarb-leaves'],
  duck: ['avocado', 'nightshade', 'yew'],
  goat: ['rhododendron', 'yew', 'nightshade', 'oleander'],
  rabbit: ['rhododendron', 'foxglove', 'yew', 'nightshade'],
  'guinea-pig': ['rhododendron', 'foxglove', 'nightshade', 'avocado'],
  chinchilla: ['rhododendron', 'avocado', 'oleander'],
  sheep: ['rhododendron', 'yew', 'oleander', 'nightshade'],
  pig: ['nightshade', 'oleander', 'avocado'],
  alpaca: ['rhododendron', 'yew', 'oleander'],
  tortoise: ['rhododendron', 'oleander', 'foxglove', 'avocado'],
  'bearded-dragon': ['avocado', 'rhubarb-leaves'],
};

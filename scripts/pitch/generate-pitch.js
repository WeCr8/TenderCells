// generate-pitch.js — TenderCells pitch deck generator
// Outputs: one-pager.pptx, four-pager.pptx, investor-deck.pptx
// Run: node generate-pitch.js
// Requires: npm install pptxgenjs

const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// ── Brand colors ──────────────────────────────────────────────────────────────
const C = {
  bg:        '0D2B1E',
  surface:   '1A3D2B',
  accent:    '4A7C59',
  gold:      'C8B882',
  goldLight: 'E8D9A8',
  danger:    'CC3333',
  warning:   'E8A020',
  white:     'F0EDE4',
  gray:      '8A9B8E',
  goldMuted: '8A7D55',
};

const OUT_DIR = path.join(__dirname, '../../docs/pitch');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Shared slide helpers ──────────────────────────────────────────────────────

function bgSlide(prs) {
  const sl = prs.addSlide();
  sl.background = { color: C.bg };
  return sl;
}

function addTitle(sl, text, y = 0.35, size = 36) {
  sl.addText(text, {
    x: 0.4, y, w: 9.2, h: 0.7,
    fontSize: size, bold: true,
    color: C.gold, fontFace: 'Segoe UI',
  });
}

function addSubtitle(sl, text, y = 1.0, size = 16) {
  sl.addText(text, {
    x: 0.4, y, w: 9.2, h: 0.4,
    fontSize: size, color: C.goldLight, fontFace: 'Segoe UI',
    italic: true,
  });
}

function addBody(sl, text, x = 0.4, y = 1.6, w = 9.2, h = 4.5, size = 14) {
  sl.addText(text, {
    x, y, w, h, fontSize: size,
    color: C.white, fontFace: 'Segoe UI',
    valign: 'top', wrap: true,
  });
}

function addAccentBar(sl, x = 0.4, y = 1.05, w = 9.2) {
  sl.addShape('rect', { x, y, w, h: 0.03, fill: { color: C.accent } });
}

function addBullets(sl, items, x = 0.4, y = 1.6, w = 9.2, size = 14) {
  const rows = items.map(txt => ({
    text: txt,
    options: { bullet: { type: 'bullet' }, fontSize: size, color: C.white, fontFace: 'Segoe UI', paraSpaceAfter: 6 },
  }));
  sl.addText(rows, { x, y, w, h: 5.0, valign: 'top' });
}

function addStatBox(sl, label, value, x, y, w = 2.1, h = 1.0) {
  sl.addShape('rect', { x, y, w, h, fill: { color: C.surface }, line: { color: C.accent, width: 1.5 } });
  sl.addText(value, { x, y: y + 0.08, w, h: 0.55, align: 'center', fontSize: 24, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  sl.addText(label, { x, y: y + 0.6, w, h: 0.32, align: 'center', fontSize: 10, color: C.gray, fontFace: 'Segoe UI' });
}

function addFooter(sl, text = 'WeCr8 Solutions · TenderCells™ · wecr8.info · CONFIDENTIAL') {
  sl.addText(text, {
    x: 0.4, y: 7.05, w: 9.2, h: 0.2,
    fontSize: 8, color: C.gray, fontFace: 'Segoe UI', align: 'center',
  });
}

// ── Slide content library ─────────────────────────────────────────────────────

function slideCover(prs, tagline) {
  const sl = bgSlide(prs);
  // Brand mark
  sl.addShape('rect', { x: 0.4, y: 0.4, w: 0.08, h: 2.0, fill: { color: C.accent } });
  sl.addText('TenderCells™', {
    x: 0.65, y: 0.5, w: 8.7, h: 1.1,
    fontSize: 52, bold: true, color: C.gold, fontFace: 'Segoe UI',
  });
  sl.addText(tagline, {
    x: 0.65, y: 1.6, w: 8.7, h: 0.5,
    fontSize: 20, color: C.white, fontFace: 'Segoe UI',
  });
  sl.addShape('rect', { x: 0.65, y: 2.25, w: 8.7, h: 0.03, fill: { color: C.accent } });

  // Product badges row
  const products = ['Chicken Tender™', 'Roaming Roost™', 'WatchTower AI™', 'Duck Dock™'];
  products.forEach((p, i) => {
    const bx = 0.65 + i * 2.35;
    sl.addShape('rect', { x: bx, y: 2.4, w: 2.2, h: 0.45, fill: { color: C.surface }, line: { color: C.accent, width: 1 } });
    sl.addText(p, { x: bx, y: 2.4, w: 2.2, h: 0.45, align: 'center', valign: 'middle', fontSize: 11, color: C.goldLight, fontFace: 'Segoe UI' });
  });

  // Stats row
  addStatBox(sl, 'US Backyard Flocks', '10M+', 0.65, 3.1);
  addStatBox(sl, 'Daily Labor Saved', '30+ min/day', 2.85, 3.1);
  addStatBox(sl, 'Products in Platform', '8+', 5.05, 3.1);
  addStatBox(sl, 'Target MSRP', '$999–$1,499', 7.25, 3.1);

  sl.addText('WeCr8 Solutions  ·  zach@wecr8.info  ·  github.com/WeCr8/TenderCells', {
    x: 0.65, y: 4.3, w: 8.7, h: 0.35, fontSize: 11, color: C.gray, fontFace: 'Segoe UI',
  });
  addFooter(sl);
  return sl;
}

function slideProblem(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'The Problem');
  addAccentBar(sl);
  addBullets(sl, [
    '10M+ backyard chicken owners in the US — flock ownership up 400% since 2020',
    'Average owner spends 30+ minutes per day on manual coop tasks: feeding, watering, cleaning, egg collection',
    'Predators kill 25% of backyard flocks annually — no affordable real-time detection exists',
    'Ammonia buildup, disease spread, and temperature extremes go undetected without continuous monitoring',
    'Existing "smart" coops = timer doors only — zero automation, zero AI, zero robotics',
    'Zero multi-species platform — chicken owners often also keep ducks, rabbits, goats, pigeons',
  ], 0.4, 1.5, 9.2, 13);
  addStatBox(sl, 'Market Size (US)', '$1.2B', 0.4, 5.4);
  addStatBox(sl, 'Flock Deaths / Year', '~2.5M', 2.6, 5.4);
  addStatBox(sl, 'Hours Lost / Year', '180 hrs', 4.8, 5.4);
  addStatBox(sl, 'Avg. Flock Size', '6 birds', 7.0, 5.4);
  addFooter(sl);
  return sl;
}

function slideSolution(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'The Solution');
  addAccentBar(sl);
  sl.addText('Chicken Tender™ — the first fully automated backyard coop', {
    x: 0.4, y: 1.15, w: 9.2, h: 0.5, fontSize: 18, bold: true, color: C.goldLight, fontFace: 'Segoe UI',
  });
  addBullets(sl, [
    '9DOF robot arm (XYZ gantry + 6DOF arm) handles egg collection, cleaning, feeding — 100% coop coverage',
    'AI sensors monitor temp, humidity, ammonia, headcount 24/7 — alerts before disease or heat stress',
    'WatchTower AI™ detects predators via 3-camera vision + LoRa mesh — 500m+ alert radius, no WiFi needed',
    'Roaming Roost™ mobile geodesic dome on mecanum wheels — GPS-fenced grazing, auto-returns on predator alert',
    'TenderCells Cloud™ dashboard — iOS + Android, real-time telemetry, schedules, routines, egg map',
    'Set-and-forget schedules + one-tap routines — no daily manual tasks required',
  ], 0.4, 1.75, 9.2, 13);

  // Feature chips
  const chips = ['Robot Arm', '9DOF Motion', 'Edge AI', 'LoRa Mesh', 'Solar', 'Multi-Species'];
  chips.forEach((c, i) => {
    const bx = 0.4 + (i % 3) * 3.1;
    const by = 5.5 + Math.floor(i / 3) * 0.55;
    sl.addShape('rect', { x: bx, y: by, w: 2.9, h: 0.42, fill: { color: C.surface }, line: { color: C.accent, width: 1 } });
    sl.addText(c, { x: bx, y: by, w: 2.9, h: 0.42, align: 'center', valign: 'middle', fontSize: 12, color: C.accent, fontFace: 'Segoe UI', bold: true });
  });
  addFooter(sl);
  return sl;
}

function slideProduct(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Product: Chicken Tender™');
  addAccentBar(sl);

  // Variants
  const variants = [
    { tier: 'BASE', price: '$599', desc: 'Structure + nesting + roosting + ventilation' },
    { tier: 'AUTO', price: '$849', desc: '+ Motorized doors + environmental monitoring + lighting' },
    { tier: 'PRO', price: '$999–$1,499', desc: '+ Robot arm + rail system + WatchTower AI + cloud' },
  ];
  variants.forEach((v, i) => {
    const bx = 0.4 + i * 3.1;
    sl.addShape('rect', { x: bx, y: 1.5, w: 2.9, h: 2.2, fill: { color: C.surface }, line: { color: i === 2 ? C.gold : C.accent, width: i === 2 ? 2 : 1 } });
    sl.addText(v.tier, { x: bx, y: 1.55, w: 2.9, h: 0.5, align: 'center', fontSize: 18, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    sl.addText(v.price, { x: bx, y: 2.0, w: 2.9, h: 0.45, align: 'center', fontSize: 22, bold: true, color: C.white, fontFace: 'Segoe UI' });
    sl.addText(v.desc, { x: bx + 0.1, y: 2.45, w: 2.7, h: 1.15, align: 'center', valign: 'middle', fontSize: 10, color: C.gray, fontFace: 'Segoe UI', wrap: true });
  });

  // Sizes
  addTitle(sl, 'Sizes: S (3×3×5ft)  ·  M (4×4×6ft)  ·  L (6×6×8ft)', 3.85, 14);
  addAccentBar(sl, 0.4, 4.05, 9.2);
  addTitle(sl, 'Key Specs', 4.15, 14);
  addBullets(sl, [
    'NEMA23 stepper gantry — 100mm/sec, 10kg payload — full interior coverage',
    'DHT22 temp/humidity · MQ-137 ammonia · HX711 load cells (feed + water)',
    'ESP32 MCU + Jetson Nano arm controller + Raspberry Pi 4 MQTT broker',
    'Poop bin cassette system — slides out for weekly removal, no scooping',
  ], 0.4, 4.3, 9.2, 11);
  addFooter(sl);
  return sl;
}

function slideEcosystem(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Product Ecosystem');
  addAccentBar(sl);
  sl.addText('One platform, one app, multiple species', {
    x: 0.4, y: 1.1, w: 9.2, h: 0.4, fontSize: 16, color: C.goldLight, fontFace: 'Segoe UI', italic: true,
  });

  const products = [
    { name: 'Chicken Tender™', size: '4×4×6ft', desc: 'Flagship automated coop' },
    { name: 'Roaming Roost™', size: '3×3×5ft', desc: 'Mobile mecanum dome' },
    { name: 'WatchTower AI™', size: '5ft pole', desc: 'Solar predator monitor' },
    { name: 'Duck Dock™', size: '4×4×6ft', desc: 'Pond + duck automation' },
    { name: 'Bunny Burrow™', size: '3×3×5ft', desc: 'Rabbit habitat' },
    { name: 'Goat Guardian™', size: '6×6×8ft', desc: 'Large animal enclosure' },
    { name: 'Turkey Tower™', size: '4×4×6ft', desc: 'Turkey-specific coop' },
    { name: 'Pigeon Palace™', size: '4×4×6ft', desc: 'Smart pigeon loft' },
  ];

  products.forEach((p, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bx = 0.4 + col * 2.35;
    const by = 1.65 + row * 2.2;
    sl.addShape('rect', { x: bx, y: by, w: 2.2, h: 1.9, fill: { color: C.surface }, line: { color: C.accent, width: 1 } });
    sl.addText(p.name, { x: bx + 0.05, y: by + 0.1, w: 2.1, h: 0.45, align: 'center', fontSize: 11, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    sl.addText(p.size, { x: bx + 0.05, y: by + 0.55, w: 2.1, h: 0.3, align: 'center', fontSize: 10, color: C.accent, fontFace: 'Segoe UI' });
    sl.addText(p.desc, { x: bx + 0.1, y: by + 0.85, w: 2.0, h: 0.8, align: 'center', valign: 'middle', fontSize: 9.5, color: C.gray, fontFace: 'Segoe UI', wrap: true });
  });
  addFooter(sl);
  return sl;
}

function slideTechnology(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Technology Stack');
  addAccentBar(sl);

  // Architecture diagram (text-based)
  const layers = [
    { label: 'Mobile App', detail: 'React Native (Expo) · TypeScript · iOS + Android' },
    { label: 'Backend', detail: 'Firebase Auth · Firestore · Realtime DB · Cloud Functions' },
    { label: 'Control Plane', detail: 'MQTT via Mosquitto on Raspberry Pi 4 — <50ms latency' },
    { label: 'Edge AI', detail: 'ESP32-S3 + TFLite Micro — on-device predator inference' },
    { label: 'Motion', detail: 'NEMA23 + DM542T drivers · Jetson Nano 9DOF controller' },
    { label: 'Mesh Network', detail: 'LoRa SX1276 915MHz · 500m+ range · no WiFi needed' },
  ];

  layers.forEach((l, i) => {
    const by = 1.5 + i * 0.9;
    sl.addShape('rect', { x: 0.4, y: by, w: 2.0, h: 0.72, fill: { color: C.surface }, line: { color: C.accent, width: 1 } });
    sl.addText(l.label, { x: 0.4, y: by, w: 2.0, h: 0.72, align: 'center', valign: 'middle', fontSize: 11, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    sl.addShape('rect', { x: 2.5, y: by + 0.1, w: 7.1, h: 0.52, fill: { color: C.surface } });
    sl.addText(l.detail, { x: 2.6, y: by, w: 6.9, h: 0.72, valign: 'middle', fontSize: 11, color: C.white, fontFace: 'Segoe UI' });
  });

  addTitle(sl, 'Local-first control: motion commands NEVER route through cloud — <50ms response', 6.8, 11);
  addFooter(sl);
  return sl;
}

function slideMarket(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Market Opportunity');
  addAccentBar(sl);
  addStatBox(sl, 'TAM — Global poultry & livestock equipment', '$8B', 0.4, 1.5, 4.5);
  addStatBox(sl, 'SAM — US tech-adopter backyard segment', '$1.2B', 5.1, 1.5, 4.5);

  sl.addShape('rect', { x: 0.4, y: 2.8, w: 9.2, h: 0.03, fill: { color: C.accent } });
  addTitle(sl, 'Why Now?', 2.95, 16);
  addBullets(sl, [
    'Backyard flock ownership up 400% since 2020 (COVID homesteading boom)',
    'ESP32, Jetson Nano, TFLite Micro enable sub-$50 edge AI — first time ROI-positive',
    'LoRa makes predator mesh alerts feasible without WiFi infrastructure',
    'Robot arm costs <$500 now vs $5,000 3 years ago (Chinese manufacturing)',
    'No direct competitor: cooptender.com = $150-300 timer door only, 4,000+ customers',
    'Multi-species expansion (duck, rabbit, goat) adds 4× TAM without new tech stack',
  ], 0.4, 3.3, 9.2, 11);

  addStatBox(sl, 'Year 3 SOM Target', '$24M', 0.4, 6.0);
  addStatBox(sl, 'Units @ $1,200 ASP', '20,000', 2.6, 6.0);
  addStatBox(sl, 'SaaS $19/mo ARR', '$4.6M', 4.8, 6.0);
  addStatBox(sl, 'CAC Target', '<$180', 7.0, 6.0);
  addFooter(sl);
  return sl;
}

function slideBusinessModel(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Business Model');
  addAccentBar(sl);

  // Revenue streams
  const streams = [
    { label: 'Hardware', model: 'Chicken Tender™ unit', price: '$999 MSRP', margin: '~45% gross margin' },
    { label: 'SaaS', model: 'TenderCare subscription', price: '$19/mo/device', margin: '~80% gross margin' },
    { label: 'Add-ons', model: 'Robot arm + WatchTower', price: '$299–$499', margin: '~50% gross margin' },
  ];

  streams.forEach((s, i) => {
    const bx = 0.4 + i * 3.1;
    sl.addShape('rect', { x: bx, y: 1.5, w: 2.9, h: 2.4, fill: { color: C.surface }, line: { color: C.accent, width: 1.5 } });
    sl.addText(s.label, { x: bx, y: 1.55, w: 2.9, h: 0.45, align: 'center', fontSize: 16, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    sl.addText(s.model, { x: bx + 0.1, y: 2.0, w: 2.7, h: 0.4, align: 'center', fontSize: 11, color: C.white, fontFace: 'Segoe UI' });
    sl.addText(s.price, { x: bx, y: 2.4, w: 2.9, h: 0.45, align: 'center', fontSize: 18, bold: true, color: C.goldLight, fontFace: 'Segoe UI' });
    sl.addText(s.margin, { x: bx + 0.1, y: 2.85, w: 2.7, h: 0.4, align: 'center', fontSize: 10, color: C.accent, fontFace: 'Segoe UI' });
  });

  addShape_line(sl);
  addTitle(sl, 'Unit Economics', 4.1, 15);
  addBullets(sl, [
    'LTV per unit (24-month subscription): $1,900  ·  LTV:CAC target ratio > 10×',
    'TenderCare SaaS: AI alerts, health history, cloud schedules, OTA firmware updates',
    'Growth strategy: content/community-led (homesteading YouTube, FFA/4H partnerships)',
    'Open-source core → commercial hardware + SaaS layer (Balances ecosystem vs. moat)',
  ], 0.4, 4.35, 9.2, 11);
  addFooter(sl);
  return sl;
}

function addShape_line(sl) {
  sl.addShape('rect', { x: 0.4, y: 4.0, w: 9.2, h: 0.03, fill: { color: C.accent } });
}

function slideTraction(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Traction & Milestones');
  addAccentBar(sl);

  const milestones = [
    { done: true,  text: 'Chicken Tender™ prototype — 9DOF arm + cleaning system working in sim' },
    { done: true,  text: 'Full-stack app: React Native dashboard, Firebase auth, Firestore, MQTT bridge' },
    { done: true,  text: 'WatchTower AI hardware design complete — ESP32-S3, LoRa, 5W solar' },
    { done: true,  text: 'TenderCells website live — GA4 + AdSense integrated' },
    { done: true,  text: 'Open-source GitHub repository — firmware, app, cloud functions' },
    { done: true,  text: 'Schedules CRUD + safety-gated routine execution (estop, chicken presence checks)' },
    { done: false, text: 'WatchTower AI firmware — camera + TFLite inference + LoRa broadcast' },
    { done: false, text: 'Chicken Tender™ v1 physical prototype — real arm + coop structure' },
    { done: false, text: 'Beta waitlist open — target: 500 signups by Q3 2026' },
    { done: false, text: 'First paying customer — target Q4 2026' },
  ];

  milestones.forEach((m, i) => {
    const by = 1.5 + i * 0.54;
    sl.addText(m.done ? '✓' : '○', { x: 0.4, y: by, w: 0.4, h: 0.45, fontSize: 14, color: m.done ? C.accent : C.gray, fontFace: 'Segoe UI', bold: true });
    sl.addText(m.text, { x: 0.9, y: by, w: 8.7, h: 0.45, fontSize: 11.5, color: m.done ? C.white : C.gray, fontFace: 'Segoe UI' });
  });
  addFooter(sl);
  return sl;
}

function slideCompetition(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Competitive Landscape');
  addAccentBar(sl);

  // Table header
  const cols = ['', 'Automation', 'AI Vision', 'Mobile', 'Multi-Species', 'UX'];
  const colW = [2.5, 1.5, 1.5, 1.5, 1.65, 1.3];
  let cx = 0.4;
  cols.forEach((c, i) => {
    sl.addShape('rect', { x: cx, y: 1.5, w: colW[i], h: 0.45, fill: { color: C.surface } });
    sl.addText(c, { x: cx, y: 1.5, w: colW[i], h: 0.45, align: 'center', valign: 'middle', fontSize: 11, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    cx += colW[i] + 0.05;
  });

  const rows = [
    { co: 'Coop Tender', vals: ['✗ (timer door)', '✗', '✗', '✗', '✓'] },
    { co: 'Farm.bot', vals: ['✓ (crops only)', '✗', '✗', '✗', '✓'] },
    { co: 'DIY Arduino/Pi', vals: ['Partial', '✗', '✗', '✗', '✗'] },
    { co: 'TenderCells™', vals: ['✓', '✓', '✓', '✓', '✓'], highlight: true },
  ];

  rows.forEach((r, ri) => {
    const by = 2.05 + ri * 0.6;
    const fill = r.highlight ? C.surface : (ri % 2 === 0 ? C.surface : C.bg);
    cx = 0.4;
    // Company col
    sl.addShape('rect', { x: cx, y: by, w: colW[0], h: 0.52, fill: { color: fill }, line: r.highlight ? { color: C.accent, width: 1 } : undefined });
    sl.addText(r.co, { x: cx + 0.1, y: by, w: colW[0] - 0.1, h: 0.52, valign: 'middle', fontSize: 12, bold: r.highlight, color: r.highlight ? C.gold : C.white, fontFace: 'Segoe UI' });
    cx += colW[0] + 0.05;
    r.vals.forEach((v, vi) => {
      sl.addShape('rect', { x: cx, y: by, w: colW[vi + 1], h: 0.52, fill: { color: fill }, line: r.highlight ? { color: C.accent, width: 1 } : undefined });
      const isCheck = v === '✓';
      sl.addText(v, { x: cx, y: by, w: colW[vi + 1], h: 0.52, align: 'center', valign: 'middle', fontSize: 12, bold: isCheck, color: isCheck ? C.accent : (v === '✗' ? C.danger : C.gray), fontFace: 'Segoe UI' });
      cx += colW[vi + 1] + 0.05;
    });
  });

  addTitle(sl, 'Only TenderCells combines robot arm + AI vision + mobile enclosure + multi-species platform', 4.7, 13);
  addFooter(sl);
  return sl;
}

function slideTeam(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'Team — WeCr8 Solutions');
  addAccentBar(sl);
  sl.addText('Building at the intersection of robotics, AI, and homesteading', {
    x: 0.4, y: 1.1, w: 9.2, h: 0.4, fontSize: 15, italic: true, color: C.goldLight, fontFace: 'Segoe UI',
  });

  // Founder card
  sl.addShape('rect', { x: 0.4, y: 1.65, w: 4.3, h: 2.2, fill: { color: C.surface }, line: { color: C.accent, width: 1.5 } });
  sl.addText('Zach', { x: 0.5, y: 1.75, w: 4.1, h: 0.6, fontSize: 22, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  sl.addText('Founder & Lead Engineer, WeCr8 Solutions', { x: 0.5, y: 2.3, w: 4.1, h: 0.35, fontSize: 11, color: C.goldLight, fontFace: 'Segoe UI' });
  sl.addText('zach@wecr8.info', { x: 0.5, y: 2.65, w: 4.1, h: 0.3, fontSize: 10, color: C.accent, fontFace: 'Segoe UI' });
  sl.addText('Full-stack: React Native · Firebase · ESP32 · Jetson Nano · Three.js · LoRa · MQTT', {
    x: 0.5, y: 3.0, w: 4.1, h: 0.6, fontSize: 10, color: C.gray, fontFace: 'Segoe UI', wrap: true,
  });

  // Seeking
  sl.addShape('rect', { x: 5.1, y: 1.65, w: 4.5, h: 2.2, fill: { color: C.surface }, line: { color: C.goldMuted, width: 1 } });
  sl.addText('Seeking Co-Founders & Advisors', { x: 5.2, y: 1.75, w: 4.3, h: 0.5, fontSize: 14, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  addBullets(sl, [
    'Hardware / manufacturing partner',
    'AgTech / consumer hardware investor-advisor',
    'Go-to-market / e-commerce operator',
  ], 5.1, 2.25, 4.5, 9);

  // GitHub + links
  addTitle(sl, 'Open-source repo: github.com/WeCr8/TenderCells · Active development June 2026', 4.05, 12);
  addFooter(sl);
  return sl;
}

function slideAsk(prs) {
  const sl = bgSlide(prs);
  addTitle(sl, 'The Ask');
  addAccentBar(sl);

  sl.addText('Raising: Seed Round', {
    x: 0.4, y: 1.15, w: 9.2, h: 0.5, fontSize: 22, bold: true, color: C.gold, fontFace: 'Segoe UI',
  });

  // Use of funds
  const uses = [
    { pct: '40%', use: 'Hardware Manufacturing', detail: 'Chicken Tender™ v1 production run — 100 units' },
    { pct: '25%', use: 'Software & AI', detail: 'App polish, TFLite model training, cloud infra' },
    { pct: '20%', use: 'Team', detail: 'Firmware/hardware engineering hire' },
    { pct: '15%', use: 'Sales & Marketing', detail: 'Waitlist activation, content, FFA/4H partnerships' },
  ];

  uses.forEach((u, i) => {
    const bx = 0.4 + (i % 2) * 4.65;
    const by = 1.85 + Math.floor(i / 2) * 1.6;
    sl.addShape('rect', { x: bx, y: by, w: 4.4, h: 1.4, fill: { color: C.surface }, line: { color: C.accent, width: 1 } });
    sl.addText(u.pct, { x: bx + 0.1, y: by + 0.1, w: 0.8, h: 1.0, valign: 'middle', fontSize: 26, bold: true, color: C.gold, fontFace: 'Segoe UI' });
    sl.addText(u.use, { x: bx + 0.95, y: by + 0.1, w: 3.3, h: 0.5, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
    sl.addText(u.detail, { x: bx + 0.95, y: by + 0.6, w: 3.3, h: 0.6, fontSize: 10, color: C.gray, fontFace: 'Segoe UI', wrap: true });
  });

  // Targets
  addTitle(sl, 'Target: 100 units shipped by Q2 2027  ·  500 beta waitlist by Q3 2026', 5.2, 13);
  sl.addShape('rect', { x: 0.4, y: 5.55, w: 9.2, h: 0.03, fill: { color: C.accent } });
  sl.addText('Contact: zach@wecr8.info  ·  wecr8.info  ·  github.com/WeCr8/TenderCells', {
    x: 0.4, y: 5.7, w: 9.2, h: 0.4, align: 'center', fontSize: 13, color: C.goldLight, fontFace: 'Segoe UI',
  });
  addFooter(sl);
  return sl;
}

// ── ONE-PAGER ─────────────────────────────────────────────────────────────────

function buildOnePager() {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';
  prs.title = 'TenderCells One-Pager';
  prs.author = 'WeCr8 Solutions';

  const sl = bgSlide(prs);

  // Left column: problem + solution
  sl.addShape('rect', { x: 0.3, y: 0.3, w: 0.06, h: 7.0, fill: { color: C.accent } });

  sl.addText('TenderCells™', { x: 0.55, y: 0.3, w: 5.5, h: 0.8, fontSize: 36, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  sl.addText('AI-Powered Automated Animal Care Platform', { x: 0.55, y: 1.05, w: 5.5, h: 0.4, fontSize: 14, color: C.goldLight, fontFace: 'Segoe UI', italic: true });

  sl.addShape('rect', { x: 0.55, y: 1.5, w: 5.5, h: 0.03, fill: { color: C.accent } });

  sl.addText('PROBLEM', { x: 0.55, y: 1.6, w: 5.5, h: 0.35, fontSize: 12, bold: true, color: C.accent, fontFace: 'Segoe UI' });
  sl.addText([
    { text: '10M+ ', options: { bold: true, color: C.gold } },
    { text: 'US backyard flock owners spend ', options: { color: C.white } },
    { text: '30+ min/day ', options: { bold: true, color: C.gold } },
    { text: 'on manual coop tasks. Predators kill ', options: { color: C.white } },
    { text: '25% of flocks ', options: { bold: true, color: C.gold } },
    { text: 'annually. No integrated smart solution exists.', options: { color: C.white } },
  ], { x: 0.55, y: 1.95, w: 5.5, h: 0.85, fontSize: 12, fontFace: 'Segoe UI', wrap: true });

  sl.addText('SOLUTION', { x: 0.55, y: 2.9, w: 5.5, h: 0.35, fontSize: 12, bold: true, color: C.accent, fontFace: 'Segoe UI' });
  sl.addText([
    { text: 'Chicken Tender™ ', options: { bold: true, color: C.gold } },
    { text: '— the first fully automated backyard coop. 9DOF robot arm (XYZ gantry + 6DOF arm), AI sensors, WatchTower AI predator detection, Roaming Roost mobile dome, and mobile dashboard. Set-and-forget.', options: { color: C.white } },
  ], { x: 0.55, y: 3.25, w: 5.5, h: 0.95, fontSize: 12, fontFace: 'Segoe UI', wrap: true });

  sl.addText('PRODUCTS', { x: 0.55, y: 4.3, w: 5.5, h: 0.35, fontSize: 12, bold: true, color: C.accent, fontFace: 'Segoe UI' });
  const plist = ['Chicken Tender™  $999', 'WatchTower AI™  $299', 'Roaming Roost™  TBD', '+5 more species'];
  plist.forEach((p, i) => {
    sl.addText('· ' + p, { x: 0.65, y: 4.65 + i * 0.35, w: 5.3, h: 0.3, fontSize: 11, color: C.white, fontFace: 'Segoe UI' });
  });

  // Right column: metrics + ask
  sl.addShape('rect', { x: 6.2, y: 0.3, w: 3.5, h: 7.0, fill: { color: C.surface } });

  sl.addText('KEY METRICS', { x: 6.3, y: 0.4, w: 3.3, h: 0.4, align: 'center', fontSize: 11, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  sl.addShape('rect', { x: 6.3, y: 0.78, w: 3.3, h: 0.03, fill: { color: C.accent } });

  const metrics = [
    ['$8B', 'Global TAM'],
    ['$1.2B', 'US SAM'],
    ['$24M', 'Year 3 SOM'],
    ['$19/mo', 'SaaS per device'],
    ['45%', 'HW Gross Margin'],
    ['80%', 'SaaS Gross Margin'],
    ['<$180', 'Target CAC'],
    ['$1,900', 'LTV per unit (24mo)'],
  ];
  metrics.forEach(([val, label], i) => {
    const by = 0.95 + i * 0.74;
    sl.addText(val, { x: 6.3, y: by, w: 3.3, h: 0.45, align: 'center', fontSize: 20, bold: true, color: C.goldLight, fontFace: 'Segoe UI' });
    sl.addText(label, { x: 6.3, y: by + 0.4, w: 3.3, h: 0.28, align: 'center', fontSize: 9, color: C.gray, fontFace: 'Segoe UI' });
  });

  sl.addShape('rect', { x: 6.3, y: 6.65, w: 3.3, h: 0.03, fill: { color: C.gold } });
  sl.addText('zach@wecr8.info\nwecr8.info · github.com/WeCr8/TenderCells', {
    x: 6.3, y: 6.7, w: 3.3, h: 0.5, align: 'center', fontSize: 8.5, color: C.goldLight, fontFace: 'Segoe UI',
  });

  addFooter(sl);
  const out = path.join(OUT_DIR, 'TenderCells_One_Pager.pptx');
  prs.writeFile({ fileName: out }).then(() => console.log('✓ One-pager:', out));
}

// ── FOUR-PAGER ────────────────────────────────────────────────────────────────

function buildFourPager() {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';
  prs.title = 'TenderCells 4-Page Overview';
  prs.author = 'WeCr8 Solutions';

  slideCover(prs, 'AI-Powered Automated Animal Care — Chicken Tender™ + Roaming Roost™ + WatchTower AI™');
  slideProblem(prs);

  // Slide 3: Solution + Tech combined
  const sl3 = bgSlide(prs);
  addTitle(sl3, 'Solution & Technology');
  addAccentBar(sl3);
  // Left: solution
  sl3.addText('What We Built', { x: 0.4, y: 1.15, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: C.goldLight, fontFace: 'Segoe UI' });
  const solBullets = [
    '9DOF robot arm — 100% coop coverage',
    'AI sensor suite — temp, humidity, ammonia, headcount',
    'WatchTower AI — 3-cam predator detection + LoRa',
    'Roaming Roost — mecanum mobile dome + GPS fence',
    'Mobile dashboard — schedules, routines, egg map',
  ];
  solBullets.forEach((b, i) => {
    sl3.addText('▸ ' + b, { x: 0.4, y: 1.6 + i * 0.5, w: 4.5, h: 0.45, fontSize: 11, color: C.white, fontFace: 'Segoe UI' });
  });
  // Right: tech stack
  sl3.addShape('rect', { x: 5.1, y: 1.15, w: 4.5, h: 0.03, fill: { color: C.accent } });
  sl3.addText('Tech Stack', { x: 5.1, y: 1.2, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: C.goldLight, fontFace: 'Segoe UI' });
  const techLines = ['React Native · TypeScript · Expo', 'Firebase Auth · Firestore · Cloud Functions', 'MQTT · Mosquitto · Raspberry Pi 4', 'ESP32 + TFLite Micro · Edge AI', 'NEMA23 + DM542T · Jetson Nano 9DOF', 'LoRa SX1276 915MHz · 500m mesh'];
  techLines.forEach((t, i) => {
    sl3.addText(t, { x: 5.1, y: 1.65 + i * 0.5, w: 4.5, h: 0.42, fontSize: 11, color: C.white, fontFace: 'Segoe UI' });
  });
  addFooter(sl3);

  // Slide 4: Market + Business Model + Ask
  const sl4 = bgSlide(prs);
  addTitle(sl4, 'Market, Model & Ask');
  addAccentBar(sl4);
  addStatBox(sl4, 'TAM', '$8B', 0.4, 1.5, 2.0);
  addStatBox(sl4, 'SAM', '$1.2B', 2.5, 1.5, 2.0);
  addStatBox(sl4, 'SOM Yr3', '$24M', 4.6, 1.5, 2.0);
  addStatBox(sl4, 'LTV/unit', '$1,900', 6.7, 1.5, 2.8);

  sl4.addText('Revenue Streams', { x: 0.4, y: 2.85, w: 9.2, h: 0.4, fontSize: 14, bold: true, color: C.goldLight, fontFace: 'Segoe UI' });
  addBullets(sl4, ['Hardware: $999 MSRP · ~45% gross margin', 'SaaS: TenderCare $19/mo/device · ~80% gross margin', 'Add-ons: WatchTower AI $299 · Robot arm $399'], 0.4, 3.25, 9.2, 11);

  sl4.addText('The Ask', { x: 0.4, y: 4.5, w: 9.2, h: 0.4, fontSize: 14, bold: true, color: C.gold, fontFace: 'Segoe UI' });
  addBullets(sl4, ['40% manufacturing · 25% software/AI · 20% team · 15% sales/marketing', 'Target: 100 units shipped by Q2 2027 · 500 waitlist Q3 2026', 'Contact: zach@wecr8.info · wecr8.info'], 0.4, 4.9, 9.2, 11);
  addFooter(sl4);

  const out = path.join(OUT_DIR, 'TenderCells_Four_Pager.pptx');
  prs.writeFile({ fileName: out }).then(() => console.log('✓ Four-pager:', out));
}

// ── FULL INVESTOR DECK (12 slides) ────────────────────────────────────────────

function buildInvestorDeck() {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';
  prs.title = 'TenderCells Investor Pitch Deck';
  prs.author = 'WeCr8 Solutions';
  prs.subject = 'Seed Round — AI-Powered Animal Care Platform';

  slideCover(prs, 'AI-Powered Automated Animal Care — Robot Arm · Edge AI · Multi-Species Platform');
  slideProblem(prs);
  slideSolution(prs);
  slideProduct(prs);
  slideEcosystem(prs);
  slideTechnology(prs);
  slideMarket(prs);
  slideBusinessModel(prs);
  slideTraction(prs);
  slideCompetition(prs);
  slideTeam(prs);
  slideAsk(prs);

  const out = path.join(OUT_DIR, 'TenderCells_Investor_Deck.pptx');
  prs.writeFile({ fileName: out }).then(() => console.log('✓ Investor deck:', out));
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('Generating TenderCells pitch decks...');
buildOnePager();
buildFourPager();
buildInvestorDeck();

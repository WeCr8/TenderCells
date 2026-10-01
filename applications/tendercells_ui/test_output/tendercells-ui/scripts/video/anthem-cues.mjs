#!/usr/bin/env node
// anthem-cues.mjs - builds the demo video's editing files from ONE timing file,
// docs/video/anthem-cues.json (song sections, lyric lines, shots), so the script,
// captions and markers can never drift apart.
//
// Writes into docs/video/:
//   DEMO_VIDEO_SCRIPT.md        shot-by-shot script, timed to the Tender Cells Anthem
//   tender-cells-anthem.srt     lyric captions (any editor / YouTube)
//   tender-cells-anthem.lrc     timed lyrics (music players, CapCut)
//   tender-cells-anthem.ass     lyrics + on-screen titles, styled (ffmpeg / Aegisub)
//   anthem-markers.csv          section + shot markers (timeline markers)
//
// Usage: npm run video:cues            (write)
//        npm run video:cues -- --check (fail if the files are stale; for CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '../../../../../../docs/video');
const cues = JSON.parse(readFileSync(resolve(DIR, 'anthem-cues.json'), 'utf8'));

// ── time formats ─────────────────────────────────────────────────────────────
const pad = (n, w = 2) => String(n).padStart(w, '0');
const split = (t) => { const ms = Math.round(t * 1000); return { m: Math.floor(ms / 60000), s: Math.floor(ms / 1000) % 60, ms: ms % 1000 }; };
const mmss = (t) => { const { m, s, ms } = split(Math.round(t * 10) / 10); return `${m}:${pad(s)}.${Math.round(ms / 100)}`; };
const srtTime = (t) => { const { m, s, ms } = split(t); return `00:${pad(m)}:${pad(s)},${pad(ms, 3)}`; };
const lrcTime = (t) => { const { m, s, ms } = split(t); return `${pad(m)}:${pad(s)}.${pad(Math.floor(ms / 10))}`; };
const assTime = (t) => { const { m, s, ms } = split(t); return `0:${pad(m)}:${pad(s)}.${pad(Math.floor(ms / 10))}`; };
const tc = (t, fps = 30) => { const { m, s, ms } = split(t); return `00:${pad(m)}:${pad(s)}:${pad(Math.floor((ms / 1000) * fps))}`; };
const md = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' / ');

// ── validation: the timeline has no gaps or overlaps ─────────────────────────
function validate() {
  const errs = [];
  const shots = cues.shots;
  if (shots[0].start !== 0) errs.push('first shot must start at 0');
  if (Math.abs(shots.at(-1).end - cues.durationSec) > 0.05) errs.push('last shot must end at the song end');
  shots.forEach((s, i) => {
    if (s.end <= s.start) errs.push(`${s.id} ends before it starts`);
    if (i && Math.abs(shots[i - 1].end - s.start) > 0.011) errs.push(`gap/overlap before ${s.id}`);
    if (s.app !== 'card' && !s.route?.startsWith('/')) errs.push(`${s.id} needs a route`);
  });
  cues.lines.forEach((l, i) => { if (i && l.start < cues.lines[i - 1].end - 0.011) errs.push(`lyric overlap at ${mmss(l.start)}`); });
  if (errs.length) throw new Error(`anthem-cues.json:\n  ${errs.join('\n  ')}`);
}

// ── outputs ──────────────────────────────────────────────────────────────────
const srt = () => cues.lines.map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end - 0.05)}\n${l.text}\n`).join('\n');

const lrc = () => [
  `[ti:Tender Cells Anthem]`, `[ar:${cues.artist}]`, `[length:${mmss(cues.durationSec).slice(0, -2)}]`,
  ...cues.lines.map((l) => `[${lrcTime(l.start)}]${l.text}`), `[${lrcTime(cues.durationSec - 4.5)}]`,
].join('\n') + '\n';

const ass = () => {
  const esc = (s) => s.replace(/\n/g, '\\N');
  const head = `[Script Info]
Title: Tender Cells Anthem - demo video
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Lyric,DejaVu Sans,54,&H00E4EDF0,&H00E4EDF0,&H001E2B0D,&H961E2B0D,-1,0,0,0,100,100,0,0,3,2,0,2,120,120,60,1
Style: Title,DejaVu Sans,64,&H0082B8C8,&H0082B8C8,&H001E2B0D,&HB41E2B0D,-1,0,0,0,100,100,1,0,3,3,0,8,120,120,70,1
Style: Card,DejaVu Sans,84,&H0082B8C8,&H0082B8C8,&H001E2B0D,&H001E2B0D,-1,0,0,0,100,100,2,0,1,0,0,5,120,120,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lyr = cues.lines.map((l) => `Dialogue: 1,${assTime(l.start)},${assTime(l.end - 0.05)},Lyric,,0,0,0,,${esc(l.text)}`);
  const titles = cues.shots.filter((s) => s.onScreen).map((s) =>
    `Dialogue: 2,${assTime(s.start)},${assTime(s.end - 0.05)},${s.app === 'card' ? 'Card' : 'Title'},,0,0,0,,{\\fad(120,120)}${esc(s.onScreen)}`);
  return head + [...titles, ...lyr].join('\n') + '\n';
};

const markers = () => ['type,name,start,end,start_tc_30fps,notes',
  ...cues.sections.map((s) => `section,"${s.name}",${s.start.toFixed(2)},${s.end.toFixed(2)},${tc(s.start)},`),
  ...cues.shots.map((s) => `shot,${s.id},${s.start.toFixed(2)},${s.end.toFixed(2)},${tc(s.start)},"${(s.app === 'card' ? 'CARD' : `${s.app.toUpperCase()} ${s.route} [${s.action}]`).replace(/"/g, "'")}"`),
].join('\n') + '\n';

function script() {
  const out = [];
  out.push(`# Demo video script: the Tender Cells Anthem

> Generated from [\`anthem-cues.json\`](anthem-cues.json) by \`npm run video:cues\` (in \`tendercells-ui\`). Edit the JSON, not this file.

**Song:** [Tender Cells Anthem](tender-cells-anthem.mp3) by ${cues.artist}. Length ${mmss(cues.durationSec)}, about **${cues.bpm} BPM**, so one bar is ${(240 / cues.bpm).toFixed(2)} s. The first beat is at ${cues.firstBeatSec.toFixed(2)} s.

**Format:** 16:9, 1920×1080, 30 fps. The whole song is the video.

**Audio: the song only.** No voice-over, narration, app sounds or sound effects. There is no closed-caption or lyric overlay track; the song and moving pictures carry the story. Any spoken explanation belongs in a separate video.

**Rules for the edit:**
- **Every screen is the real demo** (\`/app/demo\` in the OS, or the website). Keep the "Simulation" / "simulated" labels visible. Never show a simulated robot as real hardware.
- **Cut on the downbeat.** Snap each cut to the nearest bar line in your editor.
- **Motion first.** Every UI take includes a deliberate orbit, push, scroll, pointer move, control change, or simulated event. Never hold a browser screenshot for a lyric.
- **No closed captions.** SRT/LRC/ASS files are timing references only and are not imported or burned into the film. Brief product-name or end-card graphics are editorial titles, not lyric transcription.
- **Timing.** ${cues.timingNote}
- **No claims the product can't back up.** The bridge lyric "From California out to Texas" plays over the property map, with no pins or claims about where customers are.

## Files

| File | Use |
|---|---|
| \`tender-cells-anthem.mp3\` | The song (the master audio) |
| \`tender-cells-anthem.srt\` | Lyric timing reference only; do not import into the film |
| \`tender-cells-anthem.lrc\` | Timed lyrics |
| \`tender-cells-anthem.ass\` | Lyrics plus on-screen titles, styled in the brand colours (ffmpeg / Aegisub) |
| \`anthem-markers.csv\` | Section and shot markers with 30 fps timecodes |

To record every motion take and assemble a caption-free review film with the song, run \`npm run video:shots\` and then \`npm run video:roughcut\` (see the end of this page).

## Story

${cues.story}

Stock clips and source takes are specified per shot in the JSON. Render the stock-inclusive story cut with \`python scripts/video/render-story.py\` from the repository root.

## Song structure

| Section | Start | End | Length |
|---|---|---|---|
${cues.sections.map((s) => `| ${s.name} | ${mmss(s.start)} | ${mmss(s.end)} | ${(s.end - s.start).toFixed(1)} s |`).join('\n')}
`);
  for (const sec of cues.sections) {
    const shots = cues.shots.filter((s) => s.start < sec.end - 0.01 && s.end > sec.start + 0.01);
    out.push(`## ${sec.name} (${mmss(sec.start)}–${mmss(sec.end)})\n`);
    out.push('| Time | Lyric | Shot | Screen | On-screen text | Visual |');
    out.push('|---|---|---|---|---|---|');
    for (const s of shots) {
      const lyr = cues.lines.filter((l) => l.start < s.end - 0.01 && l.end > s.start + 0.01).map((l) => md(l.text));
      const screen = s.stock ? `Stock: ${s.stock}` : s.app === 'card' ? 'Title card' : `${s.app === 'web' ? 'Website' : 'OS'} \`${s.route}\`${s.action && s.action !== 'page' ? ` · ${s.action}` : ''}`;
      out.push(`| ${mmss(s.start)}–${mmss(s.end)} | ${lyr.join(' / ') || '*(instrumental)*'} | ${s.id} | ${screen} | ${md(s.onScreen || '')} | ${md(s.visual || '')} |`);
    }
    out.push('');
  }
  out.push(`## Capture and rough cut

\`\`\`bash
# In applications/tendercells_ui/test_output/tendercells-ui, with the OS on :5173 and the website on :5176:
npm run video:shots      # records one clip per shot (Playwright, 1920x1080) into video-out/shots/
npm run video:roughcut   # trims motion clips and adds the song only -> video-out/tender-cells-anthem-film.mp4
\`\`\`

Screen actions used above:

| Action | What it does |
|---|---|
| \`page\` | Open the page and perform a smooth editorial scroll or pointer move. |
| \`hero3d\` / \`hero2d\` | The simulated Property Twin at the top of \`/demo\`, in 3D or 2D. |
| \`viewer\` / \`viewer2d\` | The page's 3D viewer, with the autonomous-farm panel, in 3D or 2D top view. |
| \`trigger\` | The event simulator runs its predator event. |

Instrumental cards (\`CARD\`) use the rendered 3D property film in the automated cut. Add only a minimal opening identity and final URL in Premiere Pro.
`);
  return out.join('\n');
}

validate();
const files = {
  'DEMO_VIDEO_SCRIPT.md': script(),
  'tender-cells-anthem.srt': srt(),
  'tender-cells-anthem.lrc': lrc(),
  'tender-cells-anthem.ass': ass(),
  'anthem-markers.csv': markers(),
};
const check = process.argv.includes('--check');
let stale = 0;
for (const [name, text] of Object.entries(files)) {
  const p = resolve(DIR, name);
  if (check) { if (!existsSync(p) || readFileSync(p, 'utf8') !== text) { console.error(`stale: docs/video/${name}`); stale++; } }
  else writeFileSync(p, text);
}
if (check && stale) { console.error('Run: npm run video:cues'); process.exit(1); }
console.log(check ? 'video cues are up to date' : `wrote ${Object.keys(files).length} files to docs/video (${cues.shots.length} shots, ${cues.lines.length} lyric lines)`);

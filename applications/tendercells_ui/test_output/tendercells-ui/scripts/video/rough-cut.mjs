#!/usr/bin/env node
// Assembles a clean, caption-free anthem film from captured motion takes.
// (capture-anthem-shots.mjs), timed to docs/video/anthem-cues.json: every clip trimmed to its
// slot, title cards as text on black, the Tender Cells Anthem as the soundtrack, and the
// Lyric timing files remain production references and are never mapped into this render.
//
// Usage: npm run video:roughcut [-- --size 1280x720]
// Env:   FFMPEG (path to ffmpeg with libass; default "ffmpeg")
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '../../../../../../');
const DOCS = resolve(ROOT, 'docs/video');
const OUT = resolve(here, '../../video-out');
const SHOTS = resolve(OUT, 'shots');
const SEG = resolve(OUT, 'segments');
const FF = process.env.FFMPEG || 'ffmpeg';
const cues = JSON.parse(readFileSync(resolve(DOCS, 'anthem-cues.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(SHOTS, 'manifest.json'), 'utf8'));
const i = process.argv.indexOf('--size');
const [W, H] = (i > 0 ? process.argv[i + 1] : '1920x1080').split('x').map(Number);
const FPS = 30;
const brandFilm = resolve(ROOT, 'applications/tendercells_ui/test_output/website/public/assets/videos/tendercells-threejs-demo.mp4');

mkdirSync(SEG, { recursive: true });
const ff = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const enc = ['-an', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p'];
const fit = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`;

// Frame-accurate slot lengths (cumulative rounding, so the edit never drifts from the song).
const frameAt = (t) => Math.round(t * FPS);
const list = [];
for (const s of cues.shots) {
  const frames = frameAt(s.end) - frameAt(s.start);
  const out = resolve(SEG, `${s.id}.mp4`);
  const m = manifest[s.id];
  if (s.app === 'card' && existsSync(brandFilm)) {
    // Keep instrumental breaks moving; product names are sung and need no transcript.
    ff(['-stream_loop', '-1', '-i', brandFilm, '-vf', `${fit},fps=${FPS}`, '-frames:v', String(frames), ...enc, out]);
  } else if (!m || !existsSync(resolve(SHOTS, m.file))) {
    console.warn(`${s.id}: no motion take captured - using a brand-color hold`);
    ff(['-f', 'lavfi', '-i', `color=c=0x0D2B1E:s=${W}x${H}:r=${FPS}`, '-frames:v', String(frames), ...enc, out]);
  } else {
    ff(['-ss', String(m.leadSec), '-i', resolve(SHOTS, m.file), '-vf', `${fit},fps=${FPS},tpad=stop_mode=clone:stop_duration=5`,
      '-frames:v', String(frames), ...enc, out]);
  }
  list.push(`file '${out}'`);
}
writeFileSync(resolve(SEG, 'list.txt'), list.join('\n') + '\n');
const silent = resolve(OUT, 'anthem-picture.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', resolve(SEG, 'list.txt'), '-c', 'copy', silent]);

// Song only. No subtitle stream, lyric overlay, or closed-caption track is emitted.
const final = resolve(OUT, 'tender-cells-anthem-film.mp4');
ff(['-i', silent, '-i', resolve(DOCS, cues.audio), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final]);
console.log(`Caption-free film: ${final}`);

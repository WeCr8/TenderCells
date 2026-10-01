// StepFigure.tsx - the instruction image for one Builder step: the asset (illustrated fallback
// until reference-checked art is published) with its cues drawn on top - a target ring, an
// arrow, a path, ✓ / ✕, a measure, power-off or tool mark - each with a text label, so no
// cue relies on colour alone. A step with its own page image (image.step_asset, e.g. a concept
// book page) shows that image with the cues listed under it; concept art is labelled as such.
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { BuilderStep, ImageCueType } from '../types';
import { assetFor, assetUrl } from '../lib/assets';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4', danger: '#CC3333', warning: '#E8A020' };
const CUE: Record<ImageCueType, { glyph: string; words: string; color: string }> = {
  target: { glyph: '◎', words: 'Look here', color: C.gold },
  arrow: { glyph: '➜', words: 'Move / place', color: C.gold },
  rotate: { glyph: '⟳', words: 'Rotate', color: C.gold },
  path: { glyph: '⇢', words: 'Follow the path', color: C.gold },
  correct: { glyph: '✓', words: 'Correct', color: '#6BBF59' },
  incorrect: { glyph: '✕', words: 'Not this way', color: C.danger },
  measure: { glyph: '📏', words: 'Measure / compare', color: C.gold },
  power_off: { glyph: '⏻', words: 'Power off', color: C.warning },
  tool: { glyph: '🛠', words: 'Tool', color: C.gold },
};

export default function StepFigure({ step, concept = false }: { step: BuilderStep; concept?: boolean }) {
  const asset = assetFor(step.image?.base_asset ?? step.parts?.[0]?.asset_id);
  const cues = step.image?.cues ?? [];
  const page = step.image?.step_asset;
  if (page) {
    return (
      <Box component="figure" data-testid="step-figure" sx={{ m: 0, position: 'relative', bgcolor: C.bg, border: `1px solid ${C.accent}`, borderRadius: 2, p: 1 }}>
        <Box component="img" src={assetUrl(page)} data-testid="step-image" loading="lazy"
          alt={`${step.action}: ${asset?.label ?? 'step illustration'}${cues.length ? ` - ${cues.map((c) => c.label ?? CUE[c.type].words).join(', ')}` : ''}`}
          sx={{ display: 'block', width: '100%', maxHeight: { xs: 360, sm: 520 }, objectFit: 'contain', borderRadius: 1, bgcolor: C.white }} />
        {!concept && page.startsWith('steps/') && page.endsWith('.webp') && (
          <Typography sx={{ position: 'absolute', top: 14, left: 14, bgcolor: `${C.bg}E6`, color: C.gold, fontSize: 11, fontWeight: 800, px: 1, py: 0.25, borderRadius: 1 }}>
            SCREENSHOT · simulated farm
          </Typography>
        )}
        {concept && (
          <Typography data-testid="step-image-concept" sx={{ position: 'absolute', top: 14, left: 14, bgcolor: `${C.warning}E6`, color: C.bg, fontSize: 11, fontWeight: 800, px: 1, py: 0.25, borderRadius: 1 }}>
            CONCEPT ART · not a wiring reference
          </Typography>
        )}
        {cues.length > 0 && (
          <Box component="figcaption" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1, px: 0.5 }}>
            {cues.map((c, i) => (
              <Typography key={i} sx={{ color: CUE[c.type].color, fontSize: 14, fontWeight: 700 }}>{CUE[c.type].glyph} {c.label ?? CUE[c.type].words}</Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  }
  return (
    <Box role="img" aria-label={`${asset?.label ?? 'Step illustration'}${cues.length ? ` - ${cues.map((c) => c.label ?? CUE[c.type].words).join(', ')}` : ''}`}
      data-testid="step-figure"
      sx={{ position: 'relative', bgcolor: C.bg, border: `1px solid ${C.accent}`, borderRadius: 2, minHeight: { xs: 180, sm: 240 },
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, gap: 1 }}>
      <Box aria-hidden sx={{ fontSize: { xs: 64, sm: 88 }, lineHeight: 1, position: 'relative' }}>
        {asset?.icon ?? '🧩'}
        {cues[0] && (
          <Box component="span" sx={{ position: 'absolute', right: -34, top: -14, fontSize: 34, color: CUE[cues[0].type].color, fontWeight: 900 }}>
            {CUE[cues[0].type].glyph}
          </Box>
        )}
      </Box>
      <Typography sx={{ color: C.gold, fontWeight: 700 }}>{asset?.label ?? 'Illustration'}</Typography>
      {cues.map((c, i) => (
        <Typography key={i} sx={{ color: CUE[c.type].color, fontSize: 14, fontWeight: 700 }}>
          {CUE[c.type].glyph} {c.label ?? CUE[c.type].words}
        </Typography>
      ))}
      {asset?.technical && (
        <Typography sx={{ color: C.goldMuted, fontSize: 11, position: 'absolute', bottom: 6, left: 10, right: 10, textAlign: 'center' }}>
          Placeholder art - check pin positions against the board's official pinout.
        </Typography>
      )}
    </Box>
  );
}

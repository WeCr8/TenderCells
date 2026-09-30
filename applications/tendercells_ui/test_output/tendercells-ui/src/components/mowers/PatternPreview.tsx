// PatternPreview - top-down sketch of a mowing pattern over the area, so the owner sees the
// stripes / checkerboard / spiral before starting (lib/mower/patterns.ts does the geometry).
import { useMemo } from "react";
import type { MowPattern } from "../../lib/mower/mower";
import { patternPaths, type Rect } from "../../lib/mower/patterns";

const C = { bg: "#0D2B1E", lawn: "#2F5E3A", edge: "#8A7D55", path: "#C8B882", start: "#F0EDE4" };

export default function PatternPreview({ area, pattern, angleDeg, edgePasses, spacing, size = 220 }: {
  area: Rect; pattern: MowPattern; angleDeg: number; edgePasses: number; spacing: number; size?: number;
}) {
  // Real lanes are a blade width apart (hundreds over a lawn); draw ~20 so the pattern reads.
  const shown = Math.max(spacing, Math.max(area.width, area.depth) / 20);
  const paths = useMemo(() => patternPaths(area, pattern, angleDeg, edgePasses, shown), [area, pattern, angleDeg, edgePasses, shown]);
  const scale = size / Math.max(area.width, area.depth);
  const w = area.width * scale, h = area.depth * scale;
  const px = (x: number) => (x - area.x) * scale, py = (y: number) => (y - area.y) * scale;
  const first = paths[0]?.[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${pattern} mowing pattern preview`}
      data-testid="pattern-preview" style={{ background: C.bg, borderRadius: 6, maxWidth: "100%" }}>
      <rect x={0} y={0} width={w} height={h} fill={C.lawn} stroke={C.edge} strokeWidth={2} />
      {pattern === "auto" && !paths.length && (
        <text x={w / 2} y={h / 2} textAnchor="middle" fill={C.start} fontSize={12}>Mower chooses its own path</text>
      )}
      {paths.map((p, i) => (
        <polyline key={i} points={p.map((q) => `${px(q.x)},${py(q.y)}`).join(" ")} fill="none" stroke={C.path}
          strokeWidth={Math.max(1.5, shown * scale * 0.35)} strokeOpacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {first && <circle cx={px(first.x)} cy={py(first.y)} r={4} fill={C.start}><title>Start</title></circle>}
    </svg>
  );
}

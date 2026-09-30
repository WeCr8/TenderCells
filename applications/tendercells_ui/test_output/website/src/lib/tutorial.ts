// tutorial.ts - read a published lesson / doc's markdown into the pieces the tutorial layout
// needs: the page title, the outline (H2 sections and H3 sub-steps), which headings are
// checkable steps, and a reading time. Code fences are skipped so "# comment" lines inside
// shell snippets are never taken for headings.
import { headingSlug } from "./slug";

export interface OutlineItem {
  id: string;
  text: string;
  level: 2 | 3;
  /** A step the reader can mark done ("Step 2 — ...", "Part 1", "Stage 3", "Level 4"). */
  step: boolean;
}

export interface Tutorial {
  title: string | null;
  outline: OutlineItem[];
  minutes: number;
}

/** Heading text without markdown emphasis / code / links. */
export const plainHeading = (s: string): string =>
  s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").trim();

/** "Step 2 — ...", "🪜 Part 1", "Stage 3", "Level 4" (after any emoji). */
export const isStepHeading = (text: string): boolean =>
  /^[^\p{L}\p{N}]*(step|part|stage|level)\s*\d+/iu.test(text);

export function readTutorial(md: string): Tutorial {
  const lines = md.split("\n");
  let inFence = false;
  let title: string | null = null;
  const outline: OutlineItem[] = [];
  let words = 0;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    words += line.split(/\s+/).filter(Boolean).length;
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = plainHeading(m[2]);
    if (m[1].length === 1) { title ??= text; continue; }
    outline.push({ id: headingSlug(text), text, level: m[1].length as 2 | 3, step: isStepHeading(text) });
  }
  return { title, outline, minutes: Math.max(1, Math.round(words / 200)) };
}

/** Kind of callout for a blockquote, from how it starts. */
export type CalloutKind = "safety" | "grownup" | "idea" | "tip" | "note";

export function calloutKind(text: string): CalloutKind {
  const t = text.trim().slice(0, 80).toLowerCase();
  if (/🦺|⚠|safety|e-stop|danger|warning|never /.test(t)) return "safety";
  if (/grown-?up|teacher|parent|judges|adult/.test(t)) return "grownup";
  if (/key idea|big idea|mission|build order|one firmware|goal/.test(t)) return "idea";
  if (/💡|🧠|🧭|tip|new word|hint/.test(t)) return "tip";
  return "note";
}

export const CALLOUT_LABEL: Record<CalloutKind, string> = {
  safety: "Safety",
  grownup: "For grown-ups",
  idea: "Key idea",
  tip: "Tip",
  note: "Note",
};

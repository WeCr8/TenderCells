// slug.ts - heading ids and #anchor matching.
//
// headingSlug() makes the same id GitHub gives a markdown heading, so links written in the
// repo docs (e.g. "#-picture-dictionary-hard-words-made-easy") work on the website too.
// anchorKey() is a looser form used as a fallback when a link and a heading differ only by
// emoji, punctuation or repeated / leading hyphens.

/** GitHub-style heading id: lower case, drop punctuation and emoji, spaces become hyphens. */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\uFE0E\uFE0F\u200D]/g, "") // emoji variation selectors / joiners, as GitHub does
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
    .replace(/ /g, "-");
}

/** Loose key for matching an anchor to an id. */
export function anchorKey(s: string): string {
  return headingSlug(decodeURIComponent(s).replace(/^#/, "")).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Plain text of React children (for heading ids). */
export function textOf(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in (node as object)) {
    return textOf((node as { props: { children?: unknown } }).props.children);
  }
  return "";
}

/** Element for an anchor: exact id first, then the loose match. */
export function findAnchor(hash: string, root: ParentNode = document): HTMLElement | null {
  const raw = decodeURIComponent(hash.replace(/^#/, ""));
  if (!raw) return null;
  const exact = document.getElementById(raw);
  if (exact) return exact;
  const key = anchorKey(raw);
  for (const el of root.querySelectorAll<HTMLElement>("[id]")) {
    if (anchorKey(el.id) === key) return el;
  }
  return null;
}

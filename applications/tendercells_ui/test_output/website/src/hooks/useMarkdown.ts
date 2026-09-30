// useMarkdown - fetch a published markdown page (public/lessons, public/docs).
import { useEffect, useState } from "react";

/** Fetch a markdown file; null while loading, false when missing. */
export function useMarkdown(url: string): string | null | false {
  const [md, setMd] = useState<string | null | false>(null);
  useEffect(() => {
    let live = true;
    setMd(null);
    fetch(url)
      .then((r) => (r.ok && !(r.headers.get("content-type") ?? "").includes("text/html") ? r.text() : Promise.reject()))
      // Drop the "generated from" HTML comment at the top - markdown would show it as text.
      .then((t) => { if (live) setMd(t.replace(/^\s*<!--[\s\S]*?-->\s*/, "")); })
      .catch(() => { if (live) setMd(false); });
    return () => { live = false; };
  }, [url]);
  return md;
}

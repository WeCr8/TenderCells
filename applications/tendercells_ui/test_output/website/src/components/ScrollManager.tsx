// ScrollManager - makes navigation land where the link points.
//
// React Router changes the page without the browser's own scrolling, so menu links such as
// /education#curriculum used to open at the top (or wherever the last page was scrolled).
// On every navigation: a #hash scrolls to that section (waiting for lazy pages and fetched
// markdown to render it), otherwise a new page starts at the top. Mounted once in App.tsx.
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { findAnchor } from "../lib/slug";

const WAIT_MS = 4000;

export default function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (!hash) {
      // Back / forward keeps the browser's restored position; new pages start at the top.
      if (navType !== "POP") window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    let done = false;
    const tryScroll = () => {
      const el = findAnchor(hash);
      if (!el) return false;
      // A collapsed <details> section (e.g. school sign-in) is opened so the link shows it.
      const details = el.closest("details");
      if (details) details.open = true;
      el.scrollIntoView({ block: "start", behavior: "instant" });
      done = true;
      // Images above the section can finish loading after the jump and push it down: re-align
      // once, unless the reader has scrolled since.
      const y = window.scrollY;
      window.setTimeout(() => {
        if (window.scrollY === y && Math.abs(el.getBoundingClientRect().top - 96) > 24) el.scrollIntoView({ block: "start", behavior: "instant" });
      }, 600);
      return true;
    };
    if (tryScroll()) return;
    // The section is not rendered yet (lazy route, fetched lesson): watch for it briefly.
    const obs = new MutationObserver(() => { if (tryScroll()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    const stop = window.setTimeout(() => { obs.disconnect(); if (!done) window.scrollTo({ top: 0, behavior: "instant" }); }, WAIT_MS);
    return () => { obs.disconnect(); window.clearTimeout(stop); };
  }, [pathname, hash, key, navType]);

  return null;
}

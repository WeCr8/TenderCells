// usePageTracking.ts - route-level GA4 page_view and SEO metadata updates.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';
import routeMeta from '../data/routeMeta.json';
import siteDocs from '../data/siteDocs.json';

interface RouteMeta {
  title: string;
  description: string;
  image?: string;
}

// FIX(2026-10-22, GSC "Duplicate, Google chose different canonical than user"): the route
// metadata now lives in src/data/routeMeta.json so the build (scripts/prerender-seo.mjs) can
// write the same title/description/canonical into each route's static HTML. Before this, every
// route was served index.html with canonical "/" and the home title, and only this hook fixed
// it after JavaScript ran, so Google saw two different canonicals for each page.
const DEFAULT_META: RouteMeta = routeMeta.default;
const ROUTE_META: Record<string, RouteMeta> = routeMeta.routes;
const DOC_TITLES: Record<string, string> = Object.fromEntries(
  (siteDocs as { slug: string; title: string }[]).map((d) => [d.slug, d.title]),
);

/** Exported for scripts/tests: the metadata a path gets (same rules as prerender-seo.mjs). */
export function metaForPath(pathname: string): RouteMeta {
  const known = ROUTE_META[pathname];
  if (known) return known;
  const doc = /^\/docs\/([^/]+)$/.exec(pathname);
  if (doc && DOC_TITLES[doc[1]]) {
    return {
      title: `${DOC_TITLES[doc[1]]} - Tender Cells Docs`,
      description: `${DOC_TITLES[doc[1]]}: Tender Cells open-source documentation for builders, classrooms and developers.`,
    };
  }
  return DEFAULT_META;
}

function ensureMeta(key: string, attr: 'name' | 'property', content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensureCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const meta = metaForPath(location.pathname);
    const canonical = `https://tendercells.com${location.pathname === '/' ? '/' : location.pathname}`;

    document.title = meta.title;
    ensureMeta('description', 'name', meta.description);
    ensureMeta('og:title', 'property', meta.title);
    ensureMeta('og:description', 'property', meta.description);
    ensureMeta('og:url', 'property', canonical);
    ensureMeta('og:image', 'property', meta.image || 'https://tendercells.com/assets/images/products/chicken-tender-concept.png');
    ensureMeta('og:type', 'property', location.pathname.startsWith('/shop/') ? 'product' : 'website');
    ensureMeta('twitter:card', 'name', 'summary_large_image');
    ensureMeta('twitter:title', 'name', meta.title);
    ensureMeta('twitter:description', 'name', meta.description);
    ensureMeta('twitter:image', 'name', meta.image || 'https://tendercells.com/assets/images/products/chicken-tender-concept.png');
    ensureCanonical(canonical);

    trackPageView(location.pathname + location.search, meta.title);
  }, [location.pathname, location.search]);
}

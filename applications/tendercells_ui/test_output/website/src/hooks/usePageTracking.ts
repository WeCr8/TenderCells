// usePageTracking.ts - route-level GA4 page_view and SEO metadata updates.
// The metadata itself lives in src/seo/routeMeta.ts, which the build also uses to write each
// page's tags into its served HTML (scripts/seo-pages.mjs) so crawlers see them before JS runs.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';
import { DEFAULT_IMAGE, DEFAULT_META, NOINDEX_PATHS, canonicalFor, metaFor, normalizePath } from '../seo/routeMeta';

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

function setRobots(content: string | null) {
  let tag = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!content) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'robots';
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const known = metaFor(location.pathname);
    const meta = known ?? DEFAULT_META;
    const canonical = canonicalFor(location.pathname);
    // Unknown paths render the 404 page with a 200 status (SPA rewrite): keep them out of the index.
    setRobots(!known || NOINDEX_PATHS.includes(normalizePath(location.pathname)) ? 'noindex, follow' : null);

    document.title = meta.title;
    ensureMeta('description', 'name', meta.description);
    ensureMeta('og:title', 'property', meta.title);
    ensureMeta('og:description', 'property', meta.description);
    ensureMeta('og:url', 'property', canonical);
    ensureMeta('og:image', 'property', meta.image || DEFAULT_IMAGE);
    ensureMeta('og:type', 'property', location.pathname.startsWith('/shop/') ? 'product' : 'website');
    ensureMeta('twitter:card', 'name', 'summary_large_image');
    ensureMeta('twitter:title', 'name', meta.title);
    ensureMeta('twitter:description', 'name', meta.description);
    ensureMeta('twitter:image', 'name', meta.image || DEFAULT_IMAGE);
    ensureCanonical(canonical);

    trackPageView(location.pathname + location.search, meta.title);
  }, [location.pathname, location.search]);
}

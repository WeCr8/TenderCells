// demoNext.ts - where the public demo should open after seeding, from ?next= on /demo.
// Lets the website deep-link into one OS page with demo data ("Try Weed Patrol in the demo"
// -> /app/demo?next=/weed-patrol). Only known OS pages are accepted, so the parameter can
// never send a visitor off the app (no "//host", no schemes).

const DEMO_PAGES = new Set([
  "dashboard", "layout", "weed-patrol", "projects", "library", "animals", "predator-monitor",
  "schedules", "analytics", "watershed", "products", "diagnostics", "chicken-tender", "egg-map",
  "sensors", "resources", "ai", "chicken-eye", "simulator", "missions", "mowers",
]);

/**
 * A safe in-app path from a ?next= value, or null.
 *
 * @param next - Raw query value, e.g. "/weed-patrol" or "/library/animals/chicken"
 * @returns The path to navigate to, or null when it is not a known OS page
 */
export function safeDemoNext(next: string | null | undefined): string | null {
  if (!next) return null;
  const m = /^\/([a-z0-9-]+)((?:\/[a-z0-9-]+)*)(\?[a-z0-9=&_-]*)?$/i.exec(next);
  if (!m || !DEMO_PAGES.has(m[1].toLowerCase())) return null;
  return next;
}

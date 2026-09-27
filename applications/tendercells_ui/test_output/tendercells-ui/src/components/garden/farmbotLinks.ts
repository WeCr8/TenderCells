// farmbotLinks.ts - FarmBot Web App address helpers (kept out of the component file
// so react-refresh can hot-reload FarmBotBridgePanel).

/**
 * Normalise a FarmBot server address; only http(s) is allowed (no javascript: etc.).
 *
 * @param raw - What the user typed, e.g. "192.168.1.20:3000" (-> http) or "my.farm.bot" (-> https)
 * @returns The URL to open, or null when it is not a valid http(s) address
 */
export function normalizeFarmBotUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    // No scheme typed: LAN servers (IP, localhost, *.local, or an explicit port) are
    // almost always plain http; public hosts get https.
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
    const lan = /^(localhost|\d{1,3}(\.\d{1,3}){3}|[^/:]+\.local)(:\d+)?(\/|$)/i.test(trimmed) || /^[^/]+:\d+(\/|$)/.test(trimmed);
    const url = new URL(hasScheme ? trimmed : `${lan ? 'http' : 'https'}://${trimmed}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

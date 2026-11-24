// showcaseModel.ts - one place for the Chicken Tender showcase coop GLBs.
//
// Files: public/models/chicken-tender/CT_COOP_A_showcase_{base,starter,plus,pro}.glb
// (2026-11-23f export: 3 open nest boxes, feeder off the ramp, mixed flock of 4 hens,
// DoorCell V1.4 slide door). Sizes: base ~3.3 MB, starter ~3.4 MB, plus/pro ~6.3 MB.
//
// FIX(2026-11-24): the /demo Property Twin drew every Chicken Tender as a box with a cone
// roof (createHardwareMesh / createPlaceholderCoop), so the updated coop only showed on
// /demo/coop. The viewport now swaps that placeholder for the starter showcase GLB once
// the page has painted. The file names never change between exports, so the URL carries
// the export id as a query string: browsers holding an older copy (Firebase serves .glb
// with max-age=3600) fetch the new one.

export const COOP_TIERS = ['base', 'starter', 'plus', 'pro'] as const;
export type CoopTier = (typeof COOP_TIERS)[number];

/** Export id of the GLBs in public/models/chicken-tender. Bump it with every new export. */
export const SHOWCASE_COOP_EXPORT = '2026-11-23f';

/** Small tier used in the yard overview and as the phone default on /demo/coop (~3.4 MB, has the DoorCell). */
export const LIGHT_COOP_TIER: CoopTier = 'starter';

/** Full tier shown first on /demo/coop for wide screens (~6.3 MB). */
export const FULL_COOP_TIER: CoopTier = 'plus';

/**
 * URL of a showcase coop GLB under the app's base path.
 *
 * @param tier - Coop tier
 * @returns e.g. "/app/models/chicken-tender/CT_COOP_A_showcase_plus.glb?v=2026-11-23f"
 */
export function showcaseCoopUrl(tier: CoopTier): string {
  return `${import.meta.env.BASE_URL}models/chicken-tender/CT_COOP_A_showcase_${tier}.glb?v=${SHOWCASE_COOP_EXPORT}`;
}

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/**
 * True on phones and slow / data-saver connections, where the smaller coop file should load first.
 *
 * @returns Whether to prefer the light tier
 */
export function prefersLightCoop(): boolean {
  if (typeof window === 'undefined') return false;
  const conn = (navigator as NavigatorWithConnection).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches;
}

/**
 * True when the visitor asked to save data: the yard keeps the drawn placeholder coop
 * instead of downloading a 3 MB model.
 *
 * @returns Whether Save-Data is on
 */
export function saveDataOn(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator as NavigatorWithConnection).connection?.saveData;
}

/**
 * Run `cb` after the page has painted and the main thread is idle (falls back to a short timeout).
 *
 * @param cb - Work to defer (e.g. starting a model download)
 * @returns Cancel function
 */
export function afterFirstPaint(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  let idleId: number | undefined;
  let timer: number | undefined;
  let cancelled = false;
  const raf = window.requestAnimationFrame(() => {
    if (cancelled) return;
    // Safari has no requestIdleCallback.
    const ric = (window as Partial<Pick<Window, 'requestIdleCallback'>>).requestIdleCallback;
    if (typeof ric === 'function') idleId = ric.call(window, () => { if (!cancelled) cb(); }, { timeout: 1500 });
    else timer = window.setTimeout(() => { if (!cancelled) cb(); }, 200);
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(raf);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

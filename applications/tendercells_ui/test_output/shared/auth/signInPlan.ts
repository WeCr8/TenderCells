// signInPlan.ts - how the website (/account) and the OS (/app) run Google / school sign-in.
//
// Pure functions only (no firebase import), so both apps share the same rules and the OS
// vitest suite can pin them.
//
// WHY THIS EXISTS (2026-10-15): Google sign-in failed on iPad Safari. The apps used
// authDomain = tender-cells.firebaseapp.com while being served from tendercells.com. Safari
// 16.1+, Firefox 109+ and Chrome 115+ partition third-party storage, so the Firebase helper
// iframe on firebaseapp.com cannot hand a sign-in result back to tendercells.com. The popup is
// the only flow that can work in that setup, and when Safari blocked the popup the code fell
// back to signInWithRedirect, which cannot complete cross-origin. The user came back signed out
// with no message. See https://firebase.google.com/docs/auth/web/redirect-best-practices.
//
// The fix (Firebase "Option 1"): use the serving custom domain as authDomain, which makes the
// helper same-origin. Firebase Hosting already serves /__/auth/* on tendercells.com. That only
// works once https://<host>/__/auth/handler is an authorized redirect URI on the Google OAuth
// client, so it is switched on per host by VITE_FIREBASE_SAME_ORIGIN_AUTH_HOSTS. That way a
// deploy can never break Google sign-in before the console step is done.

export interface LocationLike {
  protocol: string;
  host: string; // hostname[:port]
  hostname: string;
}

/** "tendercells.com, www.tendercells.com" -> ["tendercells.com", "www.tendercells.com"] */
export function parseHostList(value: string | undefined | null): string[] {
  return String(value ?? "")
    .split(/[\s,]+/)
    .map((h) => h.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);
}

/**
 * The authDomain to give Firebase. It returns the page's own host when that host is opted in
 * (HTTPS only, or localhost for dev) and the configured domain otherwise.
 */
export function resolveAuthDomain(
  configured: string | undefined,
  location: LocationLike | undefined,
  sameOriginHosts: string[],
): string | undefined {
  if (!location) return configured;
  const host = location.hostname.toLowerCase();
  const secure = location.protocol === "https:" || host === "localhost";
  if (secure && sameOriginHosts.includes(host)) return location.host.toLowerCase();
  return configured;
}

/** True when the Firebase auth helper is served from the page's own origin. */
export function isSameOriginAuth(authDomain: string | undefined, location: LocationLike | undefined): boolean {
  if (!authDomain || !location) return false;
  return authDomain.toLowerCase() === location.host.toLowerCase();
}

export interface DeviceSignals {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  /** navigator.standalone (iOS home-screen) or display-mode: standalone */
  standalone?: boolean;
}

/** iPhone, iPod, or iPad. iPadOS 13+ reports "MacIntel" with touch points. */
export function isIosLike(d: DeviceSignals): boolean {
  if (/iPad|iPhone|iPod/i.test(d.userAgent)) return true;
  return d.platform === "MacIntel" && (d.maxTouchPoints ?? 0) > 1;
}

/** Desktop or iOS Safari (WebKit without a Chromium/Firefox/Edge brand). */
export function isSafariLike(d: DeviceSignals): boolean {
  const ua = d.userAgent;
  return /Safari\//.test(ua) && /AppleWebKit\//.test(ua) && !/Chrome\/|Chromium\/|CriOS\/|FxiOS\/|EdgiOS\/|Edg\//.test(ua);
}

export type SignInFlow = "popup" | "redirect";

/**
 * Which flow to start with.
 * - Redirect is reliable only when the auth helper is same-origin. In that case it is preferred
 *   on iOS and in home-screen (standalone) web apps, where popups are blocked or open in a
 *   separate browser context whose result never returns.
 * - Otherwise use the popup. It is the only flow that survives storage partitioning while the
 *   helper is on firebaseapp.com.
 */
export function chooseSignInFlow(sameOriginAuth: boolean, d: DeviceSignals): SignInFlow {
  if (sameOriginAuth && (d.standalone || isIosLike(d))) return "redirect";
  return "popup";
}

const POPUP_UNAVAILABLE = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

/** When a popup could not open: retry as a redirect only if a redirect can actually finish. */
export function shouldFallBackToRedirect(code: string, sameOriginAuth: boolean): boolean {
  return sameOriginAuth && POPUP_UNAVAILABLE.has(code);
}

export function isPopupUnavailable(code: string): boolean {
  return POPUP_UNAVAILABLE.has(code);
}

/** Plain-language text for the popup / redirect failures that the generic mappers miss. */
export function describeFederatedSignInError(code: string, d: DeviceSignals): string | null {
  if (POPUP_UNAVAILABLE.has(code)) {
    return isIosLike(d) || isSafariLike(d)
      ? "Safari blocked the Google sign-in window. Allow pop-ups for tendercells.com (Settings → Safari → Block Pop-ups off), then tap Continue with Google again, or use email and password."
      : "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again, or use email and password.";
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/user-cancelled") {
    return "Google sign-in was closed before it finished. Try again and keep the window open until it returns here.";
  }
  if (code === "auth/web-storage-unsupported") {
    return "This browser is blocking the storage sign-in needs (private browsing or blocked cookies). Turn that off for tendercells.com or use another browser.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This address is not authorized for Tender Cells sign-in. Open https://tendercells.com/account instead.";
  }
  if (code === "auth/redirect-cancelled-by-user") {
    return "Sign-in was cancelled before it finished.";
  }
  return null;
}

/** Callable Functions errors that mean "our backend is down", not "you typed something wrong". */
export function describeFunctionsError(err: unknown, fallback: string): string {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";
  if (code === "functions/internal" || code === "functions/unavailable" || code === "functions/deadline-exceeded") {
    return "Tender Cells sign-in services are temporarily unavailable. Please try again in a few minutes, or use email and password.";
  }
  if (code === "functions/not-found") {
    return "We could not find a school with that code. Check the code with your teacher or district administrator.";
  }
  return err instanceof Error && err.message && err.message !== "INTERNAL" ? err.message : fallback;
}

/** Read the device signals from the browser (safe during SSR and tests). */
export function readDeviceSignals(): DeviceSignals {
  if (typeof navigator === "undefined") return { userAgent: "" };
  const nav = navigator as Navigator & { standalone?: boolean };
  let standalone = nav.standalone === true;
  try {
    if (!standalone && typeof window !== "undefined" && typeof window.matchMedia === "function") {
      standalone = window.matchMedia("(display-mode: standalone)").matches;
    }
  } catch {
    // matchMedia unsupported: treat as a normal tab
  }
  return { userAgent: nav.userAgent || "", platform: nav.platform, maxTouchPoints: nav.maxTouchPoints, standalone };
}

/** Current page location, or undefined outside a browser. */
export function currentLocation(): LocationLike | undefined {
  if (typeof window === "undefined" || !window.location) return undefined;
  const { protocol, host, hostname } = window.location;
  return { protocol, host, hostname };
}

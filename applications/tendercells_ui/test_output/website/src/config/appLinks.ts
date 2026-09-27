const DEFAULT_WEB_ACCOUNT_URL = "https://tendercells.com/app/account";
const DEFAULT_DEMO_URL = "https://tendercells.com/app/demo";

const configuredEntryUrl = import.meta.env.VITE_TENDERCELLS_APP_URL?.trim();
const configuredWebAccountUrl = import.meta.env.VITE_TENDERCELLS_WEB_ACCOUNT_URL?.trim();
const configuredNativeAppUrl = import.meta.env.VITE_TENDERCELLS_NATIVE_APP_URL?.trim();
const configuredEntryIsWebUrl = !!configuredEntryUrl && /^https?:\/\//i.test(configuredEntryUrl);

// Browser login must always stay in-browser. We treat custom-scheme values as
// explicit native-launch URLs only, never as the default Login destination.
export const TENDERCELLS_WEB_ACCOUNT_URL =
  configuredWebAccountUrl ||
  (configuredEntryIsWebUrl ? configuredEntryUrl : DEFAULT_WEB_ACCOUNT_URL);

// Backwards-compatible app-launch URL:
// - Prefer VITE_TENDERCELLS_NATIVE_APP_URL
// - Fall back to legacy VITE_TENDERCELLS_APP_URL when it is NOT http(s)
export const TENDERCELLS_NATIVE_APP_URL =
  configuredNativeAppUrl ||
  (!configuredEntryIsWebUrl ? configuredEntryUrl : undefined);

// Public, no-signup demo front door. Auto-seeds a full sim-only environment and
// lands the visitor in the dashboard. See DemoLandingPage in the app.
export const TENDERCELLS_DEMO_URL =
  import.meta.env.VITE_TENDERCELLS_DEMO_URL || DEFAULT_DEMO_URL;

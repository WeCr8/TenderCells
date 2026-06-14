const DEFAULT_APP_ENTRY_URL = "https://tendercells.com/app/account";
const DEFAULT_DEMO_URL = "https://tendercells.com/app/demo";

export const TENDERCELLS_APP_ENTRY_URL =
  import.meta.env.VITE_TENDERCELLS_APP_URL || DEFAULT_APP_ENTRY_URL;

// Public, no-signup demo front door. Auto-seeds a full sim-only environment and
// lands the visitor in the dashboard. See DemoLandingPage in the app.
export const TENDERCELLS_DEMO_URL =
  import.meta.env.VITE_TENDERCELLS_DEMO_URL || DEFAULT_DEMO_URL;

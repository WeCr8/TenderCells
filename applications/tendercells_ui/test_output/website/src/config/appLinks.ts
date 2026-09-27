const DEFAULT_DEMO_URL = "https://tendercells.com/app/demo";

// Public, no-signup demo front door. Auto-seeds a full sim-only environment and
// lands the visitor in the dashboard. See DemoLandingPage in the app.
export const TENDERCELLS_DEMO_URL =
  import.meta.env.VITE_TENDERCELLS_DEMO_URL || DEFAULT_DEMO_URL;

// Tender Cells OS (the yard-robot control app). Opened only from an explicit
// "Launch Tender Cells OS" action - never from the header Login, which goes to
// the website's own /account page. Relative so it stays on the same origin as
// the site, which is what lets the OS reuse the website's Firebase sign-in.
export const TENDERCELLS_OS_URL =
  import.meta.env.VITE_TENDERCELLS_OS_URL || "/app/dashboard";

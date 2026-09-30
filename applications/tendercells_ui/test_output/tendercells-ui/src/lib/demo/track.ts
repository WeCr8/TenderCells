// track.ts - demo analytics events (GA4 when present; no-op otherwise). Events follow the
// demo funnel: demo_started, persona_selected, event_triggered, event_explanation_opened,
// mission_started, mission_completed, build_guide_opened, github_clicked.
export function trackDemo(event: string, params?: Record<string, unknown>): void {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", event, params ?? {});
}

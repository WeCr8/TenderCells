// track.ts - demo analytics events (GA4 when present; no-op otherwise). The funnel:
//   Demo -> Property -> Event -> Why -> Simulated action -> Hardware / Build / Code
// Events: demo_started, persona_selected, property_viewed, entity_opened, event_triggered,
// event_opened, why_opened (+ event_explanation_opened), simulation_action_requested,
// simulation_action_completed, hardware_viewed, wiring_viewed, firmware_viewed, flash_clicked,
// build_guide_opened, github_clicked, integration_viewed, mission_started, mission_completed,
// mower_viewed.
export function trackDemo(event: string, params?: Record<string, unknown>): void {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", event, params ?? {});
}

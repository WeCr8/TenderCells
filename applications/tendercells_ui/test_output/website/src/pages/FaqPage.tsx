import { useState } from "react";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    items: [
      { q: "What do I need to get started?", a: "A Chicken Tender unit, a standard 120V outlet within 10 ft, WiFi (2.4GHz or 5GHz), a smartphone (iOS 15+ or Android 9+), and chickens. The Raspberry Pi 4 MQTT broker ships pre-configured inside the unit." },
      { q: "How long does setup take?", a: "2–4 hours including unboxing, placement, WiFi setup, app installation, and the guided wizard. Most users have their first automated door schedule running the same day." },
      { q: "Do I need any technical skills?", a: "No. The app wizard guides every step. Technical skills are only needed if you want to customize firmware or build integrations — the base product requires none." },
      { q: "Does it work in cold climates?", a: "Yes. Electronics are rated –20°C to +60°C. Below 35°F, the system sends alerts. You can add a relay-controlled heat lamp via the GPIO expansion header." },
    ],
  },
  {
    section: "Hardware",
    items: [
      { q: "What is the 9DOF system?", a: "9 Degrees of Freedom: 3 from the XYZ gantry (moves the arm to any position in the coop), plus 6 from the robot arm itself. Together, they cover 100% of the coop interior." },
      { q: "How heavy is the robot arm payload?", a: "The gantry carries up to 10kg. The 6DOF arm (UR3e class) handles up to 3kg at the end effector — enough for egg grippers, scrapers, feeders, and most tools." },
      { q: "Can the arm hurt my chickens?", a: "Safety is the top priority. The arm checks camera for chicken presence before moving. Force sensors cut power on unexpected resistance. E-STOP cuts all actuator power in <100ms from any trigger." },
      { q: "What end effectors are included?", a: "Base unit ships with the scraper (cleaning) and soft egg gripper. Additional end effectors (water nozzle, seed spreader, health sensor wand) are available in the accessories shop." },
      { q: "Is the coop weather-tight?", a: "Yes. The enclosure is 3/4\" BC plywood with weather-sealed joints. Electronics are in IP54-rated enclosures inside. The unit is designed for year-round outdoor use." },
    ],
  },
  {
    section: "Software & Connectivity",
    items: [
      { q: "What happens if my internet goes down?", a: "All control runs locally over MQTT. The Raspberry Pi broker on your LAN continues operating. You lose push notifications and remote access, but all scheduled automations continue." },
      { q: "Is my data private?", a: "Telemetry syncs to Firebase (Google Cloud) encrypted. Video from WatchTower AI is stored locally on an SD card and not uploaded unless you explicitly share. No video leaves your property by default." },
      { q: "Can I use it without the cloud at all?", a: "Yes. The system operates fully offline. The app connects directly to the local MQTT broker over your LAN. Firebase sync is optional and only needed for remote access and push notifications." },
      { q: "How often does firmware update?", a: "Monthly patch releases, quarterly feature releases. All OTA via the app. You review release notes and approve before any update installs. Rollback supported." },
    ],
  },
  {
    section: "Pricing & Support",
    items: [
      { q: "Is there a subscription fee?", a: "No mandatory subscription. TenderCare ($19/mo) adds AI health analysis, extended data history (90 days vs 7), priority support, and remote access from outside your network." },
      { q: "What is the warranty?", a: "1 year hardware warranty from WeCr8. Covers manufacturing defects and component failure under normal use. Does not cover animal damage, water intrusion from improper installation, or firmware modifications." },
      { q: "Can I repair it myself?", a: "Yes, and we encourage it. Every component is documented, sourced from standard suppliers (not OEM-only), and listed in the open-source hardware BOM. Repair guides are on GitHub." },
      { q: "Where is Tender Cells manufactured?", a: "Assembled in the USA by WeCr8 Solutions. Core electronics (ESP32, sensors) are sourced from Espressif, LCSC, and US distributors. Structural components (plywood, hardware) are US-sourced." },
    ],
  },
];

export default function FaqPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #f57c00 0%, #bf360c 100%)"
        title="Frequently Asked Questions"
        subtitle="Everything you want to know before buying or building with Tender Cells."
        image="/assets/images/products/animal-health-stress-monitoring-concept.png"
        imageAlt="TenderCells animal stress and health monitoring concept"
      />

      {FAQ_SECTIONS.map((sec) => (
        <div key={sec.section}>
          <h2 className="section-title">{sec.section}</h2>
          {sec.items.map((item) => {
            const key = `${sec.section}:${item.q}`;
            return (
              <div key={key} className="faq-item">
                <div
                  className="faq-q"
                  onClick={() => setOpenItem(openItem === key ? null : key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setOpenItem(openItem === key ? null : key)}
                >
                  {item.q}
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{openItem === key ? "▲" : "▼"}</span>
                </div>
                {openItem === key && <div className="faq-a">{item.a}</div>}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: "2.5rem", padding: "2rem", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #b3d4f5" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1a5276" }}>Still have questions?</h3>
        <p style={{ margin: "0 0 1rem", color: "#333" }}>
          Our support team answers within 1 business day. TenderCare subscribers get same-day response.
        </p>
        <a href="mailto:support@wecr8.info" className="btn-primary">Email Support</a>
      </div>
    </PageLayout>
  );
}

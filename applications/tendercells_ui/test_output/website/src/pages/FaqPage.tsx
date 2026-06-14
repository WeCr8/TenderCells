import { useState } from "react";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

// TenderCells is concept-stage and not shipping hardware. Answers below describe the
// intended design and the public demo — not a product you can buy or unbox today.
const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    items: [
      { q: "Can I buy a Chicken Tender today?", a: "Not yet. TenderCells is concept-stage and not taking hardware orders. You can explore the no-signup public demo, follow the build-your-own developer path, or register interest on the Shop page." },
      { q: "What would a unit need to run?", a: "The design targets a standard 120V outlet, WiFi (2.4GHz or 5GHz), a smartphone, and a local MQTT broker (Raspberry Pi 4 class) for on-network control. These are design targets, not a shipped spec." },
      { q: "Do I need technical skills to follow along?", a: "No. The public demo needs no skills. Building your own module from the open docs does take some maker/electronics experience — the docs and good-first-issues are written to help you start small." },
      { q: "Is it intended for cold climates?", a: "The design targets electronics rated roughly –20°C to +60°C, with alerts below 35°F and an optional relay-controlled heat lamp via a GPIO expansion header." },
    ],
  },
  {
    section: "Hardware (design)",
    items: [
      { q: "What is the 9DOF system?", a: "9 Degrees of Freedom: 3 from the XYZ gantry (moves the arm to any position in the coop), plus 6 from the robot arm itself. Together they are designed to cover the full coop interior." },
      { q: "What payload is the arm designed for?", a: "The gantry targets up to 10kg, and a 6DOF arm (UR3e class) around 3kg at the end effector — enough for egg grippers, scrapers, feeders, and most tools." },
      { q: "Could the arm hurt my chickens?", a: "Safety is the top design priority: a chicken-presence check before motion, force limits that cut power on unexpected resistance, and an E-STOP designed to cut all actuator power in under 100ms." },
      { q: "What end effectors are planned?", a: "The first planned tools are a scraper (cleaning) and a soft egg gripper, with a tool-changer interface so the community can design more — water nozzle, seed spreader, sensor wand, and others." },
      { q: "Is the coop designed to be weather-tight?", a: "Yes — the structure concept uses 3/4\" BC plywood with sealed joints and IP54-rated electronics enclosures inside, intended for year-round outdoor use." },
    ],
  },
  {
    section: "Software & Connectivity",
    items: [
      { q: "What happens if internet goes down?", a: "Control is designed to run locally over MQTT, so a local broker on your LAN keeps scheduled automations running. You would lose push notifications and remote access, not local control." },
      { q: "How is data privacy handled?", a: "The design keeps motion and control local. Where cloud sync is used (e.g. Firebase) it is for optional remote access; camera video is intended to stay local and not leave your property unless you choose to share it." },
      { q: "Can it work without the cloud at all?", a: "Yes — local-first is a core principle. The app is designed to talk directly to the local MQTT broker over your LAN, with cloud sync optional and only needed for remote access and notifications." },
      { q: "How would firmware updates work?", a: "The plan is reviewed OTA updates via the app: you read release notes and approve before anything installs, with rollback support. All firmware is open source." },
    ],
  },
  {
    section: "Pricing & Support (planned)",
    items: [
      { q: "Will there be a subscription fee?", a: "No mandatory subscription is planned for local operation. An optional TenderCare plan (target around $19/mo) would add AI health analysis, longer data history, and remote access. Pricing is not final." },
      { q: "What about warranty?", a: "A hardware warranty is planned once units ship, intended to cover manufacturing defects and normal-use component failure. Exact terms are TBD." },
      { q: "Will I be able to repair it myself?", a: "Yes — repairability is a goal. Components are chosen from standard suppliers (not OEM-only) and documented in the open hardware docs, so parts can be sourced anywhere." },
      { q: "Where would it be made?", a: "The intent is US assembly by WeCr8 Solutions, with core electronics (ESP32, sensors) from suppliers like Espressif and LCSC and US-sourced structural materials. This reflects the plan, not current production." },
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
        subtitle="What TenderCells is today (a concept-stage, open, demo-able platform) and where it's headed."
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
          Email the team or open a GitHub issue and we'll get back to you as soon as we can.
        </p>
        <a href="mailto:support@wecr8.info" className="btn-primary">Email Support</a>
      </div>
    </PageLayout>
  );
}

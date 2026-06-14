import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const guides = {
  "smart-chicken-coop": {
    title: "Smart Chicken Coop Guide",
    subtitle: "How to plan an automated coop without losing sight of animal care.",
    sections: [
      ["Start with the daily care loop", "A useful smart chicken coop begins with the basic loop: safe shelter, clean air, fresh water, feed, light, predator protection, and predictable human inspection. Automation should make those jobs more visible and reliable, not hide them."],
      ["Measure before automating", "Temperature, humidity, ammonia, door state, feed level, water level, camera snapshots, and egg counts are practical first signals. Students can start with one sensor and build a record before controlling motors."],
      ["Keep manual override", "Doors, feeders, waterers, lights, and cleaning tools should have a manual fallback. A smart coop is safer when a student or keeper can understand what it is doing and stop it quickly."],
      ["Use Tender Cells as a learning path", "Chicken Tender shows how door control, nest boxes, feed, water, cameras, and records can become one open system. The public demo lets builders explore that system before installing hardware."],
    ],
    links: [
      { label: "Chicken Tender product concept", href: "/shop/chicken-tender" },
      { label: "Animal health guide", href: "/health" },
      { label: "4-H project path", href: "/4h" },
      { label: "Developer docs", href: "/developers" },
    ],
  },
  "predator-monitoring": {
    title: "Predator Monitoring Guide",
    subtitle: "Camera, alert, and solar concepts for safer outdoor animal care.",
    sections: [
      ["Observe before reacting", "A predator monitor should help keepers understand patterns around the coop, run, pasture, or property edge. The first goal is evidence: what happened, where, and when."],
      ["Design for low maintenance", "Outdoor monitors need protected electronics, simple mounting, weather awareness, battery planning, and a way to avoid constant false alarms."],
      ["Connect alerts to care decisions", "A useful alert can remind a keeper to close a door, pause a mobile coop, inspect fencing, or review camera snapshots. It should not replace daily inspection."],
      ["Use WatchTower as a concept", "WatchTower AI shows how a pole-mounted camera pod, solar power, local classification, and LoRa alerts could fit into the Tender Cells ecosystem."],
    ],
    links: [
      { label: "WatchTower AI concept", href: "/shop/watchtower" },
      { label: "Science fair projects", href: "/science-fair" },
      { label: "4-H projects", href: "/4h" },
      { label: "Developer docs", href: "/developers" },
    ],
  },
  "pasture-rotation": {
    title: "Mobile Coop and Pasture Rotation Guide",
    subtitle: "How students can think about mobile animal housing, routes, and ground impact.",
    sections: [
      ["Define the rotation question", "A pasture rotation project can ask how often a coop should move, how far it should travel, what ground conditions matter, and how the route affects vegetation recovery."],
      ["Model before building", "Students can map a yard, mark obstacles, define no-go zones, and compare routes before adding motors or batteries."],
      ["Plan for safety", "Mobile housing needs gentle motion, obstacle checks, manual stop controls, dock charging, and clear boundaries."],
      ["Use Roaming Roost as a concept", "Roaming Roost gives builders a concrete mobile coop idea to study: protected flock space, drive base, dock, GPS boundary, and integration with predator alerts."],
    ],
    links: [
      { label: "Roaming Roost concept", href: "/shop/roaming-roost" },
      { label: "Homeschool projects", href: "/homeschool" },
      { label: "Science fair projects", href: "/science-fair" },
      { label: "Academy", href: "/academy" },
    ],
  },
};

interface GuidePageProps {
  slug: keyof typeof guides;
}

export default function GuidePage({ slug }: GuidePageProps) {
  const guide = guides[slug];

  return (
    <PageLayout>
      <PageHero
        variant="green"
        title={guide.title}
        subtitle={guide.subtitle}
        image="/assets/images/demos/coop-camera-demo.png"
        imageAlt="TenderCells coop dashboard showing selectable camera views"
      />

      <div className="prose">
        {guide.sections.map(([title, body]) => (
          <section key={title} style={{ marginBottom: "1.5rem" }}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>

      <h2 className="section-title">Related Resources</h2>
      <div className="card-grid">
        {guide.links.map((link) => (
          <Link key={link.href} to={link.href} className="card" style={{ textDecoration: "none" }}>
            <h3>{link.label}</h3>
            <span className="tag">Open guide</span>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}

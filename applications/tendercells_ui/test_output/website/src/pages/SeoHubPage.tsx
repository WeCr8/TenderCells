import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const hubs = {
  audiences: {
    title: "TenderCells Audiences",
    subtitle: "Find the right path for 4-H, FFA, homeschool, young engineers, makers, teachers, and future founders.",
    intro:
      "TenderCells is intentionally built for more than one audience. These pages help students, families, educators, builders, and engineers find the right entry point into smart animal care, AI tools, robotics, and product creation.",
    groups: [
      {
        title: "Student and Youth Programs",
        links: [
          { label: "4-H STEM Projects", href: "/4h", desc: "Engineering, animal science, sensor, and fair-ready project ideas." },
          { label: "FFA Agricultural Technology", href: "/ffa", desc: "SAE-ready poultry, livestock monitoring, and farm automation projects." },
          { label: "Homeschool STEM", href: "/homeschool", desc: "Family-scale robotics, coding, biology, data, and homesteading lessons." },
          { label: "Science Fair Projects", href: "/science-fair", desc: "Testable questions around coops, sensors, cameras, pasture, and animal care." },
        ],
      },
      {
        title: "Builder and Founder Paths",
        links: [
          { label: "TenderCells Academy", href: "/academy", desc: "The main curriculum path for future builders and product thinkers." },
          { label: "Developers", href: "/developers", desc: "API, firmware, hardware, simulation, and contribution routes." },
          { label: "Open Source", href: "/open-source", desc: "How to contribute, adapt, inspect, and build on the project." },
          { label: "Our Story", href: "/story", desc: "The mission behind teaching with AI, robotics, products, and companies." },
        ],
      },
    ],
  },
  guides: {
    title: "TenderCells Guides",
    subtitle: "Original learning guides for smart coops, predator monitoring, pasture rotation, and open animal-care automation.",
    intro:
      "These guides add practical context around the products and education paths. They are written to help students and builders understand problems before they automate them.",
    groups: [
      {
        title: "Core Guides",
        links: [
          { label: "Smart Chicken Coop Guide", href: "/guides/smart-chicken-coop", desc: "Plan sensors, records, safety, manual override, and open-source coop automation." },
          { label: "Predator Monitoring Guide", href: "/guides/predator-monitoring", desc: "Understand cameras, alerts, solar design, and safe monitoring workflows." },
          { label: "Mobile Coop and Pasture Rotation", href: "/guides/pasture-rotation", desc: "Study routes, docking, safe movement, and pasture care." },
        ],
      },
      {
        title: "Related Product Pages",
        links: [
          { label: "Chicken Tender", href: "/shop/chicken-tender", desc: "Automated smart chicken coop product concept." },
          { label: "WatchTower AI", href: "/shop/watchtower", desc: "Solar predator monitor and camera concept." },
          { label: "Roaming Roost", href: "/shop/roaming-roost", desc: "Mobile pasture coop concept for route and rotation learning." },
        ],
      },
    ],
  },
};

interface SeoHubPageProps {
  kind: keyof typeof hubs;
}

export default function SeoHubPage({ kind }: SeoHubPageProps) {
  const hub = hubs[kind];

  return (
    <PageLayout>
      <div className="page-hero green">
        <h1>{hub.title}</h1>
        <p>{hub.subtitle}</p>
      </div>

      <div className="prose">
        <p>{hub.intro}</p>
      </div>

      {hub.groups.map((group) => (
        <section key={group.title}>
          <h2 className="section-title">{group.title}</h2>
          <div className="card-grid">
            {group.links.map((link) => (
              <Link key={link.href} to={link.href} className="card" style={{ textDecoration: "none" }}>
                <h3>{link.label}</h3>
                <p>{link.desc}</p>
                <span className="tag">Open page</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </PageLayout>
  );
}

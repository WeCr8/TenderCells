import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

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
};

interface SeoHubPageProps {
  kind: keyof typeof hubs;
}

export default function SeoHubPage({ kind }: SeoHubPageProps) {
  const hub = hubs[kind];

  return (
    <PageLayout>
      <PageHero
        variant="green"
        title={hub.title}
        subtitle={hub.subtitle}
        image="/assets/images/demos/tendercells-education-format.png"
        imageAlt="Tender Cells education poster: Build, Learn, Care, Share"
      />

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

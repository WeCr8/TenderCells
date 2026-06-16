import { Link } from "react-router-dom";
import "./PageLayout.css";

const footerGroups = [
  {
    title: "Learn",
    links: [
      { label: "🐣 Start Here (ages 7+)", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/lessons/00-your-first-coop-brain.md" },
      { label: "🗺️ Learning Tracks", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/LEARNING_TRACKS.md" },
      { label: "Audiences", to: "/audiences" },
      { label: "Academy", to: "/academy" },
      { label: "4-H Projects", to: "/4h" },
      { label: "FFA Projects", to: "/ffa" },
      { label: "Homeschool STEM", to: "/homeschool" },
      { label: "Science Fair", to: "/science-fair" },
      { label: "Partners & Sponsors", to: "/partners" },
      { label: "Guides", to: "/guides" },
      { label: "Farm Automation", to: "/farm-automation" },
      { label: "Smart Coop Guide", to: "/guides/smart-chicken-coop" },
      { label: "Predator Monitoring", to: "/guides/predator-monitoring" },
      { label: "Pasture Rotation", to: "/guides/pasture-rotation" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Developers", to: "/developers" },
      { label: "Open Source", to: "/open-source" },
      { label: "Flash a Device", href: "/flash" },
      { label: "3D Model Viewer", href: "/viewer" },
      { label: "Hands-on Lessons", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/lessons" },
      { label: "Public Demo", to: "/app/demo" },
      { label: "GitHub", href: "https://github.com/WeCr8/TenderCells" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Partners", to: "/partners" },
      { label: "Privacy", to: "/privacy" },
      { label: "Cookie Policy", to: "/cookie-policy" },
      { label: "Advertising Disclosure", to: "/advertising-disclosure" },
      { label: "Terms", to: "/terms" },
      { label: "Editorial Policy", to: "/editorial-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h2>Tender Cells</h2>
          <p>
            Open-source agricultural engineering for smart animal care, STEM education,
            homesteaders, makers, and young engineers.
          </p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) =>
              "href" in link ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              )
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}

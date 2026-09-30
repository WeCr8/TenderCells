// GuidesPage (/guides) - the entry point to all learning content. Explains how guides,
// lessons, reference docs and the OS fit together, offers journeys (build a device, science
// fair, teach a class, design a product), the core guides, and every topic's full link set.
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import RelatedContent from "../components/RelatedContent";
import type { TopicId } from "../data/contentGraph";
import "./GuidesPage.css";

const LAYERS = [
  { kind: "guide", title: "Guides", body: "Why and what: the problem, the idea, the safe way to think about it.", to: "/guides#core", cta: "Core guides" },
  { kind: "lesson", title: "Lessons", body: "Build it step by step, mark each step done, ages 7 and up.", to: "/lessons", cta: "All lessons" },
  { kind: "doc", title: "Reference", body: "The exact details: pins, MQTT topics, payloads, specs.", to: "/docs", cta: "All docs" },
  { kind: "os", title: "Tender Cells OS", body: "Use it: see your device on the map, schedule it, review what it finds.", to: "/os", cta: "About the OS" },
] as const;

const JOURNEYS = [
  { title: "Build your first device", body: "Board → flash → MQTT → register → on the map, in 9 steps.", to: "/os#build" },
  { title: "Run a science fair project", body: "Seven complete project plans with variables and data to record.", to: "/science-fair" },
  { title: "Teach a class", body: "Start with no hardware, then real boards; school sign-in and devices.", to: "/lessons/classroom-quickstart" },
  { title: "Design a product", body: "CAD, the 3D viewer and the documentation standard.", to: "/os#design" },
];

const CORE = [
  { title: "Smart Chicken Coop Guide", body: "Plan sensors, records, safety and manual override before automating a coop.", to: "/guides/smart-chicken-coop" },
  { title: "Predator Monitoring Guide", body: "Cameras, alerts, solar power and safe responses around the coop.", to: "/guides/predator-monitoring" },
  { title: "Mobile Coop and Pasture Rotation", body: "Routes, docking, exclusion zones and safe movement.", to: "/guides/pasture-rotation" },
  { title: "Camera Node: first build", body: "Wire, flash, register and use the first battery-powered camera node.", to: "/guides/camera-node-first-build" },
];

const ALL_TOPICS: TopicId[] = ["devices", "coop", "predator", "rover", "sensors", "garden", "design", "habitat", "schools"];

export default function GuidesPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        title="Guides"
        subtitle="Everything to learn, build and run Tender Cells: guides, hands-on lessons, reference docs and the OS - linked together by topic."
        image="/assets/images/demos/tendercells-education-format.png"
        imageAlt="Tender Cells education poster: Build, Learn, Care, Share"
      />

      <h2 className="section-title" id="how">How it fits together</h2>
      <ol className="gd-layers">
        {LAYERS.map((l, i) => (
          <li key={l.title} className={`gd-layer gd-${l.kind}`}>
            <span className="gd-layer-num">{i + 1}</span>
            <h3>{l.title}</h3>
            <p>{l.body}</p>
            <Link to={l.to}>{l.cta} →</Link>
          </li>
        ))}
      </ol>

      <h2 className="section-title" id="journeys">Start a journey</h2>
      <div className="gd-journeys">
        {JOURNEYS.map((j) => (
          <Link key={j.title} to={j.to} className="gd-journey">
            <strong>{j.title}</strong>
            <span>{j.body}</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title" id="core">Core guides</h2>
      <div className="card-grid">
        {CORE.map((g) => (
          <Link key={g.to} to={g.to} className="card" style={{ textDecoration: "none" }}>
            <h3>{g.title}</h3>
            <p>{g.body}</p>
            <span className="tag">Read the guide</span>
          </Link>
        ))}
      </div>

      <RelatedContent topics={ALL_TOPICS} title="Everything by topic" />
    </PageLayout>
  );
}

import PageLayout from "../components/PageLayout";

const quickLinks = [
  ["GitHub repository", "https://github.com/WeCr8/TenderCells"],
  ["Live public demo", "/app/demo"],
  ["Good first issues", "https://github.com/WeCr8/TenderCells/labels/good%20first%20issue"],
  ["Discussions", "https://github.com/WeCr8/TenderCells/discussions"],
];

const sections = [
  {
    title: "Web App",
    body: "Vite, React, product registry, public demo, property layout, schedules, flock data, egg maps, settings, and local-only simulation state.",
    path: "applications/tendercells_ui/test_output/tendercells-ui",
  },
  {
    title: "API And Message Broker",
    body: "Prototype REST routes live in the Express API. Live hardware control should use local MQTT contracts for telemetry, commands, alerts, and E-STOP.",
    path: "applications/tendercells_ui/test_output/express-api",
  },
  {
    title: "Firmware",
    body: "ESP32 and ESP32-S3 targets for Chicken Tender, Roaming Roost, and WatchTower. Firmware work must preserve watchdogs, interlocks, and manual override behavior.",
    path: "firmware/",
  },
  {
    title: "Hardware",
    body: "The Chicken Tender hardware catalog lists structural hardware, sensors, motors, power, networking, WatchTower AI, rail systems, and tool modules.",
    path: "docs/CHICKEN_TENDER_HARDWARE_CATALOG.md",
  },
  {
    title: "Simulation",
    body: "The demo seeds product families, flocks, egg maps, schedules, property placement, and equipment readouts without Firebase or live hardware.",
    path: "src/services/demo/demoEnvironment.ts",
  },
  {
    title: "Security",
    body: "Report vulnerabilities responsibly. Hardware motion, auth, secrets, Firestore rules, and command authorization are treated as safety-sensitive surfaces.",
    path: "SECURITY.md",
  },
];

const productDocs = [
  "README.md",
  "bom.md",
  "wiring.md",
  "firmware.md",
  "assembly.md",
  "troubleshooting.md",
  "api-mqtt.md",
  "safety-validation.md",
  "simulation.md",
];

const buildIdeas = [
  {
    title: "Coop Door Kit",
    image: "/assets/images/demos/door-device-crud-demo.png",
    alt: "TenderCells device controls for automated doors and latches",
    prompt: "Build a standalone ESP32 door/latch controller with limit switches, MQTT state, and E-STOP-safe behavior.",
    firstDoc: "docs/products/coop-door-kit/README.md",
  },
  {
    title: "Camera Inspection Node",
    image: "/assets/images/demos/coop-camera-demo.png",
    alt: "TenderCells coop camera monitoring screen",
    prompt: "Create a weatherproof camera module for coop inspection, event snapshots, and WatchTower handoff.",
    firstDoc: "docs/products/watchtower-ai/README.md",
  },
  {
    title: "Nest Box Egg Sensor",
    image: "/assets/images/demos/chickeneye-eggs-demo.png",
    alt: "ChickenEye egg detection and nest box map",
    prompt: "Document an IR, load-cell, or vision-based nest-box sensor that feeds the egg map and production history.",
    firstDoc: "docs/products/nest-box-egg-sensor/README.md",
  },
  {
    title: "Flock RFID Station",
    image: "/assets/images/demos/animal-roster-demo.png",
    alt: "TenderCells animal roster and health records",
    prompt: "Prototype a weigh/RFID checkpoint that updates per-animal profiles, last-seen status, and health notes.",
    firstDoc: "docs/products/flock-rfid-station/README.md",
  },
  {
    title: "Mobile Pasture Roost",
    image: "/app/assets/images/products/roaming-roost.svg",
    alt: "Roaming Roost mobile pasture coop concept",
    prompt: "Turn Roaming Roost into a builder-friendly product folder with drive base, docking, GPS boundary, and safety docs.",
    firstDoc: "docs/products/roaming-roost/README.md",
  },
];

function external(href: string) {
  return href.startsWith("http");
}

export default function DevelopersPage() {
  return (
    <PageLayout>
      <div className="page-hero dark">
        <h1>TenderCells Developer</h1>
        <p>Software, firmware, hardware, simulation, and integration docs for open animal-care automation.</p>
      </div>

      <div className="prose">
        <p>
          TenderCells now has a single developer entrypoint modeled after mature open robotics projects:
          quick links first, then software, APIs, message broker, firmware, hardware, simulation, licensing,
          security, and clear next steps.
        </p>
      </div>

      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        {quickLinks.map(([label, href]) => (
          <a
            key={label}
            href={href}
            target={external(href) ? "_blank" : undefined}
            rel={external(href) ? "noopener noreferrer" : undefined}
            className={label === "GitHub repository" ? "btn-primary" : "btn-outline"}
          >
            {label}
          </a>
        ))}
      </div>

      <h2 className="section-title">Developer Map</h2>
      <div className="card-grid">
        {sections.map((section) => (
          <div key={section.title} className="card">
            <h3>{section.title}</h3>
            <p>{section.body}</p>
            <p><code>{section.path}</code></p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="hardware">Hardware Documentation</h2>
      <div className="prose">
        <p>
          Hardware is listed, but the new docs hub makes it easier to find. Start with the Chicken Tender
          hardware catalog for approved components, sensors, actuators, rail concepts, WatchTower AI,
          solar, networking, and control-box guidance.
        </p>
      </div>
      <table className="info-table">
        <thead>
          <tr><th>Area</th><th>Current source</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Chicken TenderCell</td><td><code>docs/CHICKEN_TENDER_HARDWARE_CATALOG.md</code></td><td>Reference catalog</td></tr>
          <tr><td>WatchTower AI</td><td><code>docs/TenderCells_Predator_Monitor_Hardware_List.xlsx</code></td><td>Needs Markdown product folder</td></tr>
          <tr><td>Roaming Roost</td><td><code>docs/products/roaming-roost/README.md</code></td><td>Needs BOM and wiring</td></tr>
          <tr><td>Firmware targets</td><td><code>firmware/chicken-tender</code>, <code>firmware/watchtower</code>, <code>firmware/roaming-roost</code></td><td>Active prototypes</td></tr>
        </tbody>
      </table>

      <h2 className="section-title" id="ideas">Product Ideas To Build</h2>
      <div className="prose">
        <p>
          These are the visual assets already in the repo. Use them as starter prompts for product docs,
          good-first-issues, hardware proposals, classroom projects, and simulator-only product families.
        </p>
      </div>
      <div className="card-grid">
        {buildIdeas.map((idea) => (
          <div key={idea.title} className="card product-idea-card">
            <img src={idea.image} alt={idea.alt} loading="lazy" />
            <h3>{idea.title}</h3>
            <p>{idea.prompt}</p>
            <p><code>{idea.firstDoc}</code></p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="product-standard">Product Folder Standard</h2>
      <div className="prose">
        <p>Every TenderCells product or community hardware module should include this folder shape:</p>
      </div>
      <div className="card-grid">
        {productDocs.map((doc) => (
          <div key={doc} className="card compact-card">
            <h3><code>{doc}</code></h3>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="next">What To Build Next</h2>
      <div className="prose">
        <ul>
          <li>Turn WatchTower AI hardware workbook data into a complete Markdown product folder.</li>
          <li>Add BOM, wiring, and safety validation docs for Roaming Roost.</li>
          <li>Promote MQTT examples into per-product <code>api-mqtt.md</code> contracts.</li>
          <li>Add simulator examples that become good-first-issues for students and makers.</li>
        </ul>
      </div>

      <div className="cta-bar">
        <a href="https://github.com/WeCr8/TenderCells/tree/main/docs/developer" target="_blank" rel="noopener noreferrer" className="btn-primary">
          Open Developer Docs
        </a>
        <a href="https://github.com/WeCr8/TenderCells/tree/main/docs/products" target="_blank" rel="noopener noreferrer" className="btn-outline">
          Product Docs
        </a>
      </div>
    </PageLayout>
  );
}

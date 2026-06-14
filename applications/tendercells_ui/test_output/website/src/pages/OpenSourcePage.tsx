import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const roadmap = [
  {
    phase: "Phase 1",
    title: "Foundation",
    items: ["Dashboard", "WatchTower AI", "Chicken TenderCell MVP", "First local hardware validation tests"],
  },
  {
    phase: "Phase 2",
    title: "Property + Fleet",
    items: ["Roaming Roost", "Property mapping", "Fleet registry", "Custom product schemas"],
  },
  {
    phase: "Phase 3",
    title: "More Animal Systems",
    items: ["Pigeon Palace", "Duck Dock", "Goat Guardian", "Bunny Burrow"],
  },
  {
    phase: "Phase 4",
    title: "TenderCells OS",
    items: ["Self-hosted platform", "Kit ecosystem", "Isaac Sim workflows", "Community modules"],
  },
];

const documentationNeeds = [
  "BOM with preferred and substitute parts",
  "Wiring diagram or pinout",
  "CAD/STL/source model files",
  "Firmware setup and flashing steps",
  "Assembly instructions",
  "Troubleshooting guide",
  "API and MQTT topic documentation",
  "Safety validation before moving hardware is enabled",
];

const contributionAreas = [
  { title: "Software", desc: "React/Firebase dashboard, product registry, CRUD workflows, mobile/tablet UX, telemetry, and simulation views." },
  { title: "Firmware", desc: "ESP32 and ESP32-S3 controller code, MQTT contracts, sensor drivers, watchdogs, E-STOP behavior, and field-test reports." },
  { title: "Hardware", desc: "BOMs, wiring diagrams, printed parts, enclosures, mounting brackets, rail modules, feeders, waterers, and door systems." },
  { title: "Simulation", desc: "Browser Three.js layouts, Isaac Sim instructions, robot/product models, property obstacles, terrain capture, and safety validation." },
  { title: "Education", desc: "Build guides for schools, FFA, 4H, maker spaces, homesteading groups, and first-time electronics builders." },
  { title: "Marketing", desc: "Build videos, community posts, case studies, deployment photos, and open-source launch coordination." },
];

const farmBotCues = [
  "Visual planning and remote operation",
  "Open hardware, software, docs, and developer resources",
  "DIY, kit, and education-friendly paths",
  "Self-hosting, simulation, APIs, message broker, and SDK concepts",
];

export default function OpenSourcePage() {
  return (
    <PageLayout>
      <PageHero
        variant="dark"
        title="Open Source TenderCells OS"
        subtitle="Build it yourself, improve it, repair it, simulate it, or buy a kit when you want the faster path."
        image="/assets/images/demos/chickeneye-eggs-demo.png"
        imageAlt="TenderCells ChickenEye page showing camera tabs and egg detection simulation"
      />

      <div className="prose">
        <p>
          TenderCells is becoming an open-source platform for home farming automation and animal care.
          The goal is practical ownership: open software, open firmware direction, hardware documentation,
          product registration, property simulation, and community custom builds without black-box lock-in.
        </p>
        <p>
          We want farmers, developers, educators, and deeply technical builders to meet in one practical
          ecosystem: healthier animals, better care records, safer automation, and stronger humans who can
          understand, repair, and improve the systems around them.
        </p>
        <p>
          We are starting with Chicken TenderCell, WatchTower AI, Roaming Roost, and a registry for custom
          products so builders can connect their own devices, document their own hardware, and test safely.
        </p>
      </div>

      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer" className="btn-primary">GitHub Repository</a>
        <a href="https://github.com/WeCr8/TenderCells/issues/new/choose" target="_blank" rel="noopener noreferrer" className="btn-outline">Join Beta Builders</a>
        <a href="/app/products" className="btn-outline">Open Product Registry</a>
      </div>

      <h2 className="section-title" id="farmbot">Inspired by FarmBot</h2>
      <div className="prose">
        <p>
          TenderCells started from the same open-source spirit that makes FarmBot compelling:
          practical automation that people can study, repair, remix, self-host, document, and build into real-world systems.
          FarmBot focuses on CNC-style plant care; TenderCells expands that pattern toward animal care, homesteads,
          mobile enclosures, predator monitoring, property simulation, and community custom hardware.
        </p>
      </div>
      <div className="card-grid">
        {farmBotCues.map((cue) => (
          <div key={cue} className="card compact-card">
            <h3>{cue}</h3>
          </div>
        ))}
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="https://farm.bot/" target="_blank" rel="noopener noreferrer" className="btn-outline">Visit FarmBot</a>
        <a href="https://developer.farm.bot/v15/docs/farmbot-software-development" target="_blank" rel="noopener noreferrer" className="btn-outline">FarmBot Developer Docs</a>
        <a href="https://github.com/FarmBot" target="_blank" rel="noopener noreferrer" className="btn-outline">FarmBot GitHub</a>
      </div>

      <h2 className="section-title">What We Are Building</h2>
      <div className="card-grid">
        {contributionAreas.map((area) => (
          <div key={area.title} className="card">
            <h3>{area.title}</h3>
            <p>{area.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Roadmap</h2>
      <div className="card-grid">
        {roadmap.map((phase) => (
          <div key={phase.phase} className="card">
            <span className="tag">{phase.phase}</span>
            <h3>{phase.title}</h3>
            <ul>
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="standards">Product Documentation Standard</h2>
      <div className="prose">
        <p>
          Every product, kit, module, or community custom build should be documented well enough for
          another builder to assemble, flash, test, repair, and simulate it without direct support.
        </p>
      </div>
      <div className="card-grid">
        {documentationNeeds.map((need) => (
          <div key={need} className="card compact-card">
            <h3>{need}</h3>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="beta">Beta Builder Program</h2>
      <div className="prose">
        <p>
          We are looking for early builders who can test software-only flows, simulation-only flows,
          documentation build-throughs, garage hardware tests, field hardware tests, and school programs.
        </p>
      </div>
      <table className="info-table">
        <thead>
          <tr><th>Track</th><th>Useful For</th><th>First Output</th></tr>
        </thead>
        <tbody>
          <tr><td>Software only</td><td>Product registry, CRUD, mobile UI, auth, telemetry</td><td>Bug reports and screenshots</td></tr>
          <tr><td>Simulation only</td><td>Property layout, obstacles, robots, Isaac Sim workflows</td><td>Scene notes and setup gaps</td></tr>
          <tr><td>Documentation build-through</td><td>Builders without complete kits</td><td>Missing steps and photos</td></tr>
          <tr><td>Garage hardware test</td><td>Motors, sensors, doors, waterers, feeders, controllers</td><td>Safety checklist and wiring notes</td></tr>
          <tr><td>Field hardware test</td><td>Animal-safe beta deployments</td><td>Reliability and care observations</td></tr>
        </tbody>
      </table>

      <h2 className="section-title" id="license">Free, Paid, and Repairable</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Free and Open</h3>
          <p>Self-hosted dashboard, open-source firmware direction, product schemas, build docs, and simulation instructions.</p>
        </div>
        <div className="card">
          <h3>Paid When Helpful</h3>
          <p>Hardware kits, complete systems, cloud hosting, AI analytics, consulting, and custom integrations.</p>
        </div>
        <div className="card">
          <h3>No Black Box</h3>
          <p>The paid path should save time without blocking people from self-hosting, repairing, remixing, or learning.</p>
        </div>
      </div>

      <h2 className="section-title" id="contribute">How to Contribute</h2>
      <div className="prose">
        <ul>
          <li>Open a beta-builder issue if you want to test a product, kit, or simulation workflow.</li>
          <li>Open a product documentation issue if a BOM, wiring diagram, firmware guide, or safety note is missing.</li>
          <li>Open a custom product proposal for feeders, waterers, doors, rail tools, monitors, or 3D printed modules.</li>
          <li>Share build photos, deployment notes, and fixes so the next builder has an easier path.</li>
        </ul>
      </div>
      <div className="cta-bar">
        <a href="https://github.com/WeCr8/TenderCells/issues/new/choose" target="_blank" rel="noopener noreferrer" className="btn-primary">Start Contributing</a>
        <a href="https://github.com/WeCr8/TenderCells/discussions" target="_blank" rel="noopener noreferrer" className="btn-outline">Join Discussions</a>
      </div>
    </PageLayout>
  );
}

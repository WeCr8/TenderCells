import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import "./DevelopersPage.css";

const quickLinks = [
  ["GitHub repository", "https://github.com/WeCr8/TenderCells"],
  ["Live public demo", "/app/demo"],
  ["Flash a device", "/flash"],
  ["Good first issues", "https://github.com/WeCr8/TenderCells/labels/good%20first%20issue"],
  ["Discussions", "https://github.com/WeCr8/TenderCells/discussions"],
];

// On-page jump links — mirrors mature open-robotics dev portals.
const toc = [
  ["Quick start", "#quickstart"],
  ["Architecture", "#architecture"],
  ["Tech stack", "#stack"],
  ["REST API", "#rest"],
  ["MQTT topics", "#mqtt"],
  ["Code examples", "#examples"],
  ["CLI", "#cli"],
  ["Hardware", "#hardware"],
  ["Contributing", "#contributing"],
];

// Tech stack — matches the project's actual layers.
const stack = [
  ["Web / dashboard", "React + Vite + TypeScript", "applications/tendercells_ui/test_output/tendercells-ui"],
  ["Mobile app", "React Native (Expo), Zustand", "app/"],
  ["API / MQTT bridge", "Express (Node 18) → MQTT", "applications/.../express-api"],
  ["Backend / auth", "Firebase Auth, Firestore, Functions", "functions/"],
  ["Real-time control", "MQTT (Mosquitto) on Raspberry Pi", "tc/{deviceId}/…"],
  ["Coop firmware", "ESP32 / ESP32-S3, Arduino + PlatformIO", "firmware/"],
  ["Edge AI / vision", "ESP32-S3, TensorFlow Lite Micro", "firmware/watchtower"],
];

// REST reference (express-api, base http://localhost:3001/api/mqtt).
const restApi = [
  ["GET", "/devices/{id}/telemetry", "Sensor data: temp, humidity, ammonia, feed, water, count"],
  ["GET", "/devices/{id}/state", "System state: idle | running | error | estop"],
  ["GET", "/devices/{id}/alerts", "Active alerts (predator / fault / health)"],
  ["POST", "/devices/{id}/door", `Open/close door — {"state":"open"|"close"}`],
  ["POST", "/devices/{id}/feed", `Dispense feed — {"amount": grams}`],
  ["POST", "/devices/{id}/clean", `Cleaning cycle — {"action":"start"|"stop"}`],
  ["POST", "/devices/{id}/arm", `6DOF arm — {"joints":[...],"speed":0-1}`],
  ["POST", "/devices/{id}/estop", "Emergency stop — cuts all actuators (QoS 2, retained)"],
  ["GET", "/mqtt/status", "Broker connection + device list"],
];

// MQTT topic contracts (deviceId-scoped).
const mqttTopics = [
  ["tc/{id}/cmd/arm", "1", "Joint angle commands"],
  ["tc/{id}/cmd/door", "1", "open | close"],
  ["tc/{id}/cmd/feed", "1", "Dispense amount (g)"],
  ["tc/{id}/cmd/clean", "1", "start | stop cleaning cycle"],
  ["tc/{id}/cmd/estop", "2 · retain", "EMERGENCY STOP"],
  ["tc/{id}/state", "1", "Device publishes state transitions"],
  ["tc/{id}/sensors", "0", "10s telemetry / Starter Node heartbeat"],
  ["tc/{id}/alert", "2", "Predator / fault alerts"],
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
    body: "The Chicken Tender hardware catalog lists structural hardware, sensors, motors, power, networking, WatchTower AI, rail systems, tool modules, camera/health monitoring, and swappable robotics concepts.",
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
    image: "/assets/images/products/chicken-tender-concept.png",
    alt: "Concept render of the Chicken Tender automated coop",
    prompt: "Start from the Chicken Tender cell: document automatic doors, latches, feed/water modules, health/camera monitoring, and a swappable rail/arm service layer.",
    firstDoc: "docs/products/chicken-tendercell/README.md",
    productPage: "/shop/chicken-tender",
    docsHref: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/chicken-tendercell",
  },
  {
    title: "Camera Inspection Node",
    image: "/assets/images/products/predator-monitor-pole-mount.png",
    alt: "Pole-mounted WatchTower AI predator monitor",
    prompt: "Create the WatchTower predator monitor: a solar pole-mounted 360-degree camera pod with ESP32, battery, and LoRa alerts.",
    firstDoc: "docs/products/watchtower-ai/README.md",
    productPage: "/shop/watchtower",
    docsHref: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md",
  },
  {
    title: "Nest Box Egg Sensor",
    image: "/assets/images/demos/chickeneye-eggs-demo.png",
    alt: "ChickenEye egg detection and nest box map",
    prompt: "Document an IR, load-cell, or vision-based nest-box sensor that feeds the egg map and production history.",
    firstDoc: "docs/products/nest-box-egg-sensor/README.md",
    productPage: "/shop/chicken-tender",
    docsHref: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md",
  },
  {
    title: "Flock RFID Station",
    image: "/assets/images/demos/animal-roster-demo.png",
    alt: "TenderCells animal roster and health records",
    prompt: "Prototype a weigh/RFID checkpoint that updates per-animal profiles, last-seen status, and health notes.",
    firstDoc: "docs/products/flock-rfid-station/README.md",
    productPage: "/shop/chicken-tender",
    docsHref: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md",
  },
  {
    title: "Mobile Pasture Roost",
    image: "/app/assets/images/products/roaming-roost.svg",
    alt: "Roaming Roost mobile pasture coop concept",
    prompt: "Turn Roaming Roost into a builder-friendly product folder with drive base, docking, GPS boundary, and safety docs.",
    firstDoc: "docs/products/roaming-roost/README.md",
    productPage: "/shop/roaming-roost",
    docsHref: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/roaming-roost",
  },
];

function external(href: string) {
  return href.startsWith("http");
}

export default function DevelopersPage() {
  return (
    <PageLayout>
      <PageHero
        variant="dark"
        title="TenderCells Developer"
        subtitle="Software, firmware, hardware, simulation, and integration docs for open animal-care automation."
        image="/assets/images/demos/door-device-crud-demo.png"
        imageAlt="TenderCells door and device automation dashboard"
      />

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

      <nav className="dev-toc" aria-label="Developer sections">
        {toc.map(([label, href]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>

      <h2 className="section-title" id="quickstart">Quick Start</h2>
      <div className="prose">
        <p>From clone to a live device talking to the dashboard:</p>
      </div>
      <pre className="code-sample">{`# 1. Clone + install
git clone https://github.com/WeCr8/TenderCells.git
cd TenderCells

# 2. Run the stack (embedded MQTT broker + API + sim devices)
cd applications/tendercells_ui/test_output/express-api && npm install && npm run dev   # :3001
cd ../tendercells-ui && npm install && npm run dev                                     # :5173

# 3. Flash a real board (no installs) — Chrome/Edge:
#    https://tendercells.com/flash   → set WiFi + broker IP in the portal
#    or build firmware: cd firmware/starter-node && pio run -t upload

# 4. See it: open the dashboard, the device appears and streams telemetry.`}</pre>
      <div className="prose">
        <p>No hardware yet? The <a href="/app/demo">public demo</a> seeds simulated devices, flocks,
          schedules, and egg maps in your browser — no signup, no backend.</p>
      </div>

      <h2 className="section-title" id="architecture">Architecture</h2>
      <div className="prose">
        <p>Local-first control: motion never routes through the cloud. Commands take the fast LAN path
          over MQTT; only alerts and history sync to the cloud.</p>
      </div>
      <pre className="code-sample">{`  app / web / tc CLI ──▶ REST (Express :3001) ──▶ MQTT broker ──▶ ESP32 device
                                                      ▲                │
                                                      └── sensors/state/alerts ──┘
  Firebase (auth, history, alerts)  ◀── cloud sync (non-realtime)`}</pre>

      <h2 className="section-title" id="stack">Tech Stack</h2>
      <table className="info-table">
        <thead><tr><th>Layer</th><th>Technology</th><th>Path</th></tr></thead>
        <tbody>
          {stack.map(([layer, tech, path]) => (
            <tr key={layer}><td>{layer}</td><td>{tech}</td><td><code>{path}</code></td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title" id="rest">REST API</h2>
      <div className="prose">
        <p>The Express bridge exposes hardware control over HTTP. Base:
          <code>http://localhost:3001/api/mqtt</code>. Commands are forwarded to the device over MQTT.</p>
      </div>
      <table className="info-table">
        <thead><tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr></thead>
        <tbody>
          {restApi.map(([m, ep, desc]) => (
            <tr key={ep}>
              <td><span className={`method ${m.toLowerCase()}`}>{m}</span></td>
              <td><code>{ep}</code></td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title" id="mqtt">MQTT Topics</h2>
      <div className="prose">
        <p>Devices speak MQTT directly. Topics are <code>deviceId</code>-scoped. E-STOP is QoS 2 and
          retained so a reconnecting device always receives an active stop.</p>
      </div>
      <table className="info-table">
        <thead><tr><th>Topic</th><th>QoS</th><th>Payload / meaning</th></tr></thead>
        <tbody>
          {mqttTopics.map(([t, qos, desc]) => (
            <tr key={t}><td><code>{t}</code></td><td>{qos}</td><td>{desc}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title" id="examples">Code Examples</h2>
      <p className="code-label">Read telemetry (curl)</p>
      <pre className="code-sample">{`curl http://localhost:3001/api/mqtt/devices/ct_001/telemetry`}</pre>
      <p className="code-label">Open the coop door</p>
      <pre className="code-sample">{`curl -X POST http://localhost:3001/api/mqtt/devices/ct_001/door \\
  -H "Content-Type: application/json" \\
  -d '{"state":"open"}'`}</pre>
      <p className="code-label">Subscribe to live sensors (Node, mqtt.js)</p>
      <pre className="code-sample">{`import mqtt from "mqtt";
const c = mqtt.connect("mqtt://localhost:1883");
c.on("connect", () => c.subscribe("tc/ct_001/sensors"));
c.on("message", (t, m) => console.log(t, JSON.parse(m.toString())));`}</pre>
      <p className="code-label">Emergency stop (always QoS 2 + retain)</p>
      <pre className="code-sample">{`curl -X POST http://localhost:3001/api/mqtt/devices/ct_001/estop`}</pre>

      <h2 className="section-title" id="cli">Command-Line (tc)</h2>
      <div className="prose">
        <p>The <code>tc</code> CLI ships with the express-api package for scripting and diagnostics:</p>
      </div>
      <pre className="code-sample">{`tc status                 # list connected devices + broker state
tc devices                # registered device IDs
tc telemetry ct_001       # latest sensor readings
tc door ct_001 open       # send a command
tc estop ct_001           # emergency stop`}</pre>

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
          solar, networking, camera/health monitoring, swappable robotics, and control-box guidance.
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
          <tr><td>Barn Brain</td><td><code>docs/products/barn-brain/README.md</code></td><td>Jetson edge hub concept</td></tr>
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
            <div className="product-doc-links">
              <a href={idea.productPage}>Product page</a>
              <a href={idea.docsHref} target="_blank" rel="noopener noreferrer">Docs</a>
            </div>
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

      <h2 className="section-title" id="contributing">Contributing</h2>
      <div className="prose">
        <p>TenderCells is Apache-2.0 open source. Good first contributions: a new
          <code>peripheral</code> sensor driver, a product-folder doc, a simulator example, or an
          MQTT contract. Safety rules are non-negotiable in review:</p>
        <ul>
          <li>Motion commands go over MQTT, never Firebase.</li>
          <li>E-STOP stays QoS 2 + retained; never remove the handler.</li>
          <li>No hardcoded WiFi creds, API keys, or device IDs (CI secret-scan blocks them).</li>
          <li>Firmware: watchdog armed, non-blocking reconnect, no <code>delay()</code> &gt; 50ms, steppers disabled when idle.</li>
          <li>UI hardware actions go through a confirmation modal.</li>
        </ul>
        <p>Open a PR against <code>main</code>; CI runs type-check, tests, firmware build, and secret-scan.</p>
      </div>

      <h2 className="section-title" id="next">What To Build Next</h2>
      <div className="prose">
        <ul>
          <li>Turn WatchTower AI hardware workbook data into a complete Markdown product folder.</li>
          <li>Add BOM, wiring, and safety validation docs for Roaming Roost.</li>
          <li>Document swappable Chicken Tender robot arms, gantries, end effectors, cameras, health sensors, and Jetson edge controllers.</li>
          <li>Prototype Barn Brain on NVIDIA Jetson Nano-class hardware with local MQTT, routines, device registry, and safety events.</li>
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

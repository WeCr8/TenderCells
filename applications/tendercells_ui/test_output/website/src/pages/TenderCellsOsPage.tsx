// TenderCellsOsPage (/os) - the dedicated page for Tender Cells OS: what it is, what is in
// it (each with a demo deep link and its docs), how devices talk to it, and the step-by-step
// path for designers and developers to build a device that works in the OS.
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import RelatedContent, { ContentLinkItem } from "../components/RelatedContent";
import { demo, type ContentLink } from "../data/contentGraph";
import { TENDERCELLS_OS_URL } from "../config/appLinks";
import EntityStatus from "../components/EntityStatus";
import { ENTITIES, TENDERCELLS, TENDERCELLS_OS } from "../data/entities";
import "./TenderCellsOsPage.css";

const FEATURES: { title: string; img: string; body: string; tryIt: string; read: ContentLink }[] = [
  { title: "Property layout in 2D and 3D", img: "os-property-layout.jpg", body: "Map your yard: coops, gardens, trees, water points and paths. Draw robot routes and see everything in 3D.", tryIt: demo("/layout"), read: { kind: "doc", title: "Property map layers", to: "/docs/property-map-layers" } },
  { title: "Robot exclusion zones", img: "os-robot-zones.jpg", body: "No-go, keep-out and no-laser zones are sent to every robot, which refuses to drive or fire inside them.", tryIt: demo("/layout"), read: { kind: "doc", title: "Robot exclusion zones", to: "/docs/robot-exclusion-zones" } },
  { title: "Weed patrol (beds and rovers)", img: "os-weed-patrol.jpg", body: "A camera finds weeds, animals and water leaks and pins them on the map. You decide every action.", tryIt: demo("/weed-patrol"), read: { kind: "doc", title: "Weed patrol", to: "/docs/weed-patrol" } },
  { title: "Predator monitor", img: "os-predator-monitor.jpg", body: "WatchTower detections with bearing and distance, placed on the property map.", tryIt: demo("/predator-monitor"), read: { kind: "guide", title: "Predator Monitoring Guide", to: "/guides/predator-monitoring" } },
  { title: "Device cameras in 3D", img: "os-3d-camera-views.jpg", body: "Inside and outside camera views for coops, docks, robots and your own builds.", tryIt: demo("/layout"), read: { kind: "doc", title: "Device UI & secure video", to: "/docs/device-ui-and-secure-video" } },
  { title: "Chicken Tender controls", img: "os-chicken-tender.jpg", body: "Doors, feed, water, climate, eggs and E-STOP for a coop, with a confirmation before every motion.", tryIt: demo("/chicken-tender"), read: { kind: "doc", title: "Chicken Tender product doc", to: "/docs/chicken-tender" } },
  { title: "Animal & plant library", img: "os-library.jpg", body: "Care, health and safety notes by species, crops, weeds and toxic plants - the same library as this site.", tryIt: demo("/library"), read: { kind: "guide", title: "Library on this site", to: "/library" } },
  { title: "DIY habitat projects", img: "os-diy-projects.jpg", body: "Terrarium climate, enclosure cameras and sound monitors, with feeds that stay on your network.", tryIt: demo("/projects"), read: { kind: "doc", title: "DIY habitat projects", to: "/docs/diy-habitat-projects" } },
  { title: "Watershed & drainage", img: "os-watershed.jpg", body: "Rain, puddles, flow and erosion on your own terrain - and what a fix would change.", tryIt: demo("/layout"), read: { kind: "doc", title: "Property map layers", to: "/docs/property-map-layers" } },
];

const BUILD_STEPS: { title: string; body: string; links: ContentLink[] }[] = [
  {
    title: "Try it with no hardware",
    body: "Run a simulated device on a laptop and watch it appear in the OS. You learn the whole loop - sensors in, commands out - before buying parts.",
    links: [
      { kind: "lesson", title: "Classroom Quickstart", to: "/lessons/classroom-quickstart" },
      { kind: "doc", title: "Quick start (zero hardware)", to: "/docs/connect-a-device#quick-start-zero-hardware-2-minutes" },
    ],
  },
  {
    title: "Pick a board",
    body: "Start with the Starter Node (ESP32 or XIAO ESP32-C3/S3): one firmware that becomes a door, relay, sensor or RC drive. For video, use the XIAO ESP32-S3 Sense camera node.",
    links: [
      { kind: "doc", title: "Starter Node: what hardware do I need?", to: "/docs/starter-node-firmware" },
      { kind: "guide", title: "Camera Node: first build", to: "/guides/camera-node-first-build" },
      { kind: "doc", title: "Hardware catalog", to: "/docs/hardware-catalog" },
    ],
  },
  {
    title: "Flash it from the browser",
    body: "Plug the board in over USB and flash the firmware from Chrome or Edge. No toolchain needed; PlatformIO / Arduino builds are there when you want to change the code.",
    links: [
      { kind: "tool", title: "Browser flasher", to: "/flash" },
      { kind: "lesson", title: "Your First Coop Brain (step by step)", to: "/lessons/your-first-coop-brain" },
    ],
  },
  {
    title: "Connect it: WiFi, broker, product type",
    body: "On first boot the board asks for WiFi, the MQTT broker (your Barn Brain / Pi, or the classroom broker) and what it is. No WiFi? Join the classroom LoRa mesh.",
    links: [
      { kind: "doc", title: "First boot setup", to: "/docs/starter-node-firmware#5-first-boot--set-wifi-broker-and-product-type" },
      { kind: "doc", title: "Connect a device", to: "/docs/connect-a-device" },
    ],
  },
  {
    title: "Speak the Tender Cells contract",
    body: "Publish sensors on tc/{id}/sensors, state on tc/{id}/state and alerts on tc/{id}/alert. Subscribe to tc/{id}/cmd/+ and always obey tc/{id}/cmd/estop (QoS 2, retained).",
    links: [
      { kind: "doc", title: "MQTT topics and payloads", to: "/docs/connect-a-device#topics" },
      { kind: "doc", title: "Minimum viable device", to: "/docs/connect-a-device#minimum-viable-device" },
      { kind: "tool", title: "Backend API (every endpoint and topic, XML)", to: "/api/tendercells-backend.xml" },
    ],
  },
  {
    title: "Register it in the OS",
    body: "Claim the board by its device id so it belongs to your account (or your school), then add it in Products & Devices. Custom builds use the Community Custom template.",
    links: [
      { kind: "lesson", title: "Register the device to your account", to: "/lessons/door-roaming-roost#step-3--register-the-device-to-your-account" },
      { kind: "os", title: "Products & devices", to: demo("/products") },
    ],
  },
  {
    title: "Show it on the property map",
    body: "Place it in Property Layout. Give it a route if it moves, camera mounts if it sees, and a 3D model if you designed one.",
    links: [
      { kind: "os", title: "Property layout", to: demo("/layout") },
      { kind: "doc", title: "CAD to web (bring your model in)", to: "/docs/cad-to-web" },
      { kind: "tool", title: "3D model viewer", to: "/viewer" },
    ],
  },
  {
    title: "Make it safe",
    body: "Every motion needs a confirmation in the OS, an E-STOP the device obeys instantly, motors off when idle, and respect for exclusion zones. Lasers never fire near animals.",
    links: [
      { kind: "doc", title: "Robot exclusion zones", to: "/docs/robot-exclusion-zones" },
      { kind: "doc", title: "Laser safety", to: "/docs/weed-patrol#laser-safety-read-before-enabling-burn" },
    ],
  },
  {
    title: "Document it and share it",
    body: "Write it up with the product documentation standard so others can build it, then open a pull request. Good builds become lessons.",
    links: [
      { kind: "doc", title: "Product documentation standard", to: "/docs/product-documentation-standard" },
      { kind: "doc", title: "Lesson template", to: "/docs/lesson-template" },
      { kind: "doc", title: "Contributing", to: "/docs/contributing" },
    ],
  },
];

const PATHS: { id: string; title: string; who: string; links: ContentLink[] }[] = [
  {
    id: "design",
    title: "For designers",
    who: "Enclosures, brackets, mounts and whole products - modelled, printed and shown in the OS.",
    links: [
      { kind: "lesson", title: "AI + CAD with Fusion MCP", to: "/lessons/ai-cad-fusion" },
      { kind: "doc", title: "CAD to web (SolidWorks export)", to: "/docs/cad-to-web" },
      { kind: "doc", title: "Chicken Tender CAD", to: "/docs/chicken-tender-cad" },
      { kind: "doc", title: "Product ideas", to: "/docs/product-ideas" },
      { kind: "tool", title: "3D model viewer", to: "/viewer" },
    ],
  },
  {
    id: "developers",
    title: "For developers",
    who: "Firmware, the MQTT bridge, robots and the OS itself.",
    links: [
      { kind: "doc", title: "Machine-readable backend", to: "/docs/machine-readable-backend" },
      { kind: "doc", title: "Robot arm service", to: "/docs/arm-service" },
      { kind: "doc", title: "NVIDIA Isaac Sim", to: "/docs/isaac-sim" },
      { kind: "doc", title: "Developer docs", to: "/docs/developer" },
      { kind: "guide", title: "Developers page", to: "/developers" },
    ],
  },
  {
    id: "teachers",
    title: "For teachers",
    who: "Run it with a class: simulated devices first, real boards next.",
    links: [
      { kind: "lesson", title: "Classroom Quickstart", to: "/lessons/classroom-quickstart" },
      { kind: "lesson", title: "Learning Tracks", to: "/lessons/learning-tracks" },
      { kind: "guide", title: "Schools: sign-in & IT setup", to: "/schools" },
      { kind: "guide", title: "Science fair projects", to: "/science-fair" },
    ],
  },
];

export default function TenderCellsOsPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        kicker="Tender Cells OS"
        title="The farming OS for your animals, garden and robots"
        subtitle="One app for the whole property: a live 2D / 3D map, animal care, cameras, schedules and robots that ask before they act. Local-first - your devices talk to your own hub."
        image="/assets/images/os/os-property-layout.jpg"
        imageAlt="Tender Cells OS property layout with coops, garden and robot routes"
      />

      <div className="cta-bar">
        <a href="/app/demo" className="btn-primary">Open the free demo</a>
        <a href={TENDERCELLS_OS_URL} className="btn-outline">Launch Tender Cells OS</a>
        <a href="#build" className="btn-outline">Build a device for it</a>
      </div>

      <h2 className="section-title" id="what">What it is</h2>
      <div className="prose">
        <p>{TENDERCELLS_OS}</p>
        <p>{TENDERCELLS} The OS runs today as software and a public simulation; the hardware families below are at different stages, each labelled honestly.</p>
      </div>
      <div className="cta-bar">
        <a href={demo("/simulator")} className="btn-outline">Trigger an event in the demo</a>
        <a href={demo("/missions")} className="btn-outline">Try a mission</a>
      </div>

      <h2 className="section-title" id="inside">What's inside</h2>
      <div className="os-features">
        {FEATURES.map((f) => (
          <article key={f.title} className="os-feature">
            <img src={`/assets/images/os/${f.img}`} alt={`Tender Cells OS - ${f.title}`} loading="lazy" />
            <div className="os-feature-body">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <div className="os-feature-links">
                <a href={f.tryIt} className="os-try">Try it in the demo →</a>
                <ContentLinkItem link={f.read} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <h2 className="section-title" id="how">How it fits together</h2>
      <ol className="os-flow">
        <li><strong>Devices</strong><span>ESP32 nodes, cameras, rovers and arms publish sensors and obey commands.</span></li>
        <li><strong>Your hub</strong><span>An MQTT broker on your network (Barn Brain / Raspberry Pi) - motion commands never leave it.</span></li>
        <li><strong>Tender Cells OS</strong><span>The map, schedules, reviews and alerts. Media goes device → browser; only small JSON goes through the cloud.</span></li>
        <li><strong>You</strong><span>Confirm every motion, approve every robot action, press E-STOP any time.</span></li>
      </ol>

      <h2 className="section-title" id="systems">Systems and their status</h2>
      <div className="os-systems">
        {ENTITIES.map((e) => (
          <section key={e.slug} className="os-system">
            <h3>{e.page.startsWith("/os") ? e.name : <Link to={e.page}>{e.name}</Link>}</h3>
            <EntityStatus entity={e} />
          </section>
        ))}
      </div>

      <h2 className="section-title" id="build">Build a device for Tender Cells OS</h2>
      <div className="prose">
        <p>
          The same path works for a first-time student and an experienced engineer: prove it in simulation,
          flash a board, speak the MQTT contract, register it, then place it on your property. Each step
          links to the lesson that walks you through it and the reference with the exact details.
        </p>
      </div>
      <ol className="os-steps">
        {BUILD_STEPS.map((s, i) => (
          <li key={s.title} id={`build-${i + 1}`}>
            <span className="os-step-num" aria-hidden="true">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <ul className="os-step-links">{s.links.map((l) => <li key={l.to}><ContentLinkItem link={l} /></li>)}</ul>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="section-title" id="paths">Your path</h2>
      <div className="os-paths">
        {PATHS.map((p) => (
          <section key={p.id} id={p.id} className="rc-topic">
            <h3>{p.title}</h3>
            <p>{p.who}</p>
            <ul>{p.links.map((l) => <li key={l.to}><ContentLinkItem link={l} /></li>)}</ul>
          </section>
        ))}
      </div>

      <RelatedContent topics={["devices", "rover", "sensors"]} title="More to explore" />

      <div className="cta-bar">
        <a href="/app/demo" className="btn-primary">Open the free demo</a>
        <Link to="/docs" className="btn-outline">All documentation</Link>
        <Link to="/lessons" className="btn-outline">Hands-on lessons</Link>
      </div>
    </PageLayout>
  );
}

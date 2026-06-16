import { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const FAQS = [
  { q: "Do I need internet to use Chicken Tender?", a: "No. All real-time control runs over MQTT on your local network via a Raspberry Pi 4. Internet is only needed for cloud sync, push notifications, and remote access." },
  { q: "How long would installation take?", a: "The design goal is a few hours: place coop, run power, connect to WiFi, and run a guided setup. TenderCells is concept-stage, so this is a target, not a measured time from shipped units." },
  { q: "Could it work with my existing coop?", a: "The XYZ gantry + arm concept is meant to mount to the ceiling of a 4×4 ft or larger enclosure with about 5 ft of clearance. A retrofit path for existing coops is a goal, not a finished kit." },
  { q: "What happens during a power outage?", a: "The coop door defaults to closed (spring-loaded latch). Feed/water dispensers hold position. The ESP32 reconnects automatically when power returns and resumes the last schedule." },
  { q: "Is the robot arm safe around chickens?", a: "Yes. The arm checks for chicken presence (via camera) before any motion. Force sensors cut power if unexpected resistance is detected. E-STOP cuts all actuator power in <100ms." },
  { q: "Can I add more cameras or sensors?", a: "Yes. The MQTT architecture supports unlimited device nodes. Add WatchTower AI units for camera coverage or additional ESP32 sensor nodes for more measurement points." },
  { q: "What would the monthly cost be?", a: "No mandatory subscription is planned for local operation. An optional TenderCare plan (target around $19/mo) would add AI health alerts, longer history, and remote access. Pricing is not final." },
  { q: "How is the firmware updated?", a: "OTA (over-the-air) updates push from the app. You approve each update. Rollback to any previous version is supported. All firmware is open source — you can also compile and flash manually." },
];

// Hands-on lessons live as markdown in the repo (docs/). Linked here so they're
// discoverable from the site — no dead ends. Ordered as the learning path.
const DOCS_BASE = "https://github.com/WeCr8/TenderCells/blob/main/docs";
const LESSONS = [
  { title: "🐣 Start Here — Your First Coop Brain", desc: "Ages 7+. Flash a board and watch it come alive. LEGO-style steps.", href: `${DOCS_BASE}/lessons/00-your-first-coop-brain.md`, tag: "Ages 7+" },
  { title: "🚪 Build a Door + Roaming Roost", desc: "Wire a servo, open/close a door and drive a rover from the OS.", href: `${DOCS_BASE}/CLASSROOM_DOOR_AND_ROAMING_ROOST.md`, tag: "Beginner" },
  { title: "🌡️ Sensors → Automation", desc: "Add a light sensor; auto-open the door at sunrise.", href: `${DOCS_BASE}/CLASSROOM_SENSORS_AND_AUTOMATION.md`, tag: "Beginner" },
  { title: "🍽️ Feeder + Waterer", desc: "Relay-driven feeding and watering, on a schedule.", href: `${DOCS_BASE}/CLASSROOM_FEEDER_AND_WATERER.md`, tag: "Beginner" },
  { title: "🦅 Build Your Own Device", desc: "Invent an animal + threat; fire a live alert. No extra wiring.", href: `${DOCS_BASE}/CLASSROOM_BUILD_YOUR_OWN_DEVICE.md`, tag: "Beginner" },
  { title: "🤖 Gantry + BOMs", desc: "Build an XY robot gantry (coop & duck dock) with parts lists.", href: `${DOCS_BASE}/CLASSROOM_GANTRY_AND_BOM.md`, tag: "Advanced" },
  { title: "🧠 AI + CAD with Fusion MCP", desc: "Design parts with AI, model in Fusion 360 over MCP.", href: `${DOCS_BASE}/CLASSROOM_AI_CAD_FUSION_MCP.md`, tag: "Advanced" },
];

export default function LearnPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #0288d1 0%, #01579b 100%)"
        title="Learn More"
        subtitle="Everything you need to understand, set up, and master Tender Cells."
        image="/assets/images/demos/chickeneye-eggs-demo.png"
        imageAlt="TenderCells ChickenEye page showing camera tabs and egg detection simulation"
      />

      <h2 className="section-title" id="getting-started">Getting Started</h2>
      <div className="prose">
        <p>New to Tender Cells? Here's the path from unboxing to fully automated homestead:</p>
        <ol style={{ marginLeft: "1.5rem", lineHeight: 2 }}>
          <li><strong>Unbox &amp; place</strong> — level surface, 5 ft clearance overhead, access to 120V outlet</li>
          <li><strong>Download app</strong> — iOS or Android, or use the web dashboard</li>
          <li><strong>Create account</strong> — one account for all your Tender Cells devices</li>
          <li><strong>Scan QR code</strong> — printed on the device, auto-provisions to your network</li>
          <li><strong>Run setup wizard</strong> — configure flock size, nest box count, feeding schedule</li>
          <li><strong>Place chickens</strong> — arm waits in home position until you're ready</li>
          <li><strong>Enable automation</strong> — start with one schedule (evening door close), add more over time</li>
        </ol>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <Link to="/shop/chicken-tender" className="btn-primary">Explore Chicken Tender™</Link>
        <Link to="/learn/homesteading" className="btn-outline">Homesteading Guide</Link>
      </div>

      <h2 className="section-title" id="lessons">Hands-on Lessons (ages 7+)</h2>
      <div className="prose">
        <p>LEGO-style, step-by-step builds. Start at the top and follow the
          “What’s next” link inside each lesson — they form a path from a blinking
          board to a full robot coop.</p>
      </div>
      <div className="card-grid">
        {LESSONS.map((l) => (
          <a key={l.title} className="card" href={l.href} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{l.title}</h3>
            <p>{l.desc}</p>
            <span className="tag">{l.tag}</span>
          </a>
        ))}
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href={`${DOCS_BASE}/LEARNING_TRACKS.md`} target="_blank" rel="noopener noreferrer" className="btn-primary">🗺️ Full Learning Tracks map →</a>
        <a href="/flash" className="btn-outline">⚡ Flash a device</a>
      </div>

      <h2 className="section-title" id="how-it-works">How It Works</h2>
      <div className="card-grid">
        {[
          { icon: "📡", title: "Sensors Everywhere", desc: "DHT22 temperature/humidity, MQ-137 ammonia, load cells for feed and water, reed switches for doors, and computer vision for chicken counting." },
          { icon: "🧠", title: "Edge AI Processing", desc: "TensorFlow Lite Micro runs on the ESP32-S3 for real-time predator classification. No cloud latency — detection happens in <200ms locally." },
          { icon: "🤖", title: "Robot Arm Control", desc: "9DOF system: XYZ gantry positions the arm anywhere in the coop, 6DOF arm performs the task. Sequential and parallel motion for complex routines." },
          { icon: "📱", title: "Mobile Dashboard", desc: "React Native app shows live telemetry, 3D coop layout, egg map, alerts, and direct hardware control — all from your phone." },
          { icon: "🔒", title: "Safety First", desc: "E-STOP cuts all actuator power in <100ms. Chicken presence check before every arm movement. Watchdog timer restarts firmware on any hang." },
          { icon: "🌐", title: "Local-First Networking", desc: "MQTT broker on Raspberry Pi 4 handles all control commands on your LAN. No cloud dependency for real-time operation." },
        ].map((c) => (
          <div key={c.title} className="card">
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="docs">Documentation</h2>
      <div className="card-grid">
        {[
          { title: "User Guide",          desc: "Complete setup, operation, and maintenance guide for all Tender Cells products.", tag: "GitHub", href: `${DOCS_BASE}/README.md` },
          { title: "API Reference",       desc: "Full REST API and MQTT topic reference with payload schemas and code examples.", tag: "GitHub", href: "https://github.com/WeCr8/TenderCells/blob/main/README.md" },
          { title: "Firmware Guide",      desc: "PlatformIO build, OTA update, and custom firmware development guide.", tag: "GitHub", href: "https://github.com/WeCr8/TenderCells/tree/main/firmware" },
          { title: "Hardware Catalog",    desc: "Master hardware, electronics, sensors, and components reference.", tag: "GitHub", href: `${DOCS_BASE}/CHICKEN_TENDER_HARDWARE_CATALOG.md` },
          { title: "Troubleshooting",     desc: "Diagnostic codes, common errors, and resolution steps for every component.", tag: "GitHub", href: `${DOCS_BASE}/AUDIT_STUDENT_JOURNEY.md` },
          { title: "Control Types & Arm Plan", desc: "Every control type the OS supports, printing tactics, robot-arm plan.", tag: "GitHub", href: `${DOCS_BASE}/CONTROL_TYPES_AND_ARM_PLAN.md` },
        ].map((c) => (
          <a key={c.title} className="card" href={c.href} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">{c.tag}</span>
          </a>
        ))}
      </div>

      <h2 className="section-title" id="faq">FAQ</h2>
      {FAQS.map((item, i) => (
        <div key={i} className="faq-item">
          <div
            className="faq-q"
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setOpenFaq(openFaq === i ? null : i)}
          >
            {item.q}
            <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{openFaq === i ? "▲" : "▼"}</span>
          </div>
          {openFaq === i && <div className="faq-a">{item.a}</div>}
        </div>
      ))}

      <h2 className="section-title" id="forum">Community</h2>
      <div className="prose">
        <p>
          The Tender Cells community lives on GitHub Discussions. Ask questions, share build logs
          and automation ideas, report issues, and help shape what gets built next. It is open
          and just getting started — early contributors set the direction.
        </p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="https://github.com/WeCr8/TenderCells/discussions" target="_blank" rel="noopener noreferrer" className="btn-primary">GitHub Discussions →</a>
      </div>

      <h2 className="section-title" id="support">Support</h2>
      <div className="prose">
        <p>
          Need help? Start with the FAQ and troubleshooting docs. If you're still stuck:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@wecr8.info">support@wecr8.info</a> — we reply as soon as we can</li>
          <li><strong>GitHub Issues:</strong> <a href="https://github.com/WeCr8/TenderCells/issues" target="_blank" rel="noopener noreferrer">github.com/WeCr8/TenderCells/issues</a> for public bug reports and doc fixes</li>
        </ul>
      </div>
    </PageLayout>
  );
}

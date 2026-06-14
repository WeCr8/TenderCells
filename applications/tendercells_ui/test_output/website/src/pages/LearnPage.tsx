import { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const FAQS = [
  { q: "Do I need internet to use Chicken Tender?", a: "No. All real-time control runs over MQTT on your local network via a Raspberry Pi 4. Internet is only needed for cloud sync, push notifications, and remote access." },
  { q: "How long does installation take?", a: "Typical setup is 2–4 hours: unbox, place coop, run power, connect to WiFi, download app, run guided setup wizard. No special tools required." },
  { q: "Can I use my existing coop with the robot arm?", a: "The XYZ gantry + arm system mounts to the ceiling of any 4×4 ft or larger enclosure with 5 ft minimum clearance. A retrofit kit is in development for existing coops." },
  { q: "What happens during a power outage?", a: "The coop door defaults to closed (spring-loaded latch). Feed/water dispensers hold position. The ESP32 reconnects automatically when power returns and resumes the last schedule." },
  { q: "Is the robot arm safe around chickens?", a: "Yes. The arm checks for chicken presence (via camera) before any motion. Force sensors cut power if unexpected resistance is detected. E-STOP cuts all actuator power in <100ms." },
  { q: "Can I add more cameras or sensors?", a: "Yes. The MQTT architecture supports unlimited device nodes. Add WatchTower AI units for camera coverage or additional ESP32 sensor nodes for more measurement points." },
  { q: "What is the monthly cost?", a: "Hardware has no mandatory subscription. The optional TenderCare plan ($19/mo) adds AI health alerts, extended history, remote access, and priority support." },
  { q: "How is the firmware updated?", a: "OTA (over-the-air) updates push from the app. You approve each update. Rollback to any previous version is supported. All firmware is open source — you can also compile and flash manually." },
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
          { title: "User Guide",          desc: "Complete setup, operation, and maintenance guide for all Tender Cells products.", tag: "PDF + Web" },
          { title: "API Reference",       desc: "Full REST API and MQTT topic reference with payload schemas and code examples.", tag: "Web" },
          { title: "Firmware Guide",      desc: "PlatformIO build, OTA update, and custom firmware development guide.", tag: "GitHub" },
          { title: "Hardware Assembly",   desc: "Step-by-step assembly instructions with photos for all hardware kits.", tag: "PDF" },
          { title: "Troubleshooting",     desc: "Diagnostic codes, common errors, and resolution steps for every component.", tag: "Web" },
          { title: "Architecture Overview", desc: "System architecture: app → Firebase → MQTT → ESP32 → sensors + actuators.", tag: "Web" },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">{c.tag}</span>
          </div>
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

      <h2 className="section-title" id="forum">Community Forum</h2>
      <div className="prose">
        <p>
          Join thousands of homesteaders sharing build logs, automation ideas, and tips on the
          Tender Cells community forum. Ask questions, share your egg map stats, and vote on
          the next firmware feature.
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
          <li><strong>Email:</strong> <a href="mailto:support@wecr8.info">support@wecr8.info</a> — response within 1 business day</li>
          <li><strong>GitHub Issues:</strong> <a href="https://github.com/WeCr8/TenderCells/issues" target="_blank" rel="noopener noreferrer">github.com/WeCr8/TenderCells/issues</a></li>
          <li><strong>TenderCare subscribers:</strong> priority support with same-day response</li>
        </ul>
      </div>
    </PageLayout>
  );
}

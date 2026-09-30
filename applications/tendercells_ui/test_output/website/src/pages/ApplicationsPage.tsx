import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { TENDERCELLS_OS_URL } from "../config/appLinks";
import { Link } from "react-router-dom";

/** Screenshots of the OS demo (captured from tendercells.com/app/demo). */
const OS_SCREENS = [
  { src: "os-3d-camera-views.jpg", title: "3D property + device cameras", body: "Inside and outside camera views of each coop, dock and robot, with station flags (eggs ready, roost headcount)." },
  { src: "os-predator-monitor.jpg", title: "Predator Monitor", body: "WatchTower's three 120° cameras, located detections and snake / predator patrols on the map." },
  { src: "os-property-layout.jpg", title: "Property layout", body: "Draw your yard: products, gardens, obstacles, terrain, elevation and No-Go zones." },
  { src: "os-robot-zones.jpg", title: "Robot exclusion zones", body: "No-go, keep-out and no-laser zones around animals, sent to robots over MQTT and enforced on board." },
  { src: "os-weed-patrol.jpg", title: "Weed Patrol", body: "Camera passes find weeds; a person approves every aim or laser shot, behind hardware interlocks." },
  { src: "os-watershed.jpg", title: "Watershed & drainage", body: "Rain, puddles, flow and erosion on your terrain - then try fixes before you dig." },
  { src: "os-diy-projects.jpg", title: "DIY projects + live feeds", body: "Terrarium, enclosure camera, sound monitor and pond projects - video stays on your network." },
  { src: "os-library.jpg", title: "Animal & plant library", body: "Health by species (poultry, rodents, livestock, fish, reptiles), predators & pests, crops and weeds." },
  { src: "os-chicken-tender.jpg", title: "Chicken Tender dashboard", body: "Telemetry, doors, feeding, cleaning and the gantry + arm with a confirmation for every hardware action." },
];

export default function ApplicationsPage() {
  return (
    <PageLayout>
      <PageHero
        variant="dark"
        title={<>Applications &amp; Downloads</>}
        subtitle="Control your entire homestead from one app. Open APIs for builders."
        image="/assets/images/os/os-3d-camera-views.jpg"
        imageAlt="Tender Cells OS 3D property view with coop, duck dock and robot camera views"
      />

      <h2 className="section-title" id="ios">Mobile App — iOS</h2>
      <div className="prose">
        <p>
          The Tender Cells iOS app requires iOS 15+ and an iPhone 6S or newer.
          Download from the Apple App Store (link coming when v1.0 launches).
          The app works in <strong>Sim mode</strong> with no hardware — great for exploring
          before your unit arrives.
        </p>
        <ul>
          <li>Real-time telemetry dashboard (temperature, humidity, ammonia, feed, water)</li>
          <li>Live camera feed from WatchTower AI™</li>
          <li>Push notifications for predator alerts and sensor thresholds</li>
          <li>Arm control with safety confirmation for every hardware action</li>
          <li>Scheduling — set automated feeding, cleaning, and door routines</li>
          <li>Egg map — track collection from individual nest boxes</li>
          <li>TenderAI chat — ask your coop why ammonia is high</li>
        </ul>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="#ios-waitlist" className="btn-primary">Join iOS Waitlist</a>
      </div>

      <h2 className="section-title" id="android">Mobile App — Android</h2>
      <div className="prose">
        <p>
          Android app requires Android 9.0+ (API 28). Available on Google Play Store at launch.
          Same feature set as iOS — built from a single React Native codebase.
        </p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="#android-waitlist" className="btn-primary">Join Android Waitlist</a>
      </div>

      <h2 className="section-title" id="dashboard">Web Dashboard</h2>
      <div className="prose">
        <p>
          Full-featured web dashboard at <strong>app.tendercells.com</strong> (coming at launch).
          Runs in any modern browser — no app installation needed. Same data as mobile with
          larger 3D viewport for monitoring coop layout and arm position.
        </p>
      </div>

      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href={TENDERCELLS_OS_URL} className="btn-primary">
          Launch Tender Cells OS
        </a>
        <Link to="/account" className="btn-outline">
          Log in / My account
        </Link>
      </div>

      <h2 className="section-title" id="os-screenshots">Inside Tender Cells OS</h2>
      <div className="prose">
        <p>Screens from the free demo - no hardware or sign-up needed: <a href="/app/demo">try it</a>.</p>
      </div>
      <div className="card-grid" data-testid="os-gallery">
        {OS_SCREENS.map((s) => (
          <figure key={s.src} className="card" style={{ margin: 0 }}>
            <img src={`/assets/images/os/${s.src}`} alt={`Tender Cells OS - ${s.title}`} loading="lazy"
              style={{ width: "100%", height: "auto", aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top", borderRadius: 8 }} />
            <figcaption>
              <h3 style={{ marginTop: "0.75rem" }}>{s.title}</h3>
              <p>{s.body}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <h2 className="section-title" id="api">Developer API</h2>
      <div className="prose">
        <p>
          The Tender Cells REST API lets you build integrations, pull historical telemetry,
          and trigger actions from your own code.
        </p>
      </div>
      <table className="info-table">
        <thead>
          <tr><th>Endpoint</th><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          {[
            ["/api/devices/{id}/telemetry", "GET", "Latest sensor readings"],
            ["/api/devices/{id}/state",     "GET", "Current system state"],
            ["/api/devices/{id}/door",      "POST", "Open or close coop door"],
            ["/api/devices/{id}/feed",      "POST", "Dispense feed (grams)"],
            ["/api/devices/{id}/clean",     "POST", "Start / stop cleaning cycle"],
            ["/api/devices/{id}/arm",       "POST", "Send joint angles to arm"],
            ["/api/devices/{id}/estop",     "POST", "Emergency stop (QoS 2)"],
          ].map(([ep, m, d]) => (
            <tr key={ep}><td><code>{ep}</code></td><td><code>{m}</code></td><td>{d}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="prose">
        <p>All endpoints require Bearer token auth. Rate limit: 300 req/min per device.</p>
      </div>

      <h2 className="section-title" id="mqtt">MQTT Integration Guide</h2>
      <div className="prose">
        <p>
          For real-time, low-latency control (arm movements, emergency stops) use MQTT directly.
          The broker runs locally on a Raspberry Pi 4 on your network — no cloud round-trip.
        </p>
        <ul>
          <li>Broker: <code>mqtt://&lt;pi-ip&gt;:1883</code></li>
          <li>Sensor telemetry: <code>tc/&#123;deviceId&#125;/sensors</code> every 10s (QoS 0)</li>
          <li>Control commands: <code>tc/&#123;deviceId&#125;/cmd/arm</code>, <code>/cmd/door</code>, <code>/cmd/feed</code> (QoS 1)</li>
          <li>E-STOP: <code>tc/&#123;deviceId&#125;/cmd/estop</code> — retained, QoS 2</li>
          <li>Alerts: <code>tc/&#123;deviceId&#125;/alert</code> — predator/fault events (QoS 2)</li>
        </ul>
        <p>
          Full topic reference and payload schemas: <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">github.com/WeCr8/TenderCells</a>
        </p>
      </div>

      <h2 className="section-title" id="firmware">Firmware Downloads</h2>
      <table className="info-table">
        <thead>
          <tr><th>Target</th><th>MCU</th><th>Version</th><th>Download</th></tr>
        </thead>
        <tbody>
          {[
            ["Chicken Tender Coop Controller", "ESP32-WROOM-32", "v0.9.1-beta", "#dl-ct"],
            ["WatchTower AI Camera Node",      "ESP32-S3-EYE",   "Coming soon",  "#dl-wt"],
            ["Roaming Roost Drive Controller", "ESP32-WROOM-32", "Coming soon",  "#dl-rr"],
          ].map(([t, m, v, d]) => (
            <tr key={t}><td>{t}</td><td><code>{m}</code></td><td>{v}</td>
              <td><a href={d} className="btn-primary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Download</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="prose">
        <p>
          All firmware is open source under the Apache-2.0 license.
          See the <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">GitHub repo</a> for
          PlatformIO build instructions and OTA update guide.
        </p>
      </div>
    </PageLayout>
  );
}

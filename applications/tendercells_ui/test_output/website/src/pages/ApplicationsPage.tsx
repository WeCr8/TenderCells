import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { TENDERCELLS_APP_ENTRY_URL } from "../config/appLinks";

export default function ApplicationsPage() {
  return (
    <PageLayout>
      <PageHero
        variant="dark"
        title={<>Applications &amp; Downloads</>}
        subtitle="Control your entire homestead from one app. Open APIs for builders."
        image="/assets/images/demos/coop-camera-demo.png"
        imageAlt="TenderCells coop dashboard showing selectable camera views"
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
        <a href={TENDERCELLS_APP_ENTRY_URL} className="btn-primary">
          Login / Launch Web Dashboard
        </a>
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

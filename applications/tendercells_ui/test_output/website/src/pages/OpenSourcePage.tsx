import PageLayout from "../components/PageLayout";

export default function OpenSourcePage() {
  return (
    <PageLayout>
      <div className="page-hero dark">
        <h1>Open Source</h1>
        <p>Every line of code. Every schematic. Every 3D model. Yours.</p>
      </div>

      <div className="prose">
        <p>
          Tender Cells is open source from the circuit board to the cloud function.
          We believe farmers should own their tools completely — no vendor lock-in,
          no black-box firmware, no mandatory subscriptions to make the hardware work.
        </p>
        <p>
          The full codebase lives on GitHub under the MIT license. Fork it, modify it,
          build your own version, or contribute back. We review PRs weekly.
        </p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer" className="btn-primary">⭐ GitHub: WeCr8/TenderCells</a>
      </div>

      <h2 className="section-title" id="firmware">Firmware Source</h2>
      <div className="prose">
        <p>
          Written in C++ for ESP32 and ESP32-S3 using the Arduino framework via PlatformIO.
          Each firmware target has its own directory with <code>platformio.ini</code>,
          full state machine implementation, and Unity test suite.
        </p>
      </div>
      <table className="info-table">
        <thead>
          <tr><th>Target</th><th>MCU</th><th>Key Features</th></tr>
        </thead>
        <tbody>
          {[
            ["Chicken Tender Coop Controller", "ESP32-WROOM-32", "State machine, MQTT pub/sub, DHT22, MQ-137, load cells, servo control, watchdog"],
            ["WatchTower AI Camera Node",      "ESP32-S3-EYE",   "TFLite Micro inference, 3-camera capture, LoRa SX1276, solar MPPT, deep sleep"],
            ["Roaming Roost Drive Controller", "ESP32-WROOM-32", "Mecanum drive, GPS boundary, return-to-dock, obstacle avoidance"],
            ["Arm Coordinator (Jetson Nano)",  "Jetson Nano",    "9DOF motion planning, URScript/custom stepper, XYZ gantry, sequential/parallel routines"],
          ].map(([t, m, f]) => (
            <tr key={t}><td><strong>{t}</strong></td><td><code>{m}</code></td><td>{f}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="prose">
        <p><strong>Build from source:</strong></p>
        <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: "1rem", borderRadius: "6px", fontSize: "0.82rem", overflowX: "auto" }}>
{`git clone https://github.com/WeCr8/TenderCells
cd firmware/chicken-tender
pip install platformio
pio run          # build
pio run -t upload  # flash via USB`}
        </pre>
      </div>

      <h2 className="section-title" id="app">Mobile App Source</h2>
      <div className="prose">
        <p>
          React Native (Expo) + TypeScript. Runs on iOS and Android from a single codebase.
          State management via Zustand. Backend: Firebase Auth + Firestore + Realtime DB.
          Real-time control: MQTT via local broker.
        </p>
        <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: "1rem", borderRadius: "6px", fontSize: "0.82rem", overflowX: "auto" }}>
{`cd app
npm install
npx expo start    # run in Expo Go
npx expo build    # production build`}
        </pre>
      </div>

      <h2 className="section-title" id="schematics">Hardware Schematics</h2>
      <div className="prose">
        <p>
          KiCad schematic files for all custom PCBs. Gerber files for ordering from JLCPCB,
          PCBWay, or any fab. BOM with LCSC part numbers for low-cost sourcing.
        </p>
        <ul>
          <li>Coop Controller PCB — ESP32 + relay board + sensor headers + terminal blocks</li>
          <li>WatchTower AI PCB — ESP32-S3 + SX1276 LoRa + MPPT charger + battery management</li>
          <li>Drive Controller PCB — ESP32 + dual H-bridge + encoder inputs + GPS header</li>
        </ul>
      </div>

      <h2 className="section-title" id="stl">3D Print Files (STL)</h2>
      <div className="card-grid">
        {[
          { title: "Coop Controller Enclosure", desc: "IP54-rated enclosure for main ESP32 PCB, relay board, and terminal blocks. Print in PETG or ASA for moisture resistance." },
          { title: "Arm Ceiling Mount Bracket", desc: "Steel-backed bracket for mounting 6DOF arm base to ceiling ridge beam. Designed for 1/8\" steel insert, PETG printed shell." },
          { title: "Egg Gripper Fingers", desc: "Soft gripper fingers (2× per gripper) for egg collection. Print in TPU 95A. Foam-tipped design prevents shell damage." },
          { title: "Scraper Tool Handle", desc: "Cleaning end effector handle. Spring-loaded floor contact. PETG, standard M5 bolt pattern for tool changer interface." },
          { title: "WatchTower Dome Cradles", desc: "3× camera cradles at 120° spacing for 180mm acrylic dome. Print in ASA for UV resistance." },
          { title: "Cable Strain Reliefs", desc: "Parametric strain relief for all cable gland sizes. Print in PETG. Sourced from OpenSCAD script for custom sizes." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">STL on GitHub</span>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="contribute">How to Contribute</h2>
      <div className="prose">
        <p>We welcome contributions in all areas:</p>
        <ul>
          <li><strong>Firmware:</strong> Bug fixes, new sensor drivers, state machine improvements</li>
          <li><strong>App:</strong> UI improvements, new screens, accessibility fixes, localization</li>
          <li><strong>Hardware:</strong> New end effectors, enclosure designs, PCB revisions</li>
          <li><strong>Documentation:</strong> Guides, translations, video tutorials</li>
          <li><strong>Testing:</strong> Automated tests, beta hardware testing, field reports</li>
        </ul>
        <p>See <code>CONTRIBUTING.md</code> on GitHub for coding standards, PR checklist, and review process.</p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="https://github.com/WeCr8/TenderCells/issues" target="_blank" rel="noopener noreferrer" className="btn-primary">View Open Issues</a>
        <a href="https://github.com/WeCr8/TenderCells/discussions" target="_blank" rel="noopener noreferrer" className="btn-outline">Join Discussions</a>
      </div>

      <h2 className="section-title" id="license">License</h2>
      <div className="prose">
        <p>
          All Tender Cells software, firmware, and hardware designs are released under the
          <strong> MIT License</strong>. You can use, copy, modify, merge, publish, distribute,
          sublicense, and/or sell copies freely. Attribution required (keep the copyright notice).
        </p>
        <p>
          The WeCr8 Solutions and Tender Cells™ brand names, logos, and product names are
          trademarks of WeCr8 Solutions and may not be used without permission.
        </p>
      </div>
    </PageLayout>
  );
}

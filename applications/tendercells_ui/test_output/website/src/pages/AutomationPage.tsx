import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

export default function AutomationPage() {
  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)"
        title="Automation Ideas"
        subtitle="Creative ways homesteaders are using Tender Cells to save time and improve animal welfare."
        image="/assets/images/demos/door-device-crud-demo.png"
        imageAlt="TenderCells door and device automation dashboard"
      />

      <h2 className="section-title">Built-in Automation Routines</h2>
      <div className="card-grid">
        {[
          { icon: "🌅", title: "Sunrise Door Sequence", desc: "Coop door opens at sunrise (GPS-calculated). Arm does a headcount. Water topped if below 30%. Doors stay open until headcount matches flock size at sunset." },
          { icon: "🍽️", title: "Smart Feeding Schedule", desc: "Weight-triggered dispensing. Feed drops when load cell reads below threshold. Consumption rate logged. Alert if daily intake drops >20%." },
          { icon: "🧹", title: "Nightly Cleaning Cycle", desc: "After headcount confirms all chickens on roost, arm deploys scraper. XY sweep of coop floor. Debris pushed to collection tray. Arm returns to home." },
          { icon: "🥚", title: "Morning Egg Collection", desc: "30 min after sunrise, arm visits each nest box. Soft gripper collects eggs to padded tray. Egg map updated in app with timestamp per nest box." },
          { icon: "🌡️", title: "Temperature Response", desc: "Below 35°F: alert sent, heat lamp relay triggered if installed. Above 85°F: vent opens, alert sent. Logs all exceedances for health history." },
          { icon: "⚡", title: "Predator Alert Response", desc: "WatchTower detects predator → LoRa broadcast → coop door closes immediately → Roaming Roost returns to dock → alert to phone with camera snapshot." },
        ].map((c) => (
          <div key={c.title} className="card">
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Community Automation Ideas</h2>
      <div className="prose">
        <p>These ideas come from beta testers and the open-source community. Many are buildable
          today with the MQTT API and a bit of custom code.</p>
      </div>
      <div className="card-grid">
        {[
          { title: "Broody Hen Detection", desc: "If the same nest box is occupied for >4 hours mid-day three days running, flag as potentially broody hen. Alert owner with option to collect eggs manually." },
          { title: "Visitor Notification", desc: "Motion in coop during non-scheduled hours triggers camera snapshot and push notification — catch predators, check on a sick bird, or just watch the flock." },
          { title: "Feed Supplier Auto-Order", desc: "When feed drops below 20%, trigger a webhook to your preferred supplier's order API. Never run out of feed again." },
          { title: "Weather-Adaptive Scheduling", desc: "Integrate with a weather API. Delay outdoor foraging on heavy rain days. Move Roaming Roost to shelter before storms." },
          { title: "Egg Production Logging", desc: "Export daily egg counts to a Google Sheet via the REST API. Track production trends, correlate with feed changes, share with buyers." },
          { title: "Multi-Coop Coordination", desc: "Run two Chicken Tender units and one Roaming Roost from one app. Stagger cleaning cycles so both don't run at peak power draw simultaneously." },
          { title: "Compost Trigger", desc: "When waste collection tray weight exceeds threshold, send notification to add coop waste to compost bin." },
          { title: "TenderAI Daily Summary", desc: "Each morning, get a plain-language summary from TenderAI: 'Ammonia slightly elevated — check ventilation. Egg count down 2 from yesterday — monitor nest box 3.'" },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">Community Idea</span>
          </div>
        ))}
      </div>

      <h2 className="section-title">Building Custom Automations</h2>
      <div className="prose">
        <p>
          The MQTT API is fully open. Subscribe to any topic and publish commands from any device
          on your network. Popular platforms for custom automations:
        </p>
        <ul>
          <li><strong>Node-RED:</strong> Visual flow editor — drag sensor readings to trigger actions without code</li>
          <li><strong>Home Assistant:</strong> Full smart home integration — combine Tender Cells with lights, locks, and other IoT devices</li>
          <li><strong>Python scripts:</strong> Subscribe to <code>tc/&#123;deviceId&#125;/sensors</code>, parse JSON, trigger actions via REST API</li>
          <li><strong>Zapier/Make:</strong> No-code webhook triggers from Tender Cells REST API to thousands of apps</li>
          <li><strong>Custom firmware:</strong> Fork the ESP32 firmware on GitHub, add your own sensors, publish custom topics</li>
        </ul>
      </div>
      <div className="cta-bar">
        <Link to="/apps#api" className="btn-primary">API Reference</Link>
        <Link to="/open-source" className="btn-outline">View Source Code</Link>
      </div>
    </PageLayout>
  );
}

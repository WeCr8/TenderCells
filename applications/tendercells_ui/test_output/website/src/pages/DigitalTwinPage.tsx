// DigitalTwinPage (/digital-twin) - the canonical page for the Tender Cells farm digital twin:
// what a twin is, what Tender Cells twins, simulated vs live (honest maturity), the feedback
// loop, the design -> simulate -> build -> connect path, provenance and twin IDs, and where to
// try it. Engineering detail lives in /docs/digital-twin (TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md).
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import RelatedContent, { ContentLinkItem } from "../components/RelatedContent";
import { demo, type ContentLink } from "../data/contentGraph";
import { TWIN_DEFINITION } from "../data/entities";
import "./TenderCellsOsPage.css";
import "./DigitalTwinPage.css";

const TWINS: { icon: string; title: string; body: string; examples: string; tryIt: string }[] = [
  { icon: "🗺️", title: "Property twin", body: "Boundaries, buildings, pastures, fences, water, terrain, zones and where every device sits.", examples: "The Property Twin map in the OS", tryIt: demo("/layout") },
  { icon: "🏠", title: "Habitat twin", body: "A coop or dock: door, temperature, humidity, air, feed, water, lights, cameras, nest boxes.", examples: "Chicken Tender, Duck Dock, Bunny Burrow", tryIt: demo("/chicken-tender") },
  { icon: "🐔", title: "Animal twin", body: "Only what is really known: identity, species, location, observations and keeper records. Not a medical model.", examples: "Your flock in the OS", tryIt: demo("/animals") },
  { icon: "📡", title: "Device twin", body: "Online or offline, firmware, telemetry, battery, signal, current state, commands and faults.", examples: "WatchTower, camera and starter nodes", tryIt: demo("/predator-monitor") },
  { icon: "🤖", title: "Robot twin", body: "Position, route, task, limits, interlocks and E-STOP for anything that moves.", examples: "Roaming Roost, gantry + arm, rovers", tryIt: demo("/weed-patrol") },
  { icon: "🌦️", title: "Environment twin", body: "Weather, temperature, humidity, rain, runoff and pasture state around the property.", examples: "Watershed and terrain in the OS", tryIt: demo("/watershed") },
];

const LOOP: [string, string][] = [
  ["Physical farm", "Animals, coops, water, gates, weather."],
  ["Edge devices", "ESP32 nodes, cameras, Raspberry Pi hub, MQTT."],
  ["Tender Cells OS", "Identity, state, events, history, rules."],
  ["Digital twin", "Property, animals, habitats, devices, robots."],
  ["Decision support", "Alerts, map, scenarios, \"why did this happen?\""],
  ["Safe action", "Doors, fans, pumps - confirmed, acknowledged, E-STOP first."],
];

const MODES: { name: string; status: string; body: string; to: string }[] = [
  { name: "Design", status: "Available", body: "Draw the property and place coops, towers, cameras and zones - no hardware.", to: demo("/layout") },
  { name: "Simulate", status: "Available (demo)", body: "Trigger a predator, a heat wave or a water leak and watch the whole chain respond.", to: demo("/simulator") },
  { name: "Live", status: "Twin-ready devices", body: "Devices that speak the MQTT contract update their twin: presence, telemetry, state.", to: "/docs/connect-a-device" },
  { name: "History / replay", status: "Planned", body: "Step back through an evening: movement, readings, alerts, doors, robot paths.", to: "/docs/digital-twin#7-events-and-history" },
];

const PATH: { title: string; body: string; link: ContentLink }[] = [
  { title: "Design", body: "Create the farm digitally.", link: { kind: "os", title: "Property Twin", to: demo("/layout") } },
  { title: "Simulate", body: "Test devices and routines without hardware.", link: { kind: "os", title: "Trigger an event", to: demo("/simulator") } },
  { title: "Build", body: "Use the BOM, wiring, CAD and firmware.", link: { kind: "guide", title: "Build a device for the OS", to: "/os#build" } },
  { title: "Connect", body: "Flash a board; it takes the same identity as its simulated twin.", link: { kind: "doc", title: "Connect a device", to: "/docs/connect-a-device" } },
  { title: "Validate", body: "Compare what you expected with what the device reports.", link: { kind: "doc", title: "Device testing setup", to: "/docs/device-testing-setup" } },
  { title: "Operate and improve", body: "Use state, events and alerts; change the simulation, the automation or the hardware.", link: { kind: "doc", title: "Usage guide", to: "/docs/usage" } },
];

const LADDER: [string, string][] = [
  ["Simulated", "Produced by the demo simulator. This is where the public demo is today."],
  ["Twin ready", "Has an identity and an MQTT contract a real device can fill (Starter Node, Camera Node)."],
  ["Connected prototype", "A real prototype updates it."],
  ["Hardware validated", "Expected vs observed behaviour compared on hardware."],
  ["Field testing", "Running on a real property with real animals."],
  ["Live twin", "Continuous physical → digital updates with history, provenance and safe commands."],
];

const COOP_LESSON = [
  "Draw the coop on your property.",
  "Add a virtual door.",
  "Simulate opening and closing it.",
  "Wire an ESP32 and a limit switch.",
  "Publish the door state over MQTT.",
  "Watch the digital door follow the real one.",
  "Create an automation (close at sunset).",
];

export default function DigitalTwinPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        kicker="Tender Cells OS · Farm digital twin"
        title="Build the farm digitally. Connect it physically. Improve both."
        subtitle="See your whole property in one place - every coop, animal, camera, water point, gate, sensor and robot - then let real devices keep it up to date."
        image="/assets/images/os/os-property-layout.jpg"
        imageAlt="Tender Cells OS Property Twin with coops, garden and robot routes"
      />

      <div className="cta-bar dt-cta">
        <a href={demo("/layout")} className="btn-primary">Try the digital farm</a>
        <a href={demo("/simulator")} className="btn-outline">Trigger an event</a>
        <a href="#loop" className="btn-outline">See how it works</a>
      </div>

      <div className="prose">
        <p className="dt-definition" data-testid="twin-definition"><strong>{TWIN_DEFINITION}</strong></p>
        <p>
          A farm is more than a map. Animals move, doors open, water drops, batteries drain, cameras see
          things, the weather changes and equipment fails. Tender Cells OS gives those physical things a
          digital identity, a state, a history and a place on the property.
        </p>
        <p className="dt-kid"><strong>In kid language:</strong> build your farm in the computer, then make the real farm talk to it.</p>
      </div>

      <h2 className="section-title" id="honest">Where it is today</h2>
      <div className="prose">
        <p>
          The public demo is a <strong>simulated farm</strong>: every entity has an identity and a contract, so it is
          digital-twin ready, but nothing in it is a live reading. A twin becomes <em>live</em> only when real
          hardware keeps updating it. We label every system on this ladder and never skip a rung.
        </p>
      </div>
      <ol className="dt-ladder">
        {LADDER.map(([name, body], i) => (
          <li key={name} className={i === 0 ? "dt-now" : ""}><strong>{name}</strong><span>{body}</span></li>
        ))}
      </ol>
      <p className="dt-note">No Tender Cells product is sold or field-deployed yet. See each system's status on <Link to="/os#systems">the OS page</Link>.</p>

      <h2 className="section-title" id="what">One farm, many twins</h2>
      <div className="dt-twins">
        {TWINS.map((t) => (
          <article key={t.title} className="dt-twin">
            <h3><span aria-hidden="true">{t.icon}</span> {t.title}</h3>
            <p>{t.body}</p>
            <p className="dt-ex">{t.examples}</p>
            <a href={t.tryIt} className="os-try">See it in the demo →</a>
          </article>
        ))}
      </div>

      <h2 className="section-title" id="loop">Physical becomes digital - and back</h2>
      <ol className="os-flow dt-loop">
        {LOOP.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
      </ol>
      <p className="dt-note">
        …and the action feeds back to the physical farm, where sensors confirm it happened. Every command is
        authorized, validated, confirmed by you, acknowledged by the device and logged; motion never goes
        through the cloud and E-STOP always wins.
      </p>

      <h2 className="section-title" id="modes">Four ways to use the Property Twin</h2>
      <div className="dt-modes">
        {MODES.map((m) => (
          <article key={m.name} className="dt-mode">
            <h3>{m.name} <span className="dt-badge">{m.status}</span></h3>
            <p>{m.body}</p>
            {m.to.startsWith("/app") ? <a href={m.to} className="os-try">Open →</a> : <Link to={m.to} className="os-try">Read →</Link>}
          </article>
        ))}
      </div>

      <h2 className="section-title" id="provenance">Where every value came from</h2>
      <div className="prose">
        <p>
          A twin is only trustworthy if you can tell a real reading from a guess. Every value in Tender Cells
          carries its source: <code>SENSED</code>, <code>USER_ENTERED</code>, <code>INFERRED</code> (with a model and
          a confidence), <code>SIMULATED</code>, <code>CALCULATED</code>, <code>EXTERNAL</code> or
          <code> COMMAND_STATE</code> (what we asked a device to do - not yet what happened).
        </p>
        <p>
          Every entity has one stable ID across the map, MQTT, logs and docs, built from the device ID it
          already uses: <code>tc:habitat:chicken-tender:ct_001</code>, <code>tc:device:watchtower:wt_001</code>,
          <code> tc:robot:roaming-roost:rr_001</code>. In the demo's event simulator every step shows its source
          class and every event names the twin it changed.
        </p>
      </div>

      <h2 className="section-title" id="path">From simulation to reality</h2>
      <ol className="os-steps">
        {PATH.map((s, i) => (
          <li key={s.title} id={`path-${i + 1}`}>
            <span className="os-step-num" aria-hidden="true">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <ul className="os-step-links"><li><ContentLinkItem link={s.link} /></li></ul>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="section-title" id="education">Learn it: a digital twin of your coop</h2>
      <div className="prose">
        <p>
          A 4-H, FFA, homeschool or science-fair project that teaches spatial design, electronics, programming,
          networking, state machines, controls and animal care in one build:
        </p>
        <ol>{COOP_LESSON.map((s) => <li key={s}>{s}</li>)}</ol>
        <p>
          Start with <Link to="/lessons/your-first-coop-brain">Your First Coop Brain</Link>, then
          {" "}<Link to="/lessons/door-roaming-roost">Door + Basic Roaming Roost</Link> and
          {" "}<Link to="/lessons/sensors-automation">Sensors → Automation</Link>. More project ideas on
          {" "}<Link to="/science-fair">Science fair</Link>.
        </p>
      </div>

      <h2 className="section-title" id="developers">For developers</h2>
      <div className="prose">
        <p>
          The primitives are <strong>entity, state, event, relationship, command, history and simulation</strong>.
          State already flows over MQTT (<code>tc/&#123;id&#125;/sensors</code>, <code>state</code>, retained
          {" "}<code>status</code> with a last will, <code>event</code>, <code>ack</code>), and a hub serves a live
          snapshot at <code>/api/state.xml</code>. Read the <Link to="/docs/digital-twin">digital twin architecture</Link> for
          IDs, provenance, the command safety rules, offline behaviour and the planned twin API, and the
          {" "}<a href="/api/tendercells-backend.xml">machine-readable backend</a> for the exact contract.
        </p>
      </div>

      <RelatedContent topics={["twin", "devices", "design"]} title="Keep going" />
    </PageLayout>
  );
}

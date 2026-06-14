import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const routineExamples = [
  {
    title: "Heat Stress Routine",
    input: "Temperature over 95F",
    logic: "Check coop occupancy and fan status",
    actions: "Turn on fan, send alert, log event",
  },
  {
    title: "Night Predator Mode",
    input: "Sunset or predator detection",
    logic: "Confirm animals are inside",
    actions: "Close door, enable cameras, capture images, notify user",
  },
  {
    title: "Roaming Roost Grazing",
    input: "Scheduled pasture interval",
    logic: "Check weather, boundary, battery, and safe zone",
    actions: "Move 5 feet, pause, log route, repeat",
  },
  {
    title: "Greenhouse Temperature Control",
    input: "Temperature and humidity readings",
    logic: "Compare against target range",
    actions: "Open vents, activate fans, log stabilization",
  },
];

const ecosystem = [
  "Temperature, humidity, water level, feed level, motion, RFID, GPS, computer vision, thermal cameras, weather, soil moisture, and battery inputs.",
  "Motors, valves, doors, feeders, lights, sirens, pumps, fans, relays, and mobile platforms as actions.",
  "Routine packs for winter chicken care, summer heat stress, pond management, goat feeding, and solar water monitoring.",
  "Creator profiles for routine creators, project builders, farm innovators, student innovators, and teacher innovators.",
];

export default function FarmAutomationPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        title={<>Tender Cells Farm Automation &amp; Routines</>}
        subtitle="Roomba for farms. Home Assistant for agriculture. IFTTT for animal care. Node-RED for homesteaders."
        image="/assets/images/products/roaming-roost-concept.png"
        imageAlt="Roaming Roost mobile pasture robotics concept"
      />

      <div className="prose">
        <p>
          Tender Cells Farm Automation &amp; Routines is the long-term platform vision:
          let anyone automate repetitive agricultural tasks using simple routines,
          schedules, sensors, logic, and actions. A routine is easy to understand:
          inputs become logic, and logic triggers actions.
        </p>
        <p>
          The goal is to make farm automation accessible to everyone, from a
          10-year-old student learning sensors to a commercial producer managing
          livestock monitoring, irrigation, environmental controls, and equipment alerts.
        </p>
      </div>

      <h2 className="section-title">Routine Builder Concept</h2>
      <div className="card-grid">
        {routineExamples.map((routine) => (
          <div key={routine.title} className="card">
            <h3>{routine.title}</h3>
            <p><strong>Input:</strong> {routine.input}</p>
            <p><strong>Logic:</strong> {routine.logic}</p>
            <p><strong>Actions:</strong> {routine.actions}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Who It Helps</h2>
      <div className="card-grid">
        {[
          ["Students", "Learn sensors, logic, programming, engineering, and problem solving through real routines."],
          ["Homesteaders", "Automate feeding, watering, coop access, egg reminders, pond management, and alerts."],
          ["Farmers", "Automate irrigation, livestock monitoring, environmental controls, equipment alerts, and maintenance."],
          ["Developers", "Build integrations, hardware modules, AI models, automation packs, and open-source routine libraries."],
        ].map(([title, body]) => (
          <div key={title} className="card">
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Open Routine Ecosystem</h2>
      <div className="prose">
        <ul>
          {ecosystem.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Long term, Barn Brain becomes the automation engine for routine execution,
          alert management, data collection, AI analysis, device management, and
          community routine sharing.
        </p>
      </div>

      <h2 className="section-title">Every Routine Becomes a Lesson</h2>
      <div className="prose">
        <p>
          Students can learn inputs, logic, outputs, programming concepts,
          engineering, sustainability, agriculture, animal care, and applied STEM
          through routines that actually matter. A 4-H project can design a predator
          alert. An FFA project can automate livestock monitoring. A homeschool
          student can build a water-level routine. A young founder can turn a routine
          pack into a product or service.
        </p>
      </div>

      <div className="cta-bar">
        <Link to="/app/demo" className="btn-primary">Test the Demo</Link>
        <Link to="/llm-demo-test" className="btn-outline">LLM Demo Test Guide</Link>
        <Link to="/academy" className="btn-outline">Start Learning</Link>
      </div>
    </PageLayout>
  );
}

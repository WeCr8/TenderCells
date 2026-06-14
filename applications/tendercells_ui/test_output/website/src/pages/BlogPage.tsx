import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

// Editorial roadmap. TenderCells is pre-hardware and concept-stage, so these are
// planned/in-progress articles describing the design, not published case studies.
const POSTS = [
  {
    tag: "Architecture",
    title: "The 9DOF Motion System: XYZ Gantry + 6DOF Arm",
    excerpt: "How the Chicken Tender design pairs an XYZ gantry that positions the arm anywhere in the coop with a 6DOF arm for task execution — and why full-floor coverage matters for cleaning, feeding, and egg collection.",
  },
  {
    tag: "Tutorial",
    title: "Setting Up MQTT for Custom Homestead Automations",
    excerpt: "The Tender Cells MQTT contract is open. This guide walks through connecting Node-RED, Home Assistant, and a simple Python script to a coop's data stream, and triggering actions from other smart-home devices.",
  },
  {
    tag: "Homesteading",
    title: "Pasture Rotation with the Roaming Roost™ Concept",
    excerpt: "Why pasture rotation matters for soil and flock health, and how the Roaming Roost concept aims to relocate an igloo-dome enclosure on a channel-ring drive instead of manually moving a tractor coop.",
  },
  {
    tag: "Open Source",
    title: "WatchTower AI: Training Your Own Predator Detection Model",
    excerpt: "The WatchTower AI concept runs a TensorFlow Lite Micro classifier on-device. This article outlines the planned retraining pipeline — data collection, labeling, training, quantization, and OTA deployment — for adding a species.",
  },
  {
    tag: "Community",
    title: "End Effector Ideas for a Tool-Changer Arm",
    excerpt: "A running list of end effector concepts the community could design for a tool-changer arm — scraper, soft egg gripper, water nozzle, seed spreader, sensor wand — and how to document one as an open hardware module.",
  },
  {
    tag: "Education",
    title: "Using TenderCells for FFA / 4-H Record Books",
    excerpt: "How students could use the public demo and sensor concepts for SAE and 4-H projects: what to track, which readings tell a story, and how to turn an automation idea into a documented build.",
  },
  {
    tag: "Hardware",
    title: "Choosing a 6DOF Arm: UR3e, Custom Stepper, or Simulator",
    excerpt: "The arm controller design targets three arm types. We compare the UR3e (high-precision, commercial), custom stepper builds (cheapest, most hackable), and simulator mode (no hardware needed for app development).",
  },
  {
    tag: "Animal Health",
    title: "What Ammonia Levels Tell You Before You Can See the Problem",
    excerpt: "Why ammonia is a leading indicator of coop air quality: the MQ-137 sensor can flag rising levels well before they are noticeable, and what the 10 ppm warning / 25 ppm critical thresholds mean for flock health.",
  },
];

export default function BlogPage() {
  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #37474f 0%, #1c313a 100%)"
        title="Tender Cells Notebook"
        subtitle="Design notes, tutorials, and homesteading guides. TenderCells is concept-stage, so these are the topics we are writing — not field reports."
        image="/assets/images/demos/tendercells-education-format.png"
        imageAlt="Tender Cells education poster: Build, Learn, Care, Share"
      />

      <div className="prose" style={{ marginBottom: "1.5rem" }}>
        <p>
          These articles are planned or in progress. They explain how the system is designed and how
          to build with it, rather than reporting results from products that are not shipping yet.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {POSTS.map((post) => (
          <div key={post.title} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span className="tag">{post.tag}</span>
              <span style={{ fontSize: "0.8rem", color: "#888" }}>Planned</span>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>{post.title}</h3>
            <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>{post.excerpt}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "3rem", padding: "2rem", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #b3d4f5", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1a5276" }}>Get notified when articles go live</h3>
        <p style={{ margin: "0 0 1rem", color: "#555" }}>No spam, unsubscribe anytime.</p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: "0.5rem", maxWidth: "400px", margin: "0 auto" }}>
          <input
            type="email"
            placeholder="your@email.com"
            style={{ flex: 1, padding: "0.6rem 0.8rem", border: "1px solid #b3d4f5", borderRadius: "4px", fontSize: "0.9rem" }}
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap" }}>Subscribe</button>
        </form>
      </div>
    </PageLayout>
  );
}

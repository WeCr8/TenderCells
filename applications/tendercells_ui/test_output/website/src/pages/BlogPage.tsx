import PageLayout from "../components/PageLayout";

const POSTS = [
  {
    date: "June 10, 2026",
    tag: "Product Update",
    title: "Introducing the 9DOF Motion System: XYZ Gantry + 6DOF Arm",
    excerpt: "We've upgraded the Chicken Tender motion system from a single 6DOF arm to a full 9DOF architecture — an XYZ gantry that positions the arm anywhere in the coop, combined with the 6DOF arm for task execution. Here's what that means for your flock.",
  },
  {
    date: "May 28, 2026",
    tag: "Tutorial",
    title: "Setting Up MQTT for Custom Homestead Automations",
    excerpt: "The Tender Cells MQTT API is fully open. In this guide we walk through connecting Node-RED, Home Assistant, and a simple Python script to your coop's data stream — and how to trigger actions from other smart home devices.",
  },
  {
    date: "May 15, 2026",
    tag: "Homesteading",
    title: "Pasture Rotation Automation with Roaming Roost™",
    excerpt: "Manual pasture rotation requires moving a tractor every 2–3 days. Roaming Roost automates this entirely. We tested the mecanum wheel system on six different terrain types — here are the results.",
  },
  {
    date: "May 3, 2026",
    tag: "Open Source",
    title: "WatchTower AI: Training Your Own Predator Detection Model",
    excerpt: "The WatchTower AI firmware ships with a pre-trained TensorFlow Lite Micro model. But what if you want to add a species that's not in the base model? We cover the full retraining pipeline — data collection, labeling, training, quantization, and OTA deployment.",
  },
  {
    date: "April 20, 2026",
    tag: "Community",
    title: "Maker Day Recap: 12 New End Effectors in One Day",
    excerpt: "Our first Maker Day produced 12 new end effector designs contributed by community members — a water nozzle, a seed spreader, a health sensor wand, a brooder lamp holder, and more. All designs are now on GitHub with STL files.",
  },
  {
    date: "April 8, 2026",
    tag: "Education",
    title: "How Roosevelt High School's FFA Chapter Used Tender Cells for SAE Projects",
    excerpt: "Roosevelt FFA in Nebraska placed a Chicken Tender unit in their ag lab last semester. Three students used the live sensor data for SAE record books. Here's what they tracked, what they learned, and why their advisor calls it 'the best learning tool we've ever had.'",
  },
  {
    date: "March 25, 2026",
    tag: "Hardware",
    title: "Choosing the Right 6DOF Arm: UR3e, Custom Stepper, or Simulator",
    excerpt: "The Chicken Tender arm controller supports three arm types. We compare the UR3e (high-precision, commercial), custom stepper builds (cheapest, most hackable), and pure simulator mode (no hardware needed for app development).",
  },
  {
    date: "March 10, 2026",
    tag: "Animal Health",
    title: "What Ammonia Levels Tell You Before You Can See the Problem",
    excerpt: "The MQ-137 sensor catches rising ammonia 2–3 days before you'd smell it and several days before chickens show symptoms. We analyzed a full season of sensor logs from our beta farm — here's the pattern we found.",
  },
];

export default function BlogPage() {
  return (
    <PageLayout>
      <div className="page-hero" style={{ background: "linear-gradient(135deg, #37474f 0%, #1c313a 100%" }}>
        <h1>Tender Cells Blog</h1>
        <p>Product updates, tutorials, homesteading guides, and open-source community stories.</p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {POSTS.map((post) => (
          <div key={post.title} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span className="tag">{post.tag}</span>
              <span style={{ fontSize: "0.8rem", color: "#888" }}>{post.date}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>{post.title}</h3>
            <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>{post.excerpt}</p>
            <a href="#" style={{ marginTop: "0.25rem", fontSize: "0.87rem", color: "#4a90d9", fontWeight: 600, textDecoration: "none" }}>
              Read more →
            </a>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "3rem", padding: "2rem", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #b3d4f5", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1a5276" }}>Subscribe to New Posts</h3>
        <p style={{ margin: "0 0 1rem", color: "#555" }}>Weekly digest — no spam, unsubscribe anytime.</p>
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

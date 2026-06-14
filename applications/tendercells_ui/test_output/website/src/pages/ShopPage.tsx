import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { trackProductInterest } from "../utils/analytics";

const PRODUCTS = [
  { slug: "chicken-tender",  icon: "🐔", name: "Chicken Tender™",  status: "Buy later / build now",  desc: "Smart coop OS cell for cameras, health monitoring, swappable robotics, egg collection, feeding, watering, and AI monitoring." },
  { slug: "roaming-roost",   icon: "🚜", name: "Roaming Roost™",   status: "Concept", desc: "Mobile pasture coop concept that brings the flock to fresh pasture automatically." },
  { slug: "watchtower",      icon: "👁️", name: "WatchTower AI™",   status: "Concept",  desc: "Solar-powered 3-camera predator monitor concept with LoRa mesh alert workflows." },
  { slug: "barn-brain",      icon: "BB", name: "Barn Brain",       status: "Buy later / build now", desc: "NVIDIA Jetson Nano-class edge hub concept for local MQTT, rules, device registry, safety interlocks, AI vision, and offline-first farm automation." },
  { slug: "duck-dock",       icon: "🦆", name: "Duck Dock™",       status: "Concept", desc: "Duck enclosure concept with pond management, water quality monitoring, and auto-fill ideas." },
  { slug: "bunny-burrow",    icon: "🐰", name: "Bunny Burrow™",    status: "Concept",  desc: "Rabbit habitat automation concept for feeding, temperature control, and enrichment scheduling." },
  { slug: "goat-guardian",   icon: "🐐", name: "Goat Guardian™",   status: "Concept", desc: "Large-enclosure automation concept for gates, feed, water, and health monitoring." },
  { slug: "turkey-tower",    icon: "🦃", name: "Turkey Tower™",    status: "Concept", desc: "Turkey-specific enclosure concept with breed-appropriate space, roost heights, and nest management." },
  { slug: "pigeon-palace",   icon: "🕊️", name: "Pigeon Palace™",   status: "Concept",  desc: "Smart pigeon loft concept for individual bird tracking, loft door timing, and health dashboards." },
  { slug: "accessories",     icon: "🔧", name: "Accessories & Parts", status: "Coming later", desc: "End effectors, sensors, spare parts, mounting hardware, and upgrade ideas." },
  { slug: "gift-cards",      icon: "🎁", name: "Gift Cards",       status: "Not available yet", desc: "Gift cards are planned for later after hardware availability is clearer." },
];

const BUILD_IDEAS = [
  {
    title: "Door and latch controllers",
    image: "/assets/images/demos/door-device-crud-demo.png",
    desc: "Turn a coop door, feeder lid, or service hatch into a documented open hardware module.",
  },
  {
    title: "Camera and vision modules",
    image: "/assets/images/demos/coop-camera-demo.png",
    desc: "Build inspection nodes, WatchTower cameras, and event snapshots for safer animal care.",
  },
  {
    title: "Egg and nest-box sensors",
    image: "/assets/images/demos/chickeneye-eggs-demo.png",
    desc: "Prototype egg detection, nest occupancy, production maps, and ChickenEye AI workflows.",
  },
  {
    title: "Barn Brain edge hub",
    image: "/assets/images/demos/door-device-crud-demo.png",
    desc: "Prototype the local brain for a barn with NVIDIA Jetson, MQTT broker, routines, safety events, device registry, AI vision, and offline dashboards.",
  },
];

export default function ShopPage() {
  return (
    <PageLayout>
      <div className="page-hero green">
        <h1>Shop Tender Cells</h1>
        <p>Register interest for future TenderCells products, or follow the developer path to build your own and insert it into the OS.</p>
      </div>

      <h2 className="section-title">All Products</h2>
      <div className="card-grid">
        {PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            to={`/shop/${p.slug}`}
            style={{ textDecoration: "none" }}
            onClick={() => trackProductInterest(p.name, p.slug, "shop-card")}
          >
            <div className="card" style={{ height: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{p.icon}</div>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div style={{ marginTop: "0.75rem", fontWeight: 700, color: "#2a9d8f" }}>
                {p.status}
              </div>
              <span className="tag">View details / build your own</span>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Ideas Builders Can Make</h2>
      <div className="card-grid">
        {BUILD_IDEAS.map((idea) => (
          <div key={idea.title} className="card product-idea-card">
            <img src={idea.image} alt={idea.title} loading="lazy" />
            <h3>{idea.title}</h3>
            <p>{idea.desc}</p>
            <Link to="/developers#ideas" className="tag">Build from this idea</Link>
          </div>
        ))}
      </div>

      <h2 className="section-title">Why Tender Cells?</h2>
      <div className="prose">
        <p>
          TenderCells is not taking hardware orders yet. These pages document the product direction,
          demo workflows, and build ideas so students, makers, and early supporters can register
          interest, build their own devices, and insert custom 3D assets into the OS while kits,
          BOMs, CAD, and field-tested docs come together.
        </p>
        <ul>
          <li>One app controls all products on your property</li>
          <li>Local-first control — works without internet via MQTT on your network</li>
          <li>Modular hardware — tool-changer end effectors expand what the arm can do</li>
          <li>Active open-source community and hardware repair guides</li>
          <li>Made in USA by WeCr8 Solutions</li>
        </ul>
      </div>
      <div className="cta-bar">
        <Link to="/shop/chicken-tender" className="btn-primary">Explore Chicken Tender™</Link>
        <Link to="/learn" className="btn-outline">How It Works</Link>
      </div>
    </PageLayout>
  );
}

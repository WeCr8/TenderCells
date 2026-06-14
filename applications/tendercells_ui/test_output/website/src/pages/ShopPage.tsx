import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const PRODUCTS = [
  { slug: "chicken-tender",  icon: "🐔", name: "Chicken Tender™",  price: "$999",  desc: "Fully automated backyard coop with 9DOF robot arm, egg collection, feeding, watering, and AI monitoring." },
  { slug: "roaming-roost",   icon: "🚜", name: "Roaming Roost™",   price: "$1,299",desc: "Mobile geodesic dome on mecanum wheels — brings the coop to fresh pasture automatically." },
  { slug: "watchtower",      icon: "👁️", name: "WatchTower AI™",   price: "$299",  desc: "Solar-powered 3-camera predator monitor with LoRa mesh alerts up to 500m range." },
  { slug: "duck-dock",       icon: "🦆", name: "Duck Dock™",       price: "$1,149",desc: "Duck enclosure with integrated pond management, water quality monitoring, and auto-fill." },
  { slug: "bunny-burrow",    icon: "🐰", name: "Bunny Burrow™",    price: "$799",  desc: "Rabbit habitat automation — feeding, temperature control, enrichment scheduling." },
  { slug: "goat-guardian",   icon: "🐐", name: "Goat Guardian™",   price: "$1,599",desc: "Large-enclosure automation for goats — gate control, feed dispensing, health monitoring." },
  { slug: "turkey-tower",    icon: "🦃", name: "Turkey Tower™",    price: "$1,099",desc: "Turkey-specific enclosure with breed-appropriate space, roost heights, and nest management." },
  { slug: "pigeon-palace",   icon: "🕊️", name: "Pigeon Palace™",   price: "$899",  desc: "Smart pigeon loft — individual bird tracking, loft door timing, health dashboards." },
  { slug: "accessories",     icon: "🔧", name: "Accessories & Parts", price: "From $19", desc: "End effectors, sensors, spare parts, mounting hardware, and upgrade kits." },
  { slug: "gift-cards",      icon: "🎁", name: "Gift Cards",       price: "From $50", desc: "Give the gift of smart homesteading. Redeemable on all Tender Cells products." },
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
];

export default function ShopPage() {
  return (
    <PageLayout>
      <div className="page-hero green">
        <h1>Shop Tender Cells</h1>
        <p>AI-powered automation for every animal on your homestead.</p>
      </div>

      <h2 className="section-title">All Products</h2>
      <div className="card-grid">
        {PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            to={`/shop/${p.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ height: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{p.icon}</div>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div style={{ marginTop: "0.75rem", fontWeight: 700, color: "#2a9d8f" }}>
                {p.price}
              </div>
              <span className="tag">View Details →</span>
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
          Every Tender Cells product ships with the <strong>Tender Cells app</strong> (iOS + Android),
          free lifetime firmware updates, and a 1-year hardware warranty.
          The open-source firmware means your system is yours — no cloud lock-in required for local operation.
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
        <Link to="/shop/chicken-tender" className="btn-primary">Start with Chicken Tender™</Link>
        <Link to="/learn" className="btn-outline">How It Works</Link>
      </div>
    </PageLayout>
  );
}

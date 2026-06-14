import { useParams, Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const PRODUCTS: Record<string, {
  icon: string; name: string; tagline: string; price: string; desc: string;
  specs: [string, string][]; features: string[]; heroClass: string;
}> = {
  "chicken-tender": {
    icon: "🐔", name: "Chicken Tender™", price: "$999",
    tagline: "The world's first fully automated backyard chicken coop.",
    heroClass: "green",
    desc: "Chicken Tender automates every daily task in backyard chicken keeping — feeding, watering, door control, egg collection, and coop cleaning — via a ceiling-mounted 9DOF robot arm. One app controls everything.",
    specs: [
      ["Footprint", "4 × 4 × 5 ft (1220 × 1220 × 1500 mm)"],
      ["Motion System", "XYZ gantry + 6DOF arm (9DOF total)"],
      ["Gantry Speed", "100 mm/sec per axis (X, Y, Z)"],
      ["Arm Payload", "3 kg at end effector"],
      ["Main MCU", "ESP32-WROOM-32"],
      ["Arm Controller", "Jetson Nano"],
      ["Sensors", "DHT22 × 2, MQ-137, load cells × 2, reed switches × 4"],
      ["Connectivity", "WiFi 802.11 b/g/n, MQTT via local broker"],
      ["Power", "120V AC, 60W idle, 200W peak"],
      ["Warranty", "1 year hardware"],
    ],
    features: [
      "Automated door open/close — sunrise/sunset or scheduled",
      "AI chicken headcount via camera — door won't close until all birds are inside",
      "Daily egg collection to padded tray — per-nest-box egg map in app",
      "Daily floor cleaning sweep — arm scraper, parallel XY motion",
      "Automated feed dispensing — load cell weight monitoring, low-feed alerts",
      "Water level monitoring — automated top-off valve support",
      "Ammonia monitoring (MQ-137) — vent alert at 10ppm, critical at 25ppm",
      "Temperature/humidity (DHT22) — cold/heat stress alerts",
      "WatchTower AI compatible — LoRa predator alert closes door in <100ms",
      "E-STOP — all actuator power cut in <100ms from app or hardware button",
      "OTA firmware updates via app — all updates open source",
      "Local-first — works without internet via on-board MQTT broker",
    ],
  },
  "roaming-roost": {
    icon: "🚜", name: "Roaming Roost™", price: "$1,299",
    tagline: "A mobile geodesic dome that brings fresh pasture to your flock automatically.",
    heroClass: "green",
    desc: "The Roaming Roost is a 3×3×5 ft geodesic dome mounted on mecanum wheels. It moves your chickens to fresh pasture on a schedule — automated pasture rotation without moving a tractor.",
    specs: [
      ["Footprint", "3 × 3 × 5 ft"],
      ["Drive System", "4× mecanum wheels, DC motors"],
      ["Slope Rating", "Up to 8° grade"],
      ["Navigation", "GPS boundary + obstacle avoidance"],
      ["Main MCU", "ESP32-WROOM-32"],
      ["Connectivity", "WiFi + LoRa SX1276"],
      ["Power", "120V AC dock charging or 20Ah LiFePO4 battery"],
      ["Sensors", "DHT22, GPS, ultrasonic obstacle detection"],
    ],
    features: [
      "Scheduled pasture rotation — daily, every 3 days, or vegetation-triggered",
      "GPS boundary fence — never over-ranges",
      "Return-to-dock at sunset or on WatchTower predator alert",
      "Mecanum wheels — omnidirectional movement, no turning radius constraint",
      "Live position map in app — see where the Roost is on your property",
      "Automated watering station at dock position",
      "LoRa integration with WatchTower AI for predator response",
    ],
  },
  "watchtower": {
    icon: "👁️", name: "WatchTower AI™", price: "$299",
    tagline: "Solar-powered AI predator detection with LoRa mesh alerts.",
    heroClass: "dark",
    desc: "WatchTower AI mounts on a 5ft pole and watches 360° with 3 cameras. TensorFlow Lite Micro classifies threats on-device — no cloud. LoRa broadcasts alerts to all Tender Cells devices within 500m.",
    specs: [
      ["Cameras", "3× ESP32-S3-EYE at 120° spacing (360° coverage)"],
      ["AI", "TFLite Micro predator classifier, <200ms inference"],
      ["Connectivity", "WiFi + LoRa SX1276 915MHz mesh"],
      ["Alert Range", "500m+ LoRa range"],
      ["Power", "5W solar panel + 3× 18650 (6Ah)"],
      ["Solar Charging", "CN3791-based MPPT"],
      ["Enclosure", "180mm acrylic dome, IP65"],
      ["Mount", "1\" EMT conduit, 4–6 ft"],
    ],
    features: [
      "360° coverage with 3 cameras at 120° spacing",
      "On-device AI — no cloud latency, works without internet",
      "Classifies: raccoon, fox, hawk, owl, dog vs false positives",
      "LoRa mesh alert to all nearby Tender Cells devices in <500ms",
      "Photo capture on detection — sent to app with push notification",
      "Solar + battery — fully off-grid, no wiring required",
      "Night vision capable (IR illumination)",
      "5+ day battery backup in winter low-sun conditions",
    ],
  },
  "duck-dock": {
    icon: "🦆", name: "Duck Dock™", price: "$1,149",
    tagline: "Automated duck habitat with integrated pond management.",
    heroClass: "green",
    desc: "Duck Dock is built around duck-specific needs — access to water, messier environments, and different housing requirements. Includes automated pond fill/drain, water quality monitoring, and robust cleaning.",
    specs: [
      ["Footprint", "4 × 4 × 6 ft"],
      ["Pond Management", "Auto fill/drain valve, water quality sensor"],
      ["MCU", "ESP32-WROOM-32"],
      ["Sensors", "DHT22, load cells, water turbidity, pH"],
      ["Drive", "N/A — static installation"],
    ],
    features: [
      "Automated pond fill and drain on schedule",
      "Water turbidity and pH monitoring — alert when pond needs cleaning",
      "Duck-proof feeder — splash-resistant design",
      "Automated egg collection (ducks lay at night/early morning)",
      "Wider door for duck body shape",
      "Increased drainage in floor for wet environments",
    ],
  },
  "bunny-burrow": {
    icon: "🐰", name: "Bunny Burrow™", price: "$799",
    tagline: "Rabbit habitat automation — feeding, temperature, enrichment.",
    heroClass: "green",
    desc: "Bunny Burrow automates rabbit care — precise portioned feeding, temperature control for delicate rabbits, and scheduled enrichment activities.",
    specs: [
      ["Footprint", "3 × 3 × 5 ft"],
      ["MCU", "ESP32-WROOM-32"],
      ["Sensors", "DHT22, load cells, motion"],
      ["Feeders", "Portioned pellet + hay dispenser"],
    ],
    features: [
      "Portioned pellet dispensing — prevents overfeeding",
      "Hay rack with low-level alert",
      "Temperature monitoring — alert below 40°F or above 80°F",
      "Automated water bottle fill",
      "Enrichment toy rotation via servo (optional)",
      "Activity tracking via motion sensor",
    ],
  },
  "goat-guardian": {
    icon: "🐐", name: "Goat Guardian™", price: "$1,599",
    tagline: "Large enclosure automation for goats.",
    heroClass: "orange",
    desc: "Goat Guardian handles the unique challenges of goat keeping — escape-proof gate control, large-volume feed dispensing, mineral supplementation, and health monitoring for a more demanding animal.",
    specs: [
      ["Footprint", "6 × 6 × 8 ft"],
      ["MCU", "ESP32-WROOM-32"],
      ["Gate", "Heavy-duty servo gate, deadbolt-class strength"],
      ["Feed Capacity", "50 lb hopper"],
    ],
    features: [
      "Escape-proof gate with deadbolt-class servo lock",
      "50 lb capacity feed hopper with load cell metering",
      "Mineral block dispenser",
      "Automated hoof cleaning mat at entry",
      "Goat headcount (visual AI)",
      "Kid separation gate (automated for feeding)",
    ],
  },
  "turkey-tower": {
    icon: "🦃", name: "Turkey Tower™", price: "$1,099",
    tagline: "Turkey-specific enclosure built for larger birds.",
    heroClass: "orange",
    desc: "Turkeys have different space, roost height, and social needs than chickens. Turkey Tower is designed around these requirements — higher roost bars, wider door, larger nest boxes, and breed-appropriate monitoring.",
    specs: [
      ["Footprint", "4 × 4 × 6 ft"],
      ["Roost Height", "36\" from floor"],
      ["MCU", "ESP32-WROOM-32"],
    ],
    features: [
      "Roost bars at turkey-appropriate height",
      "Wide door for large turkey body size",
      "Oversized nest boxes",
      "Heavy-duty feeder (turkeys consume 2–3× chicken ration)",
      "Poult temperature zone (optional heat lamp relay)",
      "Automated egg collection — turkeys lay in predictable locations",
    ],
  },
  "pigeon-palace": {
    icon: "🕊️", name: "Pigeon Palace™", price: "$899",
    tagline: "Smart pigeon loft with individual bird tracking.",
    heroClass: "dark",
    desc: "Pigeon Palace is built for pigeon fanciers — individual bird RFID tracking, loft door timing for racing birds, and health dashboards for each bird in the loft.",
    specs: [
      ["Footprint", "4 × 4 × 6 ft"],
      ["Tracking", "RFID reader at trap door"],
      ["MCU", "ESP32-WROOM-32"],
    ],
    features: [
      "RFID reader at trap door — logs each bird's return time",
      "Individual bird health history (weight, last seen, return frequency)",
      "Automated trap door — opens on schedule or motion trigger",
      "Racing clock integration — logs official release and return times",
      "Per-bird feeding station support",
      "Loft temperature/humidity monitoring",
    ],
  },
  "accessories": {
    icon: "🔧", name: "Accessories & Parts", price: "From $19",
    tagline: "End effectors, sensors, upgrade kits, and spare parts.",
    heroClass: "green",
    desc: "Expand what your Tender Cells system can do with official accessories and parts.",
    specs: [],
    features: [],
  },
  "gift-cards": {
    icon: "🎁", name: "Gift Cards", price: "From $50",
    tagline: "Give the gift of smart homesteading.",
    heroClass: "green",
    desc: "Tender Cells gift cards are redeemable on any product or accessory. Available in any amount from $50. Digital delivery within minutes.",
    specs: [],
    features: [],
  },
};

const PRODUCT_VISUALS: Record<string, { image: string; alt: string; notes: string[]; extraImages?: { image: string; alt: string; label: string }[] }> = {
  "chicken-tender": {
    image: "/assets/images/products/chicken-tender-concept.png",
    alt: "Concept render of the Chicken Tender automated backyard coop",
    notes: [
      "A compact square backyard coop with a visible service side.",
      "Automatic chicken door, nest box access, camera, sensors, feed, and water modules are mounted as serviceable hardware.",
      "The rail and robot arm are the internal service system for cleaning, inspection, and egg handling.",
      "The CAD concept source includes a 72-inch square cell, X/Y/Z rails, and a 6DOF mounting plate.",
    ],
  },
  watchtower: {
    image: "/assets/images/products/predator-monitor-pole-mount.png",
    alt: "Pole-mounted WatchTower AI predator monitor with solar panel and three camera lenses",
    notes: [
      "A pole-mounted camera pod placed near the coop, run, or property edge.",
      "A solar panel and battery make it a mostly self-contained outdoor monitor.",
      "Three camera cradles provide 360-degree coverage around the yard.",
      "The ESP32, battery, and electronics sit inside the weather-resistant head.",
    ],
    extraImages: [
      { image: "/assets/images/products/predator-monitor-top-view.png", alt: "Top view sketch of three camera cradles around the predator monitor", label: "Top view camera carrier" },
      { image: "/assets/images/products/predator-monitor-split-view.png", alt: "Split view render showing ESP32, battery, solar panel, and cameras inside the predator monitor", label: "Electronics split view" },
      { image: "/assets/images/products/predator-monitor-sketch-idea.png", alt: "Early sketch idea for the predator monitor housing", label: "Early concept sketch" },
    ],
  },
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? PRODUCTS[slug] : undefined;
  const visual = slug ? PRODUCT_VISUALS[slug] : undefined;

  if (!product) {
    return (
      <PageLayout>
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>Product not found</h2>
          <p>This product doesn't exist yet or the URL is incorrect.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>← Back to Shop</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className={`page-hero ${product.heroClass}`}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>{product.icon}</div>
        <h1>{product.name}</h1>
        <p>{product.tagline}</p>
        <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.75rem" }}>{product.price}</div>
      </div>

      <div className="prose" style={{ marginBottom: "2rem" }}>
        <p>{product.desc}</p>
      </div>
      {visual && (
        <div className="product-visual">
          <img src={visual.image} alt={visual.alt} />
          <div>
            <h2>What It Looks Like</h2>
            <ul>
              {visual.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          {visual.extraImages && (
            <div className="product-visual-strip">
              {visual.extraImages.map((item) => (
                <figure key={item.image}>
                  <img src={item.image} alt={item.alt} loading="lazy" />
                  <figcaption>{item.label}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="cta-bar" style={{ marginBottom: "2.5rem" }}>
        <a href="#order" className="btn-primary" style={{ background: "#2a9d8f" }}>Order {product.name}</a>
        <Link to="/shop" className="btn-outline">← All Products</Link>
      </div>

      {product.features.length > 0 && (
        <>
          <h2 className="section-title">Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
            {product.features.map((f) => (
              <div key={f} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.75rem", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #eee" }}>
                <span style={{ color: "#2a9d8f", fontSize: "1rem", flexShrink: 0, marginTop: "0.05rem" }}>✓</span>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{f}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {product.specs.length > 0 && (
        <>
          <h2 className="section-title">Specifications</h2>
          <table className="info-table" style={{ marginBottom: "2rem" }}>
            <tbody>
              {product.specs.map(([k, v]) => (
                <tr key={k}><td style={{ width: "35%", fontWeight: 600 }}>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 className="section-title">In the Box</h2>
      <div className="prose">
        <ul>
          <li>{product.name} fully assembled unit</li>
          <li>Power cable (10 ft, 120V)</li>
          <li>Raspberry Pi 4 (pre-configured MQTT broker)</li>
          <li>Quick-start guide (printed + QR to digital version)</li>
          <li>Mounting hardware kit</li>
          <li>1-year hardware warranty</li>
        </ul>
      </div>

      <div style={{ marginTop: "2.5rem", padding: "2rem", background: "#f0fff4", borderRadius: "8px", border: "1px solid #b2dfdb" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1b5e20" }}>Open Source Guarantee</h3>
        <p style={{ margin: "0", color: "#333" }}>
          Every {product.name} ships with full access to its firmware source code, hardware schematics,
          and 3D print files on <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">GitHub</a>.
          No cloud lock-in. Works fully offline on your local network.
        </p>
      </div>
    </PageLayout>
  );
}

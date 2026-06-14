import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { trackProductInterest, trackProductView } from "../utils/analytics";

const PRODUCTS: Record<string, {
  icon: string; name: string; tagline: string; price: string; desc: string;
  specs: [string, string][]; features: string[]; heroClass: string;
}> = {
  "chicken-tender": {
    icon: "🐔", name: "Chicken Tender™", price: "Buy later / build now",
    tagline: "The first TenderCells OS hardware cell for cameras, health monitoring, and swappable robotics.",
    heroClass: "green",
    desc: "Chicken Tender is the first TenderCells OS hardware cell: a smart coop concept for feeding, watering, door control, egg collection, cleaning, camera monitoring, health signals, and robotics experiments. The robotics layer is meant to stay open and swappable so builders can try different arms, gantries, tool heads, camera systems, sensors, and Barn Brain / Jetson edge hubs while using the same open-source OS patterns.",
    specs: [
      ["Footprint", "4 × 4 × 5 ft (1220 × 1220 × 1500 mm)"],
      ["Motion System", "XYZ gantry + swappable 6DOF arm/tool module concept (9DOF reference path)"],
      ["Gantry Speed", "100 mm/sec per axis (X, Y, Z)"],
      ["Arm Payload", "3 kg at end effector"],
      ["Main MCU", "ESP32-WROOM-32"],
      ["Edge AI Controller", "Jetson Nano-class monitoring path; Jetson Orin Nano Super recommended for new AI prototypes"],
      ["Sensors", "DHT22 × 2, MQ-137, load cells × 2, reed switches × 4, camera and health-monitoring inputs"],
      ["Connectivity", "WiFi 802.11 b/g/n, MQTT via local broker"],
      ["Power", "120V AC, 60W idle, 200W peak"],
      ["Status", "Buy from TenderCells when available, or build your own now through developer docs"],
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
      "Jetson Nano-class camera and health monitoring path for local animal checks and vision experiments",
      "Swappable robotics concept — builders can test different arms, gantries, end effectors, and service modules",
      "TenderCells OS compatibility — use the same product registry, MQTT topics, routines, safety state, and demo workflows with community hardware",
      "WatchTower AI compatible — LoRa predator alert closes door in <100ms",
      "E-STOP — all actuator power cut in <100ms from app or hardware button",
      "OTA firmware updates via app — all updates open source",
      "Local-first — works without internet via on-board MQTT broker",
    ],
  },
  "roaming-roost": {
    icon: "🚜", name: "Roaming Roost™", price: "Concept",
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
    icon: "👁️", name: "WatchTower AI™", price: "Concept",
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
  "barn-brain": {
    icon: "BB", name: "Barn Brain", price: "Buy later / build now",
    tagline: "A Jetson-powered edge hub idea for the local farm automation brain.",
    heroClass: "dark",
    desc: "Barn Brain is a hardware and edge-software concept for the TenderCells local control layer. It is intended as a Jetson Nano-class edge hub, with new builder paths pointing toward the NVIDIA Jetson Orin Nano Super Developer Kit for local AI, MQTT, device registry, routines, safety events, offline dashboard, and bridges to Chicken Tender, WatchTower AI, Roaming Roost, and community-built modules.",
    specs: [
      ["Role", "Local edge hub for farm automation"],
      ["Recommended developer kit", "NVIDIA Jetson Orin Nano Super Developer Kit for new AI/robotics prototypes"],
      ["Legacy/low-cost path", "Jetson Nano Developer Kit or other Jetson Nano-class edge computer where available"],
      ["AI workload", "Local vision models, alert classification, routine assistants, and future barn-side agents"],
      ["Messaging", "MQTT broker and device topics"],
      ["Rules", "Local routines, schedules, alert triggers, and manual overrides"],
      ["Connectivity", "WiFi, Ethernet, optional LoRa bridge, local-only mode"],
      ["Install path", "Flash NVIDIA JetPack / Jetson Linux from official NVIDIA setup docs"],
      ["Security", "Local credentials, least-privilege device access, audit logs, and no cloud required for core control"],
      ["Status", "Naming and architecture idea for contributors"],
    ],
    features: [
      "Runs the local TenderCells brain when internet is unavailable",
      "Coordinates Chicken Tender, WatchTower AI, Roaming Roost, sensors, doors, feeders, and custom modules",
      "Keeps safety events such as E-stop, lockout, predator alert, and manual override close to the hardware",
      "Gives students a clear project: build the local rules engine, dashboard, or device bridge",
      "Uses NVIDIA Jetson as the preferred edge AI learning path for camera inference and robotics experiments",
      "Can become a reference edge kit once hardware, enclosure, power, and update docs are ready",
      "Designed as a community contribution path before official kits or full 3D files are available",
      "Bring your own 3D model or GLB asset into the TenderCells OS product registry as the hardware evolves",
    ],
  },
  "duck-dock": {
    icon: "🦆", name: "Duck Dock™", price: "Concept",
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
    icon: "🐰", name: "Bunny Burrow™", price: "Concept",
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
    icon: "🐐", name: "Goat Guardian™", price: "Concept",
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
    icon: "🦃", name: "Turkey Tower™", price: "Concept",
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
    icon: "🕊️", name: "Pigeon Palace™", price: "Concept",
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
    icon: "🔧", name: "Accessories & Parts", price: "Coming later",
    tagline: "End effectors, sensors, upgrade kits, and spare parts.",
    heroClass: "green",
    desc: "Expand what your Tender Cells system can do with official accessories and parts.",
    specs: [],
    features: [],
  },
  "gift-cards": {
    icon: "🎁", name: "Gift Cards", price: "Not available yet",
    tagline: "Give the gift of smart homesteading.",
    heroClass: "green",
    desc: "Tender Cells gift cards are redeemable on any product or accessory. Available in any amount from $50. Digital delivery within minutes.",
    specs: [],
    features: [],
  },
};

const PRODUCT_VISUALS: Record<string, {
  image: string;
  alt: string;
  notes: string[];
  docs: { label: string; href: string }[];
  extraImages?: { image: string; alt: string; label: string }[];
  componentMap?: { label: string; body: string }[];
}> = {
  "chicken-tender": {
    image: "/assets/images/products/chicken-tender-concept.png",
    alt: "Concept render of the Chicken Tender automated backyard coop",
    notes: [
      "A compact square backyard coop with a visible service side.",
      "Automatic chicken door, nest box access, camera, sensors, feed, and water modules are mounted as serviceable hardware.",
      "The rail and robot arm are the internal service system for cleaning, inspection, egg handling, and builder robotics experiments.",
      "The robotics layer is intentionally open: builders should be able to swap robot arms, gantries, camera modules, end effectors, and sensor packages as long as they preserve safety contracts.",
      "Chicken Tender can use Barn Brain or Jetson Nano-class edge hardware for local camera inference, health monitoring, routine execution, and offline-first OS behavior.",
      "The CAD concept source includes a 72-inch square cell, X/Y/Z rails, and a 6DOF mounting plate.",
    ],
    docs: [
      { label: "Product docs", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/chicken-tendercell" },
      { label: "CAD source", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/chicken-tendercell/cad" },
      { label: "Hardware catalog", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/CHICKEN_TENDER_HARDWARE_CATALOG.md" },
      { label: "Barn Brain edge hub", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/barn-brain" },
      { label: "NVIDIA Jetson setup", href: "https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit" },
    ],
    extraImages: [
      { image: "/assets/images/demos/door-device-crud-demo.png", alt: "Door and device control demo for Chicken Tender modules", label: "Door and device controls" },
      { image: "/assets/images/demos/chickeneye-eggs-demo.png", alt: "ChickenEye egg detection and nest-box map", label: "Egg and nest-box ideas" },
      { image: "/assets/images/demos/animal-roster-demo.png", alt: "Animal roster and health records demo", label: "Flock records" },
      { image: "/assets/images/products/animal-health-stress-monitoring-concept.png", alt: "Concept view of TenderCells animal stress and health monitoring with camera overlays and sensor cards", label: "Stress and health monitoring concept" },
    ],
    componentMap: [
      { label: "Animal roster", body: "Health status, individual records, and flock context are represented in the app before any automation acts." },
      { label: "Behavior analytics", body: "Camera-derived signals can flag low activity, isolation, reduced feeding, and abnormal routine patterns for human review." },
      { label: "Sensor thresholds", body: "Temperature, humidity, ammonia, feed, water, and nest-box activity map to configurable alerts instead of hidden black-box decisions." },
      { label: "TenderAI review", body: "The assistant can explain sensor readings and suggest next checks while keeping animal care decisions with the human caretaker." },
    ],
  },
  "roaming-roost": {
    image: "/assets/images/products/roaming-roost-concept.png",
    alt: "Roaming Roost mobile pasture coop concept with dome frame, wheels, and pasture automation hardware",
    notes: [
      "A mobile coop concept for pasture rotation instead of a fixed backyard cell.",
      "Drive base, docking, charging, and GPS boundary behavior need product-level docs.",
      "WatchTower alerts can command it to return to dock or pause movement.",
      "The concept shows the physical direction for a student or maker build: mobile frame, protected flock space, drive hardware, charging dock, and monitoring sensors.",
    ],
    docs: [
      { label: "Product docs", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/products/roaming-roost" },
      { label: "Hardware index", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/hardware.md" },
      { label: "Product ideas", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md" },
    ],
    extraImages: [
      { image: "/app/assets/images/products/roaming-roost.svg", alt: "Earlier Roaming Roost mobile coop diagram", label: "Earlier app concept" },
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
      "The detection visuals below are concept views of the intended workflow: classify species, separate threat from non-threat, and request human review before escalating routines.",
    ],
    docs: [
      { label: "Hardware index", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/hardware.md" },
      { label: "Product ideas", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md" },
      { label: "Hardware catalog", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/CHICKEN_TENDER_HARDWARE_CATALOG.md#16-watchtower-ai-hardware" },
    ],
    extraImages: [
      { image: "/assets/images/products/predator-monitor-top-view.png", alt: "Top view sketch of three camera cradles around the predator monitor", label: "Top view camera carrier" },
      { image: "/assets/images/products/predator-monitor-split-view.png", alt: "Split view render showing ESP32, battery, solar panel, and cameras inside the predator monitor", label: "Electronics split view" },
      { image: "/assets/images/products/predator-monitor-sketch-idea.png", alt: "Early sketch idea for the predator monitor housing", label: "Early concept sketch" },
      { image: "/assets/images/products/watchtower-threat-detection-concept.png", alt: "WatchTower AI concept view showing coyote, snake, and hawk threat detection bounding boxes", label: "Threat species detection" },
      { image: "/assets/images/products/watchtower-non-threat-detection-concept.png", alt: "WatchTower AI concept view showing non-threat dog, rabbit, songbird, and flock classification", label: "Non-threat classification" },
      { image: "/assets/images/products/watchtower-night-vision-detection-concept.png", alt: "WatchTower AI night vision concept showing coyote, owl, snake, and deer classification", label: "Night vision mode" },
    ],
    componentMap: [
      { label: "WatchTower monitor", body: "The app already has a predator monitor surface for camera status, property placement, and alert review." },
      { label: "Species labels", body: "Concept classes include coyotes, snakes, hawks, owls, farm dogs, rabbits, deer, and flock members so alerts can distinguish risk from background activity." },
      { label: "Routines and lockouts", body: "Alerts can feed door closure, Roaming Roost return-to-dock, schedule pause, and human review flows." },
      { label: "Night mode", body: "Infrared/night-vision concepts should be treated as reviewable monitoring events, not autonomous proof of danger." },
    ],
  },
  "duck-dock": {
    image: "/assets/images/products/duck-dock-concept.png",
    alt: "Duck Dock open-source aquatic animal care platform concept with pond, gantry, Barn Brain controller, and duck automation",
    notes: [
      "Duck Dock is the aquatic animal-care concept for ducks, fish, ponds, water quality, egg collection, and outdoor comfort.",
      "The concept shows a shaded floating platform with HDPE floats, sloped net floor, egg collection lane, modular gantry, and interchangeable tools.",
      "Barn Brain integration is shown as the local operating layer for automation, routines, alerts, data, AI vision, and remote monitoring.",
      "This image belongs specifically to Duck Dock and should not be reused for unrelated product pages.",
    ],
    docs: [
      { label: "Developer docs", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/developer" },
      { label: "Product ideas", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md" },
      { label: "Open source repo", href: "https://github.com/WeCr8/TenderCells" },
    ],
  },
  "barn-brain": {
    image: "/assets/images/demos/door-device-crud-demo.png",
    alt: "TenderCells local device and automation dashboard concept for a Barn Brain edge hub",
    notes: [
      "Barn Brain is the possible name for the local edge hub that lets TenderCells run close to the barn hardware.",
      "It would coordinate device discovery, MQTT topics, schedules, rules, alerts, and safety states.",
      "A builder version should try NVIDIA Jetson Nano-class hardware, with the Jetson Orin Nano Super Developer Kit as the recommended current path for new AI and robotics prototypes.",
      "Builders should install NVIDIA JetPack / Jetson Linux from official NVIDIA documentation, then layer TenderCells services on top.",
      "This is not an orderable product yet; it is a contribution-ready idea for students, makers, and edge software developers.",
    ],
    docs: [
      { label: "Buy Jetson Orin Nano Super", href: "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/" },
      { label: "Jetson Orin Nano setup", href: "https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit" },
      { label: "JetPack SDK", href: "https://developer.nvidia.com/embedded/jetpack" },
      { label: "Jetson Nano legacy setup", href: "https://developer.nvidia.com/embedded/learn/get-started-jetson-nano-devkit" },
      { label: "Developer docs", href: "https://github.com/WeCr8/TenderCells/tree/main/docs/developer" },
      { label: "Product ideas", href: "https://github.com/WeCr8/TenderCells/blob/main/docs/developer/product-ideas.md" },
      { label: "Open source repo", href: "https://github.com/WeCr8/TenderCells" },
    ],
    extraImages: [
      { image: "/assets/images/demos/coop-camera-demo.png", alt: "Camera module dashboard concept connected to local farm automation", label: "Camera/device input" },
      { image: "/assets/images/demos/animal-roster-demo.png", alt: "Animal roster records connected to local farm automation", label: "Animal records" },
    ],
  },
};

const PRODUCT_HUB_LINKS: Record<string, { label: string; href: string; note: string }[]> = {
  "chicken-tender": [
    { label: "Chicken health and coop care", href: "/health#chicken", note: "Animal welfare and daily care context" },
    { label: "4-H smart coop project", href: "/4h", note: "Student-friendly project path" },
    { label: "FFA poultry technology SAE", href: "/ffa", note: "Record book and agricultural technology path" },
    { label: "Developer hardware docs", href: "/developers", note: "Firmware, MQTT, hardware, and contribution links" },
  ],
  "roaming-roost": [
    { label: "Science fair pasture rotation", href: "/science-fair", note: "Measurable grazing and route-planning project ideas" },
    { label: "Homeschool mobile coop design", href: "/homeschool", note: "Geometry, robotics, and homestead learning path" },
    { label: "TenderCells Academy", href: "/academy", note: "Curriculum path for mobile agricultural robotics" },
    { label: "Developer hardware docs", href: "/developers", note: "Docking, device, and automation documentation" },
  ],
  watchtower: [
    { label: "Predator prevention and health", href: "/health#predators", note: "Animal safety and monitoring context" },
    { label: "4-H predator monitor project", href: "/4h", note: "Camera, solar, and alert-system project path" },
    { label: "Science fair camera study", href: "/science-fair", note: "Observation and monitoring experiment ideas" },
    { label: "Developer hardware docs", href: "/developers", note: "Camera, edge AI, and device integration links" },
  ],
  "duck-dock": [
    { label: "Animal health", href: "/health", note: "Water, habitat, and welfare context" },
    { label: "Farm automation routines", href: "/farm-automation", note: "Pond, water, feeder, and alert routines" },
    { label: "Developer hardware docs", href: "/developers", note: "Gantry, water sensors, and module documentation" },
    { label: "Academy", href: "/academy", note: "Student project path for aquatic animal care engineering" },
  ],
  "barn-brain": [
    { label: "Farm automation routines", href: "/farm-automation", note: "Rules, triggers, and local automation framing" },
    { label: "TenderCells apps", href: "/apps", note: "Dashboard, MQTT, API, and integration entrypoints" },
    { label: "Developer hardware docs", href: "/developers", note: "Firmware, broker, SDK, and device registry links" },
    { label: "4-H engineering projects", href: "/4h", note: "Student-friendly edge hub and device bridge project ideas" },
  ],
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? PRODUCTS[slug] : undefined;
  const visual = slug ? PRODUCT_VISUALS[slug] : undefined;
  const hubLinks = slug ? PRODUCT_HUB_LINKS[slug] : undefined;

  useEffect(() => {
    if (product && slug) {
      trackProductView(product.name, slug);
    }
  }, [product, slug]);

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
            <div className="product-doc-links">
              {visual.docs.map((doc) => (
                <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer">
                  {doc.label}
                </a>
              ))}
            </div>
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
          {visual.componentMap && (
            <div className="product-component-map" aria-label="How this concept maps to TenderCells components">
              <h3>How This Maps To The App</h3>
              <div>
                {visual.componentMap.map((item) => (
                  <article key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="cta-bar" style={{ marginBottom: "2.5rem" }}>
        <button
          type="button"
          className="btn-primary"
          style={{ background: "#2a9d8f", border: 0, cursor: "pointer" }}
          onClick={() => trackProductInterest(product.name, slug, "product-detail")}
        >
          I'm interested
        </button>
        <Link to="/developers#hardware" className="btn-outline">Build your own</Link>
        <Link to="/shop" className="btn-outline">← All Products</Link>
      </div>

      {hubLinks && (
        <>
          <h2 className="section-title">Build, Learn, and Contribute</h2>
          <div className="card-grid">
            {hubLinks.map((link) => (
              <Link key={link.href} to={link.href} className="card" style={{ textDecoration: "none" }}>
                <h3>{link.label}</h3>
                <p>{link.note}</p>
                <span className="tag">Open related guide</span>
              </Link>
            ))}
          </div>
        </>
      )}

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

      <h2 className="section-title">Buy Later Or Build Your Own</h2>
      <div className="prose">
        <p>
          TenderCells will use this page to measure interest for future kits and products. Builders do not
          need to wait: use the developer docs, register a custom product in the OS, and insert your own
          3D/GLB model or device asset while the official kit, BOM, CAD, and field-tested files mature.
        </p>
        <ul>
          <li>Register interest now so we know which products people want from TenderCells first</li>
          <li>Use the developer docs to build your own module, cell, controller, or edge hub</li>
          <li>Insert a custom 3D asset into the OS with the product registry or model upload workflow</li>
          <li>Map the hardware to MQTT topics, local routines, safety states, and demo workflows</li>
          <li>Open product documentation and build notes</li>
          <li>Firmware targets and local MQTT control patterns</li>
          <li>Hardware catalog references and safety constraints</li>
          <li>Concept renders, diagrams, and demo workflows</li>
          <li>Future BOM, CAD, and kit files as they become field-tested</li>
        </ul>
      </div>

      <div style={{ marginTop: "2.5rem", padding: "2rem", background: "#f0fff4", borderRadius: "8px", border: "1px solid #b2dfdb" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1b5e20" }}>Open Source Guarantee</h3>
        <p style={{ margin: "0", color: "#333" }}>
          TenderCells is building toward open firmware, hardware documentation, and reproducible build files on
          <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer"> GitHub</a>.
          The goal is local-first animal-care automation that students, makers, and engineers can inspect,
          improve, buy from TenderCells when available, or build themselves and bring into the TenderCells OS.
        </p>
      </div>
    </PageLayout>
  );
}

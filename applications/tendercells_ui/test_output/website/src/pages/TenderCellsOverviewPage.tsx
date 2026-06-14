import PageLayout from "../components/PageLayout";

const audiences = [
  "students and classrooms",
  "4-H and FFA builders",
  "homeschool families",
  "homesteaders",
  "makers and robotics clubs",
  "open-source hardware developers",
];

const buildPaths = [
  "automated chicken coops",
  "solar predator monitors",
  "mobile pasture coops",
  "door and latch controllers",
  "nest-box egg sensors",
  "animal roster and RFID stations",
  "feed, water, and environmental monitoring modules",
];

const topicPages = [
  { label: "TenderCells Academy", href: "/academy" },
  { label: "4-H STEM projects", href: "/4h" },
  { label: "FFA agricultural technology projects", href: "/ffa" },
  { label: "Homeschool STEM projects", href: "/homeschool" },
  { label: "Science fair agricultural robotics projects", href: "/science-fair" },
  { label: "LLM and reviewer demo test guide", href: "/llm-demo-test" },
];

export default function TenderCellsOverviewPage() {
  return (
    <PageLayout>
      <div className="page-hero green">
        <h1>TenderCells Overview</h1>
        <p>Plain-language overview for search engines, AI tools, educators, partners, and builders.</p>
      </div>

      <div className="prose">
        <p>
          TenderCells is an open-source agricultural engineering ecosystem that helps students,
          families, homesteaders, makers, and future engineers build smart animal care systems.
        </p>
        <p>
          The project combines product concepts, web software, public demo data, hardware catalogs,
          CAD concepts, firmware direction, MQTT device control, and education-oriented documentation.
        </p>
      </div>

      <h2 className="section-title">Who It Is For</h2>
      <div className="card-grid">
        {audiences.map((audience) => (
          <div key={audience} className="card compact-card">
            <h3>{audience}</h3>
          </div>
        ))}
      </div>

      <h2 className="section-title">What People Can Build</h2>
      <div className="card-grid">
        {buildPaths.map((path) => (
          <div key={path} className="card compact-card">
            <h3>{path}</h3>
          </div>
        ))}
      </div>

      <h2 className="section-title">Core Public Resources</h2>
      <div className="prose">
        <ul>
          <li><a href="/shop/chicken-tender">Chicken Tender automated coop concept</a></li>
          <li><a href="/shop/watchtower">WatchTower AI solar predator monitor concept</a></li>
          <li><a href="/shop/roaming-roost">Roaming Roost mobile pasture coop concept</a></li>
          <li><a href="/shop/barn-brain">Barn Brain Jetson edge hub idea</a></li>
          <li><a href="/developers">Developer documentation hub</a></li>
          <li><a href="/open-source">Open-source program</a></li>
          <li><a href="/app/demo">No-signup public demo</a></li>
          {topicPages.map((page) => (
            <li key={page.href}><a href={page.href}>{page.label}</a></li>
          ))}
          <li><a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">GitHub repository</a></li>
        </ul>
      </div>
    </PageLayout>
  );
}

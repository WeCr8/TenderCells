import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import "./EducationPage.css";

const authorityClusters = [
  {
    title: "Animal Care Engineering",
    image: "/assets/images/products/animal-health-stress-monitoring-concept.png",
    alt: "TenderCells concept view for animal stress and health monitoring education",
    body: "Use sensors, records, cameras, daily care data, and human-review alerts to teach how engineering can improve animal welfare, health, safety, and quality of life.",
    href: "/health",
    label: "Animal health",
  },
  {
    title: "Smart Chicken Coop Systems",
    image: "/assets/images/products/chicken-tender-concept.png",
    alt: "Chicken Tender smart chicken coop concept for education and engineering",
    body: "Study doors, latches, feed, water, egg maps, camera views, swappable robotics, and Jetson edge AI as one practical open-source system.",
    href: "/shop/chicken-tender",
    label: "Chicken Tender",
  },
  {
    title: "Predator Protection",
    image: "/assets/images/products/predator-monitor-pole-mount.png",
    alt: "WatchTower AI pole-mounted predator monitor concept",
    body: "Turn predator detection, solar power, camera placement, local AI, and alert response into student projects with measurable safety goals.",
    href: "/guides/predator-monitoring",
    label: "Predator guide",
  },
  {
    title: "Farm Automation Routines",
    image: "/assets/images/demos/door-device-crud-demo.png",
    alt: "TenderCells device and door control dashboard for farm automation routines",
    body: "Teach the automation loop: inputs, logic, safety checks, actions, logs, and community routines that can run locally through Barn Brain.",
    href: "/farm-automation",
    label: "Farm automation",
  },
];

const studentBuilds = [
  {
    title: "Camera And Computer Vision",
    image: "/assets/images/demos/coop-camera-demo.png",
    alt: "TenderCells coop camera dashboard for computer vision lessons",
    body: "Build camera stations, compare views, annotate events, and learn why local inference and privacy matter around animals.",
  },
  {
    title: "Egg And Nest-Box Data",
    image: "/assets/images/demos/chickeneye-eggs-demo.png",
    alt: "ChickenEye egg detection and nest-box map dashboard",
    body: "Use egg records and nest-box maps for data science, production trends, animal behavior, and fair-ready project explanations.",
  },
  {
    title: "Mobile Pasture Robotics",
    image: "/assets/images/products/roaming-roost-concept.png",
    alt: "Roaming Roost mobile pasture coop concept for robotics education",
    body: "Study route planning, grazing recovery, docking, battery assumptions, and movement safety before trying mobile hardware.",
  },
];

export default function EducationPage() {
  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #43a047 0%, #1b5e20 100%)"
        title="Tender Cells in Education"
        subtitle="Real-world automation, robotics, animal science, and open-source engineering for students."
        image="/assets/images/demos/animal-roster-demo.png"
        imageAlt="TenderCells animal roster showing product demo animal packs"
      />

      <div className="prose">
        <p>
          Tender Cells systems are educational tools as much as practical animal-care equipment.
          Every product exposes sensor data, firmware, hardware concepts, and control interfaces
          so students can interact with real embedded systems, not just simulations.
        </p>
      </div>

      <section className="education-poster" aria-label="TenderCells education format">
        <img
          src="/assets/images/demos/tendercells-education-format.png"
          alt="Tender Cells education poster showing Build Learn Care Share with animal-care engineering projects"
        />
        <div>
          <p className="education-kicker">Build. Learn. Care. Share.</p>
          <h2>A project format young engineers can understand and repeat.</h2>
          <p>
            Start from a real care problem, use the demo and docs to understand the system,
            build one safe module, measure what changed, then share the work so another
            student can learn from it.
          </p>
        </div>
      </section>

      <section className="education-visual-band" aria-label="Tender Cells authority learning paths">
        <div className="education-band-copy">
          <p className="education-kicker">Authority clusters</p>
          <h2>Own the whole learning ecosystem, not one keyword.</h2>
          <p>
            Tender Cells should help students and AI search tools understand the full map:
            animal care engineering, smart coops, predator protection, farm automation,
            agricultural robotics, and future engineering education.
          </p>
        </div>
        <div className="education-visual-grid">
          {authorityClusters.map((cluster) => (
            <Link key={cluster.title} to={cluster.href} className="education-visual-card">
              <img src={cluster.image} alt={cluster.alt} loading="lazy" />
              <div>
                <h3>{cluster.title}</h3>
                <p>{cluster.body}</p>
                <span>{cluster.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="section-title" id="stem">STEM Programs</h2>
      <div className="card-grid">
        {[
          { title: "Robotics & Kinematics", desc: "Motion systems, rails, robot arms, drive bases, and safety controls teach practical mechatronics." },
          { title: "Embedded Systems", desc: "ESP32 firmware, sensors, relays, motors, and MQTT communication give students real device experience." },
          { title: "Computer Vision", desc: "WatchTower AI concepts introduce cameras, local inference, training data, and animal-safety alerts." },
          { title: "Data Science", desc: "Temperature, humidity, feed, water, eggs, and behavior data become real analysis projects." },
          { title: "IoT & Networking", desc: "WiFi, LoRa, local-first control, dashboards, and APIs show the full farm technology stack." },
          { title: "Biology & Animal Science", desc: "Sensor thresholds connect engineering decisions to animal welfare, daily care, and husbandry." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="schools">For K-12 Schools</h2>
      <div className="prose">
        <p>
          Tender Cells is built to support school gardens, agricultural labs, classrooms, maker
          spaces, homeschool groups, robotics clubs, and agriculture programs that want hands-on
          animal-care engineering projects.
        </p>
        <ul>
          <li><strong>Elementary:</strong> observe animal care, learn sensors, and use age-appropriate dashboards</li>
          <li><strong>Middle school:</strong> program schedules, analyze sensor data, and understand automation logic</li>
          <li><strong>High school:</strong> modify firmware, build modules, document results, and contribute to open source</li>
        </ul>
      </div>

      <h2 className="section-title" id="curriculum">Curriculum Resources</h2>
      <div className="card-grid">
        {[
          { title: "Getting Started Guide", desc: "From public demo to first student project, written for non-technical mentors." },
          { title: "Lesson Plan Library", desc: "Robotics, biology, data analysis, animal welfare, agriculture, and computer science lessons." },
          { title: "Student Worksheets", desc: "Build logs, observation sheets, data tables, and presentation prompts for real projects." },
          { title: "Assessment Rubrics", desc: "Project-based assessment for automation, documentation, safety, and collaboration." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">Coming to docs</span>
          </div>
        ))}
      </div>

      <section className="education-image-strip" aria-label="Student build examples">
        <div className="education-strip-heading">
          <p className="education-kicker">What students can build</p>
          <h2>Projects with visible hardware, data, and animal-care meaning.</h2>
        </div>
        <div className="education-strip-grid">
          {studentBuilds.map((item) => (
            <article key={item.title}>
              <img src={item.image} alt={item.alt} loading="lazy" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <h2 className="section-title" id="grants">Grant Information</h2>
      <div className="prose">
        <p>
          Agricultural education technology, STEM, CTE, community foundation, and 4-H equipment
          grants can support smart animal-care builds. Tender Cells docs are structured so mentors
          can describe the learning outcomes, safety approach, budget, and public benefit clearly.
        </p>
        <ul>
          <li>USDA and rural education grants</li>
          <li>NSF STEM and computing education grants</li>
          <li>State CTE equipment funds</li>
          <li>4-H Foundation equipment grants</li>
          <li>Local community foundation small grants</li>
        </ul>
      </div>
      <div className="cta-bar">
        <a href="mailto:education@wecr8.info" className="btn-primary">Contact Education Team</a>
        <Link to="/partners" className="btn-outline">Partner or Sponsor</Link>
        <Link to="/learn" className="btn-outline">View Learning Docs</Link>
      </div>

      <h2 className="section-title" id="ffa-4h">FFA &amp; 4-H Integration</h2>
      <div className="education-split">
        <div className="prose">
        <p>
          Tender Cells gives 4-H members, FFA students, homeschoolers, and young engineers
          a real project path into agricultural robotics, smart chicken coops, animal-care
          automation, open-source firmware, and practical data science. A student can start
          in the public demo, study the product concepts, then build a small module before
          attempting a full Chicken Tender, WatchTower, or Roaming Roost system.
        </p>
        <ul>
          <li>4-H STEM projects and 4-H engineering projects using sensors, cameras, and safe automation</li>
          <li>FFA SAE projects with feed, water, weight, and egg-production records</li>
          <li>Science fair and county fair entries in agricultural technology, robotics, and animal welfare</li>
          <li>Chapter fundraising through egg production tracking, flock dashboards, and student-built modules</li>
          <li>Beginner-friendly GitHub issues for students learning open-source collaboration</li>
        </ul>
        </div>
        <figure>
          <img src="/assets/images/products/predator-monitor-top-view.png" alt="Top-view WatchTower camera concept for student predator protection projects" loading="lazy" />
          <figcaption>4-H and FFA students can turn cameras, sensors, and animal records into projects that explain both engineering and care outcomes.</figcaption>
        </figure>
      </div>

      <h2 className="section-title" id="young-engineers">Young Engineer Build Path</h2>
      <div className="card-grid">
        {[
          {
            title: "1. Explore the Farming OS",
            desc: "Use the no-signup public demo to inspect flocks, devices, schedules, property layouts, and automation ideas before touching hardware.",
            href: "/app/demo",
            label: "Open demo",
          },
          {
            title: "2. Build One Module",
            desc: "Start with a door controller, feed sensor, water monitor, nest-box counter, or WatchTower camera concept.",
            href: "/developers#ideas",
            label: "See build ideas",
          },
          {
            title: "3. Document the Project",
            desc: "Turn sensor readings, build photos, wiring notes, and animal-care observations into a 4-H, FFA, homeschool, or science fair record.",
            href: "/learn",
            label: "Use learning docs",
          },
          {
            title: "4. Contribute Back",
            desc: "Students can improve docs, test demo flows, file issues, and submit beginner-friendly pull requests to the open-source project.",
            href: "https://github.com/WeCr8/TenderCells/issues?q=is%3Aopen+label%3A%22good+first+issue%22",
            label: "Find good first issues",
          },
        ].map((step) => (
          <a key={step.title} href={step.href} className="card" style={{ textDecoration: "none" }}>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
            <span className="tag">{step.label}</span>
          </a>
        ))}
      </div>

      <h2 className="section-title" id="university">University Research</h2>
      <div className="prose">
        <p>
          Research partners can study precision agriculture, animal welfare technology,
          edge AI, educational robotics, and open hardware. Tender Cells keeps public docs
          and demo flows visible so students and researchers can evaluate the project before
          requesting deeper collaboration.
        </p>
      </div>
    </PageLayout>
  );
}

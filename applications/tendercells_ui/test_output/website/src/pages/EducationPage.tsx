import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function EducationPage() {
  return (
    <PageLayout>
      <div className="page-hero" style={{ background: "linear-gradient(135deg, #43a047 0%, #1b5e20 100%" }}>
        <h1>Tender Cells in Education</h1>
        <p>Real-world automation, robotics, animal science, and open-source engineering for students.</p>
      </div>

      <div className="prose">
        <p>
          Tender Cells systems are educational tools as much as practical animal-care equipment.
          Every product exposes sensor data, firmware, hardware concepts, and control interfaces
          so students can interact with real embedded systems, not just simulations.
        </p>
      </div>

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

      <h2 className="section-title" id="schools">K-12 School Partnerships</h2>
      <div className="prose">
        <p>
          Tender Cells supports school gardens, agricultural labs, classrooms, maker spaces,
          homeschool groups, robotics clubs, and agriculture programs that want hands-on
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

      <h2 className="section-title" id="grants">Grant Information</h2>
      <div className="prose">
        <p>
          Agricultural education technology, STEM, CTE, community foundation, and 4-H equipment
          grants can support smart animal-care builds. Tender Cells docs are structured so mentors
          can describe the learning outcomes, safety approach, budget, and public benefit clearly.
        </p>
        <ul>
          <li>USDA and rural education grants</li>
          <li>NSF STEM and computing partnerships</li>
          <li>State CTE equipment funds</li>
          <li>4-H Foundation equipment grants</li>
          <li>Local community foundation small grants</li>
        </ul>
      </div>
      <div className="cta-bar">
        <a href="mailto:education@wecr8.info" className="btn-primary">Contact Education Team</a>
        <Link to="/learn" className="btn-outline">View Learning Docs</Link>
      </div>

      <h2 className="section-title" id="ffa-4h">FFA &amp; 4-H Integration</h2>
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

      <h2 className="section-title" id="young-engineers">Young Engineer Build Path</h2>
      <div className="card-grid">
        {[
          {
            title: "1. Explore the Farming OS",
            desc: "Use the no-signup public demo to inspect flocks, devices, schedules, property layouts, and automation ideas before touching hardware.",
            href: "/demo",
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

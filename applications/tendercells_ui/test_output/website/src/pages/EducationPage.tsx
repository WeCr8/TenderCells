import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function EducationPage() {
  return (
    <PageLayout>
      <div className="page-hero" style={{ background: "linear-gradient(135deg, #43a047 0%, #1b5e20 100%" }}>
        <h1>Tender Cells in Education</h1>
        <p>Bringing real-world automation, robotics, and biology into classrooms at every level.</p>
      </div>

      <div className="prose">
        <p>
          Tender Cells systems were designed from the ground up to be <strong>educational tools</strong>
          as much as practical farm equipment. Every product exposes its sensor data, firmware, and
          control interfaces — so students can interact with a real embedded system, not a simulator.
        </p>
      </div>

      <h2 className="section-title" id="stem">STEM Programs</h2>
      <div className="card-grid">
        {[
          { title: "Robotics & Kinematics", desc: "9DOF motion system (XYZ gantry + 6DOF arm) teaches inverse kinematics, G-code, and motion planning with real hardware." },
          { title: "Embedded Systems", desc: "ESP32 firmware is open-source. Students write C++ to control sensors, motors, and MQTT communication." },
          { title: "Computer Vision", desc: "WatchTower AI runs TensorFlow Lite Micro for predator detection. Students train and deploy custom ML models." },
          { title: "Data Science", desc: "Live telemetry — temperature, humidity, ammonia, feed levels — feeds into real data analysis projects." },
          { title: "IoT & Networking", desc: "MQTT protocol, WiFi, LoRa mesh, and Firebase cloud show the full IoT stack from sensor to dashboard." },
          { title: "Biology & Animal Science", desc: "Sensor thresholds tie directly to chicken physiology — ammonia toxicity, heat stress, predation behavior." },
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
          We partner with schools to place Chicken Tender™ units in school gardens, agricultural labs,
          and maker spaces. Schools receive discounted hardware, curriculum-aligned lesson plans,
          and direct support from WeCr8 engineers for setup and troubleshooting.
        </p>
        <ul>
          <li><strong>Elementary:</strong> Observe animal care, learn about sensors with age-appropriate dashboards</li>
          <li><strong>Middle school:</strong> Program schedules, analyze sensor data, understand automation logic</li>
          <li><strong>High school:</strong> Modify firmware, build custom end effectors, integrate cloud APIs</li>
        </ul>
      </div>

      <h2 className="section-title" id="curriculum">Curriculum Resources</h2>
      <div className="card-grid">
        {[
          { title: "Getting Started Guide", desc: "Unboxing to first automated feeding in under 90 minutes. Written for non-technical teachers." },
          { title: "Lesson Plan Library", desc: "50+ ready-to-use lesson plans covering robotics, biology, data analysis, and computer science." },
          { title: "Student Worksheets", desc: "Lab worksheets tied to Next Generation Science Standards (NGSS) and Common Core math standards." },
          { title: "Assessment Rubrics", desc: "Project-based assessment tools for evaluating student work on automation and IoT projects." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">Download Free</span>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="grants">Grant Information</h2>
      <div className="prose">
        <p>
          Several federal and state grant programs cover agricultural education technology.
          We provide pre-written grant language, budget justifications, and letters of support
          to help your school secure funding for a Tender Cells unit.
        </p>
        <ul>
          <li>USDA Agricultural Education grants (Rural Education Initiative)</li>
          <li>NSF STEM + Computing (STEM-C) Partnerships</li>
          <li>State CTE (Career &amp; Technical Education) equipment funds</li>
          <li>4-H Foundation equipment grants</li>
          <li>Local community foundation small grants</li>
        </ul>
      </div>
      <div className="cta-bar">
        <a href="mailto:education@wecr8.info" className="btn-primary">Contact Education Team</a>
        <Link to="/learn" className="btn-outline">View Documentation</Link>
      </div>

      <h2 className="section-title" id="ffa-4h">FFA &amp; 4-H Integration</h2>
      <div className="prose">
        <p>
          Tender Cells is an approved technology partner for FFA (Future Farmers of America)
          and 4-H chapters nationwide. Members can use Chicken Tender projects for:
        </p>
        <ul>
          <li>Supervised Agricultural Experience (SAE) projects</li>
          <li>Record book data collection — automated weight, feed consumption, production logs</li>
          <li>State and national fair project entries in agricultural technology</li>
          <li>Chapter fundraising through egg production tracking</li>
        </ul>
      </div>

      <h2 className="section-title" id="university">University Research</h2>
      <div className="prose">
        <p>
          We offer research licenses for universities studying precision agriculture, animal welfare
          technology, and edge AI. Research partners get access to raw sensor APIs, firmware source
          modifications, and direct engineering support.
        </p>
        <p>
          Current research partnerships: Iowa State University (poultry science), Oregon State
          (agricultural robotics), Purdue (edge AI for livestock monitoring).
        </p>
      </div>
    </PageLayout>
  );
}

import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import "./PartnersPage.css";

const partnerTypes = [
  {
    title: "Education And Youth Sponsors",
    body: "Help 4-H clubs, FFA chapters, classrooms, homeschool groups, robotics clubs, and community programs access smart animal-care engineering projects.",
    ideas: ["project grants", "club equipment funds", "student challenge prizes", "teacher training support"],
  },
  {
    title: "Hardware And Automation Companies",
    body: "Support sensors, pneumatics, actuators, robotics, controls, safety hardware, edge AI, and durable farm-ready components students can learn from.",
    ideas: ["donated parts", "reference kits", "curriculum hardware", "safe demo modules"],
  },
  {
    title: "Agriculture And Animal-Care Partners",
    body: "Help connect real animal-care needs with practical automation lessons, welfare guidance, local mentors, and field-informed build constraints.",
    ideas: ["mentor networks", "care standards review", "field feedback", "local demonstrations"],
  },
  {
    title: "Open-Source And Developer Partners",
    body: "Contribute docs, firmware, MQTT examples, simulation flows, data schemas, security review, or accessible student-friendly build paths.",
    ideas: ["good first issues", "sample integrations", "security review", "docs sponsorship"],
  },
];

const targetPartners = [
  "Festo-style education and automation partners for pneumatics, mechatronics, controls, and training labs",
  "FarmBot-style open agriculture partners for CNC farming, open hardware, documentation, and student projects",
  "NVIDIA Jetson and edge-AI ecosystem partners for local camera inference and robotics learning",
  "sensor, robotics, enclosure, solar, battery, farm supply, veterinary, extension, and maker-space partners",
];

const sponsorPackages = [
  {
    title: "Sponsor A Club Build",
    body: "Fund a school, 4-H club, FFA chapter, homeschool group, or youth robotics team to build one safe module such as a sensor station, door monitor, or camera review workflow.",
  },
  {
    title: "Sponsor Curriculum",
    body: "Help create lesson plans, worksheets, project rubrics, safety checklists, and teacher guides around animal care engineering.",
  },
  {
    title: "Sponsor Open Hardware",
    body: "Support BOMs, wiring diagrams, CAD concepts, firmware examples, and repeatable build documentation for community projects.",
  },
  {
    title: "Sponsor Demo And Research",
    body: "Help improve the public demo, LLM-readable evaluation files, accessibility checks, and student-friendly data examples.",
  },
];

export default function PartnersPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        title="Partners And Sponsors"
        subtitle="Help students, clubs, schools, makers, and future engineers build the next generation of smart animal-care technology."
        image="/assets/images/demos/tendercells-education-format.png"
        imageAlt="Tender Cells education poster: Build, Learn, Care, Share"
      />

      <section className="partners-intro">
        <div>
          <p className="partners-kicker">Companies, foundations, schools, and builders</p>
          <h2>We want partners who help young people build, not just watch technology happen.</h2>
          <p>
            TenderCells is building an open-source agricultural engineering ecosystem for animal care,
            robotics, edge AI, automation, and education. Partner support can help 4-H members, FFA
            students, classrooms, homeschool families, and maker communities turn real care problems
            into safe, documented, future-ready projects.
          </p>
        </div>
        <aside>
          <strong>Partner contact</strong>
          <a href="mailto:hello@wecr8.info?subject=TenderCells%20partner%20or%20sponsor%20conversation">hello@wecr8.info</a>
          <span>Use this for sponsorships, school programs, hardware support, curriculum help, and company collaboration.</span>
        </aside>
      </section>

      <section className="partners-band" aria-label="Partner types">
        {partnerTypes.map((type) => (
          <article key={type.title}>
            <h3>{type.title}</h3>
            <p>{type.body}</p>
            <ul>
              {type.ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="partners-split">
        <div>
          <p className="partners-kicker">Examples of the kind of ecosystem we want around this</p>
          <h2>Festo, FarmBot, robotics, ag-tech, and education-minded partners.</h2>
          <p>
            We are not claiming those companies are current TenderCells sponsors. They are examples
            of the kind of practical, education-forward, open-agriculture, and automation ecosystem
            we want to connect with as TenderCells grows.
          </p>
          <ul>
            {targetPartners.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <figure>
          <img
            src="/assets/images/demos/tendercells-education-format.png"
            alt="TenderCells education format poster for Build Learn Care Share programs"
            loading="lazy"
          />
          <figcaption>
            Sponsor paths should support real projects: build one module, learn the system,
            care for animals responsibly, and share the results.
          </figcaption>
        </figure>
      </section>

      <h2 className="section-title">Ways To Help</h2>
      <div className="card-grid">
        {sponsorPackages.map((item) => (
          <div key={item.title} className="card">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <section className="partners-programs">
        <div>
          <h2>Program Paths</h2>
          <p>
            The best partner work should route back into visible learning pages, open-source docs,
            and demo flows that students and mentors can use immediately.
          </p>
        </div>
        <div className="partners-links">
          <Link to="/4h">4-H Projects</Link>
          <Link to="/ffa">FFA Projects</Link>
          <Link to="/education">Education</Link>
          <Link to="/academy">Academy</Link>
          <Link to="/developers">Developer Docs</Link>
          <Link to="/open-source">Open Source</Link>
        </div>
      </section>

      <div className="cta-bar">
        <a className="btn-primary" href="mailto:hello@wecr8.info?subject=TenderCells%20partner%20or%20sponsor%20conversation">
          Contact TenderCells
        </a>
        <Link className="btn-outline" to="/education">Explore Education</Link>
        <Link className="btn-outline" to="/app/demo">Try The Demo</Link>
      </div>
    </PageLayout>
  );
}

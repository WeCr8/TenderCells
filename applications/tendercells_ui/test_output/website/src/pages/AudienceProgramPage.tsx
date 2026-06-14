import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

type Program = {
  title: string;
  kicker: string;
  description: string;
  audience: string;
  outcomes: string[];
  projects: { title: string; desc: string; href: string }[];
  resources: { label: string; href: string }[];
};

const programs: Record<string, Program> = {
  academy: {
    title: "TenderCells Academy",
    kicker: "Agricultural robotics curriculum",
    description:
      "TenderCells Academy is the learning path for smart animal care, open-source farming, robotics, sensors, computer vision, data science, and safe automation.",
    audience:
      "Built for classrooms, 4-H clubs, FFA chapters, homeschool families, makerspaces, and young engineers who want practical agricultural technology projects.",
    outcomes: [
      "Understand how smart chicken coops, mobile pasture systems, and predator monitors work.",
      "Build and document sensor, camera, door, feed, water, and data projects.",
      "Use the public demo as a no-hardware Farming OS before building real modules.",
      "Contribute improvements back through GitHub issues, docs, and pull requests.",
    ],
    projects: [
      { title: "Smart Coop Basics", desc: "Map doors, feed, water, temperature, humidity, and egg records into one system.", href: "/shop/chicken-tender" },
      { title: "Pasture Robotics", desc: "Study mobile coop movement, docking, GPS boundaries, and route planning.", href: "/shop/roaming-roost" },
      { title: "Predator Monitoring", desc: "Explore cameras, solar power, local AI, alerts, and animal safety response.", href: "/shop/watchtower" },
    ],
    resources: [
      { label: "Public demo", href: "/demo" },
      { label: "Developer docs", href: "/developers" },
      { label: "Education hub", href: "/education" },
      { label: "GitHub repository", href: "https://github.com/WeCr8/TenderCells" },
    ],
  },
  "4h": {
    title: "4-H STEM Projects With TenderCells",
    kicker: "4-H engineering, animal science, and agricultural technology",
    description:
      "TenderCells helps 4-H members turn animal care into hands-on STEM projects using sensors, smart chicken coops, data logs, cameras, and open-source hardware.",
    audience:
      "For 4-H poultry, rabbit, goat, livestock, robotics, and engineering projects where students need visible builds, records, and fair-ready explanations.",
    outcomes: [
      "Create a 4-H engineering project with clear build notes, safety notes, and animal-care observations.",
      "Track feed, water, temperature, egg production, and behavior as project data.",
      "Use open-source docs to explain how firmware, sensors, and dashboards work.",
      "Prepare county fair and presentation materials from real build logs.",
    ],
    projects: [
      { title: "4-H Smart Chicken Coop", desc: "Automate one coop function and document the animal-care impact.", href: "/shop/chicken-tender" },
      { title: "4-H Predator Monitor", desc: "Prototype a camera or alert station for safer outdoor animal care.", href: "/shop/watchtower" },
      { title: "4-H Pasture Rotation Study", desc: "Compare movement plans, grazing patterns, and mobile coop ideas.", href: "/shop/roaming-roost" },
    ],
    resources: [
      { label: "Young engineer build path", href: "/education#young-engineers" },
      { label: "Good first issues", href: "https://github.com/WeCr8/TenderCells/issues?q=is%3Aopen+label%3A%22good+first+issue%22" },
      { label: "Animal health", href: "/health" },
      { label: "Science fair ideas", href: "/science-fair" },
    ],
  },
  ffa: {
    title: "FFA Agricultural Technology Projects",
    kicker: "SAE-ready animal-care automation",
    description:
      "TenderCells gives FFA students a practical path into agricultural robotics, precision animal care, records, supervised agricultural experiences, and open-source engineering.",
    audience:
      "For FFA chapters, agricultural education teachers, and students building SAE projects around poultry technology, livestock monitoring, farm automation, and data-driven care.",
    outcomes: [
      "Build SAE records from feed, water, egg, environment, and animal-care data.",
      "Explain agricultural technology through real hardware and software systems.",
      "Connect animal welfare, productivity, safety, and engineering decisions.",
      "Move from demo workflows to firmware, devices, and documented field tests.",
    ],
    projects: [
      { title: "FFA Poultry Technology SAE", desc: "Use Chicken Tender concepts to track environment, feed, eggs, and flock care.", href: "/shop/chicken-tender" },
      { title: "Livestock Monitoring Module", desc: "Design a feed, water, or environment sensor that can become a documented module.", href: "/developers#ideas" },
      { title: "Farm Safety Alert System", desc: "Study WatchTower AI as a solar predator and perimeter alert concept.", href: "/shop/watchtower" },
    ],
    resources: [
      { label: "Public demo", href: "/demo" },
      { label: "Developers", href: "/developers" },
      { label: "Open source program", href: "/open-source" },
      { label: "Academy", href: "/academy" },
    ],
  },
  homeschool: {
    title: "Homeschool STEM and Homesteading Projects",
    kicker: "Family-scale engineering with real animals",
    description:
      "TenderCells helps homeschool families connect animal care, robotics, coding, biology, data science, and homesteading into projects students can see and maintain.",
    audience:
      "For homeschool co-ops, families with backyard animals, and students who learn best by building useful systems for daily life.",
    outcomes: [
      "Turn daily chores into lessons about automation, observation, and responsibility.",
      "Use the no-signup demo before buying or building hardware.",
      "Create science notebooks from sensor readings and animal-care patterns.",
      "Practice coding, electronics, writing, and presentation through one project.",
    ],
    projects: [
      { title: "Backyard Coop Data Journal", desc: "Track temperature, humidity, eggs, feeding, and behavior over time.", href: "/learn/homesteading" },
      { title: "Simple Door Controller", desc: "Study schedules, fail-safe design, and animal safety before building a latch.", href: "/developers#ideas" },
      { title: "Mobile Coop Design", desc: "Explore Roaming Roost as a design challenge in geometry, robotics, and pasture care.", href: "/shop/roaming-roost" },
    ],
    resources: [
      { label: "Homesteading guide", href: "/learn/homesteading" },
      { label: "Automation ideas", href: "/learn/automation" },
      { label: "FAQ", href: "/learn/faq" },
      { label: "GitHub discussions", href: "https://github.com/WeCr8/TenderCells/discussions" },
    ],
  },
  "science-fair": {
    title: "Science Fair Agricultural Robotics Projects",
    kicker: "Smart animal care experiments and build guides",
    description:
      "TenderCells gives students science fair ideas that combine animal welfare, environmental sensing, smart chicken coops, robotics, computer vision, and open-source farming.",
    audience:
      "For middle school, high school, 4-H, FFA, homeschool, and makerspace students who need a testable question, measurable data, and a practical prototype.",
    outcomes: [
      "Ask measurable questions about environment, feed, water, movement, or egg production.",
      "Collect repeatable sensor data and explain limitations honestly.",
      "Build small prototypes before full animal deployment.",
      "Present the connection between animal welfare, automation, and engineering.",
    ],
    projects: [
      { title: "Does Coop Temperature Affect Egg Patterns?", desc: "Compare daily temperature and nest-box activity over several weeks.", href: "/health" },
      { title: "Can a Camera Reduce Missed Coop Checks?", desc: "Design a monitoring workflow and compare manual vs camera-assisted observations.", href: "/shop/watchtower" },
      { title: "What Pasture Route Reduces Overgrazing?", desc: "Model mobile coop paths and compare grass recovery assumptions.", href: "/shop/roaming-roost" },
    ],
    resources: [
      { label: "Academy", href: "/academy" },
      { label: "Public demo", href: "/demo" },
      { label: "Learn automation", href: "/learn/automation" },
      { label: "Developer docs", href: "/developers" },
    ],
  },
};

interface AudienceProgramPageProps {
  kind: keyof typeof programs;
}

function ProgramLink({ item }: { item: { label: string; href: string } }) {
  const external = item.href.startsWith("http");
  if (external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="tag">
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.href} className="tag">
      {item.label}
    </Link>
  );
}

export default function AudienceProgramPage({ kind }: AudienceProgramPageProps) {
  const program = programs[kind];

  return (
    <PageLayout>
      <div className="page-hero green">
        <p style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>{program.kicker}</p>
        <h1>{program.title}</h1>
        <p>{program.description}</p>
      </div>

      <div className="prose">
        <p>{program.audience}</p>
      </div>

      <h2 className="section-title">What Students Learn</h2>
      <div className="card-grid">
        {program.outcomes.map((outcome) => (
          <div key={outcome} className="card compact-card">
            <h3>{outcome}</h3>
          </div>
        ))}
      </div>

      <h2 className="section-title">Project Ideas</h2>
      <div className="card-grid">
        {program.projects.map((project) => (
          <Link key={project.title} to={project.href} className="card" style={{ textDecoration: "none" }}>
            <h3>{project.title}</h3>
            <p>{project.desc}</p>
            <span className="tag">Explore path</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Next Resources</h2>
      <div className="prose">
        <p>
          These links connect the topic to products, health content, education paths,
          developer documentation, and the open-source community.
        </p>
      </div>
      <div className="cta-bar">
        {program.resources.map((item) => (
          <ProgramLink key={item.href} item={item} />
        ))}
      </div>
    </PageLayout>
  );
}

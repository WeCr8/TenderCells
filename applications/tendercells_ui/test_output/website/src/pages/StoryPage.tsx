import PageLayout from "../components/PageLayout";
import "./StoryPage.css";

const demoFrames = [
  {
    title: "Start with demo animals",
    eyebrow: "Product-aware setup",
    image: "/assets/images/demos/animal-roster-demo.png",
    alt: "TenderCells animal roster showing product demo animal packs",
    body:
      "A new builder can load product-specific animals before hardware is ready. Chicken Tender, Duck Dock, Bunny Burrow, Goat Guardian, Roaming Roost, Turkey Tower, and custom devices can all start from realistic sample data.",
  },
  {
    title: "See the coop like an operator",
    eyebrow: "Camera and CAD views",
    image: "/assets/images/demos/coop-camera-demo.png",
    alt: "TenderCells coop dashboard showing selectable camera views",
    body:
      "The app can switch from CAD-style layout to simulated camera feeds so garage testing feels close to the real workflow: check roosts, nest boxes, doors, water, feed, and device state from one place.",
  },
  {
    title: "Register and move real hardware",
    eyebrow: "Device CRUD",
    image: "/assets/images/demos/door-device-crud-demo.png",
    alt: "TenderCells door and latch section with a garage test latch device added",
    body:
      "Each product section supports hardware modules, status, and setup needs. Builders can attach purchased kits, self-printed parts, custom actuators, sensors, waterers, door systems, controller boards, or community products and place them into coops, corrals, pastures, and other layouts.",
  },
  {
    title: "Test vision and egg workflows",
    eyebrow: "ChickenEye simulation",
    image: "/assets/images/demos/chickeneye-eggs-demo.png",
    alt: "TenderCells ChickenEye page showing camera tabs and egg detection simulation",
    body:
      "ChickenEye turns the flock roster, camera simulation, and nest-box egg map into a working loop. Today it is a demo workflow; tomorrow it can be wired to ESP32 cameras, local inference, and real sensors.",
  },
];

const futureSkills = [
  {
    title: "Use AI as a workshop partner",
    body:
      "Students should learn to ask better questions, inspect generated code, test ideas, document decisions, and use AI tools as accelerators instead of shortcuts.",
  },
  {
    title: "Build products from real problems",
    body:
      "Animal care gives builders tangible constraints: safety, weather, power, maintenance, daily chores, cost, and responsibility to living systems.",
  },
  {
    title: "Connect software to the physical world",
    body:
      "Dashboards matter more when they move doors, read sensors, capture camera events, control motors, and help someone make a better decision.",
  },
  {
    title: "Think like founders",
    body:
      "A school project can become a kit, a service, a local installation business, a research tool, or a new open-source module someone else can improve.",
  },
];

const builderPath = [
  "Explore a working demo before buying hardware.",
  "Pick one real problem: feed, water, doors, predators, records, pasture, or health signals.",
  "Use AI, docs, simulation, and mentors to plan a safe first prototype.",
  "Build, test, measure, and explain what worked and what failed.",
  "Publish the project so another student can learn from it.",
  "Turn the best ideas into products, clubs, services, research, or companies.",
];

const whatWeBuild = [
  {
    title: "A Farming OS for small builders",
    body:
      "A shared operating layer for animals, devices, property layouts, schedules, alerts, records, simulations, and product modules.",
  },
  {
    title: "Real product families",
    body:
      "Chicken Tender, WatchTower, Roaming Roost, and future animal-care systems that students can inspect, improve, remix, or build around.",
  },
  {
    title: "An AI-enabled learning path",
    body:
      "Guides, demos, prompts, docs, and build workflows that teach learners to use AI tools while still checking facts, testing hardware, and owning the result.",
  },
  {
    title: "A launchpad for young founders",
    body:
      "A place where a school build, 4-H project, FFA SAE, homeschool prototype, or maker idea can grow into a kit, service, open-source module, or company.",
  },
];

const companyPath = [
  "Notice a real problem in animal care, agriculture, education, or local services.",
  "Research the user, animal, environment, cost, and safety constraints.",
  "Prototype with AI assistance, open docs, hardware modules, and simulation.",
  "Test with real data and explain the outcome clearly.",
  "Package the result as a guide, kit, service, app, module, or support offering.",
  "Learn pricing, customer support, documentation, maintenance, and responsible growth.",
];

export default function StoryPage() {
  return (
    <PageLayout>
      <section className="story-hero">
        <div className="story-hero-copy">
          <p className="story-kicker">TenderCells story</p>
          <h1>Teaching the next generation to build the future, not wait for it.</h1>
          <p>
            TenderCells started as a smarter Chicken Tender coop idea. It grew into a
            bigger mission: help kids, students, engineers, homesteaders, makers, and
            future founders learn how to use AI, robotics, software, hardware, and
            open-source collaboration to build useful things in the real world.
          </p>
        </div>
        <div className="story-hero-panel">
          <span>What we are aiming for</span>
          <strong>A Farming OS where learners can imagine, simulate, build, document, and launch animal-care products.</strong>
        </div>
      </section>

      <section className="story-intro">
        <div>
          <h2>The goal is bigger than a product. It is a training ground.</h2>
          <p>
            The world is moving fast. AI tools, simulation, robotics, computer vision,
            local agents, and open-source hardware will change how products are built.
            We do not want young people to become passive users of these systems. We
            want them to understand the tools, question them, use them responsibly,
            and build with them.
          </p>
          <p>
            TenderCells uses animal care because it is real. A sensor reading matters.
            A door schedule matters. A predator alert matters. A waterer that fails
            matters. That makes the work honest, practical, and memorable.
          </p>
        </div>
        <ul>
          {builderPath.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="story-mission">
        <div>
          <p className="story-kicker">Who this is for</p>
          <h2>Young kids, engineers, teachers, parents, makers, and founders learning together.</h2>
        </div>
        <p>
          We want a student to see a coop door and think about firmware. To see a
          pasture and think about route planning. To see a sensor chart and ask a
          better science question. To use an AI assistant, then verify the answer.
          To build a prototype, show it, improve it, and maybe realize they can start
          a company around a problem they understand deeply.
        </p>
      </section>

      <section className="story-future">
        <div className="story-future-heading">
          <p className="story-kicker">Future-ready skills</p>
          <h2>AI should make young builders more capable, not more dependent.</h2>
          <p>
            TenderCells is a place to practice the new toolchain: AI assistance,
            code, CAD, sensors, dashboards, robotics, documentation, data, and
            community review. The point is not to hide complexity. The point is to
            make complexity approachable enough that more people can participate.
          </p>
        </div>
        <div className="story-skill-grid">
          {futureSkills.map((skill) => (
            <article key={skill.title}>
              <h3>{skill.title}</h3>
              <p>{skill.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-build-plan">
        <div className="story-build-plan-heading">
          <p className="story-kicker">What we want to build</p>
          <h2>A bridge from curiosity to capable products.</h2>
          <p>
            TenderCells should become a place where a young person can move from
            "I wonder if this is possible" to "I built a working prototype" to
            "other people can use this." We want the platform, docs, demo, and
            community to make that path visible.
          </p>
        </div>
        <div className="story-build-grid">
          {whatWeBuild.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-pathways">
        <article>
          <h2>Imagine it.</h2>
          <p>
            Start with a problem in animal care, then sketch the product, ask what
            data matters, and use AI tools to explore designs, risks, parts, and code.
          </p>
        </article>
        <article>
          <h2>Simulate it.</h2>
          <p>
            Test ideas in the public demo, browser workflows, CAD-style layouts,
            local scripts, or robotics simulations before risking hardware or animals.
          </p>
        </article>
        <article>
          <h2>Build it.</h2>
          <p>
            Community builders can model and 3D print their own mounts, gates,
            waterer brackets, sensor housings, rails, or replacement parts, then
            register those parts as product modules.
          </p>
        </article>
        <article>
          <h2>Wire it.</h2>
          <p>
            Developers can wire custom boards, motors, cameras, and MQTT devices
            into the same software surface used by official TenderCells products.
          </p>
        </article>
        <article>
          <h2>Share it.</h2>
          <p>
            A build log, lesson, dataset, issue, pull request, or demo video can help
            the next student move faster and think more clearly.
          </p>
        </article>
        <article>
          <h2>Launch it.</h2>
          <p>
            The best ideas can become kits, local services, school programs, research
            tools, community products, or companies built by the people who learned here.
          </p>
        </article>
      </section>

      <section className="story-company-path">
        <div>
          <p className="story-kicker">From project to company</p>
          <h2>We want students to learn how ideas become real offerings.</h2>
          <p>
            The future will reward people who can combine AI tools with taste,
            judgment, domain knowledge, and follow-through. TenderCells should help
            learners practice that full loop, from problem discovery to product,
            documentation, support, and responsible entrepreneurship.
          </p>
        </div>
        <ol>
          {companyPath.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="story-gallery" aria-label="TenderCells demo screenshots">
        {demoFrames.map((frame, index) => (
          <article className="story-frame" key={frame.title}>
            <div className="story-frame-copy">
              <p>{frame.eyebrow}</p>
              <h2>{index + 1}. {frame.title}</h2>
              <span>{frame.body}</span>
            </div>
            <figure>
              <img src={frame.image} alt={frame.alt} loading="lazy" />
            </figure>
          </article>
        ))}
      </section>

      <section className="story-community">
        <div>
          <h2>For builders, the story continues in code, hardware, and companies.</h2>
          <p>
            The next phase is letting garage hardware, open-source modules, local
            AI repair loops, community product designs, and student projects plug
            into the same registry and simulation surfaces shown here. We want
            TenderCells to help people learn the tools of the future, care for
            animals better, and build products or companies around problems that matter.
          </p>
        </div>
        <div className="story-actions">
          <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">
            View the Repository
          </a>
          <a href="/academy">Start Learning</a>
          <a href="/demo">Try the Demo</a>
        </div>
      </section>
    </PageLayout>
  );
}

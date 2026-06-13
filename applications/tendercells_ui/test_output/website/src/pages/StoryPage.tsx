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

export default function StoryPage() {
  return (
    <PageLayout>
      <section className="story-hero">
        <div className="story-hero-copy">
          <p className="story-kicker">TenderCells story</p>
          <h1>From one backyard coop idea to an open animal-care OS.</h1>
          <p>
            TenderCells started as a way to make a smarter Chicken Tender coop, then
            grew into a bigger question: what if homesteaders, students, makers, and
            hardware developers could all build animal-care automation on the same
            open software foundation?
          </p>
        </div>
        <div className="story-hero-panel">
          <span>Current proof</span>
          <strong>Demo animals, device registry, camera views, egg simulation, property layout, CLI loops.</strong>
        </div>
      </section>

      <section className="story-intro">
        <div>
          <h2>The goal is not just a product. It is a platform.</h2>
          <p>
            Some people will buy a kit. Some will 3D print parts, wire their own
            motors, and run everything locally. Some will attach third-party
            waterers, door systems, cameras, feeders, or corral equipment. Some
            will use Isaac Sim, ROS, MQTT, or browser simulation before touching
            hardware. TenderCells is being shaped so all of those paths can meet
            in one operating system.
          </p>
        </div>
        <ul>
          <li>Local-first operation when cloud services are unavailable.</li>
          <li>Product-aware demos for builders without finished hardware.</li>
          <li>Open device contracts for community sensors and actuators.</li>
          <li>Property and corral placement for products, obstacles, and animals.</li>
          <li>Repository-backed health checks, history, and animal records.</li>
          <li>Simulation paths for yards, enclosures, cameras, and robotics.</li>
        </ul>
      </section>

      <section className="story-mission">
        <div>
          <p className="story-kicker">Who this is for</p>
          <h2>Farmers, developers, and super nerds building healthier systems together.</h2>
        </div>
        <p>
          TenderCells is for people who care about animal wellness and human
          capability in the same breath. Better records, cleaner habitats,
          safer automation, and earlier health signals help animals live better.
          Better tools, open knowledge, and repairable systems help humans become
          more capable stewards of the animals and land around them.
        </p>
      </section>

      <section className="story-pathways">
        <article>
          <h2>Print it.</h2>
          <p>
            Community builders can model and 3D print their own mounts, gates,
            waterer brackets, sensor housings, rails, or replacement parts, then
            register those parts as product modules.
          </p>
        </article>
        <article>
          <h2>Build it.</h2>
          <p>
            Developers can wire custom boards, motors, cameras, and MQTT devices
            into the same software surface used by official TenderCells products.
          </p>
        </article>
        <article>
          <h2>Buy it.</h2>
          <p>
            Users who want a faster path can buy kits or prebuilt units from us
            and still manage them beside their own community or custom hardware.
          </p>
        </article>
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
          <h2>For builders, the story continues in code.</h2>
          <p>
            The next phase is letting real garage hardware, open-source modules,
            local LLM repair loops, and community product designs plug into the
            same registry and simulation surfaces shown here, while animal
            health records stay connected to the devices and places that care
            for them.
          </p>
        </div>
        <div className="story-actions">
          <a href="https://github.com/WeCr8/TenderCells" target="_blank" rel="noopener noreferrer">
            View the Repository
          </a>
          <a href="/open-source">Open Source Plan</a>
          <a href="/apps">Try the App</a>
        </div>
      </section>
    </PageLayout>
  );
}

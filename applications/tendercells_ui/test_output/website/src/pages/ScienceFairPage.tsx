// ScienceFairPage (/science-fair) - how to run a science fair project with Tender Cells, and
// complete project walkthroughs: question, hypothesis, variables, what to build (a lesson),
// what to record (and where in the OS), safety, and how to present it.
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import RelatedContent, { ContentLinkItem } from "../components/RelatedContent";
import { demo, type ContentLink } from "../data/contentGraph";
import "./ScienceFairPage.css";

const METHOD: { step: string; body: string }[] = [
  { step: "Ask a testable question", body: "One thing you change, one thing you measure. \"Does X change Y?\" beats \"Can I build a smart coop?\"" },
  { step: "Write a hypothesis", body: "Say what you expect and why, before you collect any data." },
  { step: "Name your variables", body: "Independent (what you change), dependent (what you measure), controlled (what you keep the same)." },
  { step: "Build the smallest thing that measures it", body: "One sensor or camera, following a lesson. Test it on your desk before it goes near animals." },
  { step: "Collect enough data", body: "Repeat trials or record for days. Note the time, the conditions and anything unusual." },
  { step: "Analyze honestly", body: "Graph it, compare averages, count errors. Say what the data does and does not show." },
  { step: "Present it", body: "Problem, hypothesis, build, data, conclusion, what you would do next - and a live demo." },
];

const TIMELINE: [string, string][] = [
  ["Week 1", "Pick a project below, write the question, hypothesis and variables. Try the demo."],
  ["Week 2", "Build and flash your device; test it on the desk. Register it in the OS."],
  ["Weeks 3-4", "Collect data. Check it every day; fix problems early and write them down."],
  ["Week 5", "Analyze: graphs, averages, errors. Write the conclusion."],
  ["Week 6", "Make the board, practise the 2-minute explanation, prepare the live demo."],
];

interface Project {
  id: string;
  title: string;
  level: string;
  time: string;
  question: string;
  hypothesis: string;
  variables: { independent: string; dependent: string; controlled: string };
  build: ContentLink[];
  data: string;
  safety: string;
}

const PROJECTS: Project[] = [
  {
    id: "sunrise-door",
    title: "Does a light sensor open the coop door at sunrise?",
    level: "Beginner", time: "2-3 weeks",
    question: "How close to official sunrise does a light-sensor door open, and does cloud cover change it?",
    hypothesis: "The door opens within 20 minutes of sunrise on clear days and later on cloudy days.",
    variables: { independent: "Cloud cover (clear / partly / overcast)", dependent: "Minutes between official sunrise and door opening", controlled: "Sensor position, light threshold, same door and board" },
    build: [
      { kind: "lesson", title: "Sensors → Automation", to: "/lessons/sensors-automation" },
      { kind: "lesson", title: "Door + Basic Roaming Roost", to: "/lessons/door-roaming-roost" },
    ],
    data: "Each morning: official sunrise time, door-open time from the OS event log, cloud cover. 14+ mornings.",
    safety: "Test the door without animals first; make sure it cannot close on a bird. E-STOP within reach.",
  },
  {
    id: "coop-climate",
    title: "Does coop temperature change egg laying?",
    level: "Beginner", time: "4+ weeks",
    question: "Do hens lay fewer eggs on days the coop is hotter than 85°F?",
    hypothesis: "Egg count drops on days the coop stays above 85°F for more than 3 hours.",
    variables: { independent: "Daily coop temperature (hot vs normal days)", dependent: "Eggs collected per day", controlled: "Same flock, feed, water and daylight hours" },
    build: [
      { kind: "lesson", title: "Your First Coop Brain (temp / humidity node)", to: "/lessons/your-first-coop-brain" },
      { kind: "os", title: "Analytics: sensor history", to: demo("/analytics") },
      { kind: "os", title: "Egg map", to: demo("/egg-map") },
    ],
    data: "Temperature every 10 minutes (the node publishes it), eggs per day. Chart hours above 85°F against eggs.",
    safety: "Observation only - never make the coop hotter for the experiment. Follow heat-stress advice in the animal library.",
  },
  {
    id: "predator-camera",
    title: "Can a camera spot predators before people do?",
    level: "Intermediate", time: "3-4 weeks",
    question: "How many night-time animal visits does a camera node record that people never noticed?",
    hypothesis: "The camera records at least 3 times more visits than morning checks find signs of.",
    variables: { independent: "Detection method (camera vs morning walk-around)", dependent: "Number of visits found", controlled: "Same area, same nights, same camera position" },
    build: [
      { kind: "guide", title: "Camera Node: first build", to: "/guides/camera-node-first-build" },
      { kind: "guide", title: "Predator Monitoring Guide", to: "/guides/predator-monitoring" },
      { kind: "os", title: "Predator monitor", to: demo("/predator-monitor") },
    ],
    data: "Every detection (time, animal, correct / wrong), every sign found on morning checks. Count false alarms too.",
    safety: "Never approach or trap a wild animal. Keep the camera out of reach of animals and weather.",
  },
  {
    id: "weed-camera",
    title: "Which weeds does a camera find best?",
    level: "Intermediate", time: "2-3 weeks",
    question: "Does a green-colour detector find broad-leaf weeds more reliably than grassy weeds?",
    hypothesis: "It finds most broad-leaf weeds (purslane, pigweed) and misses more grassy ones (crabgrass).",
    variables: { independent: "Weed type", dependent: "Detection rate and false alarms", controlled: "Same camera height, light, soil and bed" },
    build: [
      { kind: "doc", title: "Weed patrol: detectors", to: "/docs/weed-patrol" },
      { kind: "os", title: "Weed patrol (try it on demo data)", to: demo("/weed-patrol") },
      { kind: "guide", title: "Weed library", to: "/library#weed" },
    ],
    data: "Label every weed by hand, then compare with the robot's finds: found, missed, false alarm - per weed type.",
    safety: "Camera only (student mode) - the laser is never used in school projects.",
  },
  {
    id: "leak-rover",
    title: "Can a robot find water leaks faster than a walk-around?",
    level: "Advanced", time: "3-4 weeks",
    question: "How soon after a small leak starts does a patrolling rover report it, compared with a daily check?",
    hypothesis: "A rover patrolling twice a day finds leaks at least 8 hours sooner than one daily walk-around.",
    variables: { independent: "Patrol frequency (1, 2, 4 passes a day)", dependent: "Hours from leak start to report", controlled: "Same water point, leak size, ground" },
    build: [
      { kind: "doc", title: "Rover patrol: animals and water leaks", to: "/docs/weed-patrol#weed-patrol-on-a-rover" },
      { kind: "os", title: "Property layout: add water points", to: demo("/layout") },
    ],
    data: "When you start a small, safe drip at a spigot; when the rover reports it; when a person notices. Repeat 5+ times.",
    safety: "Use a controlled drip only - never damage plumbing. A grown-up supervises every rover run.",
  },
  {
    id: "feeder-accuracy",
    title: "How accurate is a DIY feeder?",
    level: "Beginner", time: "1-2 weeks",
    question: "Does a timed feeder portion stay the same as the hopper empties?",
    hypothesis: "Portions get smaller as the hopper empties because there is less weight pushing feed down.",
    variables: { independent: "Hopper fill level (full, half, quarter)", dependent: "Grams dispensed per portion", controlled: "Same run time, feed type and feeder" },
    build: [
      { kind: "lesson", title: "Feeder + Waterer", to: "/lessons/feeder-waterer" },
      { kind: "os", title: "Schedules", to: demo("/schedules") },
    ],
    data: "Weigh 20 portions at each fill level on a kitchen scale. Average and spread (min / max) per level.",
    safety: "Keep fingers out of moving parts; unplug before clearing a jam.",
  },
  {
    id: "coverage-route",
    title: "Which route covers a yard fastest?",
    level: "Advanced", time: "2 weeks",
    question: "Does a lawn-mower (lane) route cover more of a yard per minute than a random walk?",
    hypothesis: "Lanes cover 90% of the yard in half the time a random route needs.",
    variables: { independent: "Route type (lanes vs random vs drawn path)", dependent: "Percent of yard covered over time", controlled: "Same yard, zones, rover speed" },
    build: [
      { kind: "guide", title: "Mobile Coop and Pasture Rotation", to: "/guides/pasture-rotation" },
      { kind: "doc", title: "Robot exclusion zones", to: "/docs/robot-exclusion-zones" },
      { kind: "os", title: "Property layout: draw a route", to: demo("/layout") },
    ],
    data: "Run each route in the simulator (and on a real rover if you have one); record coverage every minute.",
    safety: "Mark no-go zones first; rovers never enter them. Stop the rover near people and pets.",
  },
];

export default function ScienceFairPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        kicker="Science fair"
        title="Science fair projects with real data"
        subtitle="Testable questions about animals, gardens and robots - each with the build, the data to collect and how to present it."
        image="/assets/images/demos/tendercells-education-format.png"
        imageAlt="Tender Cells education poster: Build, Learn, Care, Share"
      />

      <div className="cta-bar">
        <a href="#projects" className="btn-primary">Pick a project</a>
        <Link to="/lessons/classroom-quickstart#competition--science-fair-challenges" className="btn-outline">No hardware? Competition challenges</Link>
        <a href="/app/demo" className="btn-outline">Try the demo</a>
      </div>

      <h2 className="section-title" id="method">How a project works</h2>
      <ol className="sf-method">
        {METHOD.map((m, i) => (
          <li key={m.step}><span className="sf-num">{i + 1}</span><div><strong>{m.step}</strong><p>{m.body}</p></div></li>
        ))}
      </ol>

      <h2 className="section-title" id="projects">Project walkthroughs</h2>
      <div className="prose"><p>Each project is sized for a normal fair timeline. Open one to see the full plan.</p></div>
      <div className="sf-projects">
        {PROJECTS.map((p) => (
          <details key={p.id} id={p.id} className="sf-project">
            <summary>
              <span className="sf-title">{p.title}</span>
              <span className="sf-meta"><span className="tag">{p.level}</span> {p.time}</span>
            </summary>
            <div className="sf-body">
              <p><strong>Question:</strong> {p.question}</p>
              <p><strong>Hypothesis:</strong> {p.hypothesis}</p>
              <table className="sf-vars">
                <tbody>
                  <tr><th>Independent</th><td>{p.variables.independent}</td></tr>
                  <tr><th>Dependent</th><td>{p.variables.dependent}</td></tr>
                  <tr><th>Controlled</th><td>{p.variables.controlled}</td></tr>
                </tbody>
              </table>
              <p className="sf-sub">Build it</p>
              <ul className="sf-links">{p.build.map((l) => <li key={l.to}><ContentLinkItem link={l} /></li>)}</ul>
              <p><strong>Data to record:</strong> {p.data}</p>
              <p className="sf-safety"><strong>Safety:</strong> {p.safety}</p>
            </div>
          </details>
        ))}
      </div>

      <h2 className="section-title" id="timeline">A 6-week plan</h2>
      <table className="sf-timeline">
        <tbody>{TIMELINE.map(([w, t]) => <tr key={w}><th>{w}</th><td>{t}</td></tr>)}</tbody>
      </table>

      <h2 className="section-title" id="present">Presenting it</h2>
      <div className="sf-present">
        <div className="rc-topic">
          <h3>Display board</h3>
          <ul className="sf-list">
            <li>Question and hypothesis, big and at the top</li>
            <li>Photo or diagram of your build, with the parts list</li>
            <li>Your variables table</li>
            <li>One clear graph of the results</li>
            <li>Conclusion: was the hypothesis right? What surprised you?</li>
            <li>Next steps: what you would test next</li>
          </ul>
        </div>
        <div className="rc-topic">
          <h3>What judges look for</h3>
          <ul className="sf-list">
            <li>A clear problem and why it matters to animals or growers</li>
            <li>Enough repeated data - and honest about errors</li>
            <li>A working demo: show the device publishing live in the OS</li>
            <li>You can explain every part yourself</li>
            <li>Safety and animal welfare thought through</li>
          </ul>
        </div>
        <div className="rc-topic">
          <h3>Rules for projects with animals</h3>
          <ul className="sf-list">
            <li>Observe; never stress, harm or change conditions to test animals</li>
            <li>A grown-up supervises every build that moves or plugs in</li>
            <li>Lasers are never part of a school project</li>
            <li>Check your fair's rules for vertebrate animal projects early</li>
          </ul>
        </div>
      </div>

      <RelatedContent topics={["science-fair", "sensors", "schools"]} />
    </PageLayout>
  );
}

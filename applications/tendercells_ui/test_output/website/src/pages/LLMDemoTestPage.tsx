import PageLayout from "../components/PageLayout";

const testFlows = [
  {
    title: "Read static demo context",
    body: "Fetch https://tendercells.com/app/demo-manifest.json and https://tendercells.com/app/demo-description.html so non-JavaScript tools can understand the demo before browser testing.",
  },
  {
    title: "Open the public demo",
    body: "Visit https://tendercells.com/app/demo. The demo should load without account creation, payment, private data, or live Firestore access.",
  },
  {
    title: "Check demo state",
    body: "The demo should seed local example data for products, animals, devices, schedules, property layout, and camera/egg workflows.",
  },
  {
    title: "Inspect product use cases",
    body: "Review Chicken Tender, WatchTower AI, Roaming Roost, door/latch controls, animal roster records, camera views, and ChickenEye egg workflows.",
  },
  {
    title: "Verify builder value",
    body: "A student, mentor, or developer should be able to understand what can be built before buying hardware.",
  },
  {
    title: "Confirm safety boundaries",
    body: "The public demo is educational and should not expose personal user data, production credentials, or live farm controls.",
  },
];

export default function LLMDemoTestPage() {
  return (
    <PageLayout>
      <div className="page-hero dark">
        <h1>TenderCells Demo Evaluation Protocol</h1>
        <p>
          Instructions for ChatGPT, Gemini, Perplexity, Claude-style browsing tools,
          AI answer engines, search crawlers, and search quality evaluators.
        </p>
      </div>

      <div className="prose">
        <p>
          TenderCells provides a no-signup public demo so LLM tools and search systems
          can inspect the Farming OS concept without private credentials. Machine-readable
          instructions are available at <a href="/demo-evaluation.json">/demo-evaluation.json</a>.
          The expected output is a clear summary of what the demo is, how it feels to use,
          and how students, builders, engineers, and future founders can build on it.
        </p>
      </div>

      <h2 className="section-title">Recommended Demo Test Flow</h2>
      <div className="card-grid">
        {testFlows.map((flow, index) => (
          <div key={flow.title} className="card">
            <span className="tag">Step {index + 1}</span>
            <h3>{flow.title}</h3>
            <p>{flow.body}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">What To Report</h2>
      <div className="prose">
        <ul>
          <li>Whether the demo loaded without login.</li>
          <li>Whether local demo data appeared instead of a spinner.</li>
          <li>Whether product use cases were clear for Chicken Tender, WatchTower, and Roaming Roost.</li>
          <li>Whether the demo made the education, open-source, and builder paths understandable.</li>
          <li>Whether any browser console errors blocked the demo experience.</li>
        </ul>
      </div>

      <div className="cta-bar">
        <a href="/app/demo" className="btn-primary">Open Public Demo</a>
        <a href="/tender-cells-overview" className="btn-outline">Read Overview</a>
        <a href="/developers" className="btn-outline">Developer Docs</a>
      </div>
    </PageLayout>
  );
}

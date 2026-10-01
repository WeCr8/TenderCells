// AssistantsPage.tsx - /assistants: Tender Cells in Claude and ChatGPT, for customers.
// How to add the hosted connector to either app, what it can and cannot do (read-only,
// your farm only, no platform or admin access), and where to manage connections (the OS
// /app/assistants page). Linked from the header (Applications) and the connector's browser page.
import { useState } from "react";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

const URL_MAIN = "https://tendercells.com/mcp";
const URL_DEMO = "https://tendercells.com/mcp/demo";

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "0.5rem 0 1rem" }}>
      <code style={{ flex: "1 1 260px", padding: "0.6rem 0.8rem", background: "#fff", border: "1px solid #c9c2b0", borderRadius: 8, fontSize: 16, wordBreak: "break-all" }}>{value}</code>
      <button type="button" className="btn-outline" onClick={() => { void navigator.clipboard?.writeText(value).then(() => setDone(true)).catch(() => {}); }}>
        {done ? "Copied ✓" : "Copy address"}
      </button>
    </div>
  );
}

export default function AssistantsPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        kicker="Connector · Claude & ChatGPT"
        title="Ask Claude or ChatGPT about your farm"
        subtitle="“How are the chickens?” “Any predator alerts tonight?” Connect your Tender Cells account and get answers from your own coop - readings, health warnings, alerts and a farm card."
        image="/brand/farm-card-example.webp"
        imageAlt="The Tender Cells farm card inside a chat: readings for each coop, a low-water warning and a raccoon alert (demo farm)"
      />

      <h2 className="section-title">1. Copy your connector address</h2>
      <div className="prose">
        <Copy value={URL_MAIN} />
        <p>No account or hardware yet? Try the simulated demo farm first - no sign-in needed:</p>
        <Copy value={URL_DEMO} />
      </div>

      <h2 className="section-title">2. Add it to your assistant</h2>
      <div className="prose">
        <h3>Claude (claude.ai, desktop and mobile)</h3>
        <ol>
          <li>Open <strong>Settings → Connectors</strong> and choose <strong>Add custom connector</strong>.</li>
          <li>Name it <em>Tender Cells</em> and paste the address.</li>
          <li>Click <strong>Connect</strong>, sign in with your Tender Cells account and choose <strong>Allow read-only access</strong>.</li>
          <li>In a chat, switch Tender Cells on and ask <em>“How is my farm?”</em></li>
        </ol>
        <h3>ChatGPT</h3>
        <ol>
          <li>Open <strong>Settings → Apps &amp; Connectors</strong> and create a connector (until Tender Cells is in the app directory this may need developer mode).</li>
          <li>Paste the address and choose <strong>OAuth</strong>.</li>
          <li>Sign in with your Tender Cells account and allow read-only access, then ask <em>“How is my farm?”</em></li>
        </ol>
        <p>Menu names change from time to time - look for <strong>Connectors</strong>.</p>
      </div>

      <h2 className="section-title">3. What it can - and can't - do</h2>
      <div className="prose">
        <ul>
          <li>✓ Read <strong>your</strong> devices: temperature, humidity, ammonia, feed, water, headcount, door, state and alerts.</li>
          <li>✓ Put animal-health problems first and show a live farm card in the chat.</li>
          <li>✕ It can't move hardware. Doors, feeders, robots and E-STOP stay in the Tender Cells app on your farm network.</li>
          <li>✕ It can't see other people's farms, your password or payment details, or change any account, platform or admin settings.</li>
        </ul>
        <p>Your hub shares readings with the cloud only when it is signed in to your account.</p>
      </div>

      <h2 className="section-title">Manage or disconnect</h2>
      <div className="prose">
        <p>See every assistant connected to your farm, and disconnect any of them, in the Tender Cells app under <strong>Account → Claude &amp; ChatGPT</strong>.</p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="/app/assistants" className="btn-primary">Manage connected assistants</a>
        <a href="/docs/ai-assistant-plugin" className="btn-outline">Full guide (Claude Desktop, Claude Code, local hub)</a>
        <a href="/privacy" className="btn-outline">Privacy</a>
      </div>
    </PageLayout>
  );
}

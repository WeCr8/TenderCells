import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function HomesteadingPage() {
  return (
    <PageLayout>
      <div className="page-hero green">
        <h1>The Homesteader's Automation Guide</h1>
        <p>Practical wisdom for building a self-sufficient, tech-enabled homestead.</p>
      </div>

      <div className="prose">
        <p>
          Modern homesteading isn't about rejecting technology — it's about using the right tools
          to do more with less time. Tender Cells was built by homesteaders who wanted to spend
          mornings drinking coffee on the porch, not mucking coops before dawn.
        </p>
      </div>

      <h2 className="section-title">Where to Start: The 80/20 of Coop Automation</h2>
      <div className="prose">
        <p>
          Most of the daily time cost in backyard chicken keeping comes from three tasks.
          Automate these first:
        </p>
        <ul>
          <li><strong>Door open/close (~15 min/day):</strong> A timer or light-sensor door controller pays for itself in convenience within a month. Chicken Tender's door integrates with the full schedule.</li>
          <li><strong>Feeding &amp; watering (~10 min/day):</strong> Gravity feeders reduce frequency. Automated dispensers with load-cell monitoring tell you when levels are low before animals go without.</li>
          <li><strong>Cleaning (~20–30 min/day across the week):</strong> Deep litter method + automated scraper reduces manual cleaning to bi-weekly. Robot arm scraper does daily maintenance between deep cleans.</li>
        </ul>
      </div>

      <h2 className="section-title">Pasture Rotation with Roaming Roost™</h2>
      <div className="prose">
        <p>
          Pasture rotation is the single highest-impact practice for both soil health and flock
          wellbeing — chickens get fresh forage, and soil regenerates without overgrazing.
          The Roaming Roost™ automates this by moving the entire enclosure on mecanum wheels
          to a new grid square on your property map.
        </p>
        <ul>
          <li>Set a rotation schedule in the app — daily, every 3 days, or triggered by vegetation density sensor</li>
          <li>GPS boundary fence prevents over-ranging</li>
          <li>Return-to-dock runs automatically at sunset</li>
          <li>Works on slopes up to 8° — most backyard terrain</li>
        </ul>
      </div>

      <h2 className="section-title">Open Source Philosophy</h2>
      <div className="prose">
        <p>
          Every line of Tender Cells firmware, the mobile app, and the hardware schematics are
          open source under the MIT license. This isn't just marketing — it's a commitment.
        </p>
        <p>
          We believe the future of small-scale agriculture depends on farmers owning their tools
          completely. No proprietary cloud lock-in. No subscription required for local operation.
          When WeCr8 updates firmware, the community sees every commit. When a sensor fails,
          you can source a replacement from any supplier — no OEM parts required.
        </p>
      </div>

      <h2 className="section-title">Automation Ideas by Homestead Size</h2>
      <div className="card-grid">
        {[
          {
            title: "Backyard (1–10 chickens)",
            desc: "Chicken Tender BASE — automated door, feeding, watering, egg collection. WatchTower AI for predator protection. Estimated time savings: 45 min/day.",
            tag: "Starter"
          },
          {
            title: "Small Farm (10–50 chickens)",
            desc: "Chicken Tender PRO + Roaming Roost. Multiple feeding zones, advanced health monitoring, pasture rotation scheduling. Time savings: 2–3 hr/day.",
            tag: "Growing"
          },
          {
            title: "Mixed-Species Homestead",
            desc: "Full Tender Cells ecosystem — Chicken Tender, Duck Dock, Bunny Burrow, Goat Guardian. One app, unified schedules, cross-species health monitoring.",
            tag: "Full Farm"
          },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="tag">{c.tag}</span>
          </div>
        ))}
      </div>

      <h2 className="section-title">Sensor Data for Better Decisions</h2>
      <div className="prose">
        <p>
          The Tender Cells sensor suite gives you data that would take professional poultry
          operations thousands in equipment to replicate:
        </p>
        <ul>
          <li><strong>Ammonia (MQ-137):</strong> Above 10ppm stresses respiratory systems. Above 25ppm requires immediate ventilation. Know before chickens show symptoms.</li>
          <li><strong>Temperature/humidity (DHT22):</strong> Below 35°F or above 85°F triggers alerts. Humidity above 80% with ammonia creates disease risk.</li>
          <li><strong>Feed consumption rate:</strong> A sudden drop often means illness, a new predator threat, or feed quality issues — before you'd see it visually.</li>
          <li><strong>Egg production tracking:</strong> Day-over-day egg count per nest box. Declines flag health issues or lighting changes.</li>
          <li><strong>Chicken headcount via AI:</strong> Computer vision counts the flock at door close time. Missing count means door stays open until all are in.</li>
        </ul>
      </div>
      <div className="cta-bar">
        <Link to="/learn/automation" className="btn-primary">Automation Ideas →</Link>
        <Link to="/health" className="btn-outline">Animal Health Guide</Link>
      </div>
    </PageLayout>
  );
}

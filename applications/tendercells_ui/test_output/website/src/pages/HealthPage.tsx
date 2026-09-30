import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { ANIMALS } from "../../../shared/library/animals";
import "./ReferenceLibrary.css";

const urgentSigns = [
  "Sudden or unexplained death, or several birds becoming ill together",
  "Gasping, open-mouth breathing at rest, nasal discharge, or marked swelling",
  "Purple discoloration of the comb, wattles, or legs",
  "Stumbling, twisted neck, inability to stand, or severe weakness",
  "A sharp flock-wide drop in eating, drinking, or egg production",
];

const concerns = [
  ["Heat stress", "Panting, wings held away, lethargy", "Provide shade, abundant cool water, and more air movement. Reduce handling. Judge the bird, humidity, airflow, and exposure together."],
  ["Cold or frostbite risk", "Persistent huddling, lethargy, pale or dark comb tips", "Keep birds dry and protected from drafts while maintaining ventilation. Avoid improvised heat lamps and other fire hazards."],
  ["Poor air or wet litter", "Strong odor, eye irritation, damp bedding, coughing", "Correct leaks and improve ventilation. A sensor can flag a trend, but it does not replace checking litter and birds."],
  ["Parasites", "Feather damage, pale comb, weight loss, restless roosting", "Identify the parasite before treatment. Ask a veterinarian or extension specialist for an approved product and withdrawal guidance."],
  ["Reproductive emergency", "Repeated straining, penguin-like posture, weakness", "Move the hen to a quiet, safe area and contact a poultry veterinarian promptly. Do not attempt invasive home treatment."],
  ["Respiratory disease", "Sneezing, discharge, facial swelling, breathing difficulty", "Separate affected birds when safe, tighten biosecurity, and call a veterinarian. Multiple cases or deaths require rapid reporting."],
];

export default function HealthPage() {
  return (
    <PageLayout>
      <PageHero
        variant="green"
        kicker="Practical flock care"
        title="Animal Health"
        subtitle="Observe the animal first. Use records and sensors to notice change sooner, then bring a qualified veterinarian into diagnosis and treatment."
        image="/assets/images/health/free-range-flock.jpg"
        imageAlt="A free-range flock of hens near their coop"
      />

      <nav className="reference-jumps" aria-label="Animal health topics">
        <a href="#urgent">Urgent signs</a><a href="#daily">Daily check</a>
        <a href="#environment">Environment</a><a href="#concerns">Common concerns</a>
        <a href="#biosecurity">Biosecurity</a><a href="#technology">Sensors</a>
      </nav>

      <section className="urgent-panel" id="urgent">
        <div>
          <p className="reference-eyebrow">Act now</p>
          <h2>Signs that need prompt professional help</h2>
          <p>Call a poultry veterinarian, state veterinarian, or animal-health official when illness is sudden, severe, or affects multiple birds.</p>
        </div>
        <ul>{urgentSigns.map((sign) => <li key={sign}>{sign}</li>)}</ul>
        <p className="urgent-contact">In the United States, report sick or dying birds to USDA APHIS at <a href="tel:+18665367593">1-866-536-7593</a>.</p>
      </section>

      <section className="reference-section" id="chicken">
        <span id="daily" className="anchor-target" aria-hidden="true" />
        <div className="reference-intro">
          <p className="reference-eyebrow">Five-minute routine</p>
          <h2>Know what normal looks like</h2>
          <p>Check at roughly the same times each day. Count every animal, watch posture and movement, listen to breathing, inspect droppings and housing, and record meaningful changes.</p>
        </div>
        <div className="reference-grid four">
          {[
            ["Look", "Posture, gait, eyes, comb color, isolation, injuries, and droppings."],
            ["Listen", "Sneezing, coughing, wheezing, distress calls, or unusual silence."],
            ["Measure", "Feed, water, eggs, temperature, humidity, and unusual events."],
            ["Inspect", "Water flow, feed condition, litter, ventilation, locks, fencing, and pests."],
          ].map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="reference-photo-band" id="environment">
        <figure>
          <img src="/assets/images/health/hen-drinking.jpg" alt="A hen drinking clean water" loading="lazy" />
          <figcaption>Water access and consumption are useful daily checks.</figcaption>
        </figure>
        <div>
          <p className="reference-eyebrow">Housing and resources</p>
          <h2>Read conditions in context</h2>
          <p>There is no single safe temperature or humidity number for every animal. Species, breed, age, acclimation, airflow, sunlight, stocking density, and humidity all change risk.</p>
          <dl>
            <div><dt>Water</dt><dd>Keep it clean, cool in hot weather, unfrozen in cold weather, and accessible without competition.</dd></div>
            <div><dt>Feed</dt><dd>Use a complete ration for the species and life stage. Store it dry and protected from rodents and wild birds.</dd></div>
            <div><dt>Air</dt><dd>Ventilate without a direct draft at roost height. Investigate odor, condensation, dust, or wet litter.</dd></div>
            <div><dt>Trend</dt><dd>Compare with this flock's baseline. Sustained changes matter more than a generic percentage.</dd></div>
          </dl>
        </div>
      </section>

      <section className="reference-section" id="concerns">
        <div className="reference-intro"><p className="reference-eyebrow">Observe, separate, call</p><h2>Common concerns and the next safe step</h2></div>
        <div className="reference-grid three">
          {concerns.map(([title, signs, action]) => (
            <article key={title}><h3>{title}</h3><p><strong>Watch for:</strong> {signs}</p><p><strong>Next step:</strong> {action}</p></article>
          ))}
        </div>
      </section>

      <section className="reference-split" id="biosecurity">
        <div><p className="reference-eyebrow">Prevent spread</p><h2>Biosecurity is daily care</h2><ul>
          <li>Quarantine new or returning animals away from residents.</li>
          <li>Use dedicated footwear and tools; clean hands before and after contact.</li>
          <li>Keep feed and water protected from wild birds, rodents, and runoff.</li>
          <li>Limit visitors and clean shared equipment between groups.</li>
        </ul></div>
        <div id="predators"><p className="reference-eyebrow">Layered protection</p><h2>Predator prevention</h2><ul>
          <li>Use 1/2-inch hardware cloth on openings and animal-resistant latches.</li>
          <li>Secure edges against digging and cover vulnerable runs.</li>
          <li>Use cameras as an additional warning layer, never as the physical barrier.</li>
        </ul></div>
      </section>

      <section className="sensor-panel" id="technology">
        <p className="reference-eyebrow">TenderCells monitoring</p>
        <h2>What sensors can and cannot do</h2>
        <p>Temperature, humidity, air-quality, feed, water, egg, camera, and headcount data can reveal a change worth checking. They cannot diagnose disease or prove an animal is healthy.</p>
        <div><span>Measure</span><span>Compare with baseline</span><span>Inspect the animal</span><span>Escalate to a professional</span></div>
      </section>

      <section className="library-links" id="species" data-testid="health-library-links">
        <h2>Health by species</h2>
        {ANIMALS.map((a) => <Link key={a.id} to={`/library/animals/${a.id}`}>{a.emoji} {a.name}</Link>)}
        <Link to="/library#wildlife">Predators &amp; pests</Link>
        <Link to="/library#toxic">Plants toxic to animals</Link>
      </section>

      <section className="library-links">
        <h2>Explore animal-care systems</h2>
        <Link to="/shop/chicken-tender">Chicken Tender</Link>
        <Link to="/shop/duck-dock">Duck Dock</Link>
        <Link to="/shop/bunny-burrow">Bunny Burrow</Link>
        <Link to="/shop/goat-guardian">Goat Guardian</Link>
        <Link to="/shop/turkey-tower">Turkey Tower</Link>
        <Link to="/shop/pigeon-palace">Pigeon Palace</Link>
      </section>

      <section className="source-list">
        <h2>Trusted next stops</h2>
        <a href="https://www.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock/how-to-spot-sickness" target="_blank" rel="noopener noreferrer">USDA: How to spot sickness</a>
        <a href="https://www.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock/resources/how-protect-your-flock-avian-influenza" target="_blank" rel="noopener noreferrer">USDA: Protect your flock</a>
        <a href="https://extension.umn.edu/agriculture/animals-and-livestock/poultry/preventing-heat-stress-in-poultry" target="_blank" rel="noopener noreferrer">University of Minnesota: Heat stress</a>
        <p>This page is educational and is not a diagnosis or treatment plan. Local reporting rules apply.</p>
      </section>

      <footer className="photo-credits">Photography: <a href="https://commons.wikimedia.org/wiki/File:Free_range_chicken_flock.jpg" target="_blank" rel="noopener noreferrer">woodley wonderworks, CC BY 2.0</a>; <a href="https://commons.wikimedia.org/wiki/File:Hen_drinking.jpg" target="_blank" rel="noopener noreferrer">ILABORI CHIN MICHAEL, CC0</a>.</footer>
    </PageLayout>
  );
}

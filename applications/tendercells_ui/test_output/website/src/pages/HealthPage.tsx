import PageLayout from "../components/PageLayout";

export default function HealthPage() {
  return (
    <PageLayout>
      <div className="page-hero red">
        <h1>Animal Health</h1>
        <p>Evidence-based guides for keeping your flock healthy — powered by live sensor data.</p>
      </div>

      <div className="prose">
        <p>
          Tender Cells monitors the environmental conditions most predictive of flock health.
          This guide explains what the numbers mean and when to act.
        </p>
      </div>

      <h2 className="section-title" id="chicken">Chicken Health Guide</h2>
      <table className="info-table">
        <thead>
          <tr><th>Indicator</th><th>Normal Range</th><th>Warning</th><th>Critical</th></tr>
        </thead>
        <tbody>
          {[
            ["Temperature", "45–80°F", "35–44°F or 81–85°F", "<35°F or >85°F"],
            ["Humidity", "40–70%", "30–39% or 71–80%", "<30% or >80%"],
            ["Ammonia (NH₃)", "<5 ppm", "5–10 ppm", ">25 ppm"],
            ["Daily Egg Count", "Breed avg ±10%", "Drop >15% (3 days)", "Drop >30%"],
            ["Feed Consumption", "Breed avg ±15%", "Drop >20%", "Drop >35%"],
          ].map(([i, n, w, c]) => (
            <tr key={i}><td><strong>{i}</strong></td><td style={{ color: "#2a7a2a" }}>{n}</td>
              <td style={{ color: "#e07b00" }}>{w}</td><td style={{ color: "#cc3333" }}>{c}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title">Common Health Conditions</h2>
      <div className="card-grid">
        {[
          { title: "Heat Stress", tag: "Temp >85°F", desc: "Symptoms: panting, wings held away from body, reduced egg production, lethargy. Action: increase ventilation, provide cool water, add shade. Mortality risk above 95°F." },
          { title: "Cold Stress", tag: "Temp <35°F", desc: "Symptoms: huddling, reduced activity, frostbite on combs/wattles. Action: add supplemental heat (heat lamp on relay), increase bedding depth. Ensure water doesn't freeze." },
          { title: "Ammonia Toxicity", tag: "NH₃ >10 ppm", desc: "Symptoms: eye irritation, respiratory issues, reduced feed intake. Chronic exposure increases susceptibility to respiratory disease. Action: improve ventilation, clean litter more frequently." },
          { title: "Respiratory Illness", tag: "Multiple signals", desc: "Often correlated with high ammonia + high humidity. Symptoms: nasal discharge, coughing, sneezing. Action: isolate affected birds, consult vet, review ventilation." },
          { title: "Egg Binding", tag: "Missing egg + behavior", desc: "A hen unable to pass an egg. Sensor alert: hen in nest box >4 hours. Action: check the hen manually, warm bath, calcium supplement, vet if unresolved in 24 hours." },
          { title: "Mites & Lice", tag: "Night behavior change", desc: "Chickens reluctant to roost, increased grooming. Arm camera can detect unusual behavior patterns. Action: inspect roosts, treat with diatomaceous earth or approved miticide." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p style={{ fontSize: "0.78rem", color: "#cc3333", fontWeight: 600, margin: "0 0 0.4rem" }}>{c.tag}</p>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="predators">Predator Prevention</h2>
      <div className="prose">
        <p>
          Predators kill an estimated 25% of backyard flocks annually. Tender Cells provides
          a layered defense:
        </p>
        <ul>
          <li><strong>WatchTower AI:</strong> 3-camera 360° AI detection. Classifies predators (raccoon, fox, hawk, dog) vs false positives (cats, squirrels). Alert with photo to your phone.</li>
          <li><strong>Automatic door:</strong> Door closes at dusk and when headcount confirms all birds inside. Cannot be manually opened after E-STOP from predator alert.</li>
          <li><strong>LoRa mesh:</strong> WatchTower alerts broadcast to all Tender Cells devices on your property within 500m. Roaming Roost auto-returns to dock on alert.</li>
          <li><strong>Hardware barrier:</strong> 1/2" hardware cloth, buried apron, solid floor — mechanical deterrents remain the first line of defense.</li>
        </ul>
      </div>
      <div className="card-grid">
        {[
          { animal: "🦝 Raccoon", method: "Locks doors with dexterous paws. Nocturnal. WatchTower AI detects and alerts. Ensure door latches require two motions to open." },
          { animal: "🦊 Fox", method: "Digs under enclosures. Attacks at dawn/dusk. Buried apron + motion alert combination. Roaming Roost boundary fence triggers if approached." },
          { animal: "🦅 Hawk/Owl", method: "Aerial attack. Cover top of run with hardware cloth or overhead netting. WatchTower AI includes sky-view camera for aerial threat detection." },
          { animal: "🐍 Snake", method: "Eats eggs and chicks. 1/2\" hardware cloth on all gaps. Egg collection automation removes the attractant (eggs) quickly each morning." },
        ].map((c) => (
          <div key={c.animal} className="card">
            <h3>{c.animal}</h3>
            <p>{c.method}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="nutrition">Nutrition &amp; Feed</h2>
      <div className="prose">
        <p>
          The Tender Cells feed dispenser tracks daily consumption per flock. Here are the baseline
          targets the app uses to calibrate alerts:
        </p>
        <ul>
          <li><strong>Laying hens:</strong> 100–130g feed/day per bird</li>
          <li><strong>Broilers:</strong> 150–200g/day per bird</li>
          <li><strong>Chicks (0–8 weeks):</strong> 30–80g/day, gradually increasing</li>
          <li><strong>Water:</strong> 2× feed volume (~200–260mL/day per hen)</li>
        </ul>
        <p>
          The load cell weight system alerts when daily consumption drops &gt;20% from rolling 7-day average —
          often the first indicator of illness, feed quality issues, or social disruption in the flock.
        </p>
      </div>

      <h2 className="section-title" id="disease">Disease Monitoring</h2>
      <div className="prose">
        <p>
          TenderAI analyzes sensor trends to flag patterns associated with common flock diseases.
          It doesn't replace a veterinarian — it tells you when to call one sooner.
        </p>
        <ul>
          <li>3+ days declining egg production + elevated ammonia → possible respiratory illness</li>
          <li>Feed drop + temp normal → possible intestinal issue or parasite load</li>
          <li>Single nest box unused for 5+ days → possible mite infestation in that box</li>
          <li>Headcount short at dusk 2 nights running → predator access or escape point</li>
        </ul>
      </div>

      <h2 className="section-title" id="vet-connect">Vet Connect</h2>
      <div className="prose">
        <p>
          The app can generate a health export — a PDF summary of sensor history, consumption trends,
          and behavioral observations — to share with a poultry veterinarian.
          This gives your vet context that would normally require days of observation.
        </p>
        <p>
          Finding a poultry vet: <a href="https://www.avma.org/resources-tools/avma-policies/avma-guidelines-euthanasia-animals" target="_blank" rel="noopener noreferrer">AVMA</a> member search,
          your state extension service, or local farm supply stores often have referral lists.
        </p>
      </div>
    </PageLayout>
  );
}

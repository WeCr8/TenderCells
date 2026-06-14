import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

export default function ServicesPage() {
  return (
    <PageLayout>
      <PageHero
        variant="orange"
        title="Local Services"
        subtitle="The planned installer, supplier, and technician network — what support will look like once hardware ships."
        image="/assets/images/products/predator-monitor-pole-mount.png"
        imageAlt="Pole-mounted WatchTower AI predator monitor concept"
      />

      <div className="prose">
        <p>
          TenderCells is concept-stage and not yet shipping hardware, so the services below
          describe the planned support model, not programs you can buy today. They are
          designed for self-installation first, with an optional installer and technician
          network to follow once kits are available.
        </p>
      </div>

      <h2 className="section-title" id="installer">Find an Installer</h2>
      <div style={{ background: "#f0f7ff", border: "1px solid #b3d4f5", borderRadius: "8px", padding: "2rem", marginBottom: "2rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", color: "#1a5276" }}>Installer Locator Coming Soon</h3>
        <p style={{ margin: "0 0 1rem", color: "#333" }}>
          We're building our certified installer network. In the meantime, email us and we'll
          connect you with the nearest available installer in your area.
        </p>
        <a href="mailto:install@wecr8.info" className="btn-primary">Request Installer Match</a>
      </div>

      <h2 className="section-title">Installer Certification Program</h2>
      <div className="prose">
        <p>
          Become a Tender Cells Certified Installer. Training covers:
        </p>
        <ul>
          <li>Hardware assembly and placement best practices</li>
          <li>Network configuration (MQTT, WiFi, Firebase)</li>
          <li>Customer onboarding and app setup</li>
          <li>Troubleshooting and diagnostic codes</li>
          <li>Safety protocols for robot arm systems</li>
        </ul>
        <p>
          The planned program would include access to an installer portal and a listing in the
          installer directory. It is not open yet — TenderCells is concept-stage and not shipping
          hardware.
        </p>
      </div>
      <div className="cta-bar" style={{ marginBottom: "2rem" }}>
        <a href="mailto:partners@wecr8.info" className="btn-primary">Apply for Certification</a>
      </div>

      <h2 className="section-title" id="feed-suppliers">Local Feed Suppliers</h2>
      <div className="prose">
        <p>
          The Tender Cells app tracks feed consumption and can alert when supply is low.
          Here's how to integrate with your local supplier:
        </p>
        <ul>
          <li><strong>Manual reorder:</strong> App alert → you call or drive to your local farm store</li>
          <li><strong>Webhook automation:</strong> Configure a webhook to trigger an email or text to your supplier when feed drops below threshold</li>
          <li><strong>API integration (planned):</strong> A direct reorder integration with farm-supply retailers and independent co-ops is on the roadmap</li>
        </ul>
      </div>

      <h2 className="section-title" id="technicians">Certified Technicians</h2>
      <div className="card-grid">
        {[
          { title: "Remote Support (planned)", desc: "A support flow where the team can review device telemetry with your permission and walk through issues over video call." },
          { title: "On-Site Service (planned)", desc: "An optional certified-technician visit for setup, firmware customization, or repairs, once an installer network exists." },
          { title: "Warranty & Parts (planned)", desc: "A planned replacement-parts and warranty program so a failed sensor or actuator can be sourced quickly — exact terms TBD." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="events">Community Events (planned)</h2>
      <div className="prose">
        <p>
          As the community grows, we want to support events like these. None are scheduled yet —
          follow GitHub Discussions for updates.
        </p>
      </div>
      <div className="card-grid">
        {[
          { title: "Homestead Meetups", desc: "Informal gatherings to share tips, see builds, and meet the WeCr8 team." },
          { title: "Build & Demo Tours", desc: "Open-house looks at TenderCells prototypes — see the motion system, ask questions." },
          { title: "Maker Days", desc: "Workshops to design end effectors, modify firmware, and contribute to open hardware." },
          { title: "Ag Fair Presence", desc: "Demoing TenderCells at agricultural fairs and talking with engineers and educators." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

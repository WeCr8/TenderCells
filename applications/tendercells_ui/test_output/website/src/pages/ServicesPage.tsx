import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";

export default function ServicesPage() {
  return (
    <PageLayout>
      <PageHero
        variant="orange"
        title="Local Services"
        subtitle="Find certified installers, feed suppliers, and technicians near you."
        image="/assets/images/products/predator-monitor-pole-mount.png"
        imageAlt="Pole-mounted WatchTower AI predator monitor concept"
      />

      <div className="prose">
        <p>
          Tender Cells is designed for self-installation, but we know not everyone wants to
          do it alone. Our network of certified installers and technicians can help with
          setup, customization, and ongoing maintenance.
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
          Certification includes access to the installer portal, discounted hardware, and
          listing in the installer directory (coming Q3 2026).
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
          <li><strong>API integration (coming):</strong> Direct ordering integration with Tractor Supply Co., Farm &amp; Fleet, and independent co-ops</li>
        </ul>
      </div>

      <h2 className="section-title" id="technicians">Certified Technicians</h2>
      <div className="card-grid">
        {[
          { title: "Remote Support", desc: "Our support team can view your device telemetry (with your permission) and walk you through any issue via video call. Included free for 30 days after purchase." },
          { title: "On-Site Service", desc: "Certified technicians can come to your property for annual maintenance, firmware customization, or hardware repairs. Available in select states — expanding 2026." },
          { title: "Extended Warranty", desc: "TenderCare subscribers get access to the extended warranty program — replacement parts shipped same day for any component failure after year 1." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title" id="events">Community Events</h2>
      <div className="card-grid">
        {[
          { title: "Homestead Meetups", date: "Monthly", desc: "Informal gatherings of Tender Cells users to share tips, see installations, and meet WeCr8 team members. Check GitHub Discussions for your state." },
          { title: "Farm Tours", date: "Quarterly", desc: "We host open-house tours of working Tender Cells installations. See the robot arm in action, ask questions, meet the flock." },
          { title: "Maker Days", date: "Annual", desc: "Full-day workshop — build your own end effector, learn to modify firmware, contribute to open-source hardware designs." },
          { title: "State Fair Presence", date: "Summer", desc: "Find us at agricultural state fairs. Live demo of Chicken Tender, talk to engineers, get beta access to new features." },
        ].map((c) => (
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p style={{ fontSize: "0.78rem", color: "#4a90d9", fontWeight: 600, marginBottom: "0.3rem" }}>{c.date}</p>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

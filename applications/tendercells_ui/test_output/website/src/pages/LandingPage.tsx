import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./LandingPage.css";
import { trackPageView, trackButtonClick } from "../utils/analytics";
import { TENDERCELLS_DEMO_URL } from "../config/appLinks";

export default function LandingPage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDismissed, setNewsletterDismissed] = useState(false);

  useEffect(() => {
    trackPageView("/");
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick("newsletter-subscribe");
    setNewsletterEmail("");
    setNewsletterDismissed(true);
  };

  return (
    <>
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────── */}
        <section className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Tender Cells</h1>
            <p>Bring Smart Farming to the Homestead</p>
            <div className="hero-buttons">
              <a
                href={TENDERCELLS_DEMO_URL}
                className="btn-order"
                onClick={() => trackButtonClick("try-live-demo")}
              >
                ▶ TRY THE LIVE DEMO — NO SIGNUP
              </a>
              <button
                type="button"
                className="btn-watch"
                onClick={() => trackButtonClick("watch-video")}
              >
                ▶ WATCH THE VIDEO
              </button>
              <button
                type="button"
                className="btn-order"
                onClick={() => trackButtonClick("order-now")}
              >
                ORDER NOW
              </button>
            </div>
          </div>
        </section>

        {/* ── Products ─────────────────────────────── */}
        <section id="products" className="products">
          <div className="section-inner">
            <h2>Our Products</h2>
            <div className="product-grid">
              {[
                { name: "Chicken Tender™",  desc: "Fully automated backyard coop with ceiling-mounted 6DOF robot arm, egg collection, and real-time monitoring." },
                { name: "WatchTower AI™",   desc: "Solar-powered 360° predator detection with LoRa mesh networking and three-camera dome." },
                { name: "Roaming Roost™",   desc: "Mobile geodesic dome on mecanum wheels — brings the coop to fresh pasture automatically." },
                { name: "Duck Dock™",       desc: "Automated waterfowl platform with integrated pond management and smart feeding." },
                { name: "Bunny Burrow™",    desc: "Rabbit automation system with temperature control and automated feeding schedules." },
                { name: "Goat Guardian™",   desc: "Large enclosure automation with enhanced security and full health monitoring." },
              ].map((p) => (
                <div className="product-card" key={p.name}>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────── */}
        <section id="about" className="about">
          <div className="section-inner">
            <h2>About Tender Cells</h2>
            <p>
              We're building the future of automated animal care. Our platform combines
              robotics, AI vision, and cloud intelligence to keep your animals healthy
              and safe — so you spend time enjoying your homestead, not maintaining it.
            </p>
          </div>
        </section>

        {/* ── Animal Health ─────────────────────────── */}
        <section id="animal-health" className="animal-health">
          <div className="section-inner">
            <h2>Animal Health Monitoring</h2>
            <p>
              Real-time sensor data: temperature, humidity, ammonia levels, feed and water
              status, and automated headcounts — all surfaced in one dashboard. Get alerted
              before problems become emergencies.
            </p>
          </div>
        </section>

        {/* ── Open Source ──────────────────────────── */}
        <section id="open-source" className="open-source">
          <div className="section-inner">
            <h2>Open Source</h2>
            <p>
              The whole platform — firmware, mobile app, and dashboard — is open
              source under Apache&nbsp;2.0. Build your own integrations, add a new
              animal product family, contribute improvements, or audit the code
              running your coop. Students, clubs, and first-time builders welcome —
              explore it in your browser with no hardware, then pick a good first issue.
            </p>
            <a
              href="https://github.com/WeCr8/TenderCells"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick("view-on-github")}
            >
              View on GitHub
            </a>
            <a
              href="https://github.com/WeCr8/TenderCells/issues?q=is%3Aopen+label%3A%22good+first+issue%22"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick("good-first-issues")}
            >
              Good First Issues
            </a>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────── */}
        <section id="contact" className="contact">
          <div className="section-inner">
            <h2>Contact</h2>
            <p>Email: <a href="mailto:hello@wecr8.info">hello@wecr8.info</a></p>
            <p>Web: <a href="https://wecr8.info" target="_blank" rel="noopener noreferrer">wecr8.info</a></p>
          </div>
        </section>
      </main>

      {/* ── Newsletter popup ─────────────────────── */}
      {!newsletterDismissed && (
        <div className="newsletter-popup" role="dialog" aria-label="Newsletter signup">
          <button
            type="button"
            className="newsletter-close"
            onClick={() => setNewsletterDismissed(true)}
            aria-label="Close"
          >
            ✕
          </button>
          <p className="newsletter-title">Want to learn more about Tender Cells?</p>
          <p className="newsletter-sub">Subscribe to our email newsletter to get occasional updates and promos!</p>
          <form onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </div>
      )}
      <Footer />
    </>
  );
}

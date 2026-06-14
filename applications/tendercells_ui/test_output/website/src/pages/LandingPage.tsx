import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./LandingPage.css";
import { trackPageView, trackButtonClick, trackProductInterest } from "../utils/analytics";
import { TENDERCELLS_DEMO_URL } from "../config/appLinks";

const PRODUCTS = [
  {
    name: "Chicken Tender",
    href: "/shop/chicken-tender",
    image: "/assets/images/products/chicken-tender-concept.png",
    desc: "Fully automated backyard coop with rail service, egg workflows, sensors, cameras, and real-time monitoring.",
  },
  {
    name: "WatchTower AI",
    href: "/shop/watchtower",
    image: "/assets/images/products/predator-monitor-pole-mount.png",
    desc: "Solar-powered predator monitor concept with camera coverage, local detection, alerts, and farm safety workflows.",
  },
  {
    name: "Roaming Roost",
    href: "/shop/roaming-roost",
    image: "/assets/images/products/roaming-roost-concept.png",
    desc: "Mobile pasture coop concept for automated rotation, docking, GPS boundaries, and predator-response learning.",
  },
  {
    name: "Duck Dock",
    href: "/shop/duck-dock",
    image: "/assets/images/products/chicken-tender-concept.png",
    desc: "Automated waterfowl platform concept with water monitoring, feeding routines, and weather-aware care.",
  },
  {
    name: "Bunny Burrow",
    href: "/shop/bunny-burrow",
    image: "/assets/images/products/roaming-roost-concept.png",
    desc: "Rabbit housing automation concept with climate sensing, feeding schedules, and safe daily care records.",
  },
  {
    name: "Goat Guardian",
    href: "/shop/goat-guardian",
    image: "/assets/images/products/predator-monitor-top-view.png",
    desc: "Large enclosure monitoring concept for pasture safety, gates, water, feed, and health signal capture.",
  },
];

const HERO_IMAGES = [
  {
    src: "/assets/images/products/chicken-tender-concept.png",
    alt: "Chicken Tender smart coop concept with automated animal-care hardware",
  },
  {
    src: "/assets/images/products/predator-monitor-pole-mount.png",
    alt: "WatchTower AI pole-mounted predator monitor concept",
  },
  {
    src: "/assets/images/products/roaming-roost-concept.png",
    alt: "Roaming Roost mobile pasture coop concept",
  },
];

export default function LandingPage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDismissed, setNewsletterDismissed] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    trackPageView("/");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 6500);
    return () => window.clearInterval(timer);
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
          <img
            className="hero-image"
            src={HERO_IMAGES[heroIndex].src}
            alt={HERO_IMAGES[heroIndex].alt}
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Tender Cells</h1>
            <p>Open-source animal-care automation for homesteads, 4-H, FFA, makers, and young engineers.</p>
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
                onClick={() => trackProductInterest("TenderCells", "homepage", "homepage-hero")}
              >
                I'M INTERESTED
              </button>
            </div>
          </div>
        </section>

        {/* ── Products ─────────────────────────────── */}
        <section id="products" className="products">
          <div className="section-inner">
            <h2>Our Products</h2>
            <div className="product-grid">
              {PRODUCTS.map((p) => (
                <a
                  className="product-card"
                  href={p.href}
                  key={p.name}
                  onClick={() => trackProductInterest(p.name, p.href.replace("/shop/", ""), "homepage-product-card")}
                >
                  <img src={p.image} alt={`${p.name} concept image`} loading="lazy" />
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                </a>
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

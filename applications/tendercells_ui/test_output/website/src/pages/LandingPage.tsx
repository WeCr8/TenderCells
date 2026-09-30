import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [videoOpen, setVideoOpen] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    trackPageView("/");
  }, []);

  // Mobile autoplay fix: React's `muted` JSX prop doesn't reliably set the HTML
  // attribute, and iOS Safari refuses autoplay without a real muted attribute +
  // playsinline. Force them via the ref, then attempt play (ignore rejection —
  // iOS Low Power Mode blocks autoplay; the tap-to-play handler covers that).
  useEffect(() => {
    const v = heroVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
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
          {/* Demo video as the hero — WebGL/Three.js, in the browser. Muted autoplay
              loop with a poster fallback; "Watch the video" unmutes + restarts. */}
          <video
            ref={heroVideoRef}
            className="hero-image"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_IMAGES[heroIndex].src}
            onClick={() => setVideoOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <source src="/assets/videos/tendercells-threejs-demo.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Tender Cells</h1>
            <p className="hero-tagline">Your farm. Its digital twin. One open operating system.</p>
            <p>Tender Cells OS connects animals, habitats, sensors, cameras, robots and automation into a digital picture of your property. Start in simulation, connect real hardware when you're ready.</p>
            <div className="hero-buttons">
              <a
                href={TENDERCELLS_DEMO_URL}
                className="btn-order"
                onClick={() => trackButtonClick("try-live-demo")}
              >
                ▶ TRY THE DIGITAL FARM — NO SIGNUP
              </a>
              <Link
                to="/digital-twin"
                className="btn-watch"
                onClick={() => trackButtonClick("see-how-it-works")}
              >
                SEE HOW IT WORKS
              </Link>
              <button
                type="button"
                className="btn-watch"
                onClick={() => {
                  trackButtonClick("watch-video");
                  setVideoOpen(true);
                }}
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

        {/* ── Demo video popup player (portal → document.body = true top layer) ── */}
        {videoOpen && createPortal(
          <div
            className="video-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="TenderCells demo video"
            onClick={() => setVideoOpen(false)}
          >
            <div className="video-modal-inner" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="video-modal-close"
                aria-label="Close video"
                onClick={() => setVideoOpen(false)}
              >
                ✕
              </button>
              <video
                className="video-modal-player"
                src="/assets/videos/tendercells-threejs-demo.mp4"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>,
          document.body,
        )}

        {/* ── Digital twin: the OS before the products ── */}
        <section id="digital-twin" className="twin-intro">
          <div className="section-inner">
            <h2>See your whole property in one place</h2>
            <p className="twin-lede">
              Every coop, animal, camera, water point, gate, sensor and robot gets a place on one digital
              property. Kept up to date by real devices, that picture is your farm's <strong>digital twin</strong> -
              and Tender Cells OS is the open system that runs it.
            </p>
            <div className="twin-steps">
              <Link to="/digital-twin#honest" className="twin-step">
                <span className="twin-num">1</span>
                <h3>Start without hardware</h3>
                <p>Build your property digitally and trigger events in the free simulated farm.</p>
              </Link>
              <Link to="/os#build" className="twin-step">
                <span className="twin-num">2</span>
                <h3>Connect the physical farm</h3>
                <p>ESP32 boards, sensors, cameras and motors join over MQTT on your own network.</p>
              </Link>
              <Link to="/digital-twin#what" className="twin-step">
                <span className="twin-num">3</span>
                <h3>One farm, many twins</h3>
                <p>Property, animals, habitats, devices, robots and environment - each with identity, state and history.</p>
              </Link>
            </div>
            <p className="twin-links">
              <Link to="/digital-twin">What a farm digital twin is →</Link>
              <Link to="/os">Explore Tender Cells OS →</Link>
            </p>
          </div>
        </section>

        {/* ── Products ─────────────────────────────── */}
        <section id="products" className="products">
          <div className="section-inner">
            <h2>Connected systems</h2>
            <p className="products-sub">Each product family is a node inside Tender Cells OS. None is sold yet - every page shows its honest status, and you can run each one in the simulation or build your own from the open docs.</p>
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
              Tender Cells is an open-source animal-care and agricultural automation ecosystem for
              connecting sensors, cameras, robotics, automation and educational projects - with a
              person confirming every action and E-STOP always within reach.
            </p>
          </div>
        </section>

        {/* ── Animal Health ─────────────────────────── */}
        <section id="animal-health" className="animal-health">
          <div className="section-inner">
            <h2>Animal Health Monitoring</h2>
            <p>
              Temperature, humidity, ammonia, feed and water levels, and headcounts - shown on the
              animals' habitat twin and turned into alerts before small problems grow. Try it with
              simulated readings in the demo today; connected sensors make the readings real.
              Tender Cells surfaces observations - it does not diagnose illness.
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
          <span id="newsletter" aria-hidden="true" />
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

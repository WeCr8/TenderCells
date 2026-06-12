import { useEffect, useState } from "react";
import Header from "../components/Header";
import "./LandingPage.css";
import { trackPageView, trackButtonClick } from "../utils/analytics";

export default function LandingPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    trackPageView("/");
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick("newsletter-subscribe");
    // TODO: Subscribe user to newsletter
    setEmail("");
  };

  return (
    <>
      <Header />
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Tender Cells</h1>
            <p>Bring Smart Farming to the Homestead</p>
            <div className="hero-buttons">
              <button
                type="button"
                className="cta-button"
                onClick={() => trackButtonClick("watch-video")}
              >
                ▶ WATCH THE VIDEO
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => trackButtonClick("order-now")}
              >
                ORDER NOW
              </button>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="products">
          <h2>Our Products</h2>
          <div className="product-grid">
            <div className="product-card" id="chicken-tender">
              <h3>Chicken Tender™</h3>
              <p>Fully automated backyard coop system with 6DOF robot arm, intelligent feeding, and 24/7 monitoring</p>
            </div>
            <div className="product-card" id="roaming-roost">
              <h3>Roaming Roost™</h3>
              <p>Mobile geodesic dome on mecanum wheels for dynamic animal care and pasture rotation</p>
            </div>
            <div className="product-card" id="watchtower">
              <h3>WatchTower AI™</h3>
              <p>Solar-powered 360° predator detection system with LoRa mesh networking and AI vision</p>
            </div>
            <div className="product-card" id="duck-dock">
              <h3>Duck Dock™</h3>
              <p>Automated waterfowl platform with pond management and smart feeding systems</p>
            </div>
            <div className="product-card" id="bunny-burrow">
              <h3>Bunny Burrow™</h3>
              <p>Rabbit automation system with temperature control and automated feeding</p>
            </div>
            <div className="product-card" id="goat-guardian">
              <h3>Goat Guardian™</h3>
              <p>Large enclosure automation for goats with enhanced security and health monitoring</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about">
          <h2>About Tender Cells</h2>
          <p>
            We're building the future of automated animal care. Our platform combines robotics, artificial intelligence, and cloud intelligence to keep your animals healthy, safe, and thriving. From backyard hobbyists to small farms, Tender Cells automates the daily tasks that consume hours of your time, so you can focus on what matters most.
          </p>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter">
          <h2>Want to learn more about Tender Cells?</h2>
          <p>Subscribe to our email newsletter to get occasional updates and promos!</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact">
          <h2>Get In Touch</h2>
          <p>Email: <a href="mailto:hello@wecr8.info">hello@wecr8.info</a></p>
          <p>Visit us: <a href="https://wecr8.info" target="_blank" rel="noopener noreferrer">wecr8.info</a></p>
        </section>
      </main>
    </>
  );
}

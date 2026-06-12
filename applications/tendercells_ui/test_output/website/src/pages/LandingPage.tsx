import Header from "../components/Header";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="landing-main">
        <section className="hero">
          <div className="hero-content">
            <h1>Tender Cells</h1>
            <p>AI-Powered Automated Animal Care</p>
            <button type="button" className="cta-button">Get Started</button>
          </div>
        </section>

        <section id="products" className="products">
          <h2>Our Products</h2>
          <div className="product-grid">
            <div className="product-card">
              <h3>Chicken Tender™</h3>
              <p>Fully automated backyard coop with 6DOF robot arm</p>
            </div>
            <div className="product-card">
              <h3>WatchTower AI™</h3>
              <p>Solar-powered predator detection system</p>
            </div>
            <div className="product-card">
              <h3>Roaming Roost™</h3>
              <p>Mobile geodesic dome on mecanum wheels</p>
            </div>
          </div>
        </section>

        <section id="about" className="about">
          <h2>About Tender Cells</h2>
          <p>We're building the future of automated animal care. Our platform combines robotics, AI vision, and cloud intelligence to keep your animals healthy and safe.</p>
        </section>

        <section id="contact" className="contact">
          <h2>Contact</h2>
          <p>Email: hello@wecr8.info</p>
        </section>
      </main>
    </>
  );
}

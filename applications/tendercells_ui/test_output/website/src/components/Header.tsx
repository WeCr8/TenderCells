import { Link } from "react-router-dom";
import { useState } from "react";
import "./Header.css";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
      <div className="promo-banner">
        🍗 Order Chicken Tender v1.0.0 today - Free shipping worldwide!
      </div>
      <header>
        <nav className="navbar">
          <div className="navbar-container">
            <div className="logo-section">
              <Link to="/" className="logo" onClick={closeMenus}>
                <span className="logo-icon">🌱</span>
                Tender Cells
              </Link>
            </div>

            <button
              type="button"
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <div className={`nav-menu ${mobileMenuOpen ? "open" : ""}`}>
              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item dropdown-toggle ${openDropdown === "shop" ? "active" : ""}`}
                  onClick={() => toggleDropdown("shop")}
                >
                  Shop ▼
                </button>
                <div className={`dropdown-menu ${openDropdown === "shop" ? "show" : ""}`}>
                  <a href="#chicken-tender" onClick={closeMenus}>Chicken Tender™</a>
                  <a href="#roaming-roost" onClick={closeMenus}>Roaming Roost™</a>
                  <a href="#duck-dock" onClick={closeMenus}>Duck Dock™</a>
                  <a href="#bunny-burrow" onClick={closeMenus}>Bunny Burrow™</a>
                  <a href="#goat-guardian" onClick={closeMenus}>Goat Guardian™</a>
                  <a href="#accessories" onClick={closeMenus}>Accessories</a>
                </div>
              </div>

              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item dropdown-toggle ${openDropdown === "education" ? "active" : ""}`}
                  onClick={() => toggleDropdown("education")}
                >
                  Tender Cells in Education ▼
                </button>
                <div className={`dropdown-menu ${openDropdown === "education" ? "show" : ""}`}>
                  <a href="#stem-learning" onClick={closeMenus}>STEM Learning</a>
                  <a href="#school-programs" onClick={closeMenus}>School Programs</a>
                  <a href="#curriculum" onClick={closeMenus}>Curriculum Guide</a>
                </div>
              </div>

              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item dropdown-toggle ${openDropdown === "apps" ? "active" : ""}`}
                  onClick={() => toggleDropdown("apps")}
                >
                  Applications ▼
                </button>
                <div className={`dropdown-menu ${openDropdown === "apps" ? "show" : ""}`}>
                  <a href="#mobile-app" onClick={closeMenus}>Mobile App</a>
                  <a href="#dashboard" onClick={closeMenus}>Web Dashboard</a>
                  <a href="#api" onClick={closeMenus}>Developer API</a>
                </div>
              </div>

              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item dropdown-toggle ${openDropdown === "learn" ? "active" : ""}`}
                  onClick={() => toggleDropdown("learn")}
                >
                  Learn More ▼
                </button>
                <div className={`dropdown-menu ${openDropdown === "learn" ? "show" : ""}`}>
                  <a href="#getting-started" onClick={closeMenus}>Getting Started</a>
                  <a href="#documentation" onClick={closeMenus}>Documentation</a>
                  <a href="#faq" onClick={closeMenus}>FAQ</a>
                  <a href="#blog" onClick={closeMenus}>Blog</a>
                </div>
              </div>

              <a href="#animal-health" className="nav-item" onClick={closeMenus}>Animal Health</a>
              <a href="#local-services" className="nav-item" onClick={closeMenus}>Local Services</a>
              <a href="#store" className="nav-item" onClick={closeMenus}>Store</a>
              <a href="#open-source" className="nav-item" onClick={closeMenus}>Open Source</a>
              <a href="#blog" className="nav-item" onClick={closeMenus}>Blog</a>

              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item dropdown-toggle ${openDropdown === "follow" ? "active" : ""}`}
                  onClick={() => toggleDropdown("follow")}
                >
                  Follow ▼
                </button>
                <div className={`dropdown-menu ${openDropdown === "follow" ? "show" : ""}`}>
                  <a href="https://twitter.com" onClick={closeMenus}>Twitter</a>
                  <a href="https://instagram.com" onClick={closeMenus}>Instagram</a>
                  <a href="https://github.com" onClick={closeMenus}>GitHub</a>
                  <a href="https://youtube.com" onClick={closeMenus}>YouTube</a>
                </div>
              </div>
            </div>

            <div className="nav-actions">
              <button type="button" className="promo-badge" onClick={closeMenus}>
                📦 All Tender Cells ship FREE worldwide
              </button>
              <a href="#login" className="login-btn" onClick={closeMenus}>Login</a>
              <a href="#cart" className="cart-btn" onClick={closeMenus}>🛒</a>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

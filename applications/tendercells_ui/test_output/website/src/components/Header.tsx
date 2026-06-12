import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const NAV_ITEMS = [
  {
    label: "Shop",
    children: [
      { label: "Chicken Tender™", href: "#chicken-tender" },
      { label: "Roaming Roost™", href: "#roaming-roost" },
      { label: "WatchTower AI™", href: "#watchtower" },
      { label: "Duck Dock™", href: "#duck-dock" },
      { label: "Bunny Burrow™", href: "#bunny-burrow" },
      { label: "Goat Guardian™", href: "#goat-guardian" },
      { label: "Turkey Tower™", href: "#turkey-tower" },
      { label: "Pigeon Palace™", href: "#pigeon-palace" },
      { label: "Accessories & Parts", href: "#accessories" },
      { label: "Gift Cards", href: "#gift-cards" },
    ],
  },
  {
    label: "Tender Cells in Education",
    children: [
      { label: "STEM Programs", href: "#stem" },
      { label: "K-12 School Partnerships", href: "#schools" },
      { label: "Curriculum Resources", href: "#curriculum" },
      { label: "Grant Information", href: "#grants" },
      { label: "FFA & 4-H Integration", href: "#ffa-4h" },
      { label: "University Research", href: "#university" },
    ],
  },
  {
    label: "Applications",
    children: [
      { label: "Mobile App (iOS)", href: "#ios" },
      { label: "Mobile App (Android)", href: "#android" },
      { label: "Web Dashboard", href: "#dashboard" },
      { label: "Developer API", href: "#api" },
      { label: "MQTT Integration Guide", href: "#mqtt" },
      { label: "Firmware Downloads", href: "#firmware" },
    ],
  },
  {
    label: "Learn More",
    children: [
      { label: "Getting Started", href: "#getting-started" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Homesteading Guide", href: "#homesteading" },
      { label: "Automation Ideas", href: "#automation-ideas" },
      { label: "Documentation", href: "#docs" },
      { label: "FAQ", href: "#faq" },
      { label: "Community Forum", href: "#forum" },
      { label: "Support", href: "#support" },
    ],
  },
  {
    label: "Animal Health",
    children: [
      { label: "Chicken Health Guide", href: "#chicken-health" },
      { label: "Predator Prevention", href: "#predators" },
      { label: "Nutrition & Feed", href: "#nutrition" },
      { label: "Disease Monitoring", href: "#disease" },
      { label: "Vet Connect", href: "#vet-connect" },
    ],
  },
  {
    label: "Local Services",
    children: [
      { label: "Find an Installer", href: "#installer" },
      { label: "Local Feed Suppliers", href: "#feed-suppliers" },
      { label: "Certified Technicians", href: "#technicians" },
      { label: "Community Events", href: "#events" },
    ],
  },
  { label: "Store", href: "#store" },
  {
    label: "Open Source",
    children: [
      { label: "GitHub Repository", href: "https://github.com/WeCr8/TenderCells" },
      { label: "Firmware Source", href: "#firmware-source" },
      { label: "Mobile App Source", href: "#app-source" },
      { label: "Hardware Schematics", href: "#schematics" },
      { label: "3D Print Files (STL)", href: "#stl-files" },
      { label: "Contribute", href: "#contribute" },
      { label: "License", href: "#license" },
    ],
  },
  { label: "Blog", href: "#blog" },
  {
    label: "Follow",
    children: [
      { label: "Instagram", href: "#instagram" },
      { label: "YouTube", href: "#youtube" },
      { label: "Twitter / X", href: "#twitter" },
      { label: "Facebook", href: "#facebook" },
      { label: "GitHub", href: "https://github.com/WeCr8/TenderCells" },
      { label: "Newsletter", href: "#newsletter" },
    ],
  },
];

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const headerRef = useRef<HTMLDivElement>(null);

  // close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (label: string) =>
    setOpenDropdown((prev) => (prev === label ? null : label));

  return (
    <div ref={headerRef}>
      {/* Promo banner */}
      <div className="promo-banner">
        🍗 Order Chicken Tender v1.0.0 today &mdash; Free shipping worldwide!
      </div>

      <header className="site-header">
        {/* Top row: logo / search / badges / login / cart */}
        <div className="header-top">
          <Link to="/" className="site-logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">Tender Cells</span>
          </Link>

          <form
            className="header-search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="search"
              placeholder="What are you looking for?"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Site search"
            />
          </form>

          <div className="header-shipping-badge">
            <span className="shipping-icon">📦</span>
            <span>
              <strong>All Tender Cells ship FREE</strong>
              <br />
              worldwide
            </span>
          </div>

          <a href="#login" className="header-login">
            <span>👤</span> Login
          </a>
          <a href="#cart" className="header-cart" aria-label="Shopping cart">
            🛒
          </a>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* Bottom row: nav */}
        <nav className={`site-nav ${mobileOpen ? "mobile-open" : ""}`}>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="nav-item has-dropdown">
                <button
                  type="button"
                  className={`nav-btn ${openDropdown === item.label ? "active" : ""}`}
                  onClick={() => toggle(item.label)}
                  aria-expanded={openDropdown === item.label ? "true" : "false"}
                >
                  {item.label} <span className="caret">▾</span>
                </button>
                <ul
                  className={`dropdown ${openDropdown === item.label ? "open" : ""}`}
                  role="menu"
                >
                  {item.children.map((child) => (
                    <li key={child.label} role="menuitem">
                      <a
                        href={child.href}
                        onClick={() => {
                          setOpenDropdown(null);
                          setMobileOpen(false);
                        }}
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="nav-item nav-link"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
        </nav>
      </header>
    </div>
  );
}

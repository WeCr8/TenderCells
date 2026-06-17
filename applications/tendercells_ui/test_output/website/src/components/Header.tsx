import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TENDERCELLS_APP_ENTRY_URL } from "../config/appLinks";
import { searchSite } from "../data/searchIndex";
import "./Header.css";

interface NavChild {
  label: string;
  to?: string;
  href?: string;
}
interface NavItem {
  label: string;
  to?: string;
  href?: string;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Shop",
    to: "/shop",
    children: [
      { label: "Chicken Tender™",   to: "/shop/chicken-tender" },
      { label: "Roaming Roost™",    to: "/shop/roaming-roost" },
      { label: "WatchTower AI™",    to: "/shop/watchtower" },
      { label: "Barn Brain",        to: "/shop/barn-brain" },
      { label: "Duck Dock™",        to: "/shop/duck-dock" },
      { label: "Bunny Burrow™",     to: "/shop/bunny-burrow" },
      { label: "Goat Guardian™",    to: "/shop/goat-guardian" },
      { label: "Turkey Tower™",     to: "/shop/turkey-tower" },
      { label: "Pigeon Palace™",    to: "/shop/pigeon-palace" },
      { label: "Accessories & Parts", to: "/shop/accessories" },
      { label: "Gift Cards",        to: "/shop/gift-cards" },
    ],
  },
  {
    label: "Education",
    to: "/education",
    children: [
      { label: "All Audience Paths",     to: "/audiences" },
      { label: "STEM Programs",         to: "/education#stem" },
      { label: "K-12 School Partnerships", to: "/education#schools" },
      { label: "Curriculum Resources",  to: "/education#curriculum" },
      { label: "Grant Information",     to: "/education#grants" },
      { label: "Partners & Sponsors",   to: "/partners" },
      { label: "FFA & 4-H Integration", to: "/education#ffa-4h" },
      { label: "TenderCells Academy",   to: "/academy" },
      { label: "4-H STEM Projects",     to: "/4h" },
      { label: "FFA AgTech Projects",   to: "/ffa" },
      { label: "Homeschool STEM",       to: "/homeschool" },
      { label: "Science Fair Projects", to: "/science-fair" },
      { label: "University Research",   to: "/education#university" },
    ],
  },
  {
    label: "Applications",
    to: "/apps",
    children: [
      { label: "Mobile App (iOS)",        to: "/apps#ios" },
      { label: "Mobile App (Android)",    to: "/apps#android" },
      { label: "Web Dashboard",           href: TENDERCELLS_APP_ENTRY_URL },
      { label: "Developer API",           to: "/apps#api" },
      { label: "MQTT Integration Guide",  to: "/apps#mqtt" },
      { label: "⚡ Flash a Device",        href: "/flash" },
      { label: "⚙️ Expert Flasher (custom firmware)", href: "/flash/expert" },
      { label: "🧊 3D Model Viewer",       href: "/viewer" },
    ],
  },
  {
    label: "Learn More",
    to: "/learn",
    children: [
      { label: "📚 Learn Home (guides & FAQ)", to: "/learn" },
      { label: "🐣 Start Here — First Coop Brain (ages 7+)", to: "/lessons/your-first-coop-brain" },
      { label: "🧱 Hands-on Lessons",  to: "/lessons" },
      { label: "🗺️ Learning Tracks (curriculum map)", to: "/lessons/learning-tracks" },
      { label: "All Guides",         to: "/guides" },
      { label: "Farm Automation",    to: "/farm-automation" },
      { label: "Getting Started",    to: "/learn#getting-started" },
      { label: "How It Works",       to: "/learn#how-it-works" },
      { label: "Homesteading Guide", to: "/learn/homesteading" },
      { label: "Automation Ideas",   to: "/learn/automation" },
      { label: "Smart Coop Guide",   to: "/guides/smart-chicken-coop" },
      { label: "Predator Monitoring", to: "/guides/predator-monitoring" },
      { label: "Pasture Rotation",   to: "/guides/pasture-rotation" },
      { label: "Documentation",      to: "/learn#docs" },
      { label: "FAQ",                to: "/learn/faq" },
      { label: "Community Forum",    to: "/learn#forum" },
      { label: "Support",            to: "/learn#support" },
    ],
  },
  {
    label: "Open Source",
    to: "/open-source",
    children: [
      { label: "GitHub Repository",    href: "https://github.com/WeCr8/TenderCells" },
      { label: "⚡ Flash a Device",     href: "/flash" },
      { label: "Firmware Source",      to: "/open-source#firmware" },
      { label: "Mobile App Source",    to: "/open-source#app" },
      { label: "Hardware Schematics",  to: "/open-source#schematics" },
      { label: "3D Print Files (STL)", to: "/open-source#stl" },
      { label: "Contribute",           to: "/open-source#contribute" },
      { label: "License",              to: "/open-source#license" },
    ],
  },
  {
    label: "Company",
    to: "/story",
    children: [
      { label: "Our Story",       to: "/story" },
      { label: "Developers",      to: "/developers" },
      { label: "Blog",            to: "/blog" },
      { label: "Partners & Sponsors", to: "/partners" },
      { label: "Animal Health",   to: "/health" },
      { label: "Local Services",  to: "/services" },
    ],
  },
  {
    label: "Follow",
    children: [
      { label: "Instagram",  href: "https://instagram.com/tendercells" },
      { label: "YouTube",    href: "https://youtube.com/@tendercells" },
      { label: "Twitter / X",href: "https://x.com/tendercells" },
      { label: "Facebook",   href: "https://facebook.com/tendercells" },
      { label: "GitHub",     href: "https://github.com/WeCr8/TenderCells" },
      { label: "Newsletter", to: "/#newsletter" },
    ],
  },
];

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Live suggestions as the user types (>=2 chars). Top 6 matches from the index.
  const suggestions =
    searchValue.trim().length >= 2 ? searchSite(searchValue).slice(0, 6) : [];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    setSearchFocused(false);
    closeAll();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const pickSuggestion = (path: string, external?: boolean) => {
    setSearchValue("");
    setSearchFocused(false);
    closeAll();
    if (external) window.location.href = path;
    else navigate(path);
  };

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

  const closeAll = () => {
    setOpenDropdown(null);
    setMobileOpen(false);
  };

  return (
    <div ref={headerRef}>
      <div className="promo-banner">
        TenderCells kits are coming later. Register interest, explore docs, or build your own and bring it into the OS today.
      </div>

      <header className="site-header">
        <div className="header-top">
          <Link to="/" className="site-logo">
            <img
              src="/assets/images/tender-cells-logo.svg"
              alt="Tender Cells"
              className="logo-img"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <img
              src="/assets/images/tender_cells_logo.png"
              alt=""
              className="logo-img logo-img-fallback"
            />
            <span className="logo-text">Tender Cells</span>
          </Link>

          <form className="header-search" onSubmit={submitSearch} role="search" autoComplete="off">
            <input
              type="search"
              placeholder="What are you looking for?"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              aria-label="Site search"
            />
            <button type="submit" className="header-search-btn" aria-label="Search">
              🔍
            </button>
            {searchFocused && suggestions.length > 0 && (
              <ul className="search-suggest" id="search-suggest">
                {suggestions.map((s) => (
                  <li key={s.path}>
                    <button type="button" onClick={() => pickSuggestion(s.path, s.external)}>
                      <span className="ss-title">{s.title}</span>
                      <span className="ss-desc">{s.description}</span>
                    </button>
                  </li>
                ))}
                <li className="ss-all">
                  <button type="button" onClick={submitSearch}>See all results for “{searchValue.trim()}” →</button>
                </li>
              </ul>
            )}
          </form>

          <div className="header-shipping-badge">
            <span className="shipping-icon">🛠</span>
            <span>
              <strong>Concepts open for interest</strong>
              <br />
              kits coming soon
            </span>
          </div>

          <a href={TENDERCELLS_APP_ENTRY_URL} className="header-login">
            <span>👤</span> Login
          </a>
          <a href="/shop" className="header-cart" aria-label="Product concepts">
            ☆
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

        <nav className={`site-nav ${mobileOpen ? "mobile-open" : ""}`}>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="nav-item has-dropdown">
                <button
                  type="button"
                  className={`nav-btn ${openDropdown === item.label ? "active" : ""}`}
                  onClick={() => toggle(item.label)}
                  aria-expanded={openDropdown === item.label}
                >
                  {item.label} <span className="caret">▾</span>
                </button>
                <ul
                  className={`dropdown ${openDropdown === item.label ? "open" : ""}`}
                  role="menu"
                >
                  {item.children.map((child) => (
                    <li key={child.label} role="menuitem">
                      {child.to ? (
                        <Link to={child.to} onClick={closeAll}>
                          {child.label}
                        </Link>
                      ) : (
                        <a
                          href={child.href}
                          target={child.href?.startsWith("http") ? "_blank" : undefined}
                          rel={child.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          onClick={closeAll}
                        >
                          {child.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="nav-item nav-link"
                onClick={closeAll}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="nav-item nav-link"
                onClick={closeAll}
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

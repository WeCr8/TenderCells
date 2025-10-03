// Dedicated Header Component
export function createHeader() {
  return `
    <!-- Notification Banner -->
    <div class="notification-banner">
      <div class="container">
        <p>🎉 Order Chicken Tender v1.0.0 today - Free shipping worldwide!</p>
      </div>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <a href="#" class="logo">
            <div class="logo-icon">🐣</div>
            <span class="logo-text">Tender Cells</span>
          </a>

          <!-- Search Bar -->
          <div class="search-container">
            <input type="text" placeholder="What are you looking for?" class="search-input">
            <button class="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>

          <!-- Shipping Info -->
          <div class="shipping-info">
            <div class="shipping-icon">📦</div>
            <div class="shipping-text">
              <div class="shipping-title">All Tender Cells ship FREE</div>
              <div class="shipping-subtitle">worldwide</div>
            </div>
          </div>

          <!-- User Actions -->
          <div class="user-actions">
            <button class="login-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Login
            </button>
            <button class="cart-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Skip to main content link for keyboard users -->
        <a href="#main-content" class="skip-nav">Skip to main content</a>
        
        <!-- Navigation -->
        <nav class="main-nav" aria-label="Main navigation">
          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Shop <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">Chicken Tender</a>
              <a href="#" class="dropdown-item" role="menuitem">Genesis XL</a>
              <a href="#" class="dropdown-item" role="menuitem">Accessories</a>
              <a href="#" class="dropdown-item" role="menuitem">Parts</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Tender Cells in Education <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">Curriculum</a>
              <a href="#" class="dropdown-item" role="menuitem">Case Studies</a>
              <a href="#" class="dropdown-item" role="menuitem">Teacher Resources</a>
              <a href="#" class="dropdown-item" role="menuitem">Student Projects</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Applications <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">Chicken Tender</a>
              <a href="#" class="dropdown-item" role="menuitem" aria-disabled="true">Cattle Care (Soon)</a>
              <a href="#" class="dropdown-item" role="menuitem" aria-disabled="true">Pig Pal (Soon)</a>
              <a href="#" class="dropdown-item" role="menuitem" aria-disabled="true">Goat Guardian (Soon)</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Learn More <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">How It Works</a>
              <a href="#" class="dropdown-item" role="menuitem">Technology</a>
              <a href="#" class="dropdown-item" role="menuitem">Success Stories</a>
              <a href="#" class="dropdown-item" role="menuitem">FAQ</a>
            </div>
          </div>

          <div class="nav-item">
            <a href="#" class="nav-link">Open Source</a>
          </div>

          <div class="nav-item">
            <a href="#" class="nav-link">Blog</a>
          </div>

          <div class="nav-item">
            <a href="#" class="nav-link">Signup for our Newsletter</a>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Follow <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">Twitter</a>
              <a href="#" class="dropdown-item" role="menuitem">Instagram</a>
              <a href="#" class="dropdown-item" role="menuitem">YouTube</a>
              <a href="#" class="dropdown-item" role="menuitem">GitHub</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              Contact <span class="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-menu" role="menu">
              <a href="#" class="dropdown-item" role="menuitem">Support</a>
              <a href="#" class="dropdown-item" role="menuitem">Sales</a>
              <a href="#" class="dropdown-item" role="menuitem">Press</a>
              <a href="#" class="dropdown-item" role="menuitem">Partnerships</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  `;
}
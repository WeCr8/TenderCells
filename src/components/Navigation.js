// Navigation Component - Modular header navigation
export function createNavigation() {
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
            <button class="login-btn" id="loginBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Login
            </button>
            <div class="user-profile" id="userProfile" style="display: none;">
              <div class="user-avatar" id="userAvatar"></div>
              <div class="user-dropdown" id="userDropdown">
                <div class="user-dropdown-header">
                  <div class="user-name" id="userName"></div>
                  <div class="user-email" id="userEmail"></div>
                </div>
                <a href="#account" class="user-dropdown-item">My Account</a>
                <a href="#account" class="user-dropdown-item">Profile</a>
                <a href="#account" class="user-dropdown-item">Settings</a>
                <a href="#" class="user-dropdown-item">My Applications</a>
                <button class="user-dropdown-item logout" id="logoutBtn">Sign Out</button>
              </div>
            </div>
            <button class="cart-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="main-nav">
          <div class="nav-item dropdown">
            <button class="nav-link">Shop <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">Chicken Tender</a>
              <a href="#" class="dropdown-item">Genesis XL</a>
              <a href="#" class="dropdown-item">Accessories</a>
              <a href="#" class="dropdown-item">Parts</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link">Tender Cells in Education <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#education" class="dropdown-item">Overview</a>
              <a href="#education/programs" class="dropdown-item">Educational Programs</a>
              <a href="#education/curriculum" class="dropdown-item">Curriculum Framework</a>
              <a href="#education/resources" class="dropdown-item">Teacher Resources</a>
              <a href="#education/projects" class="dropdown-item">Student Projects</a>
              <a href="#education/pricing" class="dropdown-item">Educational Pricing</a>
              <a href="#education/contact" class="dropdown-item">Contact & Support</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link">Applications <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#chicken-tender" class="dropdown-item">Chicken Tender</a>
              <a href="#cattle-care" class="dropdown-item">Cattle Care (Soon)</a>
              <a href="#pig-pal" class="dropdown-item">Pig Pal (Soon)</a>
              <a href="#goat-guardian" class="dropdown-item">Goat Guardian (Soon)</a>
              <a href="#duck-dock" class="dropdown-item">Duck Dock (Soon)</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link">Learn More <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">How It Works</a>
              <a href="#" class="dropdown-item">Technology</a>
              <a href="#" class="dropdown-item">Success Stories</a>
              <a href="#" class="dropdown-item">FAQ</a>
            </div>
          </div>

          <div class="nav-item">
            <a href="#animal-health" class="nav-link">Animal Health</a>
          </div>

          <div class="nav-item">
            <a href="#services" class="nav-link">Local Services</a>
          </div>

          <div class="nav-item">
            <a href="#store" class="nav-link">Store</a>
          </div>

          <div class="nav-item">
            <a href="#open-source" class="nav-link">Open Source</a>
          </div>

          <div class="nav-item">
            <a href="#blog" class="nav-link">Blog</a>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link">Follow <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">Twitter</a>
              <a href="#" class="dropdown-item">Instagram</a>
              <a href="#" class="dropdown-item">YouTube</a>
              <a href="#" class="dropdown-item">GitHub</a>
            </div>
          </div>

          <div class="nav-item dropdown">
            <button class="nav-link">Contact <span class="dropdown-arrow">▼</span></button>
            <div class="dropdown-menu">
              <a href="#contact" class="dropdown-item">Contact Us</a>
              <a href="#support" class="dropdown-item">Support</a>
              <a href="#assets" class="dropdown-item">Marketing Assets</a>
              <a href="#contact" class="dropdown-item">Sales</a>
              <a href="#contact" class="dropdown-item">Press</a>
              <a href="#contact" class="dropdown-item">Partnerships</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  `;
}

export function initializeNavigation() {
  // Dropdown functionality
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.nav-link');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });

  // User profile dropdown
  const userProfile = document.getElementById('userProfile');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userAvatar) {
    userAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      userProfile.classList.toggle('active');
    });
  }
  
  // Close user dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (userProfile && !userProfile.contains(e.target)) {
      userProfile.classList.remove('active');
    }
  });

  console.log('Navigation component initialized');
}
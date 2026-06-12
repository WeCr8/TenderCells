import './style.css'
import { router } from './router.js'
import { AuthModal } from './components/AuthModal.js'
import { cartModal } from './components/CartModal.js'
import { getCurrentUser, logOut, onAuthStateChange } from './firebase/auth.js'
import { resetBodyScroll } from './utils/scrollLock.js'

// Simple homepage content
document.querySelector('#app').innerHTML = `
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
        <a href="#" class="logo" data-nav-home>
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
            <button class="user-avatar" id="userAvatar" type="button" aria-label="Open account menu" title="Account"></button>
            <div class="user-dropdown" id="userDropdown">
              <div class="user-dropdown-header">
                <div class="user-name" id="userName"></div>
                <div class="user-email" id="userEmail"></div>
              </div>
              <a href="#account" class="user-dropdown-item">My Account</a>
              <a href="#tender-cells-application" class="user-dropdown-item">My Applications</a>
              <button class="user-dropdown-item logout" id="logoutBtn" type="button">Sign Out</button>
            </div>
          </div>
          <button class="cart-btn" id="cartBtn" type="button" aria-label="Open shopping cart" title="Cart">
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
          <button class="nav-link">Products <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
            <a href="#all-products" class="dropdown-item">All Products</a>
            <div class="dropdown-divider"></div>
            <a href="#chicken-tender" class="dropdown-item">Chicken Tender</a>
            <a href="#pigeon-palace" class="dropdown-item">Pigeon Palace</a>
            <a href="#turkey-tower" class="dropdown-item">Turkey Tower</a>
            <a href="#bunny-burrow" class="dropdown-item">Bunny Burrow</a>
            <a href="#roaming-roost" class="dropdown-item">Roaming Roost</a>
            <div class="dropdown-divider"></div>
            <a href="#cattle-care" class="dropdown-item">Cattle Care</a>
            <a href="#goat-guardian" class="dropdown-item">Goat Guardian</a>
            <a href="#pig-pal" class="dropdown-item">Pig Pal</a>
            <div class="dropdown-divider"></div>
            <a href="#duck-dock" class="dropdown-item">Duck Dock</a>
            <div class="dropdown-divider"></div>
            <a href="#predator-monitoring" class="dropdown-item">Predator Monitoring</a>
          </div>
        </div>

        <div class="nav-item dropdown">
          <button class="nav-link">Shop <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
            <a href="#chicken-tender" class="dropdown-item">Chicken Tender</a>
            <a href="#cattle-care" class="dropdown-item">Cattle Care</a>
            <a href="#pig-pal" class="dropdown-item">Pig Pal</a>
            <a href="#goat-guardian" class="dropdown-item">Goat Guardian</a>
            <a href="#duck-dock" class="dropdown-item">Duck Dock</a>
              <a href="#predator-monitoring" class="dropdown-item">Predator Monitoring (In Development)</a>
            <a href="#store" class="dropdown-item">Accessories</a>
            <a href="#store" class="dropdown-item">Parts</a>
          </div>
        </div>

        <div class="nav-item dropdown">
          <button class="nav-link">Tender Cells in Education <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
              <a href="#education/curriculum" class="dropdown-item">Curriculum</a>
              <a href="#success-stories" class="dropdown-item">Case Studies</a>
              <a href="#education/resources" class="dropdown-item">Teacher Resources</a>
              <a href="#education/projects" class="dropdown-item">Student Projects</a>
          </div>
        </div>

        <div class="nav-item dropdown">
          <button class="nav-link">Applications <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
            <a href="#tender-cells-application" class="dropdown-item">Tender Cells Application</a>
            <a href="#chicken-tender" class="dropdown-item">Chicken Tender</a>
            <a href="#cattle-care" class="dropdown-item">Cattle Care (Soon)</a>
            <a href="#pig-pal" class="dropdown-item">Pig Pal (Soon)</a>
            <a href="#goat-guardian" class="dropdown-item">Goat Guardian (Soon)</a>
          </div>
        </div>

        <div class="nav-item dropdown">
          <button class="nav-link">Learn More <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
              <a href="#how-it-works" class="dropdown-item">How It Works</a>
              <a href="#technology" class="dropdown-item">Technology</a>
              <a href="#success-stories" class="dropdown-item">Success Stories</a>
              <a href="#faq" class="dropdown-item">FAQ</a>
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
            <a href="#" class="dropdown-item">Support</a>
            <a href="#" class="dropdown-item">Sales</a>
            <a href="#" class="dropdown-item">Press</a>
            <a href="#" class="dropdown-item">Partnerships</a>
          </div>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <!-- Video Hero Section -->
    <section class="video-hero">
      <div class="video-background">
        <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop" alt="Smart farming background" class="hero-bg-image">
        <div class="video-overlay"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Tender Cells</h1>
          <p class="hero-subtitle">Bring Smart Farming to the Homestead</p>
          <div class="hero-buttons">
            <button class="btn btn-video">
              <span>▶</span>
              WATCH THE VIDEO
            </button>
            <button class="btn btn-order">
              ORDER NOW
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Press Quote Section -->
    <section class="press-section">
      <div class="container">
        <p class="press-quote">"Tender Cells makes smart farming as easy as playing Farmville"</p>
      </div>
    </section>

    <!-- Product Hero Section -->
    <section class="product-hero">
      <div class="container">
        <div class="product-content">
          <div class="product-image">
            <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Chicken Tender Smart Coop" class="product-img">
          </div>
          <div class="product-info">
            <h2 class="product-title">Explore our models</h2>
            <p class="product-description">
              Chicken Tender is our flagship smart coop system currently in build and beta testing phase. 
              Designed specifically for homesteaders and chicken enthusiasts, this system will feature our 
              most advanced technology and come 95% pre-assembled for easy installation.

              Join our beta testing program to be among the first to experience smart farming technology.
            </p>
            <button class="btn btn-product-order">JOIN BETA PROGRAM</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Apps Section -->
    <section id="apps" class="apps">
      <div class="container">
        <h2>Our Smart Farming Apps</h2>
        <p class="apps-subtitle">Cross-platform applications powered by Firebase, Genkit, and Google AI for intelligent farm management.</p>
        
        <div class="app-showcase">
          <div class="app-featured">
            <div class="app-featured-header">
              <div class="app-icon-large">🐔</div>
              <div class="app-title-section">
                <h3>Chicken Tender</h3>
                <p class="app-status">Build/Beta Testing</p>
              </div>
            </div>
            
            <div class="app-description">
              <p>Our flagship app for intelligent chicken coop management. Monitor temperature, humidity, feeding schedules, and health metrics with AI-powered insights.</p>
            </div>
            
            <div class="app-features">
              <div class="feature-tag">🌡️ Climate Control</div>
              <div class="feature-tag">🍽️ Smart Feeding</div>
              <div class="feature-tag">📊 Health Analytics</div>
              <div class="feature-tag">🔔 Smart Alerts</div>
            </div>
            
            <div class="app-footer">
              <div class="platform-badges">
                <span class="platform-badge">📱 iOS</span>
                <span class="platform-badge">🤖 Android</span>
                <span class="platform-badge">🌐 Web</span>
              </div>
              
              <div class="app-action">
                <a href="#chicken-tender" class="btn btn-primary">Learn More</a>
              </div>
            </div>
          </div>
          
          <div class="apps-coming-soon">
            <h4>Coming Soon</h4>
            <div class="app-grid">
              <div class="app-card coming-soon">
                <div class="app-icon">🐄</div>
                <h5>Cattle Care</h5>
                <p>Comprehensive cattle management and health monitoring</p>
                <a href="#cattle-care" class="btn btn-secondary" style="margin-top: 16px;">Learn More</a>
              </div>
              <div class="app-card coming-soon">
                <div class="app-icon">🐷</div>
                <h5>Pig Pal</h5>
                <p>Smart pig farming with automated feeding and health tracking</p>
                <a href="#pig-pal" class="btn btn-secondary" style="margin-top: 16px;">Learn More</a>
              </div>
              <div class="app-card coming-soon">
                <div class="app-icon">🐐</div>
                <h5>Goat Guardian</h5>
                <p>Intelligent goat herd management and pasture optimization</p>
                <a href="#goat-guardian" class="btn btn-secondary" style="margin-top: 16px;">Learn More</a>
              </div>
              <div class="app-card coming-soon">
                <div class="app-icon">🦆</div>
                <h5>Duck Dock</h5>
                <p>Waterfowl management with pond monitoring and care scheduling</p>
                <a href="#duck-dock" class="btn btn-secondary" style="margin-top: 16px;">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Section -->
    <section id="technology" class="technology">
      <div class="container">
        <h2>Powered by Modern Technology</h2>
        <p class="tech-subtitle">Built with cutting-edge tools for reliability, intelligence, and scalability.</p>
        <div class="tech-grid">
          <div class="tech-card">
            <div class="tech-icon">🔥</div>
            <h3>Firebase</h3>
            <p>Real-time database, authentication, and cloud functions for seamless data synchronization across all your devices.</p>
          </div>
          <div class="tech-card">
            <div class="tech-icon">🤖</div>
            <h3>Google AI & Genkit</h3>
            <p>Advanced AI capabilities for predictive analytics, health monitoring, and intelligent farming recommendations.</p>
          </div>
          <div class="tech-card">
            <div class="tech-icon">📱</div>
            <h3>Cross-Platform</h3>
            <p>Native iOS and Android apps plus responsive web interface - access your farm data anywhere, anytime.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Open Source Section -->
    <section id="open-source" class="open-source">
      <div class="container">
        <div class="open-source-content">
          <div class="open-source-text">
            <h2>Open Source & Community Driven</h2>
            <p>We believe in the power of community collaboration. All Tender Cells applications are open source, allowing homesteaders worldwide to contribute, customize, and improve our farming solutions.</p>
            
            <div class="open-source-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🔓</span>
                <div>
                  <h4>Fully Open</h4>
                  <p>Complete source code available on GitHub</p>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🤝</span>
                <div>
                  <h4>Community Driven</h4>
                  <p>Built by farmers, for farmers</p>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🔧</span>
                <div>
                  <h4>Customizable</h4>
                  <p>Adapt to your specific farming needs</p>
                </div>
              </div>
            </div>
            
            <a href="#" class="btn btn-primary">
              <span>⭐</span>
              Star on GitHub
            </a>
          </div>
          <div class="github-stats">
            <div class="stat-card">
              <h3>1.2k+</h3>
              <p>GitHub Stars</p>
            </div>
            <div class="stat-card">
              <h3>150+</h3>
              <p>Contributors</p>
            </div>
            <div class="stat-card">
              <h3>50+</h3>
              <p>Forks</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <h3>10k+</h3>
            <p>Active Farmers</p>
          </div>
          <div class="stat-item">
            <h3>50k+</h3>
            <p>Animals Monitored</p>
          </div>
          <div class="stat-item">
            <h3>99.9%</h3>
            <p>Uptime</p>
          </div>
          <div class="stat-item">
            <h3>24/7</h3>
            <p>AI Monitoring</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Tender Cells</h4>
          <p>Empowering homesteaders with intelligent, open-source farming solutions that make animal care easier and more effective.</p>
          <div class="social-links">
            <a href="#" class="social-link">GitHub</a>
            <a href="#" class="social-link">Discord</a>
            <a href="#" class="social-link">Twitter</a>
          </div>
        </div>
        <div class="footer-section">
          <h4>Applications</h4>
          <ul class="footer-links">
            <li><a href="#">Chicken Tender</a></li>
            <li><a href="#">Cattle Care (Soon)</a></li>
            <li><a href="#">Pig Pal (Soon)</a></li>
            <li><a href="#">Goat Guardian (Soon)</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Developers</h4>
          <ul class="footer-links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Contributing Guide</a></li>
            <li><a href="#">Community Forum</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Support</h4>
          <ul class="footer-links">
            <li><a href="mailto:hello@tendercells.com">hello@tendercells.com</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Bug Reports</a></li>
            <li><a href="#">Feature Requests</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 Tender Cells. Open source software for the farming community.</p>
        <div class="company-info">
          A WeCr8 Solutions LLC company • Open source project
        </div>
      </div>
    </div>
  </footer>
`

// Basic dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  resetBodyScroll();

  // Ensure pageContainer exists for router
  if (!document.getElementById('pageContainer')) {
    const pageContainer = document.createElement('div');
    pageContainer.id = 'pageContainer';
    pageContainer.style.display = 'none'; // Hidden by default, shown when route changes
    const appRoot = document.getElementById('app');
    const header = document.querySelector('header');
    const mainContent = document.querySelector('main');

    if (appRoot && mainContent && mainContent.parentNode === appRoot) {
      appRoot.insertBefore(pageContainer, mainContent);
    } else if (appRoot && header && header.parentNode === appRoot) {
      appRoot.insertBefore(pageContainer, header.nextSibling);
    } else {
      (appRoot || document.body).appendChild(pageContainer);
    }
  }

      const authModal = new AuthModal({
        onAuthSuccess: () => {
          window.location.hash = '#tender-cells-application';

          if (window.router && typeof window.router.handleRoute === 'function') {
            window.router.handleRoute();
          } else if (router && typeof router.handleRoute === 'function') {
            router.handleRoute();
          }
        }
      });

      const loginButton = document.getElementById('loginBtn');
      const logoutButton = document.getElementById('logoutBtn');
      const cartButton = document.getElementById('cartBtn');
      const userProfile = document.getElementById('userProfile');
      const userAvatar = document.getElementById('userAvatar');
      const userName = document.getElementById('userName');
      const userEmail = document.getElementById('userEmail');

      const getUserInitials = (user) => {
        const displayName = user?.displayName?.trim();
        if (displayName) {
          const initials = displayName
            .split(/\s+/)
            .map((namePart) => namePart[0])
            .slice(0, 2)
            .join('');

          if (initials) {
            return initials.toUpperCase();
          }
        }

        if (user?.email) {
          return user.email.slice(0, 2).toUpperCase();
        }

        return 'TC';
      };

      const updateAuthUI = (user) => {
        if (!loginButton || !userProfile || !userAvatar || !userName || !userEmail) {
          return;
        }

        if (user) {
          loginButton.style.display = 'none';
          userProfile.style.display = 'block';
          userAvatar.textContent = getUserInitials(user);
          userName.textContent = user.displayName || 'Tender Cells User';
          userEmail.textContent = user.email || 'Signed in';
        } else {
          loginButton.style.display = 'flex';
          userProfile.style.display = 'none';
          userProfile.classList.remove('active');
          userAvatar.textContent = '';
          userName.textContent = '';
          userEmail.textContent = '';
        }
      };

  // Initialize router - it's already instantiated when imported, but ensure it's ready
  // The router listens for hashchange events automatically
  
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

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      if (getCurrentUser()) {
        window.location.hash = '#tender-cells-application';

        if (window.router && typeof window.router.handleRoute === 'function') {
          window.router.handleRoute();
        } else if (router && typeof router.handleRoute === 'function') {
          router.handleRoute();
        }
        return;
      }

      authModal.open('signin');
    });
  }

  if (cartButton) {
    cartButton.addEventListener('click', () => {
      cartModal.open();
    });
  }

  if (userAvatar && userProfile) {
    userAvatar.addEventListener('click', (event) => {
      event.stopPropagation();
      userProfile.classList.toggle('active');
    });
  }

  document.addEventListener('click', (event) => {
    if (userProfile && !userProfile.contains(event.target)) {
      userProfile.classList.remove('active');
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      const result = await logOut();

      if (!result.success) {
        window.alert(result.error || 'Unable to sign out right now.');
        return;
      }

      userProfile?.classList.remove('active');
      window.location.hash = '';
      if (window.router && typeof window.router.handleRoute === 'function') {
        window.router.handleRoute();
      } else if (router && typeof router.handleRoute === 'function') {
        router.handleRoute();
      }
    });
  }

  updateAuthUI(getCurrentUser());
  onAuthStateChange((user) => {
    updateAuthUI(user);
  });

  // Handle navigation links using event delegation for dynamically added content
  document.addEventListener('click', function(e) {
    // Handle logo click to go home
    const logo = e.target.closest('[data-nav-home]');
    if (logo) {
      e.preventDefault();
      window.location.hash = '';
      if (window.router && typeof window.router.handleRoute === 'function') {
        window.router.handleRoute();
      }
      return;
    }

    // Handle hash links
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const href = link.getAttribute('href');
      if (href && href !== '#' && href.startsWith('#')) {
        e.preventDefault(); // Prevent default anchor behavior
        
        // Close dropdown when navigating
        const dropdown = link.closest('.dropdown');
        if (dropdown) {
          dropdown.classList.remove('active');
        }
        
        // Set the hash to trigger router
        window.location.hash = href;
        
        // Ensure router handles the navigation immediately
        if (window.router && typeof window.router.handleRoute === 'function') {
          window.router.handleRoute();
        } else if (router && typeof router.handleRoute === 'function') {
          router.handleRoute();
        }
      }
    }

    // Handle buttons with data-category for services filtering
    const categoryLink = e.target.closest('a[data-category]');
    if (categoryLink) {
      const category = categoryLink.getAttribute('data-category');
      if (category) {
        // Store category in sessionStorage for services page to read
        sessionStorage.setItem('serviceCategory', category);
      }
    }
  });
});
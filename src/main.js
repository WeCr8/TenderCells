import './style.css'
import { analytics, trackEvent, trackFormSubmit, trackEngagement, trackNewsletter } from './utils/analytics.js';
import { signIn, signUp, logOut, onAuthStateChange, resetPassword } from './firebase/auth.js';
import { AuthModal } from './components/AuthModal.js';
import { cartModal } from './components/CartModal.js';
import { cart } from './store/cart.js';
import './router.js';

// Initialize authentication modal
let authModal;
let currentUser = null;

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
              Chicken Tender is our flagship smart coop system for homesteaders and 
              enthusiasts featuring our most advanced technology, 
              features, and options. Coming 95% pre-assembled in the 
              box, Chicken Tender can be installed on an existing coop in 
              an afternoon. It is suitable for backyard coops, 
              research facilities, and homesteads.
            </p>
            <button class="btn btn-product-order">ORDER CHICKEN TENDER v1.0.0</button>
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

  <!-- Floating Newsletter Signup -->
  <div class="floating-newsletter" id="floatingNewsletter">
    <div class="newsletter-content">
      <button class="newsletter-close" id="closeNewsletter">×</button>
      <h3>Want to learn more about Tender Cells?</h3>
      <p>Subscribe to our email newsletter to get occasional updates and promos!</p>
      <form class="newsletter-form">
        <input type="email" placeholder="Email" class="newsletter-input" required>
        <button type="submit" class="newsletter-submit">SUBSCRIBE</button>
      </form>
    </div>
  </div>

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

// Add interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication
  initializeAuth();
  
  // Initialize cart functionality
  initializeCart();
  
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

  // Floating newsletter functionality
  const floatingNewsletter = document.getElementById('floatingNewsletter');
  const closeNewsletter = document.getElementById('closeNewsletter');
  
  // Show newsletter after 5 seconds
  setTimeout(() => {
    floatingNewsletter.classList.add('show');
  }, 5000);
  
  closeNewsletter.addEventListener('click', () => {
    floatingNewsletter.classList.remove('show');
  });

  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Track newsletter signup
    trackNewsletter(email, 'floating_newsletter');
    
    alert(`Thank you for subscribing with ${email}!`);
    floatingNewsletter.classList.remove('show');
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add scroll-triggered animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe cards for animation
  document.querySelectorAll('.tech-card, .app-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });

  // Add hover effects to buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      
      // Track button hover engagement
      trackEngagement('hover', 'button', this.textContent.trim());
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      
      // Track scroll milestones
      if (scrollDepth >= 25 && scrollDepth < 50) {
        trackEvent('scroll_depth', { depth: '25%' });
      } else if (scrollDepth >= 50 && scrollDepth < 75) {
        trackEvent('scroll_depth', { depth: '50%' });
      } else if (scrollDepth >= 75 && scrollDepth < 90) {
        trackEvent('scroll_depth', { depth: '75%' });
      } else if (scrollDepth >= 90) {
        trackEvent('scroll_depth', { depth: '90%' });
      }
    }
  });
  
  // Track time on page
  const startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    trackEvent('time_on_page', { 
      duration: timeOnPage,
      page_path: window.location.pathname 
    });
  });
});

// Cart Functions
function initializeCart() {
  // Cart button click
  document.querySelector('.cart-btn').addEventListener('click', () => {
    cartModal.open();
  });
  
  // Order buttons
  document.querySelectorAll('.btn-order').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = 'store';
    });
  });
  
  // Update cart badge on page load
  const itemCount = cart.getItemCount();
  if (itemCount > 0) {
    cartModal.updateCartBadge(itemCount);
  }
}

// Authentication Functions
function initializeAuth() {
  // Initialize auth modal
  authModal = new AuthModal();
  
  // Set up auth state listener
  onAuthStateChange((user) => {
    currentUser = user;
    updateAuthUI(user);
  });
  
  // Login button click
  document.getElementById('loginBtn').addEventListener('click', () => {
    authModal.open('signin');
  });
  
  // User profile dropdown
  const userProfile = document.getElementById('userProfile');
  const userAvatar = document.getElementById('userAvatar');
  const userDropdown = document.getElementById('userDropdown');
  
  userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userProfile.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userProfile.contains(e.target)) {
      userProfile.classList.remove('active');
    }
  });
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const result = await logOut();
    if (result.success) {
      userProfile.classList.remove('active');
    }
  });
  
  // Set up form handlers
  setupAuthForms();
}

function updateAuthUI(user) {
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  
  if (user) {
    // User is signed in
    loginBtn.style.display = 'none';
    userProfile.style.display = 'block';
    
    // Set user info
    const displayName = user.displayName || user.email.split('@')[0];
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    userAvatar.textContent = initials;
    userName.textContent = displayName;
    userEmail.textContent = user.email;
  } else {
    // User is signed out
    loginBtn.style.display = 'flex';
    userProfile.style.display = 'none';
  }
}

function setupAuthForms() {
  // Sign in form
  document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const errorEl = document.getElementById('signinError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    errorEl.textContent = '';
    
    const result = await signIn(email, password);
    
    if (result.success) {
      authModal.close();
    } else {
      errorEl.textContent = result.error;
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  });
  
  // Sign up form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('signupError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    errorEl.textContent = '';
    
    const result = await signUp(email, password, name);
    
    if (result.success) {
      authModal.close();
    } else {
      errorEl.textContent = result.error;
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  });
  
  // Reset password form
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const errorEl = document.getElementById('resetError');
    const successEl = document.getElementById('resetSuccess');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    errorEl.textContent = '';
    successEl.textContent = '';
    
    const result = await resetPassword(email);
    
    if (result.success) {
      successEl.textContent = 'Password reset email sent! Check your inbox.';
    } else {
      errorEl.textContent = result.error;
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
  });
}
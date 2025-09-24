import './style.css'
import { createNavigation, initializeNavigation } from './components/Navigation.js';
import { createHeroSection, initializeHeroSection } from './components/HeroSection.js';
import { createProductShowcase, initializeProductShowcase } from './components/ProductShowcase.js';
import { createAppsSection, initializeAppsSection } from './components/AppsSection.js';
import { createTechnologySection, initializeTechnologySection } from './components/TechnologySection.js';
import { createOpenSourceSection, initializeOpenSourceSection } from './components/OpenSourceSection.js';
import { createStatsSection, initializeStatsSection } from './components/StatsSection.js';
import { createNewsletterWidget, initializeNewsletterWidget } from './components/NewsletterWidget.js';
import { createFooter } from './components/footer.js';
import { analytics, trackEvent, trackFormSubmit, trackEngagement, trackNewsletter } from './utils/analytics.js';
import { signIn, signUp, logOut, onAuthStateChange, resetPassword } from './firebase/auth.js';
import { AuthModal } from './components/AuthModal.js';
import { cartModal } from './components/CartModal.js';
import { cart } from './store/cart.js';
import { eventBus, EVENTS } from './utils/eventBus.js';
import './router.js';

// Initialize authentication modal
let authModal;
let currentUser = null;

document.querySelector('#app').innerHTML = `
  ${createNavigation()}

  <main>
    <!-- Video Hero Section -->
    ${createHeroSection()}
    ${createProductShowcase()}
    ${createAppsSection()}
    ${createTechnologySection()}
    ${createOpenSourceSection()}
    ${createStatsSection()}
  </main>

  ${createNewsletterWidget()}
  ${createFooter()}
`

// Add interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication
  initializeAuth();
  
  // Initialize modular components
  initializeNavigation();
  initializeHeroSection();
  initializeProductShowcase();
  initializeAppsSection();
  initializeTechnologySection();
  initializeOpenSourceSection();
  initializeStatsSection();
  initializeNewsletterWidget();
  
  // Initialize cart functionality
  initializeCart();
  
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
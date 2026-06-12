import { resetPassword, signIn, signInWithGoogle, signUp } from '../firebase/auth.js';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock.js';

// Authentication Modal Component
export class AuthModal {
  constructor(options = {}) {
    this.isOpen = false;
    this.mode = 'signin'; // 'signin', 'signup', 'reset'
    this.onAuthSuccess = options.onAuthSuccess || null;
    this.createModal();
  }

  createModal() {
    const modalHTML = `
      <div id="authModal" class="auth-modal">
        <div class="auth-modal-overlay"></div>
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h2 id="authModalTitle">Sign In to Tender Cells</h2>
            <button id="closeAuthModal" class="auth-modal-close">&times;</button>
          </div>
          
          <div class="auth-modal-body">
            <!-- Sign In Form -->
            <form id="signinForm" class="auth-form">
              <div class="form-group">
                <label for="signinEmail">Email</label>
                <input type="email" id="signinEmail" required>
              </div>
              <div class="form-group">
                <label for="signinPassword">Password</label>
                <input type="password" id="signinPassword" required>
              </div>
              <button type="submit" class="auth-btn auth-btn-primary">Sign In</button>
              <div class="auth-divider">
                <span>or</span>
              </div>
              <button type="button" id="signinGoogleButton" class="google-signin-btn">
                <span class="google-signin-icon" aria-hidden="true">G</span>
                <span class="google-signin-label">Continue with Google</span>
              </button>
              <div class="auth-error" id="signinError"></div>
            </form>

            <!-- Sign Up Form -->
            <form id="signupForm" class="auth-form" style="display: none;">
              <div class="form-group">
                <label for="signupName">Full Name</label>
                <input type="text" id="signupName" required>
              </div>
              <div class="form-group">
                <label for="signupEmail">Email</label>
                <input type="email" id="signupEmail" required>
              </div>
              <div class="form-group">
                <label for="signupPassword">Password</label>
                <input type="password" id="signupPassword" required minlength="6">
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" required minlength="6">
              </div>
              <button type="submit" class="auth-btn auth-btn-primary">Create Account</button>
              <div class="auth-divider">
                <span>or</span>
              </div>
              <button type="button" id="signupGoogleButton" class="google-signin-btn">
                <span class="google-signin-icon" aria-hidden="true">G</span>
                <span class="google-signin-label">Continue with Google</span>
              </button>
              <div class="auth-error" id="signupError"></div>
            </form>

            <!-- Reset Password Form -->
            <form id="resetForm" class="auth-form" style="display: none;">
              <div class="form-group">
                <label for="resetEmail">Email</label>
                <input type="email" id="resetEmail" required>
              </div>
              <button type="submit" class="auth-btn auth-btn-primary">Send Reset Link</button>
              <div class="auth-error" id="resetError"></div>
              <div class="auth-success" id="resetSuccess"></div>
            </form>
          </div>

          <div class="auth-modal-footer">
            <div id="authSwitcher">
              <p>Don't have an account? <a href="#" id="switchToSignup">Sign up</a></p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('closeAuthModal');
    const overlay = modal.querySelector('.auth-modal-overlay');
    const signInForm = document.getElementById('signinForm');
    const signUpForm = document.getElementById('signupForm');
    const resetForm = document.getElementById('resetForm');
    const signInGoogleButton = document.getElementById('signinGoogleButton');
    const signUpGoogleButton = document.getElementById('signupGoogleButton');
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', () => this.close());
    signInForm.addEventListener('submit', (event) => this.handleSignIn(event));
    signUpForm.addEventListener('submit', (event) => this.handleSignUp(event));
    resetForm.addEventListener('submit', (event) => this.handleReset(event));
    signInGoogleButton.addEventListener('click', () => this.handleGoogleSignIn('signinError'));
    signUpGoogleButton.addEventListener('click', () => this.handleGoogleSignIn('signupError'));

    // Add more switcher links dynamically
    this.updateSwitcher();
  }

  clearMessages() {
    document.querySelectorAll('.auth-error, .auth-success').forEach((element) => {
      element.textContent = '';
    });
  }

  setFormPending(formId, pending) {
    const form = document.getElementById(formId);
    if (!form) {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input');

    inputs.forEach((input) => {
      input.disabled = pending;
    });

    if (submitButton) {
      submitButton.disabled = pending;
      submitButton.dataset.defaultLabel = submitButton.dataset.defaultLabel || submitButton.textContent;
      submitButton.textContent = pending ? 'Please wait...' : submitButton.dataset.defaultLabel;
    }
  }

  setGooglePending(pending) {
    document.querySelectorAll('.google-signin-btn').forEach((button) => {
      const label = button.querySelector('.google-signin-label');
      button.disabled = pending;
      if (label) {
        label.textContent = pending ? 'Please wait...' : 'Continue with Google';
      }
    });
  }

  showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
    }
  }

  async handleSignIn(event) {
    event.preventDefault();
    this.clearMessages();
    this.setFormPending('signinForm', true);

    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    const result = await signIn(email, password);

    this.setFormPending('signinForm', false);

    if (!result.success) {
      this.showMessage('signinError', result.error || 'Unable to sign in right now.');
      return;
    }

    if (this.onAuthSuccess) {
      this.onAuthSuccess(result.user);
    }

    this.close();
  }

  async handleSignUp(event) {
    event.preventDefault();
    this.clearMessages();
    this.setFormPending('signupForm', true);

    const displayName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      this.setFormPending('signupForm', false);
      this.showMessage('signupError', 'Passwords do not match.');
      return;
    }

    const result = await signUp(email, password, displayName);

    this.setFormPending('signupForm', false);

    if (!result.success) {
      this.showMessage('signupError', result.error || 'Unable to create your account right now.');
      return;
    }

    if (this.onAuthSuccess) {
      this.onAuthSuccess(result.user);
    }

    this.close();
  }

  async handleGoogleSignIn(errorElementId) {
    this.clearMessages();
    this.setGooglePending(true);

    const result = await signInWithGoogle();

    this.setGooglePending(false);

    if (!result.success) {
      this.showMessage(errorElementId, result.error || 'Unable to continue with Google right now.');
      return;
    }

    if (this.onAuthSuccess) {
      this.onAuthSuccess(result.user);
    }

    this.close();
  }

  async handleReset(event) {
    event.preventDefault();
    this.clearMessages();
    this.setFormPending('resetForm', true);

    const email = document.getElementById('resetEmail').value.trim();
    const result = await resetPassword(email);

    this.setFormPending('resetForm', false);

    if (!result.success) {
      this.showMessage('resetError', result.error || 'Unable to send a reset link right now.');
      return;
    }

    this.showMessage('resetSuccess', 'Password reset link sent. Check your inbox.');
  }

  switchMode(mode) {
    this.mode = mode;
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.style.display = 'none');

    const title = document.getElementById('authModalTitle');
    
    switch(mode) {
      case 'signin':
        document.getElementById('signinForm').style.display = 'block';
        title.textContent = 'Sign In to Tender Cells';
        break;
      case 'signup':
        document.getElementById('signupForm').style.display = 'block';
        title.textContent = 'Create Your Account';
        break;
      case 'reset':
        document.getElementById('resetForm').style.display = 'block';
        title.textContent = 'Reset Password';
        break;
    }
    
    this.updateSwitcher();
  }

  updateSwitcher() {
    const switcher = document.getElementById('authSwitcher');
    let html = '';
    
    switch(this.mode) {
      case 'signin':
        html = `
          <p>Don't have an account? <a href="#" id="switcherSignupLink">Sign up</a></p>
          <p><a href="#" id="switcherResetLink">Forgot password?</a></p>
        `;
        break;
      case 'signup':
        html = `<p>Already have an account? <a href="#" id="switcherSigninLink">Sign in</a></p>`;
        break;
      case 'reset':
        html = `<p>Remember your password? <a href="#" id="switcherSigninLink">Sign in</a></p>`;
        break;
    }
    
    switcher.innerHTML = html;
    
    // Add event listeners to the new links
    const signupLink = document.getElementById('switcherSignupLink');
    const signinLink = document.getElementById('switcherSigninLink');
    const resetLink = document.getElementById('switcherResetLink');
    
    if (signupLink) {
      signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('signup');
      });
    }
    
    if (signinLink) {
      signinLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('signin');
      });
    }
    
    if (resetLink) {
      resetLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('reset');
      });
    }
  }

  open(mode = 'signin') {
    this.switchMode(mode);
    this.clearMessages();
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';
    lockBodyScroll();
    this.isOpen = true;
  }

  close() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    unlockBodyScroll();
    this.isOpen = false;
    
    // Clear forms
    document.querySelectorAll('.auth-form').forEach(form => form.reset());
    this.clearMessages();
  }
}

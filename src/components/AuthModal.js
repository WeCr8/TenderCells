// Authentication Modal Component
export class AuthModal {
  constructor() {
    this.isOpen = false;
    this.mode = 'signin'; // 'signin', 'signup', 'reset'
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
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', () => this.close());
    
    // Form switching
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchMode('signup');
    });

    // Add more switcher links dynamically
    this.updateSwitcher();
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
          <p>Don't have an account? <a href="#" onclick="authModal.switchMode('signup')">Sign up</a></p>
          <p><a href="#" onclick="authModal.switchMode('reset')">Forgot password?</a></p>
        `;
        break;
      case 'signup':
        html = `<p>Already have an account? <a href="#" onclick="authModal.switchMode('signin')">Sign in</a></p>`;
        break;
      case 'reset':
        html = `<p>Remember your password? <a href="#" onclick="authModal.switchMode('signin')">Sign in</a></p>`;
        break;
    }
    
    switcher.innerHTML = html;
  }

  open(mode = 'signin') {
    this.switchMode(mode);
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }

  close() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    this.isOpen = false;
    
    // Clear forms
    document.querySelectorAll('.auth-form').forEach(form => form.reset());
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => el.textContent = '');
  }
}
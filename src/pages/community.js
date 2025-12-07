// Community Page (Follow/Social)
import { trackEngagement } from '../utils/analytics.js';

export function createCommunityPage() {
  return `
    <div class="community-page">
      <!-- Hero Section -->
      <section class="community-hero">
        <div class="container">
          <div class="community-hero-content">
            <span class="community-badge">Community</span>
            <h1>Join the <span class="highlight">Tender Cells</span> Community</h1>
            <p class="community-tagline">
              Connect with thousands of farmers, developers, and enthusiasts who are 
              transforming agriculture through smart technology.
            </p>
            <div class="community-stats">
              <div class="stat">
                <span class="stat-value">50K+</span>
                <span class="stat-label">Community Members</span>
              </div>
              <div class="stat">
                <span class="stat-value">2.5K+</span>
                <span class="stat-label">Contributors</span>
              </div>
              <div class="stat">
                <span class="stat-value">100+</span>
                <span class="stat-label">Countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Platforms -->
      <section class="community-platforms">
        <div class="container">
          <div class="section-header">
            <h2>Follow Us Everywhere</h2>
            <p>Stay connected and never miss an update.</p>
          </div>

          <div class="platforms-grid">
            <a href="https://twitter.com/tendercells" target="_blank" rel="noopener noreferrer" class="platform-card twitter">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>X (Twitter)</h3>
                <p>@tendercells</p>
                <span class="platform-followers">25K followers</span>
              </div>
              <span class="platform-action">Follow →</span>
            </a>

            <a href="https://instagram.com/tendercells" target="_blank" rel="noopener noreferrer" class="platform-card instagram">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>Instagram</h3>
                <p>@tendercells</p>
                <span class="platform-followers">18K followers</span>
              </div>
              <span class="platform-action">Follow →</span>
            </a>

            <a href="https://youtube.com/@tendercells" target="_blank" rel="noopener noreferrer" class="platform-card youtube">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>YouTube</h3>
                <p>Tender Cells</p>
                <span class="platform-followers">12K subscribers</span>
              </div>
              <span class="platform-action">Subscribe →</span>
            </a>

            <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" class="platform-card github">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>GitHub</h3>
                <p>tendercells</p>
                <span class="platform-followers">50K+ stars</span>
              </div>
              <span class="platform-action">Star →</span>
            </a>

            <a href="https://discord.gg/tendercells" target="_blank" rel="noopener noreferrer" class="platform-card discord">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>Discord</h3>
                <p>Tender Cells Server</p>
                <span class="platform-followers">8K members</span>
              </div>
              <span class="platform-action">Join →</span>
            </a>

            <a href="https://linkedin.com/company/tendercells" target="_blank" rel="noopener noreferrer" class="platform-card linkedin">
              <div class="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div class="platform-info">
                <h3>LinkedIn</h3>
                <p>Tender Cells</p>
                <span class="platform-followers">5K followers</span>
              </div>
              <span class="platform-action">Connect →</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Community Spaces -->
      <section class="community-spaces">
        <div class="container">
          <div class="section-header">
            <h2>Join the Conversation</h2>
            <p>Find your people in our active community spaces.</p>
          </div>

          <div class="spaces-grid">
            <div class="space-card">
              <div class="space-header">
                <span class="space-icon">💬</span>
                <span class="space-status online">Active Now</span>
              </div>
              <h3>Discord Community</h3>
              <p>Our most active community hub. Get real-time help, share your farm setup, and chat with other Tender Cells users.</p>
              <div class="space-features">
                <span>🎙️ Voice Channels</span>
                <span>📷 Photo Sharing</span>
                <span>🆘 Support</span>
              </div>
              <a href="https://discord.gg/tendercells" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Join Discord</a>
            </div>

            <div class="space-card">
              <div class="space-header">
                <span class="space-icon">📖</span>
                <span class="space-status">Community Forum</span>
              </div>
              <h3>Discussion Forum</h3>
              <p>Long-form discussions, tutorials, and knowledge sharing. Search our extensive archive of community wisdom.</p>
              <div class="space-features">
                <span>📚 Tutorials</span>
                <span>❓ Q&A</span>
                <span>💡 Ideas</span>
              </div>
              <a href="#" class="btn btn-primary">Visit Forum</a>
            </div>

            <div class="space-card">
              <div class="space-header">
                <span class="space-icon">🐙</span>
                <span class="space-status">Open Source</span>
              </div>
              <h3>GitHub Discussions</h3>
              <p>Technical discussions, feature requests, and development updates. Perfect for developers and power users.</p>
              <div class="space-features">
                <span>🔧 Technical</span>
                <span>🚀 Features</span>
                <span>🐛 Bug Reports</span>
              </div>
              <a href="https://github.com/tendercells/discussions" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Join Discussion</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="community-newsletter">
        <div class="container">
          <div class="newsletter-content">
            <div class="newsletter-text">
              <h2>Subscribe to Our Newsletter</h2>
              <p>Get the latest news, tips, and updates delivered straight to your inbox. No spam, just valuable content.</p>
              <ul class="newsletter-benefits">
                <li>✅ Weekly farming tips & tricks</li>
                <li>✅ Product updates & new features</li>
                <li>✅ Community highlights</li>
                <li>✅ Exclusive offers for subscribers</li>
              </ul>
            </div>
            <div class="newsletter-form">
              <form id="newsletterForm">
                <div class="form-group">
                  <label for="newsletter-email">Email Address</label>
                  <input type="email" id="newsletter-email" placeholder="your@email.com" required>
                </div>
                <div class="form-group">
                  <label for="newsletter-name">First Name (Optional)</label>
                  <input type="text" id="newsletter-name" placeholder="Your name">
                </div>
                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" id="newsletter-consent" required>
                    <span>I agree to receive marketing emails from Tender Cells</span>
                  </label>
                </div>
                <button type="submit" class="btn btn-primary btn-large">Subscribe Now</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Events Section -->
      <section class="community-events">
        <div class="container">
          <div class="section-header">
            <h2>Upcoming Events</h2>
            <p>Join us for live streams, webinars, and community meetups.</p>
          </div>

          <div class="events-grid">
            <div class="event-card">
              <div class="event-date">
                <span class="month">DEC</span>
                <span class="day">15</span>
              </div>
              <div class="event-info">
                <span class="event-type">🎥 Live Stream</span>
                <h4>Winter Coop Setup Tips</h4>
                <p>Learn how to prepare your smart coop for winter conditions.</p>
                <span class="event-time">📅 Dec 15, 2024 • 2:00 PM EST</span>
              </div>
              <button class="btn btn-secondary">Set Reminder</button>
            </div>

            <div class="event-card">
              <div class="event-date">
                <span class="month">DEC</span>
                <span class="day">22</span>
              </div>
              <div class="event-info">
                <span class="event-type">💻 Webinar</span>
                <h4>API Deep Dive: Custom Integrations</h4>
                <p>Technical session on building custom integrations with Tender Cells.</p>
                <span class="event-time">📅 Dec 22, 2024 • 11:00 AM EST</span>
              </div>
              <button class="btn btn-secondary">Register</button>
            </div>

            <div class="event-card">
              <div class="event-date">
                <span class="month">JAN</span>
                <span class="day">10</span>
              </div>
              <div class="event-info">
                <span class="event-type">🤝 Community Call</span>
                <h4>Monthly Community Roundtable</h4>
                <p>Open discussion with the Tender Cells team and community members.</p>
                <span class="event-time">📅 Jan 10, 2025 • 3:00 PM EST</span>
              </div>
              <button class="btn btn-secondary">RSVP</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Ambassador Program -->
      <section class="community-ambassadors">
        <div class="container">
          <div class="ambassador-content">
            <div class="ambassador-text">
              <span class="badge">Ambassador Program</span>
              <h2>Become a Tender Cells Ambassador</h2>
              <p>Are you passionate about smart farming? Join our ambassador program and help spread the word while earning exclusive perks.</p>
              <div class="ambassador-perks">
                <div class="perk">
                  <span class="perk-icon">🎁</span>
                  <span>Free products & early access</span>
                </div>
                <div class="perk">
                  <span class="perk-icon">💰</span>
                  <span>Referral commissions</span>
                </div>
                <div class="perk">
                  <span class="perk-icon">🏆</span>
                  <span>Exclusive community badge</span>
                </div>
                <div class="perk">
                  <span class="perk-icon">📣</span>
                  <span>Featured on our channels</span>
                </div>
              </div>
              <a href="#contact" class="btn btn-primary btn-large">Apply Now</a>
            </div>
            <div class="ambassador-visual">
              <div class="ambassador-badge">
                <span class="badge-icon">🌟</span>
                <span class="badge-title">Ambassador</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="community-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Join?</h2>
            <p>Pick your favorite platform and become part of the Tender Cells community today.</p>
            <div class="cta-buttons">
              <a href="https://discord.gg/tendercells" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large">Join Discord</a>
              <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-large">Star on GitHub</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeCommunityPage() {
  // Newsletter form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;
      const name = document.getElementById('newsletter-name').value;
      
      trackEngagement('newsletter_signup', { has_name: !!name });
      alert('Thanks for subscribing! Check your email to confirm.');
      newsletterForm.reset();
    });
  }

  // Track social link clicks
  const platformCards = document.querySelectorAll('.platform-card');
  platformCards.forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.querySelector('h3').textContent;
      trackEngagement('social_click', { platform });
    });
  });

  // Event reminder buttons
  const reminderBtns = document.querySelectorAll('.event-card .btn');
  reminderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const eventTitle = btn.closest('.event-card').querySelector('h4').textContent;
      trackEngagement('event_reminder', { event: eventTitle });
      alert(`Reminder set for: ${eventTitle}`);
    });
  });

  // Animate cards on scroll
  const cards = document.querySelectorAll('.platform-card, .space-card, .event-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  console.log('Community page initialized');
}


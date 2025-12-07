// Partnerships Page
import { trackFormSubmit, trackEngagement } from '../utils/analytics.js';

export function createPartnershipsPage() {
  return `
    <div class="partnerships-page">
      <!-- Hero Section -->
      <section class="partnerships-hero">
        <div class="container">
          <div class="partnerships-hero-content">
            <span class="partnerships-badge">Partnerships</span>
            <h1>Let's Build the Future of <span class="highlight">Farming Together</span></h1>
            <p class="partnerships-tagline">
              We partner with organizations that share our vision of making smart farming 
              accessible to everyone. Join us in transforming agriculture.
            </p>
            <div class="partnerships-cta">
              <a href="#partnerForm" class="btn btn-primary btn-large">Become a Partner</a>
              <a href="#partnerTypes" class="btn btn-secondary btn-large">Explore Programs</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Partner Stats -->
      <section class="partnerships-stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">200+</span>
              <span class="stat-label">Active Partners</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">40+</span>
              <span class="stat-label">Countries</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">$5M+</span>
              <span class="stat-label">Partner Revenue Generated</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">95%</span>
              <span class="stat-label">Partner Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Partnership Types -->
      <section class="partnerships-types" id="partnerTypes">
        <div class="container">
          <div class="section-header">
            <h2>Partnership Programs</h2>
            <p>Find the right partnership model for your organization.</p>
          </div>

          <div class="types-grid">
            <div class="type-card">
              <div class="type-icon">🏪</div>
              <h3>Reseller Partners</h3>
              <p>Sell Tender Cells products to your customers and earn competitive margins.</p>
              <ul class="type-benefits">
                <li>✓ Wholesale pricing (up to 40% margin)</li>
                <li>✓ Sales & marketing support</li>
                <li>✓ Demo units provided</li>
                <li>✓ Co-branded materials</li>
                <li>✓ Priority support channel</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> Farm supply stores, agricultural retailers, e-commerce sellers</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="reseller">Apply Now</a>
            </div>

            <div class="type-card featured">
              <div class="type-badge">Most Popular</div>
              <div class="type-icon">🔧</div>
              <h3>Installation Partners</h3>
              <p>Become a certified installer and service provider for Tender Cells systems.</p>
              <ul class="type-benefits">
                <li>✓ Installation certification training</li>
                <li>✓ Per-installation fees</li>
                <li>✓ Recurring service revenue</li>
                <li>✓ Lead referrals in your area</li>
                <li>✓ Technical support hotline</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> Electricians, farm service providers, ag consultants</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="installer">Apply Now</a>
            </div>

            <div class="type-card">
              <div class="type-icon">🔗</div>
              <h3>Technology Partners</h3>
              <p>Integrate Tender Cells with your platform or build complementary products.</p>
              <ul class="type-benefits">
                <li>✓ Full API access</li>
                <li>✓ Technical documentation</li>
                <li>✓ Developer support</li>
                <li>✓ Co-marketing opportunities</li>
                <li>✓ Joint roadmap input</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> AgTech companies, farm management software, IoT platforms</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="technology">Apply Now</a>
            </div>

            <div class="type-card">
              <div class="type-icon">🎓</div>
              <h3>Education Partners</h3>
              <p>Bring smart farming technology to students and agricultural programs.</p>
              <ul class="type-benefits">
                <li>✓ 30% educational discount</li>
                <li>✓ Curriculum resources</li>
                <li>✓ Student project support</li>
                <li>✓ Guest lectures & workshops</li>
                <li>✓ Research collaboration</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> Universities, agricultural schools, 4-H programs</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="education">Apply Now</a>
            </div>

            <div class="type-card">
              <div class="type-icon">📣</div>
              <h3>Affiliate Partners</h3>
              <p>Earn commissions by recommending Tender Cells to your audience.</p>
              <ul class="type-benefits">
                <li>✓ 10% commission on sales</li>
                <li>✓ 90-day cookie duration</li>
                <li>✓ Real-time tracking dashboard</li>
                <li>✓ Monthly payouts</li>
                <li>✓ Promotional materials</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> Bloggers, YouTubers, farm influencers, homesteading content creators</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="affiliate">Apply Now</a>
            </div>

            <div class="type-card">
              <div class="type-icon">🤝</div>
              <h3>Strategic Partners</h3>
              <p>Deep collaborations on product development, market expansion, or innovation.</p>
              <ul class="type-benefits">
                <li>✓ Custom partnership structure</li>
                <li>✓ Executive sponsorship</li>
                <li>✓ Joint development projects</li>
                <li>✓ Exclusive market rights</li>
                <li>✓ Board visibility</li>
              </ul>
              <p class="type-ideal"><strong>Ideal for:</strong> Large agricultural companies, international distributors, strategic investors</p>
              <a href="#partnerForm" class="btn btn-primary" data-partner-type="strategic">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Success Stories -->
      <section class="partnerships-success">
        <div class="container">
          <div class="section-header">
            <h2>Partner Success Stories</h2>
            <p>See how our partners are growing their businesses with Tender Cells.</p>
          </div>

          <div class="success-grid">
            <div class="success-card">
              <div class="success-quote">"Becoming a Tender Cells reseller transformed our farm supply business. We've added $200K in annual revenue and our customers love the technology."</div>
              <div class="success-author">
                <div class="author-avatar">RS</div>
                <div class="author-info">
                  <span class="author-name">Robert Stevens</span>
                  <span class="author-role">Owner, Stevens Farm Supply</span>
                  <span class="partner-type">Reseller Partner</span>
                </div>
              </div>
            </div>

            <div class="success-card">
              <div class="success-quote">"The installation certification program was excellent. I now do 3-4 Tender Cells installations per month, and the recurring service contracts provide stable income."</div>
              <div class="success-author">
                <div class="author-avatar">ML</div>
                <div class="author-info">
                  <span class="author-name">Maria Lopez</span>
                  <span class="author-role">Ag Tech Services LLC</span>
                  <span class="partner-type">Installation Partner</span>
                </div>
              </div>
            </div>

            <div class="success-card">
              <div class="success-quote">"Integrating Tender Cells with our farm management platform has been a game-changer for our users. The API is well-documented and the partnership team is incredibly responsive."</div>
              <div class="success-author">
                <div class="author-avatar">TK</div>
                <div class="author-info">
                  <span class="author-name">Tom Kim</span>
                  <span class="author-role">CTO, FarmTrack Software</span>
                  <span class="partner-type">Technology Partner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Partner Benefits -->
      <section class="partnerships-benefits">
        <div class="container">
          <div class="benefits-content">
            <div class="benefits-text">
              <h2>Why Partner With Tender Cells?</h2>
              <p>We're committed to our partners' success with comprehensive support and resources.</p>
            </div>
            <div class="benefits-grid">
              <div class="benefit">
                <span class="benefit-icon">📚</span>
                <h4>Training & Certification</h4>
                <p>Comprehensive onboarding and ongoing education programs.</p>
              </div>
              <div class="benefit">
                <span class="benefit-icon">📊</span>
                <h4>Partner Portal</h4>
                <p>Dedicated dashboard for orders, commissions, and resources.</p>
              </div>
              <div class="benefit">
                <span class="benefit-icon">🎯</span>
                <h4>Lead Generation</h4>
                <p>Customer referrals and co-marketing campaigns.</p>
              </div>
              <div class="benefit">
                <span class="benefit-icon">🛠️</span>
                <h4>Technical Support</h4>
                <p>Priority access to our technical team.</p>
              </div>
              <div class="benefit">
                <span class="benefit-icon">📣</span>
                <h4>Marketing Resources</h4>
                <p>Co-branded materials, product images, and content.</p>
              </div>
              <div class="benefit">
                <span class="benefit-icon">🏆</span>
                <h4>Partner Rewards</h4>
                <p>Incentive programs and annual partner summit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Application Form -->
      <section class="partnerships-form" id="partnerForm">
        <div class="container">
          <div class="form-content">
            <div class="form-text">
              <h2>Apply to Become a Partner</h2>
              <p>Tell us about your organization and how you'd like to partner with Tender Cells.</p>
              
              <div class="form-contact">
                <h4>Questions?</h4>
                <p>Email: <a href="mailto:partners@tendercells.com">partners@tendercells.com</a></p>
                <p>Phone: 1-800-PARTNER</p>
              </div>
            </div>
            
            <div class="partner-form">
              <form id="partnerApplicationForm">
                <div class="form-row">
                  <div class="form-group">
                    <label for="partnerFirstName">First Name *</label>
                    <input type="text" id="partnerFirstName" required>
                  </div>
                  <div class="form-group">
                    <label for="partnerLastName">Last Name *</label>
                    <input type="text" id="partnerLastName" required>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="partnerEmail">Email *</label>
                    <input type="email" id="partnerEmail" required>
                  </div>
                  <div class="form-group">
                    <label for="partnerPhone">Phone *</label>
                    <input type="tel" id="partnerPhone" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="partnerCompany">Company/Organization *</label>
                  <input type="text" id="partnerCompany" required>
                </div>

                <div class="form-group">
                  <label for="partnerWebsite">Website</label>
                  <input type="url" id="partnerWebsite" placeholder="https://">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="partnerType">Partnership Type *</label>
                    <select id="partnerType" required>
                      <option value="">Select type</option>
                      <option value="reseller">Reseller Partner</option>
                      <option value="installer">Installation Partner</option>
                      <option value="technology">Technology Partner</option>
                      <option value="education">Education Partner</option>
                      <option value="affiliate">Affiliate Partner</option>
                      <option value="strategic">Strategic Partner</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="partnerCountry">Country *</label>
                    <select id="partnerCountry" required>
                      <option value="">Select country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="partnerDescription">Tell us about your business *</label>
                  <textarea id="partnerDescription" rows="4" placeholder="Describe your organization, target customers, and why you're interested in partnering with Tender Cells..." required></textarea>
                </div>
                
                <div class="form-group">
                  <label for="partnerExperience">Relevant experience</label>
                  <textarea id="partnerExperience" rows="3" placeholder="Share any relevant experience with agricultural technology, farming, or related industries..."></textarea>
                </div>

                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" id="partnerAgree" required>
                    <span>I agree to the <a href="#">Partner Program Terms</a> and <a href="#">Privacy Policy</a></span>
                  </label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Submit Application</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="partnerships-faq">
        <div class="container">
          <div class="section-header">
            <h2>Partnership FAQ</h2>
          </div>

          <div class="faq-grid">
            <div class="faq-item">
              <h4>How long does the application process take?</h4>
              <p>We review applications within 5 business days. Approved partners receive onboarding within 2 weeks of acceptance.</p>
            </div>
            <div class="faq-item">
              <h4>Is there a cost to join the partner program?</h4>
              <p>No. There are no upfront costs or fees to become a Tender Cells partner. You only pay for products at wholesale pricing.</p>
            </div>
            <div class="faq-item">
              <h4>What regions do you support?</h4>
              <p>We currently support partners in North America, Europe, Australia, and select Asian markets. Contact us about other regions.</p>
            </div>
            <div class="faq-item">
              <h4>Can I be multiple partner types?</h4>
              <p>Yes! Many of our partners combine reseller and installation services, or affiliate and education programs.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializePartnershipsPage() {
  // Partner type buttons
  const typeButtons = document.querySelectorAll('[data-partner-type]');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const partnerType = btn.dataset.partnerType;
      const select = document.getElementById('partnerType');
      if (select) {
        select.value = partnerType;
      }
      trackEngagement('partner_type_select', { type: partnerType });
    });
  });

  // Partner form submission
  const partnerForm = document.getElementById('partnerApplicationForm');
  if (partnerForm) {
    partnerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      trackFormSubmit('partner_application', {
        partner_type: data.partnerType,
        country: data.partnerCountry
      });
      
      alert('Thank you for your application! Our partnerships team will review and contact you within 5 business days.');
      partnerForm.reset();
    });
  }

  // Animate cards on scroll
  const cards = document.querySelectorAll('.type-card, .success-card, .benefit, .faq-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  console.log('Partnerships page initialized');
}


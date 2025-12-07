// Sales Page
import { trackFormSubmit, trackEngagement } from '../utils/analytics.js';

export function createSalesPage() {
  return `
    <div class="sales-page">
      <!-- Hero Section -->
      <section class="sales-hero">
        <div class="container">
          <div class="sales-hero-content">
            <span class="sales-badge">Sales</span>
            <h1>Let's Talk <span class="highlight">Business</span></h1>
            <p class="sales-tagline">
              Whether you're a commercial farm, distributor, or enterprise, our sales team 
              is ready to help you find the perfect solution.
            </p>
            <div class="sales-cta">
              <a href="#salesForm" class="btn btn-primary btn-large">Request Quote</a>
              <a href="tel:1-800-TENDER-CELLS" class="btn btn-secondary btn-large">📞 Call Sales</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Sales Options -->
      <section class="sales-options">
        <div class="container">
          <div class="section-header">
            <h2>Solutions for Every Scale</h2>
            <p>From small farms to enterprise operations, we have the right plan for you.</p>
          </div>

          <div class="options-grid">
            <div class="option-card">
              <div class="option-icon">🏠</div>
              <h3>Homestead</h3>
              <p class="option-size">5-50 birds</p>
              <ul class="option-features">
                <li>✓ Base monitoring system</li>
                <li>✓ Mobile app access</li>
                <li>✓ Email support</li>
                <li>✓ Community forum access</li>
              </ul>
              <p class="option-price">Starting at <strong>$299</strong></p>
              <a href="#store" class="btn btn-secondary">Shop Now</a>
            </div>

            <div class="option-card featured">
              <div class="option-badge">Most Popular</div>
              <div class="option-icon">🌾</div>
              <h3>Farm</h3>
              <p class="option-size">50-500 birds</p>
              <ul class="option-features">
                <li>✓ Multi-zone monitoring</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ API access</li>
                <li>✓ 10% volume discount</li>
              </ul>
              <p class="option-price">Starting at <strong>$1,499</strong></p>
              <a href="#salesForm" class="btn btn-primary">Get Quote</a>
            </div>

            <div class="option-card">
              <div class="option-icon">🏭</div>
              <h3>Commercial</h3>
              <p class="option-size">500-10,000+ birds</p>
              <ul class="option-features">
                <li>✓ Enterprise dashboard</li>
                <li>✓ Multi-location support</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Custom integrations</li>
                <li>✓ On-site installation</li>
                <li>✓ SLA guarantee</li>
              </ul>
              <p class="option-price"><strong>Custom Pricing</strong></p>
              <a href="#salesForm" class="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Volume Discounts -->
      <section class="sales-discounts">
        <div class="container">
          <div class="discounts-content">
            <div class="discounts-text">
              <h2>Volume Discounts</h2>
              <p>The more you buy, the more you save. Our volume pricing makes it affordable to scale your smart farming operation.</p>
            </div>
            <div class="discounts-table">
              <table>
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1-4 units</td>
                    <td>Standard pricing</td>
                  </tr>
                  <tr>
                    <td>5-9 units</td>
                    <td><strong>10% off</strong></td>
                  </tr>
                  <tr>
                    <td>10-24 units</td>
                    <td><strong>15% off</strong></td>
                  </tr>
                  <tr>
                    <td>25-49 units</td>
                    <td><strong>20% off</strong></td>
                  </tr>
                  <tr>
                    <td>50+ units</td>
                    <td><strong>Contact for pricing</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Choose Us -->
      <section class="sales-why">
        <div class="container">
          <div class="section-header">
            <h2>Why Partner With Tender Cells</h2>
            <p>We're committed to your success at every step.</p>
          </div>

          <div class="why-grid">
            <div class="why-card">
              <span class="why-icon">🎯</span>
              <h3>Proven ROI</h3>
              <p>Our customers see an average 35% increase in productivity and 93% reduction in preventable losses.</p>
            </div>
            <div class="why-card">
              <span class="why-icon">🛠️</span>
              <h3>Full Support</h3>
              <p>From installation to optimization, our team is with you every step of the way.</p>
            </div>
            <div class="why-card">
              <span class="why-icon">📈</span>
              <h3>Scalable Solutions</h3>
              <p>Start small and grow. Our modular system scales seamlessly with your operation.</p>
            </div>
            <div class="why-card">
              <span class="why-icon">🔒</span>
              <h3>Enterprise Security</h3>
              <p>SOC 2 certified with end-to-end encryption. Your data is always protected.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Form -->
      <section class="sales-form-section" id="salesForm">
        <div class="container">
          <div class="form-content">
            <div class="form-text">
              <h2>Request a Quote</h2>
              <p>Tell us about your operation and we'll create a customized proposal tailored to your needs.</p>
              
              <div class="contact-methods">
                <div class="method">
                  <span class="method-icon">📞</span>
                  <div>
                    <h4>Call Us</h4>
                    <p>1-800-TENDER-CELLS</p>
                    <p class="method-hours">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>
                <div class="method">
                  <span class="method-icon">📧</span>
                  <div>
                    <h4>Email</h4>
                    <p>sales@tendercells.com</p>
                    <p class="method-hours">Response within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="sales-form">
              <form id="salesContactForm">
                <div class="form-row">
                  <div class="form-group">
                    <label for="salesFirstName">First Name *</label>
                    <input type="text" id="salesFirstName" required>
                  </div>
                  <div class="form-group">
                    <label for="salesLastName">Last Name *</label>
                    <input type="text" id="salesLastName" required>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="salesEmail">Email *</label>
                    <input type="email" id="salesEmail" required>
                  </div>
                  <div class="form-group">
                    <label for="salesPhone">Phone *</label>
                    <input type="tel" id="salesPhone" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="salesCompany">Company/Farm Name</label>
                  <input type="text" id="salesCompany">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="salesFlockSize">Flock Size *</label>
                    <select id="salesFlockSize" required>
                      <option value="">Select size</option>
                      <option value="5-50">5-50 birds</option>
                      <option value="50-200">50-200 birds</option>
                      <option value="200-500">200-500 birds</option>
                      <option value="500-1000">500-1,000 birds</option>
                      <option value="1000-5000">1,000-5,000 birds</option>
                      <option value="5000+">5,000+ birds</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="salesTimeline">Purchase Timeline *</label>
                    <select id="salesTimeline" required>
                      <option value="">Select timeline</option>
                      <option value="immediate">Immediate (within 2 weeks)</option>
                      <option value="1-month">1 month</option>
                      <option value="1-3-months">1-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6+-months">6+ months / Just exploring</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="salesInterest">Products of Interest *</label>
                  <div class="checkbox-group">
                    <label><input type="checkbox" name="interest" value="chicken-tender"> Chicken Tender</label>
                    <label><input type="checkbox" name="interest" value="cattle-care"> Cattle Care</label>
                    <label><input type="checkbox" name="interest" value="accessories"> Accessories</label>
                    <label><input type="checkbox" name="interest" value="enterprise"> Enterprise Solutions</label>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="salesMessage">Tell us about your operation</label>
                  <textarea id="salesMessage" rows="4" placeholder="Describe your farm, current challenges, and what you're hoping to achieve..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Submit Request</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonial -->
      <section class="sales-testimonial">
        <div class="container">
          <div class="testimonial-content">
            <div class="testimonial-quote">
              <p>"Working with the Tender Cells sales team was fantastic. They took the time to understand our operation and recommended exactly what we needed—no upselling, just honest advice. The ROI has exceeded our expectations."</p>
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">JR</div>
              <div class="author-info">
                <span class="author-name">James Rodriguez</span>
                <span class="author-role">Operations Director, Valley Fresh Farms</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeSalesPage() {
  // Sales form submission
  const salesForm = document.getElementById('salesContactForm');
  if (salesForm) {
    salesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      trackFormSubmit('sales_inquiry', {
        flock_size: data.salesFlockSize,
        timeline: data.salesTimeline
      });
      
      alert('Thank you for your inquiry! Our sales team will contact you within 24 hours.');
      salesForm.reset();
    });
  }

  // Track option card clicks
  const optionCards = document.querySelectorAll('.option-card .btn');
  optionCards.forEach(btn => {
    btn.addEventListener('click', () => {
      const tier = btn.closest('.option-card').querySelector('h3').textContent;
      trackEngagement('sales_tier_click', { tier });
    });
  });

  console.log('Sales page initialized');
}


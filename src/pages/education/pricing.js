// Educational Pricing Page
export function createEducationalPricingPage() {
  return `
    <div class="education-page">
      <!-- Hero Section -->
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>Educational Pricing</h1>
              <p class="education-tagline">Affordable smart farming education for every classroom</p>
              <p class="education-description">
                Flexible pricing options designed to fit educational budgets, from individual 
                classrooms to district-wide implementations. All packages include comprehensive 
                curriculum, training, and ongoing support.
              </p>
              <div class="education-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Request Custom Quote
                </button>
                <button class="btn btn-secondary btn-large">
                  Schedule Consultation
                </button>
              </div>
            </div>
            <div class="education-hero-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Educational Pricing">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Overview -->
      <section class="pricing-overview">
        <div class="container">
          <h2>Choose the Right Package for Your Needs</h2>
          <p class="pricing-description">All packages include hardware, software, curriculum materials, and professional support.</p>
          
          <div class="pricing-grid">
            <div class="pricing-card">
              <div class="pricing-header">
                <h3>Classroom Starter</h3>
                <div class="price">
                  <span class="price-current">$1,999</span>
                  <span class="price-period">per classroom</span>
                </div>
                <p class="price-description">Perfect for individual teachers getting started</p>
              </div>
              <div class="pricing-features">
                <h4>What's Included:</h4>
                <ul>
                  <li>✅ 1 Chicken Tender system</li>
                  <li>✅ Grade-appropriate curriculum package</li>
                  <li>✅ Teacher training (4 hours online)</li>
                  <li>✅ Student workbooks (30 copies)</li>
                  <li>✅ Assessment tools and rubrics</li>
                  <li>✅ 1-year email support</li>
                  <li>✅ Access to online resources</li>
                  <li>✅ Community forum membership</li>
                </ul>
              </div>
              <div class="pricing-details">
                <div class="detail-item">
                  <span class="detail-label">Setup Time:</span>
                  <span class="detail-value">2-3 hours</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Student Capacity:</span>
                  <span class="detail-value">Up to 30 students</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Warranty:</span>
                  <span class="detail-value">2 years</span>
                </div>
              </div>
              <button class="btn btn-primary">Get Started</button>
            </div>

            <div class="pricing-card featured">
              <div class="pricing-badge">Most Popular</div>
              <div class="pricing-header">
                <h3>School Package</h3>
                <div class="price">
                  <span class="price-current">$7,999</span>
                  <span class="price-period">per school</span>
                </div>
                <p class="price-description">Ideal for schools with multiple classrooms</p>
              </div>
              <div class="pricing-features">
                <h4>What's Included:</h4>
                <ul>
                  <li>✅ 5 Chicken Tender systems</li>
                  <li>✅ Complete K-12 curriculum library</li>
                  <li>✅ On-site teacher training (8 hours)</li>
                  <li>✅ Unlimited student materials</li>
                  <li>✅ Advanced assessment suite</li>
                  <li>✅ 2-year priority support</li>
                  <li>✅ Professional development credits</li>
                  <li>✅ Administrator dashboard</li>
                  <li>✅ Custom implementation plan</li>
                </ul>
              </div>
              <div class="pricing-details">
                <div class="detail-item">
                  <span class="detail-label">Setup Time:</span>
                  <span class="detail-value">1 day on-site</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Student Capacity:</span>
                  <span class="detail-value">Up to 150 students</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Warranty:</span>
                  <span class="detail-value">3 years</span>
                </div>
              </div>
              <button class="btn btn-primary">Most Popular Choice</button>
            </div>

            <div class="pricing-card">
              <div class="pricing-header">
                <h3>District Enterprise</h3>
                <div class="price">
                  <span class="price-current">$24,999</span>
                  <span class="price-period">per district</span>
                </div>
                <p class="price-description">Comprehensive solution for entire districts</p>
              </div>
              <div class="pricing-features">
                <h4>What's Included:</h4>
                <ul>
                  <li>✅ 20 Chicken Tender systems</li>
                  <li>✅ Complete curriculum for all grades</li>
                  <li>✅ Comprehensive teacher training (20 hours)</li>
                  <li>✅ Train-the-trainer certification</li>
                  <li>✅ Unlimited materials and resources</li>
                  <li>✅ 3-year premium support</li>
                  <li>✅ District-wide implementation plan</li>
                  <li>✅ Data analytics dashboard</li>
                  <li>✅ Custom curriculum development</li>
                  <li>✅ Annual review meetings</li>
                </ul>
              </div>
              <div class="pricing-details">
                <div class="detail-item">
                  <span class="detail-label">Setup Time:</span>
                  <span class="detail-value">2-week rollout</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Student Capacity:</span>
                  <span class="detail-value">Up to 600 students</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Warranty:</span>
                  <span class="detail-value">5 years</span>
                </div>
              </div>
              <button class="btn btn-primary">Contact Sales</button>
            </div>

            <div class="pricing-card">
              <div class="pricing-header">
                <h3>University Research</h3>
                <div class="price">
                  <span class="price-current">Custom</span>
                  <span class="price-period">pricing</span>
                </div>
                <p class="price-description">Tailored solutions for higher education</p>
              </div>
              <div class="pricing-features">
                <h4>What's Included:</h4>
                <ul>
                  <li>✅ Multiple system configurations</li>
                  <li>✅ Research collaboration opportunities</li>
                  <li>✅ Full data access and APIs</li>
                  <li>✅ Publication support and co-authoring</li>
                  <li>✅ Graduate student training programs</li>
                  <li>✅ Industry partnership opportunities</li>
                  <li>✅ Custom research protocols</li>
                  <li>✅ Conference presentation support</li>
                  <li>✅ Grant writing assistance</li>
                </ul>
              </div>
              <div class="pricing-details">
                <div class="detail-item">
                  <span class="detail-label">Setup Time:</span>
                  <span class="detail-value">Flexible</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Research Scope:</span>
                  <span class="detail-value">Unlimited</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Support:</span>
                  <span class="detail-value">Dedicated team</span>
                </div>
              </div>
              <button class="btn btn-primary">Discuss Needs</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Comparison -->
      <section class="pricing-comparison">
        <div class="container">
          <h2>Detailed Feature Comparison</h2>
          <div class="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Features</th>
                  <th>Classroom Starter</th>
                  <th>School Package</th>
                  <th>District Enterprise</th>
                  <th>University Research</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hardware</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Chicken Tender Systems</td>
                  <td>1</td>
                  <td>5</td>
                  <td>20</td>
                  <td>Custom</td>
                </tr>
                <tr>
                  <td>Sensor Packages</td>
                  <td>Basic</td>
                  <td>Standard</td>
                  <td>Advanced</td>
                  <td>Research Grade</td>
                </tr>
                <tr>
                  <td>Warranty Period</td>
                  <td>2 years</td>
                  <td>3 years</td>
                  <td>5 years</td>
                  <td>Custom</td>
                </tr>
                <tr>
                  <td><strong>Curriculum & Materials</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Grade Level Coverage</td>
                  <td>Single Grade</td>
                  <td>K-12</td>
                  <td>K-12 + Extensions</td>
                  <td>University Level</td>
                </tr>
                <tr>
                  <td>Lesson Plans</td>
                  <td>30+</td>
                  <td>100+</td>
                  <td>200+</td>
                  <td>Custom Development</td>
                </tr>
                <tr>
                  <td>Student Workbooks</td>
                  <td>30 copies</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                  <td>Research Protocols</td>
                </tr>
                <tr>
                  <td>Assessment Tools</td>
                  <td>Basic</td>
                  <td>Advanced</td>
                  <td>Comprehensive</td>
                  <td>Research Metrics</td>
                </tr>
                <tr>
                  <td><strong>Training & Support</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Teacher Training Hours</td>
                  <td>4 (Online)</td>
                  <td>8 (On-site)</td>
                  <td>20 (Comprehensive)</td>
                  <td>Custom Program</td>
                </tr>
                <tr>
                  <td>Support Type</td>
                  <td>Email</td>
                  <td>Priority</td>
                  <td>Premium</td>
                  <td>Dedicated Team</td>
                </tr>
                <tr>
                  <td>Professional Development</td>
                  <td>Basic</td>
                  <td>Credits Available</td>
                  <td>Certification</td>
                  <td>Research Training</td>
                </tr>
                <tr>
                  <td>Implementation Support</td>
                  <td>Self-guided</td>
                  <td>Guided</td>
                  <td>Full Service</td>
                  <td>Collaborative</td>
                </tr>
                <tr>
                  <td><strong>Technology & Data</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Data Access</td>
                  <td>Basic Dashboard</td>
                  <td>Advanced Analytics</td>
                  <td>Full Analytics Suite</td>
                  <td>Raw Data + APIs</td>
                </tr>
                <tr>
                  <td>Mobile App Access</td>
                  <td>✅</td>
                  <td>✅</td>
                  <td>✅</td>
                  <td>✅ + Custom</td>
                </tr>
                <tr>
                  <td>Cloud Storage</td>
                  <td>1GB</td>
                  <td>10GB</td>
                  <td>100GB</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td>❌</td>
                  <td>Limited</td>
                  <td>Full</td>
                  <td>Complete</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Financing Options -->
      <section class="financing-options">
        <div class="container">
          <h2>Flexible Financing Options</h2>
          <p class="financing-description">We understand educational budgets can be tight. We offer several financing options to make Tender Cells accessible to all schools.</p>
          
          <div class="financing-grid">
            <div class="financing-card">
              <div class="financing-icon">💳</div>
              <h3>Payment Plans</h3>
              <p>Spread costs over 12, 24, or 36 months with 0% interest for qualified educational institutions.</p>
              <ul>
                <li>No down payment required</li>
                <li>Fixed monthly payments</li>
                <li>Early payoff options</li>
                <li>Simple approval process</li>
              </ul>
              <button class="btn btn-secondary">Learn More</button>
            </div>
            
            <div class="financing-card">
              <div class="financing-icon">🎓</div>
              <h3>Educational Grants</h3>
              <p>We partner with foundations and government programs to provide grant funding for qualifying schools.</p>
              <ul>
                <li>Title I school priority</li>
                <li>STEM education grants</li>
                <li>Rural school initiatives</li>
                <li>Grant writing assistance</li>
              </ul>
              <button class="btn btn-secondary">Apply Now</button>
            </div>
            
            <div class="financing-card">
              <div class="financing-icon">🤝</div>
              <h3>Lease Programs</h3>
              <p>Lease equipment with option to purchase, perfect for schools wanting to try before committing.</p>
              <ul>
                <li>Low monthly payments</li>
                <li>Upgrade options</li>
                <li>Maintenance included</li>
                <li>Purchase option at end</li>
              </ul>
              <button class="btn btn-secondary">Get Quote</button>
            </div>
            
            <div class="financing-card">
              <div class="financing-icon">🏦</div>
              <h3>Budget Planning</h3>
              <p>Work with our education specialists to plan purchases around your budget cycles and funding availability.</p>
              <ul>
                <li>Multi-year planning</li>
                <li>Budget cycle alignment</li>
                <li>Funding source guidance</li>
                <li>ROI calculations</li>
              </ul>
              <button class="btn btn-secondary">Schedule Call</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ROI Calculator -->
      <section class="roi-calculator">
        <div class="container">
          <div class="roi-content">
            <div class="roi-text">
              <h2>Calculate Your Return on Investment</h2>
              <p>See how Tender Cells can provide measurable value to your educational program through improved student outcomes and engagement.</p>
              
              <div class="roi-benefits">
                <div class="benefit-item">
                  <h4>📈 Improved Test Scores</h4>
                  <p>Schools report average 25% improvement in STEM assessment scores</p>
                </div>
                <div class="benefit-item">
                  <h4>🎯 Increased Engagement</h4>
                  <p>40% increase in student participation and classroom engagement</p>
                </div>
                <div class="benefit-item">
                  <h4>👨‍🎓 Career Readiness</h4>
                  <p>Students gain valuable skills in technology, data analysis, and problem-solving</p>
                </div>
                <div class="benefit-item">
                  <h4>🏆 Recognition</h4>
                  <p>Schools using Tender Cells win 3x more science fair awards</p>
                </div>
              </div>
            </div>
            
            <div class="roi-calculator-tool">
              <h3>ROI Calculator</h3>
              <form class="calculator-form">
                <div class="form-group">
                  <label for="studentCount">Number of Students</label>
                  <input type="number" id="studentCount" value="100" min="1">
                </div>
                
                <div class="form-group">
                  <label for="packageType">Package Type</label>
                  <select id="packageType">
                    <option value="1999">Classroom Starter ($1,999)</option>
                    <option value="7999" selected>School Package ($7,999)</option>
                    <option value="24999">District Enterprise ($24,999)</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="yearsUsed">Years of Use</label>
                  <input type="number" id="yearsUsed" value="5" min="1" max="10">
                </div>
                
                <div class="calculator-results">
                  <div class="result-item">
                    <span class="result-label">Cost per student per year:</span>
                    <span class="result-value" id="costPerStudent">$16.00</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Estimated test score improvement:</span>
                    <span class="result-value" id="scoreImprovement">25%</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Students reached over 5 years:</span>
                    <span class="result-value" id="studentsReached">500</span>
                  </div>
                  <div class="result-item total">
                    <span class="result-label">Total ROI Value:</span>
                    <span class="result-value" id="totalROI">$40,000</span>
                  </div>
                </div>
                
                <button type="button" class="btn btn-primary" onclick="calculateROI()">Recalculate</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Special Offers -->
      <section class="special-offers">
        <div class="container">
          <h2>Limited Time Offers</h2>
          <div class="offers-grid">
            <div class="offer-card">
              <div class="offer-badge">New Customer</div>
              <h3>First-Time Buyer Discount</h3>
              <p class="offer-discount">Save 15%</p>
              <p>New schools get 15% off their first Tender Cells package, plus free shipping and setup assistance.</p>
              <div class="offer-details">
                <p><strong>Valid until:</strong> March 31, 2025</p>
                <p><strong>Code:</strong> NEWSCHOOL15</p>
              </div>
              <button class="btn btn-primary">Claim Offer</button>
            </div>
            
            <div class="offer-card">
              <div class="offer-badge">Summer Special</div>
              <h3>Summer Implementation Program</h3>
              <p class="offer-discount">Free Training</p>
              <p>Order by June 1st and receive free summer teacher training workshops (valued at $2,000).</p>
              <div class="offer-details">
                <p><strong>Valid until:</strong> June 1, 2025</p>
                <p><strong>Includes:</strong> 16 hours of training</p>
              </div>
              <button class="btn btn-primary">Learn More</button>
            </div>
            
            <div class="offer-card">
              <div class="offer-badge">Bundle Deal</div>
              <h3>Multi-School District Bundle</h3>
              <p class="offer-discount">Up to 25% Off</p>
              <p>Districts ordering for 3+ schools receive progressive discounts and enhanced support packages.</p>
              <div class="offer-details">
                <p><strong>3 schools:</strong> 15% discount</p>
                <p><strong>5+ schools:</strong> 25% discount</p>
              </div>
              <button class="btn btn-primary">Get Quote</button>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="pricing-faq">
        <div class="container">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-grid">
            <div class="faq-item">
              <h4>What's included in the warranty?</h4>
              <p>Our warranty covers all hardware defects, software updates, and technical support. We also provide replacement units if needed during the warranty period.</p>
            </div>
            
            <div class="faq-item">
              <h4>Can we upgrade our package later?</h4>
              <p>Yes! You can upgrade to a larger package at any time. We'll credit your original purchase toward the new package price.</p>
            </div>
            
            <div class="faq-item">
              <h4>Do you offer discounts for non-profit schools?</h4>
              <p>We offer special pricing for Title I schools, non-profits, and schools in underserved communities. Contact us for details.</p>
            </div>
            
            <div class="faq-item">
              <h4>What if we need more training?</h4>
              <p>Additional training sessions are available at $200/hour. We also offer train-the-trainer programs for larger implementations.</p>
            </div>
            
            <div class="faq-item">
              <h4>Is there a minimum commitment period?</h4>
              <p>No minimum commitment required. However, we recommend at least one full academic year to see the full benefits of the program.</p>
            </div>
            
            <div class="faq-item">
              <h4>Can we try before we buy?</h4>
              <p>Yes! We offer 30-day trial programs for qualified schools. Contact us to arrange a demonstration and trial period.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="pricing-contact">
        <div class="container">
          <div class="contact-content">
            <div class="contact-text">
              <h2>Ready to Get Started?</h2>
              <p>Our education specialists are here to help you choose the right package and answer any questions about implementation, training, or financing.</p>
              
              <div class="contact-methods">
                <div class="contact-method">
                  <div class="contact-icon">📞</div>
                  <div>
                    <h4>Call Us</h4>
                    <p>1-800-TENDER-EDU</p>
                    <span>Mon-Fri 8AM-6PM EST</span>
                  </div>
                </div>
                
                <div class="contact-method">
                  <div class="contact-icon">📧</div>
                  <div>
                    <h4>Email Us</h4>
                    <p>education@tendercells.com</p>
                    <span>Response within 24 hours</span>
                  </div>
                </div>
                
                <div class="contact-method">
                  <div class="contact-icon">💬</div>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available on our website</p>
                    <span>Mon-Fri 9AM-5PM EST</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="quote-form">
              <h3>Request Custom Quote</h3>
              <form class="pricing-quote-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName">First Name *</label>
                    <input type="text" id="firstName" required>
                  </div>
                  <div class="form-group">
                    <label for="lastName">Last Name *</label>
                    <input type="text" id="lastName" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="email">Email *</label>
                  <input type="email" id="email" required>
                </div>
                
                <div class="form-group">
                  <label for="phone">Phone Number</label>
                  <input type="tel" id="phone">
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="school">School/District *</label>
                    <input type="text" id="school" required>
                  </div>
                  <div class="form-group">
                    <label for="role">Your Role *</label>
                    <select id="role" required>
                      <option value="">Select Role</option>
                      <option value="teacher">Teacher</option>
                      <option value="principal">Principal</option>
                      <option value="administrator">Administrator</option>
                      <option value="curriculum-coordinator">Curriculum Coordinator</option>
                      <option value="technology-director">Technology Director</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="studentCount">Number of Students</label>
                    <input type="number" id="studentCount" min="1">
                  </div>
                  <div class="form-group">
                    <label for="packageInterest">Package Interest</label>
                    <select id="packageInterest">
                      <option value="">Select Package</option>
                      <option value="classroom">Classroom Starter</option>
                      <option value="school">School Package</option>
                      <option value="district">District Enterprise</option>
                      <option value="university">University Research</option>
                      <option value="custom">Custom Solution</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="timeline">Implementation Timeline</label>
                  <select id="timeline">
                    <option value="">Select Timeline</option>
                    <option value="immediate">Immediate (within 30 days)</option>
                    <option value="semester">This semester</option>
                    <option value="next-year">Next school year</option>
                    <option value="planning">Still planning</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="budget">Budget Range</label>
                  <select id="budget">
                    <option value="">Select Budget</option>
                    <option value="under-5k">Under $5,000</option>
                    <option value="5k-15k">$5,000 - $15,000</option>
                    <option value="15k-30k">$15,000 - $30,000</option>
                    <option value="over-30k">Over $30,000</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="message">Additional Information</label>
                  <textarea id="message" rows="3" placeholder="Tell us about your specific needs, questions, or goals..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Request Quote</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeEducationalPricingPage() {
  // ROI Calculator functionality
  window.calculateROI = function() {
    const studentCount = parseInt(document.getElementById('studentCount').value) || 100;
    const packageCost = parseInt(document.getElementById('packageType').value) || 7999;
    const yearsUsed = parseInt(document.getElementById('yearsUsed').value) || 5;
    
    const costPerStudent = (packageCost / (studentCount * yearsUsed)).toFixed(2);
    const studentsReached = studentCount * yearsUsed;
    const totalROI = (studentsReached * 80).toLocaleString(); // $80 value per student
    
    document.getElementById('costPerStudent').textContent = `$${costPerStudent}`;
    document.getElementById('studentsReached').textContent = studentsReached.toLocaleString();
    document.getElementById('totalROI').textContent = `$${totalROI}`;
  };
  
  // Auto-calculate on input change
  const calculatorInputs = document.querySelectorAll('.calculator-form input, .calculator-form select');
  calculatorInputs.forEach(input => {
    input.addEventListener('change', calculateROI);
  });
  
  // Quote form submission
  const quoteForm = document.querySelector('.pricing-quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      alert(`Thank you for your interest! We'll prepare a custom quote for ${data.school} and contact you within 24 hours.`);
      e.target.reset();
    });
  }
  
  // Initial ROI calculation
  calculateROI();
  
  console.log('Educational Pricing page initialized');
}
// Tender Cells in Education Page
export function createEducationPage() {
  return `
    <div class="education-page">
      <!-- Hero Section -->
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>Tender Cells in Education</h1>
              <p class="education-tagline">Bringing smart farming technology to the classroom</p>
              <p class="education-description">
                Empower the next generation of farmers and technologists with hands-on experience in 
                smart agriculture, IoT systems, and sustainable farming practices through our comprehensive 
                educational programs and resources.
              </p>
              <div class="education-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Request Curriculum
                </button>
                <button class="btn btn-secondary btn-large">
                  Schedule Demo
                </button>
              </div>
            </div>
            <div class="education-hero-image">
              <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Students learning smart farming">
            </div>
          </div>
        </div>
      </section>

      <!-- Educational Programs -->
      <section class="education-programs">
        <div class="container">
          <h2>Educational Programs</h2>
          <div class="programs-grid">
            <div class="program-card">
              <div class="program-icon">🎓</div>
              <h3>K-12 STEM Curriculum</h3>
              <p>Age-appropriate lessons integrating agriculture, technology, and environmental science for elementary through high school students.</p>
              <ul class="program-features">
                <li>Interactive lesson plans</li>
                <li>Hands-on experiments</li>
                <li>Assessment rubrics</li>
                <li>Teacher training materials</li>
              </ul>
              <button class="btn btn-secondary">Learn More</button>
            </div>
            
            <div class="program-card">
              <div class="program-icon">🏫</div>
              <h3>University Research Programs</h3>
              <p>Advanced coursework and research opportunities for agricultural engineering, computer science, and sustainability programs.</p>
              <ul class="program-features">
                <li>Research project templates</li>
                <li>Data analysis tools</li>
                <li>Publication opportunities</li>
                <li>Industry partnerships</li>
              </ul>
              <button class="btn btn-secondary">Learn More</button>
            </div>
            
            <div class="program-card">
              <div class="program-icon">👨‍🏫</div>
              <h3>Professional Development</h3>
              <p>Training programs for educators to integrate smart farming technology into their existing curriculum.</p>
              <ul class="program-features">
                <li>Workshop series</li>
                <li>Certification programs</li>
                <li>Online resources</li>
                <li>Peer networking</li>
              </ul>
              <button class="btn btn-secondary">Learn More</button>
            </div>
            
            <div class="program-card">
              <div class="program-icon">🌱</div>
              <h3>FFA & 4-H Integration</h3>
              <p>Specialized programs designed for agricultural youth organizations and competitive events.</p>
              <ul class="program-features">
                <li>Competition frameworks</li>
                <li>Project guidelines</li>
                <li>Mentorship programs</li>
                <li>Scholarship opportunities</li>
              </ul>
              <button class="btn btn-secondary">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Curriculum Overview -->
      <section class="curriculum-overview">
        <div class="container">
          <div class="curriculum-content">
            <div class="curriculum-text">
              <h2>Comprehensive Curriculum Framework</h2>
              <p>Our educational framework covers the intersection of agriculture, technology, and sustainability through progressive learning modules.</p>
              
              <div class="curriculum-modules">
                <div class="module-item">
                  <div class="module-number">01</div>
                  <div class="module-content">
                    <h4>Introduction to Smart Agriculture</h4>
                    <p>Basic concepts of precision farming, IoT sensors, and data-driven decision making</p>
                  </div>
                </div>
                
                <div class="module-item">
                  <div class="module-number">02</div>
                  <div class="module-content">
                    <h4>Animal Husbandry & Technology</h4>
                    <p>Modern livestock management using automated systems and health monitoring</p>
                  </div>
                </div>
                
                <div class="module-item">
                  <div class="module-number">03</div>
                  <div class="module-content">
                    <h4>Environmental Monitoring</h4>
                    <p>Climate control, soil health, and sustainable farming practices</p>
                  </div>
                </div>
                
                <div class="module-item">
                  <div class="module-number">04</div>
                  <div class="module-content">
                    <h4>Data Analysis & AI</h4>
                    <p>Using artificial intelligence for predictive analytics and optimization</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="curriculum-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Smart farming curriculum">
            </div>
          </div>
        </div>
      </section>

      <!-- Case Studies -->
      <section class="case-studies">
        <div class="container">
          <h2>Success Stories</h2>
          <div class="case-studies-grid">
            <div class="case-study-card">
              <div class="case-study-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Lincoln High School">
              </div>
              <div class="case-study-content">
                <h3>Lincoln High School Agricultural Program</h3>
                <p class="case-study-location">Nebraska, USA</p>
                <p>Integrated Chicken Tender systems into their agricultural science curriculum, resulting in 40% increase in student engagement and improved test scores in STEM subjects.</p>
                <div class="case-study-stats">
                  <div class="stat">
                    <span class="stat-number">150+</span>
                    <span class="stat-label">Students Engaged</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">40%</span>
                    <span class="stat-label">Engagement Increase</span>
                  </div>
                </div>
                <button class="btn btn-secondary btn-small">Read Full Case Study</button>
              </div>
            </div>
            
            <div class="case-study-card">
              <div class="case-study-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="State University">
              </div>
              <div class="case-study-content">
                <h3>State University Research Project</h3>
                <p class="case-study-location">California, USA</p>
                <p>Graduate students used Tender Cells platform for thesis research on sustainable farming practices, leading to 3 published papers and industry partnerships.</p>
                <div class="case-study-stats">
                  <div class="stat">
                    <span class="stat-number">25</span>
                    <span class="stat-label">Research Projects</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">3</span>
                    <span class="stat-label">Publications</span>
                  </div>
                </div>
                <button class="btn btn-secondary btn-small">Read Full Case Study</button>
              </div>
            </div>
            
            <div class="case-study-card">
              <div class="case-study-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="4-H Club">
              </div>
              <div class="case-study-content">
                <h3>Regional 4-H Technology Competition</h3>
                <p class="case-study-location">Texas, USA</p>
                <p>4-H members used Tender Cells applications to develop award-winning projects, with 5 students receiving state-level recognition and scholarships.</p>
                <div class="case-study-stats">
                  <div class="stat">
                    <span class="stat-number">50+</span>
                    <span class="stat-label">Participants</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">5</span>
                    <span class="stat-label">State Awards</span>
                  </div>
                </div>
                <button class="btn btn-secondary btn-small">Read Full Case Study</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Teacher Resources -->
      <section class="teacher-resources">
        <div class="container">
          <h2>Teacher Resources</h2>
          <div class="resources-grid">
            <div class="resource-card">
              <div class="resource-icon">📚</div>
              <h3>Lesson Plans</h3>
              <p>Ready-to-use lesson plans aligned with NGSS and state standards</p>
              <ul>
                <li>Grades K-12 coverage</li>
                <li>Hands-on activities</li>
                <li>Assessment tools</li>
                <li>Extension projects</li>
              </ul>
              <button class="btn btn-primary">Download Resources</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">🎥</div>
              <h3>Video Tutorials</h3>
              <p>Step-by-step video guides for teachers and students</p>
              <ul>
                <li>Setup instructions</li>
                <li>Data interpretation</li>
                <li>Troubleshooting guides</li>
                <li>Best practices</li>
              </ul>
              <button class="btn btn-primary">Watch Videos</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">🔬</div>
              <h3>Lab Activities</h3>
              <p>Structured experiments and investigations using Tender Cells technology</p>
              <ul>
                <li>Scientific method practice</li>
                <li>Data collection sheets</li>
                <li>Analysis templates</li>
                <li>Report formats</li>
              </ul>
              <button class="btn btn-primary">Access Labs</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">👥</div>
              <h3>Community Forum</h3>
              <p>Connect with other educators using Tender Cells in their classrooms</p>
              <ul>
                <li>Share experiences</li>
                <li>Ask questions</li>
                <li>Collaborate on projects</li>
                <li>Access support</li>
              </ul>
              <button class="btn btn-primary">Join Community</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Student Projects -->
      <section class="student-projects">
        <div class="container">
          <h2>Student Project Showcase</h2>
          <div class="projects-grid">
            <div class="project-card">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Student project">
              </div>
              <div class="project-content">
                <h4>Automated Chicken Coop Monitoring</h4>
                <p class="project-school">Madison High School - Grade 11</p>
                <p>Students designed and implemented a complete monitoring system for their school's chicken coop, including temperature alerts and egg production tracking.</p>
                <div class="project-tags">
                  <span class="tag">IoT</span>
                  <span class="tag">Data Analysis</span>
                  <span class="tag">Agriculture</span>
                </div>
              </div>
            </div>
            
            <div class="project-card">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Student project">
              </div>
              <div class="project-content">
                <h4>Sustainable Farming Analysis</h4>
                <p class="project-school">Roosevelt Middle School - Grade 8</p>
                <p>Middle school students used Tender Cells data to analyze the environmental impact of different farming practices and present solutions to local farmers.</p>
                <div class="project-tags">
                  <span class="tag">Sustainability</span>
                  <span class="tag">Research</span>
                  <span class="tag">Community</span>
                </div>
              </div>
            </div>
            
            <div class="project-card">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Student project">
              </div>
              <div class="project-content">
                <h4>AI-Powered Health Prediction</h4>
                <p class="project-school">Tech University - Undergraduate</p>
                <p>Computer science students developed machine learning algorithms to predict animal health issues using Tender Cells sensor data.</p>
                <div class="project-tags">
                  <span class="tag">AI/ML</span>
                  <span class="tag">Programming</span>
                  <span class="tag">Health Tech</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="projects-cta">
            <h3>Share Your Student Projects</h3>
            <p>We love seeing what students create with Tender Cells technology!</p>
            <button class="btn btn-primary">Submit Project</button>
          </div>
        </div>
      </section>

      <!-- Pricing for Education -->
      <section class="education-pricing">
        <div class="container">
          <h2>Educational Pricing</h2>
          <div class="pricing-grid">
            <div class="pricing-card">
              <div class="pricing-header">
                <h3>Classroom Package</h3>
                <div class="price">
                  <span class="price-current">$1,999</span>
                  <span class="price-note">per classroom</span>
                </div>
              </div>
              <div class="pricing-features">
                <ul>
                  <li>✅ 1 Chicken Tender system</li>
                  <li>✅ Complete curriculum package</li>
                  <li>✅ Teacher training (4 hours)</li>
                  <li>✅ Student workbooks (30 copies)</li>
                  <li>✅ 1-year support</li>
                  <li>✅ Assessment tools</li>
                </ul>
              </div>
              <button class="btn btn-primary">Request Quote</button>
            </div>
            
            <div class="pricing-card featured">
              <div class="pricing-header">
                <h3>School District Package</h3>
                <div class="price">
                  <span class="price-current">$15,999</span>
                  <span class="price-note">per district</span>
                </div>
              </div>
              <div class="pricing-features">
                <ul>
                  <li>✅ 10 Chicken Tender systems</li>
                  <li>✅ Complete curriculum for all grades</li>
                  <li>✅ Professional development (20 hours)</li>
                  <li>✅ Unlimited student materials</li>
                  <li>✅ 3-year support & updates</li>
                  <li>✅ Custom implementation plan</li>
                </ul>
              </div>
              <button class="btn btn-primary">Contact Sales</button>
            </div>
            
            <div class="pricing-card">
              <div class="pricing-header">
                <h3>University Research</h3>
                <div class="price">
                  <span class="price-current">Custom</span>
                  <span class="price-note">pricing</span>
                </div>
              </div>
              <div class="pricing-features">
                <ul>
                  <li>✅ Multiple system configurations</li>
                  <li>✅ Research collaboration</li>
                  <li>✅ Data access & APIs</li>
                  <li>✅ Publication support</li>
                  <li>✅ Graduate student training</li>
                  <li>✅ Industry partnerships</li>
                </ul>
              </div>
              <button class="btn btn-primary">Discuss Needs</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="education-contact">
        <div class="container">
          <div class="contact-content">
            <div class="contact-text">
              <h2>Ready to Bring Smart Farming to Your Classroom?</h2>
              <p>Our education team is here to help you integrate Tender Cells technology into your curriculum and support your students' learning journey.</p>
              
              <div class="contact-info">
                <div class="contact-item">
                  <div class="contact-icon">📧</div>
                  <div>
                    <h4>Email Us</h4>
                    <p>education@tendercells.com</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">📞</div>
                  <div>
                    <h4>Call Us</h4>
                    <p>1-800-TENDER-CELLS</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">💬</div>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available Mon-Fri 9AM-5PM EST</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="contact-form">
              <h3>Request Information</h3>
              <form class="education-contact-form">
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
                  <label for="school">School/Institution *</label>
                  <input type="text" id="school" required>
                </div>
                
                <div class="form-group">
                  <label for="role">Role *</label>
                  <select id="role" required>
                    <option value="">Select Role</option>
                    <option value="teacher">Teacher</option>
                    <option value="administrator">Administrator</option>
                    <option value="curriculum-coordinator">Curriculum Coordinator</option>
                    <option value="researcher">Researcher</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="interest">Area of Interest</label>
                  <select id="interest">
                    <option value="">Select Interest</option>
                    <option value="k12-curriculum">K-12 Curriculum</option>
                    <option value="university-research">University Research</option>
                    <option value="professional-development">Professional Development</option>
                    <option value="ffa-4h">FFA/4-H Programs</option>
                    <option value="custom-solution">Custom Solution</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="message">Message</label>
                  <textarea id="message" rows="4" placeholder="Tell us about your educational goals and how we can help..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Send Request</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeEducationPage() {
  // Contact form handler
  const form = document.querySelector('.education-contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      // Simulate form submission
      alert(`Thank you for your interest! We'll contact you at ${data.email} within 24 hours.`);
      e.target.reset();
    });
  }
  
  console.log('Education page initialized');
}
// Student Project Showcase Page
export function createStudentProjectsPage() {
  return `
    <div class="education-page">
      <!-- Hero Section -->
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>Student Project Showcase</h1>
              <p class="education-tagline">Celebrating innovation in smart farming education</p>
              <p class="education-description">
                Discover amazing projects created by students using Tender Cells technology. 
                From elementary school observations to advanced AI applications, see how 
                students are solving real-world agricultural challenges.
              </p>
              <div class="education-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Submit Your Project
                </button>
                <button class="btn btn-secondary btn-large">
                  Browse All Projects
                </button>
              </div>
            </div>
            <div class="education-hero-image">
              <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Student Projects">
            </div>
          </div>
        </div>
      </section>

      <!-- Project Statistics -->
      <section class="project-stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <h3>500+</h3>
              <p>Student Projects</p>
            </div>
            <div class="stat-card">
              <h3>150+</h3>
              <p>Schools Participating</p>
            </div>
            <div class="stat-card">
              <h3>25+</h3>
              <p>Award Winners</p>
            </div>
            <div class="stat-card">
              <h3>12</h3>
              <p>Countries Represented</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Projects -->
      <section class="featured-projects">
        <div class="container">
          <h2>Featured Projects</h2>
          <p class="featured-description">Outstanding student work that demonstrates innovation, creativity, and technical excellence.</p>
          
          <div class="featured-grid">
            <div class="project-card featured">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="AI Health Prediction">
                <div class="project-badge">🏆 National Winner</div>
              </div>
              <div class="project-content">
                <div class="project-header">
                  <h3>AI-Powered Chicken Health Prediction System</h3>
                  <div class="project-meta">
                    <span class="school">Lincoln Tech High School</span>
                    <span class="grade">Grade 12</span>
                    <span class="location">Nebraska, USA</span>
                  </div>
                </div>
                <p class="project-description">
                  Sarah and her team developed a machine learning model that predicts chicken health issues 
                  3-5 days before symptoms appear, using behavioral data from Tender Cells sensors. 
                  The system achieved 94% accuracy in early disease detection.
                </p>
                <div class="project-details">
                  <div class="project-technologies">
                    <span class="tech-tag">Python</span>
                    <span class="tech-tag">Machine Learning</span>
                    <span class="tech-tag">Data Analysis</span>
                    <span class="tech-tag">IoT Sensors</span>
                  </div>
                  <div class="project-impact">
                    <h4>Impact:</h4>
                    <ul>
                      <li>Reduced veterinary costs by 40%</li>
                      <li>Improved flock health outcomes</li>
                      <li>Published in student research journal</li>
                    </ul>
                  </div>
                </div>
                <div class="project-actions">
                  <button class="btn btn-primary">View Full Project</button>
                  <button class="btn btn-secondary">Download Report</button>
                </div>
              </div>
            </div>
            
            <div class="project-card featured">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Sustainable Farming">
                <div class="project-badge">🌱 Sustainability Award</div>
              </div>
              <div class="project-content">
                <div class="project-header">
                  <h3>Carbon Footprint Reduction in Small Farms</h3>
                  <div class="project-meta">
                    <span class="school">Green Valley Middle School</span>
                    <span class="grade">Grade 8</span>
                    <span class="location">California, USA</span>
                  </div>
                </div>
                <p class="project-description">
                  Marcus investigated how smart farming technology can reduce carbon emissions on small farms. 
                  His research showed that optimized feeding schedules and climate control can reduce 
                  energy consumption by up to 30%.
                </p>
                <div class="project-details">
                  <div class="project-technologies">
                    <span class="tech-tag">Environmental Science</span>
                    <span class="tech-tag">Data Collection</span>
                    <span class="tech-tag">Sustainability</span>
                    <span class="tech-tag">Research Methods</span>
                  </div>
                  <div class="project-impact">
                    <h4>Impact:</h4>
                    <ul>
                      <li>Presented to local farming community</li>
                      <li>Adopted by 5 local farms</li>
                      <li>Featured in regional science fair</li>
                    </ul>
                  </div>
                </div>
                <div class="project-actions">
                  <button class="btn btn-primary">View Full Project</button>
                  <button class="btn btn-secondary">Download Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Project Categories -->
      <section class="project-categories">
        <div class="container">
          <h2>Project Categories</h2>
          <div class="category-filters">
            <button class="filter-btn active" data-category="all">All Projects</button>
            <button class="filter-btn" data-category="elementary">Elementary</button>
            <button class="filter-btn" data-category="middle">Middle School</button>
            <button class="filter-btn" data-category="high">High School</button>
            <button class="filter-btn" data-category="university">University</button>
          </div>
          
          <div class="projects-grid" id="projectsGrid">
            <!-- Elementary Projects -->
            <div class="project-card" data-category="elementary">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Egg Counting">
              </div>
              <div class="project-content">
                <h4>Daily Egg Counting Chart</h4>
                <div class="project-meta">
                  <span class="school">Sunny Elementary</span>
                  <span class="grade">Grade 3</span>
                </div>
                <p>Students created colorful charts to track daily egg production and learned about patterns in data.</p>
                <div class="project-tags">
                  <span class="tag">Math</span>
                  <span class="tag">Data Collection</span>
                  <span class="tag">Observation</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <div class="project-card" data-category="elementary">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Weather Station">
              </div>
              <div class="project-content">
                <h4>Classroom Weather Station</h4>
                <div class="project-meta">
                  <span class="school">Oak Tree Elementary</span>
                  <span class="grade">Grade 4</span>
                </div>
                <p>Fourth graders built a simple weather monitoring station to understand how weather affects farm animals.</p>
                <div class="project-tags">
                  <span class="tag">Science</span>
                  <span class="tag">Weather</span>
                  <span class="tag">Building</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <!-- Middle School Projects -->
            <div class="project-card" data-category="middle">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Automated Feeder">
              </div>
              <div class="project-content">
                <h4>Automated Chicken Feeder Design</h4>
                <div class="project-meta">
                  <span class="school">Roosevelt Middle School</span>
                  <span class="grade">Grade 7</span>
                </div>
                <p>Students designed and built an automated feeding system using simple motors and timers.</p>
                <div class="project-tags">
                  <span class="tag">Engineering</span>
                  <span class="tag">Automation</span>
                  <span class="tag">Problem Solving</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <div class="project-card" data-category="middle">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Data Analysis">
              </div>
              <div class="project-content">
                <h4>Feed Efficiency Analysis</h4>
                <div class="project-meta">
                  <span class="school">Jefferson Middle School</span>
                  <span class="grade">Grade 8</span>
                </div>
                <p>Eighth graders analyzed feed consumption data to determine the most efficient feeding schedules.</p>
                <div class="project-tags">
                  <span class="tag">Data Analysis</span>
                  <span class="tag">Statistics</span>
                  <span class="tag">Optimization</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <!-- High School Projects -->
            <div class="project-card" data-category="high">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="IoT System">
              </div>
              <div class="project-content">
                <h4>Complete IoT Monitoring System</h4>
                <div class="project-meta">
                  <span class="school">Tech Valley High School</span>
                  <span class="grade">Grade 11</span>
                </div>
                <p>Advanced students built a complete IoT system with custom sensors, data logging, and mobile alerts.</p>
                <div class="project-tags">
                  <span class="tag">IoT</span>
                  <span class="tag">Programming</span>
                  <span class="tag">Mobile Apps</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <div class="project-card" data-category="high">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Behavior Analysis">
              </div>
              <div class="project-content">
                <h4>Chicken Behavior Pattern Recognition</h4>
                <div class="project-meta">
                  <span class="school">Innovation High School</span>
                  <span class="grade">Grade 12</span>
                </div>
                <p>Senior project using computer vision to analyze and classify chicken behaviors for health monitoring.</p>
                <div class="project-tags">
                  <span class="tag">Computer Vision</span>
                  <span class="tag">AI</span>
                  <span class="tag">Behavior Analysis</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <!-- University Projects -->
            <div class="project-card" data-category="university">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Research Project">
              </div>
              <div class="project-content">
                <h4>Predictive Analytics for Livestock Health</h4>
                <div class="project-meta">
                  <span class="school">State Agricultural University</span>
                  <span class="grade">Graduate Research</span>
                </div>
                <p>Master's thesis research on using machine learning for early disease detection in poultry operations.</p>
                <div class="project-tags">
                  <span class="tag">Machine Learning</span>
                  <span class="tag">Research</span>
                  <span class="tag">Health Monitoring</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
            
            <div class="project-card" data-category="university">
              <div class="project-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Sustainability Research">
              </div>
              <div class="project-content">
                <h4>Sustainable Agriculture Technology Assessment</h4>
                <div class="project-meta">
                  <span class="school">Environmental Science Institute</span>
                  <span class="grade">PhD Research</span>
                </div>
                <p>Comprehensive study on the environmental impact and sustainability benefits of smart farming technologies.</p>
                <div class="project-tags">
                  <span class="tag">Sustainability</span>
                  <span class="tag">Environmental Impact</span>
                  <span class="tag">Policy Research</span>
                </div>
                <button class="btn btn-secondary btn-small">View Project</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Awards & Recognition -->
      <section class="awards-recognition">
        <div class="container">
          <h2>Awards & Recognition</h2>
          <p class="awards-description">Celebrating outstanding student achievements in smart farming education.</p>
          
          <div class="awards-grid">
            <div class="award-category">
              <h3>🏆 National Science Fair Winners</h3>
              <div class="award-winners">
                <div class="winner">
                  <div class="winner-info">
                    <h4>Sarah Chen - 1st Place</h4>
                    <p>AI Health Prediction System</p>
                    <span class="school">Lincoln Tech High School</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
                <div class="winner">
                  <div class="winner-info">
                    <h4>Marcus Rodriguez - 2nd Place</h4>
                    <p>Carbon Footprint Reduction Study</p>
                    <span class="school">Green Valley Middle School</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
                <div class="winner">
                  <div class="winner-info">
                    <h4>Team Phoenix - 3rd Place</h4>
                    <p>Automated Farm Management System</p>
                    <span class="school">Innovation High School</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
              </div>
            </div>
            
            <div class="award-category">
              <h3>🌱 Sustainability Excellence Awards</h3>
              <div class="award-winners">
                <div class="winner">
                  <div class="winner-info">
                    <h4>Emma Thompson</h4>
                    <p>Water Conservation in Smart Farming</p>
                    <span class="school">Riverside Elementary</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
                <div class="winner">
                  <div class="winner-info">
                    <h4>David Kim</h4>
                    <p>Renewable Energy Integration</p>
                    <span class="school">Tech Valley High School</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
              </div>
            </div>
            
            <div class="award-category">
              <h3>💡 Innovation Awards</h3>
              <div class="award-winners">
                <div class="winner">
                  <div class="winner-info">
                    <h4>Aisha Patel</h4>
                    <p>Mobile App for Farm Monitoring</p>
                    <span class="school">Central High School</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
                <div class="winner">
                  <div class="winner-info">
                    <h4>Team Innovators</h4>
                    <p>Voice-Controlled Farm Assistant</p>
                    <span class="school">Future Tech Academy</span>
                  </div>
                  <div class="award-year">2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Project Submission -->
      <section class="project-submission">
        <div class="container">
          <div class="submission-content">
            <div class="submission-text">
              <h2>Submit Your Student Project</h2>
              <p>Share your students' amazing work with the global Tender Cells education community. Projects are reviewed by our education team and featured based on innovation, educational value, and technical excellence.</p>
              
              <div class="submission-benefits">
                <h4>Benefits of Submission:</h4>
                <ul>
                  <li>Recognition for outstanding student work</li>
                  <li>Inspiration for other educators and students</li>
                  <li>Potential scholarship opportunities</li>
                  <li>Featured placement on our website</li>
                  <li>Certificate of recognition for participants</li>
                </ul>
              </div>
              
              <div class="submission-criteria">
                <h4>Submission Criteria:</h4>
                <ul>
                  <li>Project must use Tender Cells technology</li>
                  <li>Include project description and methodology</li>
                  <li>Provide photos or videos of the project</li>
                  <li>Student permission forms required</li>
                  <li>Teacher endorsement and contact information</li>
                </ul>
              </div>
            </div>
            
            <div class="submission-form">
              <h3>Project Submission Form</h3>
              <form class="project-submit-form">
                <div class="form-group">
                  <label for="projectTitle">Project Title *</label>
                  <input type="text" id="projectTitle" required>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="studentName">Student Name(s) *</label>
                    <input type="text" id="studentName" required>
                  </div>
                  <div class="form-group">
                    <label for="gradeLevel">Grade Level *</label>
                    <select id="gradeLevel" required>
                      <option value="">Select Grade</option>
                      <option value="K-2">K-2</option>
                      <option value="3-5">3-5</option>
                      <option value="6-8">6-8</option>
                      <option value="9-12">9-12</option>
                      <option value="university">University</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="schoolName">School Name *</label>
                    <input type="text" id="schoolName" required>
                  </div>
                  <div class="form-group">
                    <label for="teacherName">Teacher Name *</label>
                    <input type="text" id="teacherName" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="teacherEmail">Teacher Email *</label>
                  <input type="email" id="teacherEmail" required>
                </div>
                
                <div class="form-group">
                  <label for="projectDescription">Project Description *</label>
                  <textarea id="projectDescription" rows="4" placeholder="Describe the project, methodology, and outcomes..." required></textarea>
                </div>
                
                <div class="form-group">
                  <label for="projectCategory">Project Category *</label>
                  <select id="projectCategory" required>
                    <option value="">Select Category</option>
                    <option value="data-analysis">Data Analysis</option>
                    <option value="engineering">Engineering Design</option>
                    <option value="sustainability">Sustainability</option>
                    <option value="ai-ml">AI/Machine Learning</option>
                    <option value="iot">IoT/Sensors</option>
                    <option value="research">Research Project</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="projectFiles">Project Files</label>
                  <input type="file" id="projectFiles" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov">
                  <p class="file-note">Upload photos, videos, reports, or presentations (Max 50MB total)</p>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="permissions" required>
                    <span class="checkmark"></span>
                    I have obtained all necessary permissions from students and parents for sharing this project publicly
                  </label>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="accuracy">
                    <span class="checkmark"></span>
                    I certify that all information provided is accurate and the project authentically represents student work
                  </label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Submit Project</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Success Stories -->
      <section class="success-stories">
        <div class="container">
          <h2>Success Stories</h2>
          <p class="stories-description">Hear from students and teachers about their experiences with Tender Cells projects.</p>
          
          <div class="stories-grid">
            <div class="story-card">
              <div class="story-quote">
                "Working on the AI health prediction project opened my eyes to how technology can solve real-world problems. I'm now studying computer science in college and want to work in agricultural technology."
              </div>
              <div class="story-author">
                <div class="author-info">
                  <h4>Sarah Chen</h4>
                  <p>National Science Fair Winner</p>
                  <span>Now studying at MIT</span>
                </div>
              </div>
            </div>
            
            <div class="story-card">
              <div class="story-quote">
                "The Tender Cells program transformed my classroom. Students who were previously disengaged became excited about science and math. We saw a 40% improvement in test scores."
              </div>
              <div class="story-author">
                <div class="author-info">
                  <h4>Ms. Jennifer Martinez</h4>
                  <p>8th Grade Science Teacher</p>
                  <span>Roosevelt Middle School</span>
                </div>
              </div>
            </div>
            
            <div class="story-card">
              <div class="story-quote">
                "Building the automated feeder taught me that engineering isn't just about building things - it's about solving problems that matter to people and animals."
              </div>
              <div class="story-author">
                <div class="author-info">
                  <h4>Marcus Rodriguez</h4>
                  <p>Sustainability Award Winner</p>
                  <span>Green Valley Middle School</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeStudentProjectsPage() {
  // Category filter functionality
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-category]');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      
      // Show/hide project cards based on category
      projectCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
  
  // Project submission form
  const submitForm = document.querySelector('.project-submit-form');
  if (submitForm) {
    submitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      // Simulate form submission
      alert(`Thank you for submitting "${data.projectTitle}"! We'll review your project and contact you within 5 business days.`);
      e.target.reset();
    });
  }
  
  console.log('Student Projects page initialized');
}
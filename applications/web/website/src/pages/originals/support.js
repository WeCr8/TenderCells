// Support Page
export function createSupportPage() {
  return `
    <div class="support-page">
      <!-- Hero Section -->
      <section class="support-hero">
        <div class="container">
          <div class="support-hero-content">
            <div class="support-hero-text">
              <h1>Tender Cells Support</h1>
              <p class="support-tagline">Get the help you need, when you need it</p>
              <p class="support-description">
                Our comprehensive support system is designed to help you succeed with Tender Cells. 
                From setup assistance to advanced troubleshooting, we're here to ensure your smart 
                farming operation runs smoothly.
              </p>
              <div class="support-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Get Immediate Help
                </button>
                <button class="btn btn-secondary btn-large">
                  Browse Knowledge Base
                </button>
              </div>
            </div>
            <div class="support-hero-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Tender Cells Support">
            </div>
          </div>
        </div>
      </section>

      <!-- Support Options -->
      <section class="support-options">
        <div class="container">
          <h2>Choose Your Support Option</h2>
          <div class="support-grid">
            <div class="support-card priority">
              <div class="support-icon">🚨</div>
              <h3>Emergency Support</h3>
              <p class="support-availability">24/7 Available</p>
              <p>Critical system failures, safety concerns, or urgent issues that affect your operation.</p>
              <div class="support-features">
                <span class="feature-tag">Immediate Response</span>
                <span class="feature-tag">Phone Support</span>
                <span class="feature-tag">Remote Assistance</span>
              </div>
              <div class="support-contact">
                <strong>Call: 1-800-URGENT-TC</strong>
              </div>
              <button class="btn btn-primary">Get Emergency Help</button>
            </div>

            <div class="support-card">
              <div class="support-icon">🔧</div>
              <h3>Technical Support</h3>
              <p class="support-availability">Mon-Fri 8AM-8PM EST</p>
              <p>Hardware setup, software configuration, troubleshooting, and maintenance guidance.</p>
              <div class="support-features">
                <span class="feature-tag">Expert Technicians</span>
                <span class="feature-tag">Screen Sharing</span>
                <span class="feature-tag">Step-by-Step Guides</span>
              </div>
              <div class="support-contact">
                <strong>Call: 1-800-TENDER-TECH</strong>
              </div>
              <button class="btn btn-primary">Get Technical Help</button>
            </div>

            <div class="support-card">
              <div class="support-icon">🎓</div>
              <h3>Educational Support</h3>
              <p class="support-availability">Mon-Fri 9AM-5PM EST</p>
              <p>Curriculum questions, training assistance, and educational program guidance.</p>
              <div class="support-features">
                <span class="feature-tag">Education Specialists</span>
                <span class="feature-tag">Training Materials</span>
                <span class="feature-tag">Implementation Help</span>
              </div>
              <div class="support-contact">
                <strong>Email: education@tendercells.com</strong>
              </div>
              <button class="btn btn-primary">Get Education Help</button>
            </div>

            <div class="support-card">
              <div class="support-icon">💬</div>
              <h3>Community Support</h3>
              <p class="support-availability">24/7 Community</p>
              <p>Connect with other users, share experiences, and get help from the community.</p>
              <div class="support-features">
                <span class="feature-tag">User Forums</span>
                <span class="feature-tag">Discord Chat</span>
                <span class="feature-tag">GitHub Issues</span>
              </div>
              <div class="support-contact">
                <strong>Join: discord.gg/tendercells</strong>
              </div>
              <button class="btn btn-primary">Join Community</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Knowledge Base -->
      <section class="knowledge-base">
        <div class="container">
          <h2>Knowledge Base</h2>
          <p class="kb-description">Find answers to common questions and learn how to get the most out of your Tender Cells system.</p>
          
          <div class="kb-search">
            <input type="text" placeholder="Search knowledge base..." class="kb-search-input">
            <button class="kb-search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>

          <div class="kb-categories">
            <div class="kb-category">
              <div class="kb-category-icon">🚀</div>
              <h3>Getting Started</h3>
              <p>Setup guides, initial configuration, and first-time user tutorials.</p>
              <ul class="kb-articles">
                <li><a href="#">Quick Start Guide</a></li>
                <li><a href="#">System Requirements</a></li>
                <li><a href="#">Initial Setup Checklist</a></li>
                <li><a href="#">First Week with Tender Cells</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>

            <div class="kb-category">
              <div class="kb-category-icon">🔧</div>
              <h3>Hardware & Installation</h3>
              <p>Physical setup, hardware troubleshooting, and maintenance procedures.</p>
              <ul class="kb-articles">
                <li><a href="#">Hardware Assembly Guide</a></li>
                <li><a href="#">Sensor Calibration</a></li>
                <li><a href="#">Network Configuration</a></li>
                <li><a href="#">Maintenance Schedule</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>

            <div class="kb-category">
              <div class="kb-category-icon">📱</div>
              <h3>Software & Apps</h3>
              <p>Mobile apps, web interface, data management, and software features.</p>
              <ul class="kb-articles">
                <li><a href="#">Mobile App Setup</a></li>
                <li><a href="#">Data Export Guide</a></li>
                <li><a href="#">Alert Configuration</a></li>
                <li><a href="#">Dashboard Customization</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>

            <div class="kb-category">
              <div class="kb-category-icon">🐔</div>
              <h3>Animal Care</h3>
              <p>Best practices for animal health, feeding schedules, and care optimization.</p>
              <ul class="kb-articles">
                <li><a href="#">Optimal Feeding Schedules</a></li>
                <li><a href="#">Health Monitoring Tips</a></li>
                <li><a href="#">Environmental Controls</a></li>
                <li><a href="#">Seasonal Care Adjustments</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>

            <div class="kb-category">
              <div class="kb-category-icon">📊</div>
              <h3>Data & Analytics</h3>
              <p>Understanding your data, creating reports, and making data-driven decisions.</p>
              <ul class="kb-articles">
                <li><a href="#">Reading Your Dashboard</a></li>
                <li><a href="#">Creating Custom Reports</a></li>
                <li><a href="#">Data Analysis Best Practices</a></li>
                <li><a href="#">Trend Identification</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>

            <div class="kb-category">
              <div class="kb-category-icon">❓</div>
              <h3>Troubleshooting</h3>
              <p>Common issues, error messages, and step-by-step problem resolution.</p>
              <ul class="kb-articles">
                <li><a href="#">Connection Issues</a></li>
                <li><a href="#">Sensor Problems</a></li>
                <li><a href="#">App Sync Issues</a></li>
                <li><a href="#">Performance Optimization</a></li>
              </ul>
              <button class="btn btn-secondary">View All Articles</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Video Tutorials -->
      <section class="video-tutorials">
        <div class="container">
          <h2>Video Tutorials</h2>
          <p class="tutorials-description">Watch step-by-step video guides to master your Tender Cells system.</p>
          
          <div class="tutorials-grid">
            <div class="tutorial-card">
              <div class="tutorial-video">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Setup Tutorial">
                <div class="play-button">▶</div>
                <div class="video-duration">12:34</div>
              </div>
              <div class="tutorial-content">
                <h4>Complete System Setup</h4>
                <p>Follow along as we set up a Chicken Tender system from unboxing to first data collection.</p>
                <div class="tutorial-meta">
                  <span>12 min</span>
                  <span>Beginner</span>
                  <span>2.1k views</span>
                </div>
              </div>
            </div>

            <div class="tutorial-card">
              <div class="tutorial-video">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Mobile App Tutorial">
                <div class="play-button">▶</div>
                <div class="video-duration">8:45</div>
              </div>
              <div class="tutorial-content">
                <h4>Mobile App Walkthrough</h4>
                <p>Learn how to use the Tender Cells mobile app for monitoring and controlling your system.</p>
                <div class="tutorial-meta">
                  <span>9 min</span>
                  <span>Beginner</span>
                  <span>1.8k views</span>
                </div>
              </div>
            </div>

            <div class="tutorial-card">
              <div class="tutorial-video">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Data Analysis Tutorial">
                <div class="play-button">▶</div>
                <div class="video-duration">15:22</div>
              </div>
              <div class="tutorial-content">
                <h4>Data Analysis & Insights</h4>
                <p>Discover how to interpret your data and make informed decisions about your farming operation.</p>
                <div class="tutorial-meta">
                  <span>15 min</span>
                  <span>Intermediate</span>
                  <span>3.2k views</span>
                </div>
              </div>
            </div>

            <div class="tutorial-card">
              <div class="tutorial-video">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop" alt="Troubleshooting Tutorial">
                <div class="play-button">▶</div>
                <div class="video-duration">10:18</div>
              </div>
              <div class="tutorial-content">
                <h4>Common Troubleshooting</h4>
                <p>Learn how to diagnose and fix the most common issues with your Tender Cells system.</p>
                <div class="tutorial-meta">
                  <span>10 min</span>
                  <span>Intermediate</span>
                  <span>1.5k views</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="tutorials-cta">
            <button class="btn btn-primary">View All Tutorials</button>
          </div>
        </div>
      </section>

      <!-- Support Stats -->
      <section class="support-stats">
        <div class="container">
          <h2>Our Support Performance</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>< 4 hours</h3>
              <p>Average Response Time</p>
            </div>
            <div class="stat-card">
              <h3>98.5%</h3>
              <p>Customer Satisfaction</p>
            </div>
            <div class="stat-card">
              <h3>24/7</h3>
              <p>Emergency Support</p>
            </div>
            <div class="stat-card">
              <h3>500+</h3>
              <p>Knowledge Base Articles</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact CTA -->
      <section class="support-contact-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Still Need Help?</h2>
            <p>Can't find what you're looking for? Our support team is ready to assist you with personalized help.</p>
            <div class="cta-buttons">
              <button class="btn btn-primary btn-large">Contact Support</button>
              <button class="btn btn-secondary btn-large">Schedule a Call</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeSupportPage() {
  // Knowledge base search
  const kbSearch = document.querySelector('.kb-search-input');
  const kbSearchBtn = document.querySelector('.kb-search-btn');
  
  function performKBSearch() {
    const query = kbSearch.value.trim();
    if (query) {
      alert(`Searching knowledge base for: "${query}"`);
      // In a real implementation, this would filter articles
    }
  }

  if (kbSearchBtn) {
    kbSearchBtn.addEventListener('click', performKBSearch);
  }
  
  if (kbSearch) {
    kbSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performKBSearch();
      }
    });
  }
  
  console.log('Support page initialized');
}
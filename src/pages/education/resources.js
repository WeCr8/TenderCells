// Teacher Resources Page
export function createTeacherResourcesPage() {
  return `
    <div class="education-page">
      <!-- Hero Section -->
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>Teacher Resources</h1>
              <p class="education-tagline">Everything you need to succeed in smart farming education</p>
              <p class="education-description">
                Comprehensive collection of lesson plans, video tutorials, lab activities, and 
                community support designed to help educators successfully integrate Tender Cells 
                technology into their curriculum.
              </p>
              <div class="education-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Access Resource Library
                </button>
                <button class="btn btn-secondary btn-large">
                  Join Teacher Community
                </button>
              </div>
            </div>
            <div class="education-hero-image">
              <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Teacher Resources">
            </div>
          </div>
        </div>
      </section>

      <!-- Resource Categories -->
      <section class="resource-categories">
        <div class="container">
          <h2>Resource Categories</h2>
          <div class="categories-grid">
            <div class="resource-category featured">
              <div class="category-icon">📚</div>
              <h3>Lesson Plans</h3>
              <p class="category-count">150+ Ready-to-Use Plans</p>
              <p>Standards-aligned lesson plans for all grade levels with step-by-step instructions, materials lists, and assessment rubrics.</p>
              <div class="category-features">
                <span class="feature-tag">NGSS Aligned</span>
                <span class="feature-tag">Differentiated</span>
                <span class="feature-tag">Editable</span>
              </div>
              <button class="btn btn-primary">Browse Lessons</button>
            </div>

            <div class="resource-category">
              <div class="category-icon">🎥</div>
              <h3>Video Tutorials</h3>
              <p class="category-count">75+ HD Videos</p>
              <p>Professional video guides covering setup, operation, troubleshooting, and advanced techniques for all Tender Cells systems.</p>
              <div class="category-features">
                <span class="feature-tag">HD Quality</span>
                <span class="feature-tag">Closed Captions</span>
                <span class="feature-tag">Downloadable</span>
              </div>
              <button class="btn btn-primary">Watch Videos</button>
            </div>

            <div class="resource-category">
              <div class="category-icon">🔬</div>
              <h3>Lab Activities</h3>
              <p class="category-count">100+ Experiments</p>
              <p>Hands-on laboratory activities and investigations using real Tender Cells technology and data.</p>
              <div class="category-features">
                <span class="feature-tag">Inquiry-Based</span>
                <span class="feature-tag">Safety Reviewed</span>
                <span class="feature-tag">Scalable</span>
              </div>
              <button class="btn btn-primary">Access Labs</button>
            </div>

            <div class="resource-category">
              <div class="category-icon">👥</div>
              <h3>Community Forum</h3>
              <p class="category-count">2,500+ Active Members</p>
              <p>Connect with educators worldwide, share experiences, ask questions, and collaborate on projects.</p>
              <div class="category-features">
                <span class="feature-tag">24/7 Access</span>
                <span class="feature-tag">Expert Support</span>
                <span class="feature-tag">Resource Sharing</span>
              </div>
              <button class="btn btn-primary">Join Community</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Lesson Plans Section -->
      <section class="lesson-plans-detail">
        <div class="container">
          <div class="section-header">
            <h2>Comprehensive Lesson Plans</h2>
            <p>Standards-aligned, ready-to-use lesson plans for seamless curriculum integration</p>
          </div>
          
          <div class="lesson-plans-content">
            <div class="lesson-plans-text">
              <div class="grade-level-tabs">
                <button class="tab-btn active" data-grade="elementary">Elementary (K-5)</button>
                <button class="tab-btn" data-grade="middle">Middle School (6-8)</button>
                <button class="tab-btn" data-grade="high">High School (9-12)</button>
              </div>
              
              <div class="grade-content active" id="elementary">
                <h3>Elementary School Lessons</h3>
                <div class="lesson-samples">
                  <div class="lesson-sample">
                    <h4>🐣 "Caring for Baby Chicks"</h4>
                    <p class="lesson-meta">Grade 2 • 45 minutes • NGSS K-LS1-1</p>
                    <p>Students observe and record chick behavior using simple sensors and charts.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Temperature sensors, observation charts, colored pencils
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>🌡️ "Weather and Animals"</h4>
                    <p class="lesson-meta">Grade 3 • 60 minutes • NGSS 3-LS4-3</p>
                    <p>Explore how weather affects farm animals and how technology helps keep them comfortable.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Weather station, thermometers, activity worksheets
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>📊 "Counting Eggs with Graphs"</h4>
                    <p class="lesson-meta">Grade 4 • 50 minutes • CCSS.MATH.4.MD.B.4</p>
                    <p>Create and interpret graphs using real egg production data from smart coops.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Graph paper, calculators, egg production data
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="grade-content" id="middle">
                <h3>Middle School Lessons</h3>
                <div class="lesson-samples">
                  <div class="lesson-sample">
                    <h4>🔬 "Designing Animal Habitats"</h4>
                    <p class="lesson-meta">Grade 6 • 90 minutes • NGSS MS-ETS1-2</p>
                    <p>Students design optimal habitats using engineering design process and sensor data.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Design software, sensor kits, building materials
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>📈 "Data Analysis in Agriculture"</h4>
                    <p class="lesson-meta">Grade 7 • 75 minutes • CCSS.MATH.7.SP.B.3</p>
                    <p>Analyze real farm data to identify patterns and make predictions about animal health.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Computers, spreadsheet software, real farm datasets
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>🌱 "Sustainable Farming Systems"</h4>
                    <p class="lesson-meta">Grade 8 • 100 minutes • NGSS MS-ESS3-4</p>
                    <p>Investigate how technology can make farming more sustainable and environmentally friendly.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Research materials, presentation tools, case studies
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="grade-content" id="high">
                <h3>High School Lessons</h3>
                <div class="lesson-samples">
                  <div class="lesson-sample">
                    <h4>🤖 "Introduction to Agricultural AI"</h4>
                    <p class="lesson-meta">Grade 9-12 • 120 minutes • NGSS HS-ETS1-4</p>
                    <p>Explore machine learning applications in modern agriculture and animal husbandry.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Programming environment, AI datasets, computers
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>📊 "Statistical Analysis of Farm Data"</h4>
                    <p class="lesson-meta">Grade 11-12 • 90 minutes • CCSS.MATH.HSS.ID.B.6</p>
                    <p>Use advanced statistical methods to analyze large agricultural datasets.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Statistical software, real farm data, graphing calculators
                    </div>
                  </div>
                  
                  <div class="lesson-sample">
                    <h4>🔧 "IoT System Design Project"</h4>
                    <p class="lesson-meta">Grade 10-12 • Multi-week project • NGSS HS-ETS1-1</p>
                    <p>Design and build complete IoT monitoring system for agricultural applications.</p>
                    <div class="lesson-materials">
                      <strong>Materials:</strong> Microcontrollers, sensors, programming tools, project materials
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="lesson-plans-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Lesson Plans">
            </div>
          </div>
        </div>
      </section>

      <!-- Video Tutorials Section -->
      <section class="video-tutorials">
        <div class="container">
          <div class="section-header">
            <h2>Professional Video Tutorials</h2>
            <p>Step-by-step video guides for teachers and students</p>
          </div>
          
          <div class="video-categories">
            <div class="video-category">
              <h3>🚀 Getting Started</h3>
              <div class="video-list">
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Setup Tutorial">
                    <div class="play-button">▶</div>
                    <div class="video-duration">12:34</div>
                  </div>
                  <div class="video-info">
                    <h4>Initial System Setup</h4>
                    <p>Complete walkthrough of Chicken Tender installation and configuration</p>
                  </div>
                </div>
                
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="First Lesson">
                    <div class="play-button">▶</div>
                    <div class="video-duration">8:45</div>
                  </div>
                  <div class="video-info">
                    <h4>Teaching Your First Lesson</h4>
                    <p>Best practices for introducing students to smart farming concepts</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="video-category">
              <h3>🔧 Technical Skills</h3>
              <div class="video-list">
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Data Analysis">
                    <div class="play-button">▶</div>
                    <div class="video-duration">15:22</div>
                  </div>
                  <div class="video-info">
                    <h4>Data Analysis Techniques</h4>
                    <p>How to help students interpret and analyze agricultural data</p>
                  </div>
                </div>
                
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Troubleshooting">
                    <div class="play-button">▶</div>
                    <div class="video-duration">10:18</div>
                  </div>
                  <div class="video-info">
                    <h4>Common Troubleshooting</h4>
                    <p>Solving typical technical issues that arise in the classroom</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="video-category">
              <h3>📚 Pedagogy</h3>
              <div class="video-list">
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Assessment">
                    <div class="play-button">▶</div>
                    <div class="video-duration">11:56</div>
                  </div>
                  <div class="video-info">
                    <h4>Assessment Strategies</h4>
                    <p>Effective methods for evaluating student learning and progress</p>
                  </div>
                </div>
                
                <div class="video-item">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Differentiation">
                    <div class="play-button">▶</div>
                    <div class="video-duration">9:33</div>
                  </div>
                  <div class="video-info">
                    <h4>Differentiation Techniques</h4>
                    <p>Adapting lessons for diverse learning styles and abilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Lab Activities Section -->
      <section class="lab-activities">
        <div class="container">
          <div class="lab-activities-content">
            <div class="lab-activities-text">
              <h2>Hands-On Lab Activities</h2>
              <p>Engaging laboratory experiences that bring smart farming concepts to life through direct interaction with technology and real data.</p>
              
              <div class="lab-types">
                <div class="lab-type">
                  <h4>🔬 Investigation Labs</h4>
                  <p>Student-driven inquiry activities where learners formulate hypotheses and design experiments using Tender Cells technology.</p>
                  <ul>
                    <li>Animal behavior pattern analysis</li>
                    <li>Environmental factor correlation studies</li>
                    <li>Feed efficiency optimization experiments</li>
                  </ul>
                </div>
                
                <div class="lab-type">
                  <h4>🛠️ Design Challenge Labs</h4>
                  <p>Engineering-focused activities where students design, build, and test solutions to real agricultural problems.</p>
                  <ul>
                    <li>Automated feeding system design</li>
                    <li>Climate control optimization</li>
                    <li>Sensor network configuration</li>
                  </ul>
                </div>
                
                <div class="lab-type">
                  <h4>📊 Data Analysis Labs</h4>
                  <p>Statistical and computational activities using real farm data to develop analytical thinking skills.</p>
                  <ul>
                    <li>Predictive modeling exercises</li>
                    <li>Trend identification activities</li>
                    <li>Comparative analysis projects</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="lab-activities-image">
              <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Lab Activities">
            </div>
          </div>
          
          <div class="featured-labs">
            <h3>Featured Lab Activities</h3>
            <div class="labs-grid">
              <div class="lab-card">
                <div class="lab-header">
                  <h4>Temperature Optimization Lab</h4>
                  <div class="lab-meta">
                    <span class="lab-duration">90 minutes</span>
                    <span class="lab-level">Intermediate</span>
                  </div>
                </div>
                <p>Students investigate optimal temperature ranges for different chicken breeds and design automated climate control systems.</p>
                <div class="lab-skills">
                  <span class="skill-tag">Data Collection</span>
                  <span class="skill-tag">System Design</span>
                  <span class="skill-tag">Problem Solving</span>
                </div>
                <button class="btn btn-secondary">View Lab Guide</button>
              </div>
              
              <div class="lab-card">
                <div class="lab-header">
                  <h4>Egg Production Analysis</h4>
                  <div class="lab-meta">
                    <span class="lab-duration">120 minutes</span>
                    <span class="lab-level">Advanced</span>
                  </div>
                </div>
                <p>Advanced statistical analysis of egg production data to identify factors affecting laying patterns and productivity.</p>
                <div class="lab-skills">
                  <span class="skill-tag">Statistics</span>
                  <span class="skill-tag">Data Visualization</span>
                  <span class="skill-tag">Critical Thinking</span>
                </div>
                <button class="btn btn-secondary">View Lab Guide</button>
              </div>
              
              <div class="lab-card">
                <div class="lab-header">
                  <h4>IoT Sensor Network Design</h4>
                  <div class="lab-meta">
                    <span class="lab-duration">Multi-session</span>
                    <span class="lab-level">Advanced</span>
                  </div>
                </div>
                <p>Comprehensive project where students design, build, and deploy a complete IoT monitoring system for agricultural applications.</p>
                <div class="lab-skills">
                  <span class="skill-tag">Engineering</span>
                  <span class="skill-tag">Programming</span>
                  <span class="skill-tag">Project Management</span>
                </div>
                <button class="btn btn-secondary">View Lab Guide</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Forum Section -->
      <section class="community-forum">
        <div class="container">
          <div class="forum-header">
            <h2>Teacher Community Forum</h2>
            <p>Connect, collaborate, and share with educators worldwide</p>
          </div>
          
          <div class="forum-stats">
            <div class="stat-card">
              <h3>2,500+</h3>
              <p>Active Members</p>
            </div>
            <div class="stat-card">
              <h3>15,000+</h3>
              <p>Forum Posts</p>
            </div>
            <div class="stat-card">
              <h3>500+</h3>
              <p>Shared Resources</p>
            </div>
            <div class="stat-card">
              <h3>24/7</h3>
              <p>Community Support</p>
            </div>
          </div>
          
          <div class="forum-categories">
            <div class="forum-category">
              <div class="category-header">
                <h3>💬 General Discussion</h3>
                <span class="post-count">1,234 posts</span>
              </div>
              <p>General questions, introductions, and community announcements</p>
              <div class="recent-topics">
                <div class="topic">
                  <span class="topic-title">Welcome new teachers from Texas!</span>
                  <span class="topic-meta">2 hours ago by Sarah_M</span>
                </div>
                <div class="topic">
                  <span class="topic-title">Best practices for parent engagement</span>
                  <span class="topic-meta">5 hours ago by TeachTech_John</span>
                </div>
              </div>
            </div>
            
            <div class="forum-category">
              <div class="category-header">
                <h3>📚 Curriculum & Lessons</h3>
                <span class="post-count">2,456 posts</span>
              </div>
              <p>Share lesson plans, discuss curriculum integration, and get teaching tips</p>
              <div class="recent-topics">
                <div class="topic">
                  <span class="topic-title">Modified lesson for special needs students</span>
                  <span class="topic-meta">1 hour ago by InclusiveEd_Lisa</span>
                </div>
                <div class="topic">
                  <span class="topic-title">Cross-curricular math integration ideas</span>
                  <span class="topic-meta">3 hours ago by MathTeacher_Mike</span>
                </div>
              </div>
            </div>
            
            <div class="forum-category">
              <div class="category-header">
                <h3>🔧 Technical Support</h3>
                <span class="post-count">856 posts</span>
              </div>
              <p>Get help with setup, troubleshooting, and technical questions</p>
              <div class="recent-topics">
                <div class="topic">
                  <span class="topic-title">Sensor calibration issues - SOLVED</span>
                  <span class="topic-meta">30 minutes ago by TechSupport_Amy</span>
                </div>
                <div class="topic">
                  <span class="topic-title">WiFi connectivity troubleshooting</span>
                  <span class="topic-meta">2 hours ago by ITGuru_Bob</span>
                </div>
              </div>
            </div>
            
            <div class="forum-category">
              <div class="category-header">
                <h3>🏆 Success Stories</h3>
                <span class="post-count">423 posts</span>
              </div>
              <p>Share student achievements, project successes, and inspiring moments</p>
              <div class="recent-topics">
                <div class="topic">
                  <span class="topic-title">Students win state science fair!</span>
                  <span class="topic-meta">4 hours ago by ProudTeacher_Jan</span>
                </div>
                <div class="topic">
                  <span class="topic-title">100% engagement in my 8th grade class</span>
                  <span class="topic-meta">1 day ago by MiddleSchool_Pat</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="forum-cta">
            <h3>Join Our Growing Community</h3>
            <p>Connect with passionate educators, share your experiences, and get the support you need to succeed.</p>
            <button class="btn btn-primary btn-large">Join Forum Now</button>
          </div>
        </div>
      </section>

      <!-- Resource Downloads -->
      <section class="resource-downloads">
        <div class="container">
          <h2>Download Teaching Resources</h2>
          <p class="downloads-description">Access our complete library of educational materials, all free for registered educators.</p>
          
          <div class="downloads-grid">
            <div class="download-category">
              <h3>📋 Lesson Plan Library</h3>
              <div class="download-items">
                <div class="download-item">
                  <span class="download-name">Elementary Lesson Plans (K-5)</span>
                  <span class="download-size">25MB ZIP</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Middle School Lesson Plans (6-8)</span>
                  <span class="download-size">32MB ZIP</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">High School Lesson Plans (9-12)</span>
                  <span class="download-size">45MB ZIP</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
              </div>
            </div>
            
            <div class="download-category">
              <h3>🎯 Assessment Tools</h3>
              <div class="download-items">
                <div class="download-item">
                  <span class="download-name">Rubrics & Evaluation Forms</span>
                  <span class="download-size">8MB PDF</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Student Portfolio Templates</span>
                  <span class="download-size">12MB ZIP</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Progress Tracking Sheets</span>
                  <span class="download-size">5MB Excel</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
              </div>
            </div>
            
            <div class="download-category">
              <h3>🔬 Lab Materials</h3>
              <div class="download-items">
                <div class="download-item">
                  <span class="download-name">Complete Lab Activity Guide</span>
                  <span class="download-size">55MB PDF</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Safety Protocols & Checklists</span>
                  <span class="download-size">3MB PDF</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Data Collection Templates</span>
                  <span class="download-size">7MB ZIP</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
              </div>
            </div>
            
            <div class="download-category">
              <h3>📊 Presentation Materials</h3>
              <div class="download-items">
                <div class="download-item">
                  <span class="download-name">Introduction to Smart Farming Slides</span>
                  <span class="download-size">18MB PowerPoint</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Parent Information Packet</span>
                  <span class="download-size">6MB PDF</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
                <div class="download-item">
                  <span class="download-name">Administrator Overview</span>
                  <span class="download-size">4MB PDF</span>
                  <button class="btn btn-secondary btn-small">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeTeacherResourcesPage() {
  // Grade level tabs functionality
  const tabBtns = document.querySelectorAll('.tab-btn');
  const gradeContents = document.querySelectorAll('.grade-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs and content
      tabBtns.forEach(tab => tab.classList.remove('active'));
      gradeContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      // Show corresponding content
      const gradeLevel = btn.dataset.grade;
      document.getElementById(gradeLevel).classList.add('active');
    });
  });
  
  console.log('Teacher Resources page initialized');
}
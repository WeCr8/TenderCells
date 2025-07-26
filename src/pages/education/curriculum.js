// Curriculum Framework Page
export function createCurriculumFrameworkPage() {
  return `
    <div class="education-page">
      <!-- Hero Section -->
      <section class="education-hero">
        <div class="container">
          <div class="education-hero-content">
            <div class="education-hero-text">
              <h1>Curriculum Framework</h1>
              <p class="education-tagline">Progressive learning modules from basics to advanced AI</p>
              <p class="education-description">
                Our comprehensive curriculum framework provides a structured pathway for students 
                to learn smart farming concepts, from basic agricultural principles to advanced 
                artificial intelligence applications in modern farming.
              </p>
              <div class="education-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Download Curriculum Guide
                </button>
                <button class="btn btn-secondary btn-large">
                  View Sample Lessons
                </button>
              </div>
            </div>
            <div class="education-hero-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Curriculum Framework">
            </div>
          </div>
        </div>
      </section>

      <!-- Learning Pathway -->
      <section class="learning-pathway">
        <div class="container">
          <h2>Progressive Learning Pathway</h2>
          <p class="pathway-description">Our four-module framework builds knowledge systematically, ensuring students develop both theoretical understanding and practical skills.</p>
          
          <div class="pathway-modules">
            <div class="module-card active">
              <div class="module-header">
                <div class="module-number">01</div>
                <div class="module-info">
                  <h3>Introduction to Smart Agriculture</h3>
                  <p class="module-duration">4-6 weeks • Beginner Level</p>
                </div>
              </div>
              <div class="module-content">
                <div class="module-description">
                  <p>Foundation concepts of precision farming, IoT sensors, and data-driven decision making in modern agriculture.</p>
                </div>
                <div class="module-topics">
                  <h4>Key Topics:</h4>
                  <ul>
                    <li>History and evolution of farming technology</li>
                    <li>Introduction to Internet of Things (IoT)</li>
                    <li>Basic sensor types and applications</li>
                    <li>Data collection fundamentals</li>
                    <li>Sustainable farming principles</li>
                  </ul>
                </div>
                <div class="module-activities">
                  <h4>Hands-On Activities:</h4>
                  <ul>
                    <li>Build simple temperature sensors</li>
                    <li>Create basic data collection charts</li>
                    <li>Compare traditional vs. smart farming methods</li>
                    <li>Design ideal farm layout</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <div class="module-number">02</div>
                <div class="module-info">
                  <h3>Animal Husbandry & Technology</h3>
                  <p class="module-duration">6-8 weeks • Intermediate Level</p>
                </div>
              </div>
              <div class="module-content">
                <div class="module-description">
                  <p>Modern livestock management using automated systems, health monitoring, and welfare optimization through technology.</p>
                </div>
                <div class="module-topics">
                  <h4>Key Topics:</h4>
                  <ul>
                    <li>Animal behavior and welfare science</li>
                    <li>Automated feeding and watering systems</li>
                    <li>Health monitoring technologies</li>
                    <li>Environmental control systems</li>
                    <li>Breeding and genetics tracking</li>
                  </ul>
                </div>
                <div class="module-activities">
                  <h4>Hands-On Activities:</h4>
                  <ul>
                    <li>Design automated chicken coop</li>
                    <li>Monitor animal behavior patterns</li>
                    <li>Create health tracking systems</li>
                    <li>Analyze feeding efficiency data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <div class="module-number">03</div>
                <div class="module-info">
                  <h3>Environmental Monitoring</h3>
                  <p class="module-duration">5-7 weeks • Intermediate Level</p>
                </div>
              </div>
              <div class="module-content">
                <div class="module-description">
                  <p>Climate control, soil health assessment, and sustainable farming practices using advanced monitoring systems.</p>
                </div>
                <div class="module-topics">
                  <h4>Key Topics:</h4>
                  <ul>
                    <li>Climate and microclimate management</li>
                    <li>Soil health and nutrient monitoring</li>
                    <li>Water quality and conservation</li>
                    <li>Air quality and ventilation systems</li>
                    <li>Renewable energy integration</li>
                  </ul>
                </div>
                <div class="module-activities">
                  <h4>Hands-On Activities:</h4>
                  <ul>
                    <li>Build weather monitoring station</li>
                    <li>Test soil composition and pH</li>
                    <li>Design water conservation system</li>
                    <li>Create environmental dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="module-card">
              <div class="module-header">
                <div class="module-number">04</div>
                <div class="module-info">
                  <h3>Data Analysis & AI</h3>
                  <p class="module-duration">8-10 weeks • Advanced Level</p>
                </div>
              </div>
              <div class="module-content">
                <div class="module-description">
                  <p>Using artificial intelligence for predictive analytics, optimization, and intelligent decision-making in agricultural systems.</p>
                </div>
                <div class="module-topics">
                  <h4>Key Topics:</h4>
                  <ul>
                    <li>Data visualization and interpretation</li>
                    <li>Statistical analysis fundamentals</li>
                    <li>Machine learning basics</li>
                    <li>Predictive modeling</li>
                    <li>AI ethics in agriculture</li>
                  </ul>
                </div>
                <div class="module-activities">
                  <h4>Hands-On Activities:</h4>
                  <ul>
                    <li>Create predictive health models</li>
                    <li>Build recommendation systems</li>
                    <li>Analyze large agricultural datasets</li>
                    <li>Develop AI-powered farm assistant</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Standards Alignment -->
      <section class="standards-alignment">
        <div class="container">
          <h2>Educational Standards Alignment</h2>
          <p class="standards-description">Our curriculum aligns with national and state educational standards, ensuring seamless integration into existing programs.</p>
          
          <div class="standards-grid">
            <div class="standard-card">
              <div class="standard-icon">🔬</div>
              <h3>Next Generation Science Standards (NGSS)</h3>
              <div class="standard-alignments">
                <div class="alignment-item">
                  <h4>K-ESS3-1</h4>
                  <p>Living things need water, air, and resources from the land</p>
                </div>
                <div class="alignment-item">
                  <h4>5-ESS3-1</h4>
                  <p>Human impact on Earth's systems</p>
                </div>
                <div class="alignment-item">
                  <h4>MS-ETS1-1</h4>
                  <p>Define criteria and constraints of design problems</p>
                </div>
                <div class="alignment-item">
                  <h4>HS-ETS1-3</h4>
                  <p>Evaluate solutions to complex real-world problems</p>
                </div>
              </div>
            </div>

            <div class="standard-card">
              <div class="standard-icon">📊</div>
              <h3>Common Core Mathematics</h3>
              <div class="standard-alignments">
                <div class="alignment-item">
                  <h4>CCSS.MATH.CONTENT.5.MD.B.2</h4>
                  <p>Make line plots to display data sets</p>
                </div>
                <div class="alignment-item">
                  <h4>CCSS.MATH.CONTENT.6.SP.B.5</h4>
                  <p>Summarize numerical data sets</p>
                </div>
                <div class="alignment-item">
                  <h4>CCSS.MATH.CONTENT.HSA.CED.A.3</h4>
                  <p>Represent constraints by systems of inequalities</p>
                </div>
                <div class="alignment-item">
                  <h4>CCSS.MATH.CONTENT.HSS.ID.B.6</h4>
                  <p>Represent data on two quantitative variables</p>
                </div>
              </div>
            </div>

            <div class="standard-card">
              <div class="standard-icon">💻</div>
              <h3>Computer Science Teachers Association (CSTA)</h3>
              <div class="standard-alignments">
                <div class="alignment-item">
                  <h4>1A-DA-05</h4>
                  <p>Store, copy, search, retrieve, modify, and delete data</p>
                </div>
                <div class="alignment-item">
                  <h4>1B-DA-06</h4>
                  <p>Organize and present collected data visually</p>
                </div>
                <div class="alignment-item">
                  <h4>2-DA-08</h4>
                  <p>Collect data and identify patterns</p>
                </div>
                <div class="alignment-item">
                  <h4>3A-DA-11</h4>
                  <p>Create interactive data visualizations</p>
                </div>
              </div>
            </div>

            <div class="standard-card">
              <div class="standard-icon">🌱</div>
              <h3>Agriculture, Food & Natural Resources (AFNR)</h3>
              <div class="standard-alignments">
                <div class="alignment-item">
                  <h4>AS.01.01</h4>
                  <p>Analyze the role of agriculture in society</p>
                </div>
                <div class="alignment-item">
                  <h4>AS.02.02</h4>
                  <p>Examine animal welfare concerns</p>
                </div>
                <div class="alignment-item">
                  <h4>AS.03.01</h4>
                  <p>Analyze the nutritional needs of animals</p>
                </div>
                <div class="alignment-item">
                  <h4>AS.07.01</h4>
                  <p>Justify the use of technology in animal agriculture</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Assessment Framework -->
      <section class="assessment-framework">
        <div class="container">
          <div class="assessment-content">
            <div class="assessment-text">
              <h2>Assessment & Evaluation Framework</h2>
              <p>Comprehensive assessment tools to measure student learning and program effectiveness across all curriculum modules.</p>
              
              <div class="assessment-types">
                <div class="assessment-type">
                  <h4>📝 Formative Assessments</h4>
                  <ul>
                    <li>Daily observation checklists</li>
                    <li>Lab notebook evaluations</li>
                    <li>Peer collaboration rubrics</li>
                    <li>Digital portfolio reviews</li>
                  </ul>
                </div>
                
                <div class="assessment-type">
                  <h4>🎯 Summative Assessments</h4>
                  <ul>
                    <li>Module completion projects</li>
                    <li>Data analysis presentations</li>
                    <li>System design challenges</li>
                    <li>Comprehensive final portfolios</li>
                  </ul>
                </div>
                
                <div class="assessment-type">
                  <h4>🔄 Performance-Based Assessments</h4>
                  <ul>
                    <li>Real-world problem solving</li>
                    <li>Technology troubleshooting</li>
                    <li>Collaborative team projects</li>
                    <li>Community presentation events</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="assessment-image">
              <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Assessment Framework">
            </div>
          </div>
        </div>
      </section>

      <!-- Differentiation Strategies -->
      <section class="differentiation">
        <div class="container">
          <h2>Differentiation & Accessibility</h2>
          <p class="differentiation-description">Our curriculum accommodates diverse learning styles and abilities through multiple pathways and support systems.</p>
          
          <div class="differentiation-grid">
            <div class="differentiation-card">
              <div class="diff-icon">🎨</div>
              <h3>Multiple Learning Styles</h3>
              <ul>
                <li>Visual learners: Infographics and diagrams</li>
                <li>Auditory learners: Podcasts and discussions</li>
                <li>Kinesthetic learners: Hands-on experiments</li>
                <li>Reading/writing learners: Research projects</li>
              </ul>
            </div>
            
            <div class="differentiation-card">
              <div class="diff-icon">⚡</div>
              <h3>Flexible Pacing</h3>
              <ul>
                <li>Self-paced online modules</li>
                <li>Accelerated tracks for advanced students</li>
                <li>Extended time options</li>
                <li>Remediation support materials</li>
              </ul>
            </div>
            
            <div class="differentiation-card">
              <div class="diff-icon">🌐</div>
              <h3>Language Support</h3>
              <ul>
                <li>Multilingual glossaries</li>
                <li>Visual vocabulary cards</li>
                <li>Translation tools integration</li>
                <li>Simplified text options</li>
              </ul>
            </div>
            
            <div class="differentiation-card">
              <div class="diff-icon">♿</div>
              <h3>Accessibility Features</h3>
              <ul>
                <li>Screen reader compatibility</li>
                <li>High contrast visual options</li>
                <li>Keyboard navigation support</li>
                <li>Alternative format materials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Implementation Timeline -->
      <section class="implementation-timeline">
        <div class="container">
          <h2>Implementation Timeline</h2>
          <p class="timeline-description">Structured rollout plan for successful curriculum integration in your educational setting.</p>
          
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-marker">1</div>
              <div class="timeline-content">
                <h3>Planning Phase</h3>
                <p class="timeline-duration">Weeks 1-2</p>
                <ul>
                  <li>Curriculum review and customization</li>
                  <li>Teacher training schedule development</li>
                  <li>Resource and equipment planning</li>
                  <li>Student assessment baseline</li>
                </ul>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-marker">2</div>
              <div class="timeline-content">
                <h3>Teacher Preparation</h3>
                <p class="timeline-duration">Weeks 3-4</p>
                <ul>
                  <li>Professional development workshops</li>
                  <li>Technology setup and testing</li>
                  <li>Curriculum material distribution</li>
                  <li>Assessment tool training</li>
                </ul>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-marker">3</div>
              <div class="timeline-content">
                <h3>Pilot Implementation</h3>
                <p class="timeline-duration">Weeks 5-8</p>
                <ul>
                  <li>Module 1 rollout with select classes</li>
                  <li>Feedback collection and analysis</li>
                  <li>Curriculum adjustments</li>
                  <li>Student engagement monitoring</li>
                </ul>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-marker">4</div>
              <div class="timeline-content">
                <h3>Full Deployment</h3>
                <p class="timeline-duration">Weeks 9+</p>
                <ul>
                  <li>All modules available to all classes</li>
                  <li>Ongoing support and monitoring</li>
                  <li>Regular assessment and evaluation</li>
                  <li>Continuous improvement process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Download Resources -->
      <section class="download-resources">
        <div class="container">
          <h2>Download Curriculum Resources</h2>
          <p class="resources-description">Access comprehensive curriculum materials, lesson plans, and implementation guides.</p>
          
          <div class="resources-grid">
            <div class="resource-download">
              <div class="resource-icon">📋</div>
              <h3>Complete Curriculum Guide</h3>
              <p>Comprehensive 200-page guide covering all four modules with detailed lesson plans and activities.</p>
              <button class="btn btn-primary">Download PDF (15MB)</button>
            </div>
            
            <div class="resource-download">
              <div class="resource-icon">🎯</div>
              <h3>Assessment Rubrics</h3>
              <p>Detailed rubrics and evaluation tools for all curriculum modules and activities.</p>
              <button class="btn btn-primary">Download ZIP (3MB)</button>
            </div>
            
            <div class="resource-download">
              <div class="resource-icon">🛠️</div>
              <h3>Implementation Toolkit</h3>
              <p>Step-by-step implementation guide with checklists, timelines, and best practices.</p>
              <button class="btn btn-primary">Download PDF (8MB)</button>
            </div>
            
            <div class="resource-download">
              <div class="resource-icon">📊</div>
              <h3>Standards Alignment Chart</h3>
              <p>Detailed mapping of curriculum activities to national and state educational standards.</p>
              <button class="btn btn-primary">Download Excel (2MB)</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeCurriculumFrameworkPage() {
  // Module card interactions
  const moduleCards = document.querySelectorAll('.module-card');
  moduleCards.forEach(card => {
    const header = card.querySelector('.module-header');
    header.addEventListener('click', () => {
      // Remove active class from all cards
      moduleCards.forEach(c => c.classList.remove('active'));
      // Add active class to clicked card
      card.classList.add('active');
    });
  });
  
  console.log('Curriculum Framework page initialized');
}
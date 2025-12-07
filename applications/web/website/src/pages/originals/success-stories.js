// Success Stories Page
import { trackEngagement } from '../utils/analytics.js';

export function createSuccessStoriesPage() {
  return `
    <div class="success-stories-page">
      <!-- Hero Section -->
      <section class="stories-hero">
        <div class="container">
          <div class="stories-hero-content">
            <span class="stories-badge">Success Stories</span>
            <h1>Real Farmers, <span class="highlight">Real Results</span></h1>
            <p class="stories-tagline">
              Discover how farmers around the world are transforming their operations 
              with Tender Cells technology.
            </p>
          </div>
        </div>
      </section>

      <!-- Impact Stats -->
      <section class="stories-impact">
        <div class="container">
          <div class="impact-grid">
            <div class="impact-card">
              <span class="impact-value">15,000+</span>
              <span class="impact-label">Active Farms</span>
            </div>
            <div class="impact-card">
              <span class="impact-value">2.5M+</span>
              <span class="impact-label">Animals Monitored</span>
            </div>
            <div class="impact-card">
              <span class="impact-value">35%</span>
              <span class="impact-label">Avg. Productivity Increase</span>
            </div>
            <div class="impact-card">
              <span class="impact-value">4.9/5</span>
              <span class="impact-label">Customer Rating</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Stories -->
      <section class="stories-featured">
        <div class="container">
          <div class="section-header">
            <h2>Featured Stories</h2>
            <p>Deep dives into how Tender Cells is making a difference.</p>
          </div>

          <div class="featured-story">
            <div class="story-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Johnson Family Farm">
              <div class="story-badge">Featured</div>
            </div>
            <div class="story-content">
              <div class="story-meta">
                <span class="story-location">📍 Texas, USA</span>
                <span class="story-type">🐔 Poultry Farm</span>
              </div>
              <h3>Johnson Family Farm: From Struggling to Thriving</h3>
              <p class="story-quote">"Before Tender Cells, we were losing 15% of our flock each year to preventable issues. Now that number is under 2%. The early warning system has been a game-changer."</p>
              <p class="story-author">— Sarah Johnson, Farm Owner</p>
              
              <div class="story-results">
                <div class="result">
                  <span class="result-value">93%</span>
                  <span class="result-label">Reduction in mortality</span>
                </div>
                <div class="result">
                  <span class="result-value">40%</span>
                  <span class="result-label">Increase in egg production</span>
                </div>
                <div class="result">
                  <span class="result-value">6 hrs</span>
                  <span class="result-label">Saved daily on monitoring</span>
                </div>
              </div>

              <button class="btn btn-primary read-full-story" data-story="johnson">Read Full Story</button>
            </div>
          </div>

          <div class="featured-story reverse">
            <div class="story-image">
              <img src="https://images.pexels.com/photos/2255459/pexels-photo-2255459.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Green Valley Co-op">
              <div class="story-badge">Education</div>
            </div>
            <div class="story-content">
              <div class="story-meta">
                <span class="story-location">📍 Vermont, USA</span>
                <span class="story-type">🎓 Agricultural School</span>
              </div>
              <h3>Green Valley Agricultural College: Teaching Tomorrow's Farmers</h3>
              <p class="story-quote">"Our students are learning with the same technology they'll use in their careers. The hands-on experience with AI and automation gives them a real competitive advantage."</p>
              <p class="story-author">— Dr. Michael Chen, Department Head</p>
              
              <div class="story-results">
                <div class="result">
                  <span class="result-value">500+</span>
                  <span class="result-label">Students trained annually</span>
                </div>
                <div class="result">
                  <span class="result-value">94%</span>
                  <span class="result-label">Job placement rate</span>
                </div>
                <div class="result">
                  <span class="result-value">12</span>
                  <span class="result-label">Research papers published</span>
                </div>
              </div>

              <button class="btn btn-primary read-full-story" data-story="greenvalley">Read Full Story</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials Grid -->
      <section class="stories-testimonials">
        <div class="container">
          <div class="section-header">
            <h2>What Our Customers Say</h2>
            <p>Hear from farmers who use Tender Cells every day.</p>
          </div>

          <div class="testimonials-grid">
            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"The ROI was evident within the first month. Between the time saved and the improved production, Tender Cells paid for itself in 8 weeks."</p>
              <div class="testimonial-author">
                <div class="author-avatar">MR</div>
                <div class="author-info">
                  <span class="author-name">Mike Reynolds</span>
                  <span class="author-role">Homesteader, Oregon</span>
                </div>
              </div>
            </div>

            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"I was skeptical about 'smart farming' but the simplicity won me over. If I can use it, anyone can. The app is incredibly intuitive."</p>
              <div class="testimonial-author">
                <div class="author-avatar">BT</div>
                <div class="author-info">
                  <span class="author-name">Betty Thompson</span>
                  <span class="author-role">Retired Teacher, Iowa</span>
                </div>
              </div>
            </div>

            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"We manage three farms across 200 miles. Being able to monitor everything from one dashboard has transformed how we operate."</p>
              <div class="testimonial-author">
                <div class="author-avatar">JW</div>
                <div class="author-info">
                  <span class="author-name">James Wilson</span>
                  <span class="author-role">Farm Manager, Georgia</span>
                </div>
              </div>
            </div>

            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"The early health alerts are incredible. We caught a respiratory issue spreading through the flock before we would have noticed it ourselves."</p>
              <div class="testimonial-author">
                <div class="author-avatar">LD</div>
                <div class="author-info">
                  <span class="author-name">Lisa Davis</span>
                  <span class="author-role">Family Farm, Wisconsin</span>
                </div>
              </div>
            </div>

            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"As a developer, I appreciate that they open-sourced so much. I've customized integrations that perfectly fit my farm's unique needs."</p>
              <div class="testimonial-author">
                <div class="author-avatar">AK</div>
                <div class="author-info">
                  <span class="author-name">Alex Kim</span>
                  <span class="author-role">Tech Farmer, California</span>
                </div>
              </div>
            </div>

            <div class="testimonial-card">
              <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p class="testimonial-text">"My chickens have never been healthier or more productive. The automated climate control alone has made a huge difference."</p>
              <div class="testimonial-author">
                <div class="author-avatar">SM</div>
                <div class="author-info">
                  <span class="author-name">Susan Miller</span>
                  <span class="author-role">Urban Farmer, Denver</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Case Studies -->
      <section class="stories-cases">
        <div class="container">
          <div class="section-header">
            <h2>Case Studies</h2>
            <p>Detailed analyses of Tender Cells implementations.</p>
          </div>

          <div class="cases-grid">
            <div class="case-card">
              <div class="case-header">
                <span class="case-icon">🏭</span>
                <span class="case-type">Commercial</span>
              </div>
              <h3>Scaling Smart: 10,000 Bird Operation</h3>
              <p>How a large-scale commercial farm implemented Tender Cells across multiple buildings and achieved consistent results.</p>
              <div class="case-stats">
                <span>📊 ROI: 340% in Year 1</span>
                <span>⏱️ Read: 8 min</span>
              </div>
              <a href="#" class="case-link">Read Case Study →</a>
            </div>

            <div class="case-card">
              <div class="case-header">
                <span class="case-icon">🏠</span>
                <span class="case-type">Homestead</span>
              </div>
              <h3>Weekend Warrior: Remote Monitoring Success</h3>
              <p>A part-time farmer manages a thriving flock while working a full-time job, thanks to intelligent automation.</p>
              <div class="case-stats">
                <span>📊 Time Saved: 80%</span>
                <span>⏱️ Read: 5 min</span>
              </div>
              <a href="#" class="case-link">Read Case Study →</a>
            </div>

            <div class="case-card">
              <div class="case-header">
                <span class="case-icon">🌱</span>
                <span class="case-type">Organic</span>
              </div>
              <h3>Certified Organic: Meeting Premium Standards</h3>
              <p>How an organic farm uses Tender Cells to maintain certification requirements while improving efficiency.</p>
              <div class="case-stats">
                <span>📊 Premium: +25%/dozen</span>
                <span>⏱️ Read: 6 min</span>
              </div>
              <a href="#" class="case-link">Read Case Study →</a>
            </div>

            <div class="case-card">
              <div class="case-header">
                <span class="case-icon">❄️</span>
                <span class="case-type">Extreme Climate</span>
              </div>
              <h3>Arctic Success: Farming at -40°F</h3>
              <p>An Alaskan farm proves Tender Cells can handle the most extreme conditions while keeping flocks healthy.</p>
              <div class="case-stats">
                <span>📊 Survival: 99.5%</span>
                <span>⏱️ Read: 7 min</span>
              </div>
              <a href="#" class="case-link">Read Case Study →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Video Section -->
      <section class="stories-videos">
        <div class="container">
          <div class="section-header">
            <h2>Video Stories</h2>
            <p>Watch farmers share their experiences in their own words.</p>
          </div>

          <div class="videos-grid">
            <div class="video-card" data-video="farm-tour">
              <div class="video-thumbnail">
                <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Farm Tour">
                <div class="play-overlay">
                  <span class="play-icon">▶</span>
                </div>
                <span class="video-duration">8:42</span>
              </div>
              <h4>Farm Tour: Smart Coop in Action</h4>
              <p>See a fully automated Tender Cells setup in daily operation.</p>
            </div>

            <div class="video-card" data-video="interview">
              <div class="video-thumbnail">
                <img src="https://images.pexels.com/photos/2255459/pexels-photo-2255459.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Farmer Interview">
                <div class="play-overlay">
                  <span class="play-icon">▶</span>
                </div>
                <span class="video-duration">12:15</span>
              </div>
              <h4>Farmer Spotlight: The Martinez Family</h4>
              <p>Three generations share how technology transformed their farm.</p>
            </div>

            <div class="video-card" data-video="setup">
              <div class="video-thumbnail">
                <img src="https://images.pexels.com/photos/162240/bull-calf-heifer-ko-162240.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Setup Guide">
                <div class="play-overlay">
                  <span class="play-icon">▶</span>
                </div>
                <span class="video-duration">6:30</span>
              </div>
              <h4>Unboxing & Setup: First Impressions</h4>
              <p>New customer documents their complete setup experience.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="stories-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Write Your Success Story?</h2>
            <p>Join thousands of farmers who are already experiencing the benefits of smart farming.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Get Started</a>
              <a href="#contact" class="btn btn-outline btn-large">Share Your Story</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeSuccessStoriesPage() {
  // Read full story buttons
  const storyButtons = document.querySelectorAll('.read-full-story');
  storyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const storyId = btn.dataset.story;
      trackEngagement('story_view', { story_id: storyId });
      alert(`Full story for ${storyId} would open here`);
    });
  });

  // Video cards
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(card => {
    card.addEventListener('click', () => {
      const videoId = card.dataset.video;
      trackEngagement('video_play', { video_id: videoId });
      alert(`Video ${videoId} would play here`);
    });
  });

  // Case study links
  const caseLinks = document.querySelectorAll('.case-link');
  caseLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      trackEngagement('case_study_view');
      alert('Case study would open here');
    });
  });

  // Animate cards on scroll
  const cards = document.querySelectorAll('.testimonial-card, .case-card, .video-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  console.log('Success Stories page initialized');
}


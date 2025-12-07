// Press Page
import { trackEngagement } from '../utils/analytics.js';

export function createPressPage() {
  return `
    <div class="press-page">
      <!-- Hero Section -->
      <section class="press-hero">
        <div class="container">
          <div class="press-hero-content">
            <span class="press-badge">Press & Media</span>
            <h1>Tender Cells in the <span class="highlight">News</span></h1>
            <p class="press-tagline">
              Media resources, press releases, and contact information for journalists 
              covering smart agriculture and farming technology.
            </p>
            <div class="press-cta">
              <a href="#pressKit" class="btn btn-primary btn-large">Download Press Kit</a>
              <a href="mailto:press@tendercells.com" class="btn btn-secondary btn-large">📧 Contact Press Team</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Press Contact -->
      <section class="press-contact">
        <div class="container">
          <div class="contact-card">
            <div class="contact-info">
              <h3>Press Contact</h3>
              <p>For media inquiries, interview requests, or press materials:</p>
              <div class="contact-details">
                <div class="detail">
                  <span class="detail-icon">📧</span>
                  <span>press@tendercells.com</span>
                </div>
                <div class="detail">
                  <span class="detail-icon">📞</span>
                  <span>1-800-TENDER-PR</span>
                </div>
              </div>
            </div>
            <div class="response-time">
              <span class="response-icon">⚡</span>
              <span>We respond to press inquiries within 4 hours during business days.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Press Releases -->
      <section class="press-releases">
        <div class="container">
          <div class="section-header">
            <h2>Press Releases</h2>
            <p>Official announcements from Tender Cells.</p>
          </div>

          <div class="releases-list">
            <article class="release-card">
              <div class="release-date">
                <span class="day">15</span>
                <span class="month">Nov 2024</span>
              </div>
              <div class="release-content">
                <h3>Tender Cells Raises $25M Series B to Expand Smart Farming Platform</h3>
                <p>Funding will accelerate product development and international expansion, with plans to launch in Europe and Asia Pacific markets.</p>
                <a href="#" class="release-link">Read Release →</a>
              </div>
            </article>

            <article class="release-card">
              <div class="release-date">
                <span class="day">02</span>
                <span class="month">Oct 2024</span>
              </div>
              <div class="release-content">
                <h3>Tender Cells Partners with USDA for Agricultural Innovation Program</h3>
                <p>Partnership will provide smart farming technology to underserved rural communities and agricultural education programs.</p>
                <a href="#" class="release-link">Read Release →</a>
              </div>
            </article>

            <article class="release-card">
              <div class="release-date">
                <span class="day">18</span>
                <span class="month">Sep 2024</span>
              </div>
              <div class="release-content">
                <h3>Introducing TenderNet v3: Next-Generation AI for Farm Health Monitoring</h3>
                <p>New machine learning models deliver 40% better prediction accuracy for animal health issues.</p>
                <a href="#" class="release-link">Read Release →</a>
              </div>
            </article>

            <article class="release-card">
              <div class="release-date">
                <span class="day">05</span>
                <span class="month">Aug 2024</span>
              </div>
              <div class="release-content">
                <h3>Tender Cells Surpasses 15,000 Active Farms on Platform</h3>
                <p>Milestone reflects growing adoption of smart farming technology across commercial and homestead operations.</p>
                <a href="#" class="release-link">Read Release →</a>
              </div>
            </article>
          </div>

          <div class="releases-archive">
            <a href="#" class="btn btn-secondary">View All Press Releases →</a>
          </div>
        </div>
      </section>

      <!-- Media Coverage -->
      <section class="press-coverage">
        <div class="container">
          <div class="section-header">
            <h2>Media Coverage</h2>
            <p>Recent articles and features about Tender Cells.</p>
          </div>

          <div class="coverage-grid">
            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">TC</span>
                <span class="source-name">TechCrunch</span>
              </div>
              <h3>"How Tender Cells is Bringing Silicon Valley Innovation to the Farm"</h3>
              <span class="coverage-date">November 2024</span>
            </a>

            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">F</span>
                <span class="source-name">Forbes</span>
              </div>
              <h3>"30 Under 30: The Founders Making Agriculture Smarter"</h3>
              <span class="coverage-date">October 2024</span>
            </a>

            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">W</span>
                <span class="source-name">Wired</span>
              </div>
              <h3>"The AI Revolution Is Coming to Your Chicken Coop"</h3>
              <span class="coverage-date">September 2024</span>
            </a>

            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">FW</span>
                <span class="source-name">Farm Weekly</span>
              </div>
              <h3>"Smart Coops: Are They Worth the Investment?"</h3>
              <span class="coverage-date">August 2024</span>
            </a>

            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">MIT</span>
                <span class="source-name">MIT Tech Review</span>
              </div>
              <h3>"Open Source Meets Agriculture in Tender Cells' Mission"</h3>
              <span class="coverage-date">July 2024</span>
            </a>

            <a href="#" class="coverage-card">
              <div class="coverage-source">
                <span class="source-logo">NPR</span>
                <span class="source-name">NPR</span>
              </div>
              <h3>"Small Farmers Embrace Big Tech to Stay Competitive"</h3>
              <span class="coverage-date">June 2024</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Press Kit -->
      <section class="press-kit" id="pressKit">
        <div class="container">
          <div class="section-header">
            <h2>Press Kit</h2>
            <p>Download official brand assets and media materials.</p>
          </div>

          <div class="kit-grid">
            <div class="kit-card">
              <div class="kit-icon">🎨</div>
              <h3>Brand Assets</h3>
              <p>Logos, icons, and brand guidelines in various formats.</p>
              <ul class="kit-contents">
                <li>Logo (SVG, PNG, EPS)</li>
                <li>Brand guidelines PDF</li>
                <li>Color palette</li>
                <li>Typography guide</li>
              </ul>
              <button class="btn btn-primary download-kit" data-kit="brand">Download ZIP</button>
            </div>

            <div class="kit-card">
              <div class="kit-icon">📸</div>
              <h3>Product Photos</h3>
              <p>High-resolution product images for media use.</p>
              <ul class="kit-contents">
                <li>Product photography</li>
                <li>Lifestyle shots</li>
                <li>Farm installations</li>
                <li>Mobile app screenshots</li>
              </ul>
              <button class="btn btn-primary download-kit" data-kit="photos">Download ZIP</button>
            </div>

            <div class="kit-card">
              <div class="kit-icon">👥</div>
              <h3>Leadership Photos</h3>
              <p>Executive headshots and team photos.</p>
              <ul class="kit-contents">
                <li>CEO headshot</li>
                <li>Leadership team</li>
                <li>Company photos</li>
                <li>Bios</li>
              </ul>
              <button class="btn btn-primary download-kit" data-kit="leadership">Download ZIP</button>
            </div>

            <div class="kit-card">
              <div class="kit-icon">📄</div>
              <h3>Fact Sheet</h3>
              <p>Company overview, stats, and key facts.</p>
              <ul class="kit-contents">
                <li>Company overview</li>
                <li>Key statistics</li>
                <li>Timeline/milestones</li>
                <li>Product descriptions</li>
              </ul>
              <button class="btn btn-primary download-kit" data-kit="factsheet">Download PDF</button>
            </div>
          </div>

          <div class="kit-full">
            <p>Need everything? Download the complete press kit:</p>
            <button class="btn btn-primary btn-large download-kit" data-kit="complete">Download Complete Press Kit (45MB)</button>
          </div>
        </div>
      </section>

      <!-- Company Facts -->
      <section class="press-facts">
        <div class="container">
          <div class="section-header">
            <h2>Quick Facts</h2>
            <p>Key information about Tender Cells for your story.</p>
          </div>

          <div class="facts-grid">
            <div class="fact-card">
              <span class="fact-label">Founded</span>
              <span class="fact-value">2022</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Headquarters</span>
              <span class="fact-value">Austin, Texas</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Employees</span>
              <span class="fact-value">85+</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Active Farms</span>
              <span class="fact-value">15,000+</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Animals Monitored</span>
              <span class="fact-value">2.5M+</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Countries</span>
              <span class="fact-value">40+</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">Total Funding</span>
              <span class="fact-value">$35M</span>
            </div>
            <div class="fact-card">
              <span class="fact-label">GitHub Stars</span>
              <span class="fact-value">50K+</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Interview Request -->
      <section class="press-interview">
        <div class="container">
          <div class="interview-content">
            <h2>Request an Interview</h2>
            <p>Our leadership team is available for interviews on topics including:</p>
            <div class="interview-topics">
              <span class="topic">Smart Agriculture</span>
              <span class="topic">IoT & Farming</span>
              <span class="topic">AI in Agriculture</span>
              <span class="topic">Open Source</span>
              <span class="topic">Rural Technology</span>
              <span class="topic">Sustainable Farming</span>
              <span class="topic">AgTech Startups</span>
              <span class="topic">Farm Automation</span>
            </div>
            <a href="mailto:press@tendercells.com?subject=Interview Request" class="btn btn-primary btn-large">Request Interview</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializePressPage() {
  // Track press release clicks
  const releaseLinks = document.querySelectorAll('.release-link');
  releaseLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const title = link.closest('.release-card').querySelector('h3').textContent;
      trackEngagement('press_release_view', { title });
      alert('Press release would open here');
    });
  });

  // Track media coverage clicks
  const coverageCards = document.querySelectorAll('.coverage-card');
  coverageCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const source = card.querySelector('.source-name').textContent;
      trackEngagement('media_coverage_click', { source });
      alert('Article would open here');
    });
  });

  // Download kit buttons
  const downloadBtns = document.querySelectorAll('.download-kit');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const kit = btn.dataset.kit;
      trackEngagement('press_kit_download', { kit });
      alert(`Downloading ${kit} press kit...`);
    });
  });

  // Animate cards on scroll
  const cards = document.querySelectorAll('.release-card, .coverage-card, .kit-card, .fact-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  console.log('Press page initialized');
}


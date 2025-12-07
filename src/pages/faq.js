// FAQ Page
import { trackEngagement } from '../utils/analytics.js';

export function createFAQPage() {
  const faqCategories = [
    {
      id: 'general',
      name: 'General',
      icon: '❓',
      questions: [
        {
          q: 'What is Tender Cells?',
          a: 'Tender Cells is a smart farming platform that combines IoT hardware, AI-powered software, and mobile apps to help farmers monitor and automate their animal care operations. Our flagship product, Chicken Tender, focuses on poultry management, with additional systems for cattle, pigs, goats, and ducks in development.'
        },
        {
          q: 'Who is Tender Cells designed for?',
          a: 'Tender Cells is designed for farmers of all sizes—from backyard homesteaders with a few chickens to commercial operations with thousands of birds. Our modular system scales to fit your needs, and our intuitive interface makes it accessible regardless of technical experience.'
        },
        {
          q: 'Do I need technical skills to use Tender Cells?',
          a: 'Not at all! We\'ve designed our system to be as simple as using a smartphone. The setup process is guided step-by-step, and our mobile app is intuitive and user-friendly. If you can use email, you can use Tender Cells.'
        },
        {
          q: 'Is Tender Cells available internationally?',
          a: 'Yes! We ship worldwide with free shipping on all orders. Our system supports multiple languages and works with both metric and imperial units. Local power adapters are included based on your shipping destination.'
        }
      ]
    },
    {
      id: 'products',
      name: 'Products & Pricing',
      icon: '🛒',
      questions: [
        {
          q: 'What\'s included in the Chicken Tender system?',
          a: 'The base Chicken Tender system includes: 1 Smart Hub, 2 Climate Sensors (temperature/humidity), 1 Water Level Sensor, 1 Smart Feeder Controller, the mobile app (iOS/Android), and free cloud monitoring for 1 year. Additional sensors and accessories can be added based on your needs.'
        },
        {
          q: 'How much does Tender Cells cost?',
          a: 'The Chicken Tender base system starts at $299. We also offer financing options starting at $25/month. Enterprise pricing for commercial operations is available—contact our sales team for a custom quote.'
        },
        {
          q: 'Is there a subscription fee?',
          a: 'Basic cloud monitoring is included free for the first year, then $9.99/month. However, all core functionality works locally without any subscription—cloud features are optional. We also offer annual plans with 2 months free.'
        },
        {
          q: 'What\'s your return policy?',
          a: 'We offer a 90-day satisfaction guarantee. If you\'re not completely happy with your Tender Cells system, return it for a full refund—no questions asked. We\'ll even cover return shipping.'
        },
        {
          q: 'Do you offer bulk or educational discounts?',
          a: 'Yes! Educational institutions receive 30% off all products. We also offer volume discounts for orders of 5+ units. Contact our sales team for details.'
        }
      ]
    },
    {
      id: 'setup',
      name: 'Setup & Installation',
      icon: '🔧',
      questions: [
        {
          q: 'How long does setup take?',
          a: 'Most users complete setup in about 45 minutes. The Smart Hub takes about 15 minutes to configure, and each sensor takes 5-10 minutes to place and connect. Our app guides you through every step.'
        },
        {
          q: 'Do I need WiFi in my barn or coop?',
          a: 'The Smart Hub needs WiFi to connect to the cloud, but it doesn\'t need to be in the barn itself—it can be up to 100 meters from your sensors. Many customers place the hub in their house and use the mesh network to reach the coop.'
        },
        {
          q: 'Can I install the system myself?',
          a: 'Absolutely! Tender Cells is designed for DIY installation. No electrician or special tools required. All components use standard power outlets or batteries, and sensors mount with screws or magnetic mounts.'
        },
        {
          q: 'What if my barn doesn\'t have electricity?',
          a: 'Our sensors run on long-life batteries (2+ years) or optional solar panels. The Smart Hub requires power, but can be located anywhere within range of the sensors—even in your house.'
        }
      ]
    },
    {
      id: 'features',
      name: 'Features & Capabilities',
      icon: '⚡',
      questions: [
        {
          q: 'What can Tender Cells monitor?',
          a: 'Tender Cells can monitor: temperature, humidity, water levels, feed levels, door status (open/closed), light levels, motion/activity, and with our AI camera, individual animal health and behavior. The specific capabilities depend on which sensors you have installed.'
        },
        {
          q: 'How does the AI health monitoring work?',
          a: 'Our AI analyzes patterns across all your sensor data. If it detects anomalies—like decreased activity, unusual feeding patterns, or environmental stress—it alerts you immediately. The system learns your flock\'s normal behavior and improves over time.'
        },
        {
          q: 'Can I control devices automatically?',
          a: 'Yes! You can create automation rules like "turn on the heater when temperature drops below 60°F" or "close the coop door at sunset." Our system supports complex conditions and schedules.'
        },
        {
          q: 'Does it work without internet?',
          a: 'Yes. All monitoring and automation runs locally on the Smart Hub. You\'ll lose remote access and cloud features during an outage, but your farm keeps running normally. Data syncs automatically when connectivity returns.'
        },
        {
          q: 'Can I integrate with other smart home systems?',
          a: 'Tender Cells integrates with Home Assistant, Apple HomeKit, Amazon Alexa, Google Home, and IFTTT. We also provide a REST API for custom integrations.'
        }
      ]
    },
    {
      id: 'technical',
      name: 'Technical',
      icon: '💻',
      questions: [
        {
          q: 'What wireless protocol do the sensors use?',
          a: 'Our sensors use Zigbee 3.0, which creates a self-healing mesh network. This provides better range and reliability than WiFi or Bluetooth, with much longer battery life. Range is 100+ meters outdoors, more with mesh nodes.'
        },
        {
          q: 'How often is sensor data updated?',
          a: 'Temperature and humidity update every 5 seconds. Water and feed levels update every minute. Motion and activity are real-time. You can adjust these intervals in settings if needed.'
        },
        {
          q: 'Is my data secure?',
          a: 'Yes. All data is encrypted end-to-end using AES-256 encryption. Communications use TLS 1.3. We\'re SOC 2 Type II certified and GDPR compliant. Your data is never sold to third parties.'
        },
        {
          q: 'Can I export my data?',
          a: 'Absolutely. You can export all your data in CSV, JSON, or PDF format at any time. We believe you own your data—it\'s yours to use however you want.'
        },
        {
          q: 'Is the software open source?',
          a: 'Large portions of our software are open source under the MIT license, including the sensor firmware, API libraries, and integration plugins. The AI models and cloud infrastructure are proprietary. Visit our GitHub for details.'
        }
      ]
    },
    {
      id: 'support',
      name: 'Support & Warranty',
      icon: '🛠️',
      questions: [
        {
          q: 'What warranty do you offer?',
          a: 'All Tender Cells hardware comes with a 3-year warranty covering defects in materials and workmanship. Sensors have a 2-year warranty. Extended warranties are available for purchase.'
        },
        {
          q: 'How do I get support?',
          a: 'We offer multiple support channels: in-app chat, email (support@tendercells.com), phone (1-800-TENDER-CELLS), and community forums. Phone support is available Monday-Friday, 9 AM-6 PM EST.'
        },
        {
          q: 'Do you offer on-site installation?',
          a: 'For commercial installations, we offer on-site setup and training through our network of certified installers. Contact sales for pricing and availability in your area.'
        },
        {
          q: 'What if a sensor breaks?',
          a: 'Under warranty, we\'ll ship a replacement immediately—often before you return the defective unit. Our modular design means you can usually swap components yourself in minutes.'
        }
      ]
    }
  ];

  return `
    <div class="faq-page">
      <!-- Hero Section -->
      <section class="faq-hero">
        <div class="container">
          <div class="faq-hero-content">
            <span class="faq-badge">Help Center</span>
            <h1>Frequently Asked <span class="highlight">Questions</span></h1>
            <p class="faq-tagline">
              Find answers to common questions about Tender Cells products, 
              features, and support.
            </p>
            
            <div class="faq-search">
              <input type="text" id="faqSearch" placeholder="Search for answers..." class="faq-search-input">
              <button class="faq-search-btn">
                <span>🔍</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Category Navigation -->
      <section class="faq-categories">
        <div class="container">
          <div class="category-nav">
            ${faqCategories.map(cat => `
              <button class="category-btn" data-category="${cat.id}">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FAQ Content -->
      <section class="faq-content">
        <div class="container">
          <div class="faq-main">
            ${faqCategories.map(cat => `
              <div class="faq-section" id="faq-${cat.id}">
                <h2>
                  <span class="section-icon">${cat.icon}</span>
                  ${cat.name}
                </h2>
                
                <div class="faq-accordion">
                  ${cat.questions.map((item, idx) => `
                    <div class="faq-item" data-index="${cat.id}-${idx}">
                      <button class="faq-question">
                        <span class="question-text">${item.q}</span>
                        <span class="faq-toggle">+</span>
                      </button>
                      <div class="faq-answer">
                        <p>${item.a}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Sidebar -->
          <aside class="faq-sidebar">
            <div class="sidebar-card">
              <h3>Still Have Questions?</h3>
              <p>Can't find what you're looking for? Our support team is here to help.</p>
              <a href="#contact" class="btn btn-primary">Contact Support</a>
            </div>

            <div class="sidebar-card">
              <h3>Quick Links</h3>
              <ul class="quick-links">
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#technology">Our Technology</a></li>
                <li><a href="#store">Shop Products</a></li>
                <li><a href="#open-source">Open Source</a></li>
              </ul>
            </div>

            <div class="sidebar-card highlight">
              <h3>Join Our Community</h3>
              <p>Connect with other Tender Cells users, share tips, and get help from the community.</p>
              <div class="community-links">
                <a href="#" class="community-link">
                  <span>💬</span> Discord
                </a>
                <a href="#" class="community-link">
                  <span>📖</span> Forum
                </a>
                <a href="#" class="community-link">
                  <span>🐙</span> GitHub
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- Popular Topics -->
      <section class="faq-popular">
        <div class="container">
          <div class="section-header">
            <h2>Popular Topics</h2>
            <p>Quick answers to the most common questions.</p>
          </div>

          <div class="popular-grid">
            <a href="#faq-setup" class="popular-card">
              <span class="popular-icon">📦</span>
              <h4>Getting Started</h4>
              <p>Setup guides and first steps</p>
            </a>
            <a href="#faq-features" class="popular-card">
              <span class="popular-icon">📱</span>
              <h4>Mobile App</h4>
              <p>App features and usage</p>
            </a>
            <a href="#faq-technical" class="popular-card">
              <span class="popular-icon">🔗</span>
              <h4>Integrations</h4>
              <p>Smart home connections</p>
            </a>
            <a href="#faq-products" class="popular-card">
              <span class="popular-icon">💳</span>
              <h4>Billing & Plans</h4>
              <p>Pricing and subscriptions</p>
            </a>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="faq-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Transform your farming operation with intelligent automation.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Shop Now</a>
              <a href="#support" class="btn btn-outline btn-large">Get Support</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeFAQPage() {
  // Accordion functionality
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close all items
      faqItems.forEach(i => i.classList.remove('open'));
      
      // Open clicked item if it wasn't already open
      if (!isOpen) {
        item.classList.add('open');
        trackEngagement('faq_view', { question: item.dataset.index });
      }
    });
  });

  // Category navigation
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const categoryId = btn.dataset.category;
      const section = document.getElementById(`faq-${categoryId}`);
      
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight active category
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Search functionality
  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      faqItems.forEach(item => {
        const questionText = item.querySelector('.question-text').textContent.toLowerCase();
        const answerText = item.querySelector('.faq-answer p').textContent.toLowerCase();
        
        if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
          item.style.display = 'block';
          if (searchTerm.length > 2) {
            item.classList.add('open');
          }
        } else {
          item.style.display = searchTerm.length > 0 ? 'none' : 'block';
        }
      });

      // Track search
      if (searchTerm.length > 2) {
        trackEngagement('faq_search', { term: searchTerm });
      }
    });
  }

  // Popular topic links
  const popularCards = document.querySelectorAll('.popular-card');
  popularCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = card.getAttribute('href').slice(1);
      const section = document.getElementById(targetId);
      
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('FAQ page initialized');
}


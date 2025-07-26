// Contact Page
import { trackFormSubmit, trackEngagement } from '../utils/analytics.js';

export function createContactPage() {
  return `
    <div class="contact-page">
      <!-- Hero Section -->
      <section class="contact-hero">
        <div class="container">
          <div class="contact-hero-content">
            <div class="contact-hero-text">
              <h1>Contact Tender Cells</h1>
              <p class="contact-tagline">We're here to help you succeed with smart farming</p>
              <p class="contact-description">
                Whether you're a farmer looking to modernize your operation, an educator interested in our programs, 
                or a developer wanting to contribute to our open-source projects, we'd love to hear from you.
              </p>
            </div>
            <div class="contact-hero-image">
              <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Contact Tender Cells">
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Methods -->
      <section class="contact-methods">
        <div class="container">
          <h2>Get in Touch</h2>
          <div class="methods-grid">
            <div class="method-card">
              <div class="method-icon">📞</div>
              <h3>Phone Support</h3>
              <div class="method-details">
                <p class="method-number">1-800-TENDER-CELLS</p>
                <p class="method-hours">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p class="method-response">Immediate assistance</p>
              </div>
              <p>Speak directly with our team for immediate help with products, orders, or technical questions.</p>
              <button class="btn btn-primary">Call Now</button>
            </div>

            <div class="method-card">
              <div class="method-icon">📧</div>
              <h3>Email Support</h3>
              <div class="method-details">
                <p class="method-number">hello@tendercells.com</p>
                <p class="method-hours">24/7 submission</p>
                <p class="method-response">Response within 24 hours</p>
              </div>
              <p>Send us detailed questions or requests. Include photos and files for faster resolution.</p>
              <button class="btn btn-primary">Send Email</button>
            </div>

            <div class="method-card">
              <div class="method-icon">💬</div>
              <h3>Live Chat</h3>
              <div class="method-details">
                <p class="method-number">Available on website</p>
                <p class="method-hours">Monday - Friday: 10:00 AM - 5:00 PM EST</p>
                <p class="method-response">Real-time responses</p>
              </div>
              <p>Get quick answers through our live chat system. Perfect for quick questions and guidance.</p>
              <button class="btn btn-primary">Start Chat</button>
            </div>

            <div class="method-card">
              <div class="method-icon">🏢</div>
              <h3>Visit Our Office</h3>
              <div class="method-details">
                <p class="method-number">123 Smart Farm Lane</p>
                <p class="method-hours">Austin, TX 78701</p>
                <p class="method-response">By appointment only</p>
              </div>
              <p>Schedule a visit to see our technology in action and meet the team behind Tender Cells.</p>
              <button class="btn btn-primary">Schedule Visit</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Form -->
      <section class="contact-form-section">
        <div class="container">
          <div class="form-content">
            <div class="form-text">
              <h2>Send Us a Message</h2>
              <p>Have a specific question or need personalized assistance? Fill out the form below and we'll get back to you promptly.</p>
              
              <div class="contact-info">
                <div class="contact-item">
                  <div class="contact-icon">📍</div>
                  <div>
                    <h4>Address</h4>
                    <p>123 Smart Farm Lane<br>Austin, TX 78701</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">🕒</div>
                  <div>
                    <h4>Business Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST<br>Saturday: 10:00 AM - 2:00 PM EST</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">🌐</div>
                  <div>
                    <h4>Follow Us</h4>
                    <div class="social-links">
                      <a href="#" class="social-link">Twitter</a>
                      <a href="#" class="social-link">GitHub</a>
                      <a href="#" class="social-link">Discord</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="contact-form">
              <form class="main-contact-form">
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
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" required>
                  </div>
                  <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="company">Company/Organization</label>
                  <input type="text" id="company">
                </div>
                
                <div class="form-group">
                  <label for="inquiryType">Type of Inquiry *</label>
                  <select id="inquiryType" required>
                    <option value="">Select inquiry type</option>
                    <option value="product">Product Information</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="support">Technical Support</option>
                    <option value="education">Education Programs</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="press">Press & Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="subject">Subject *</label>
                  <input type="text" id="subject" placeholder="Brief description of your inquiry" required>
                </div>
                
                <div class="form-group">
                  <label for="message">Message *</label>
                  <textarea id="message" rows="5" placeholder="Please provide details about your inquiry, questions, or how we can help you..." required></textarea>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="newsletter">
                    <span class="checkmark"></span>
                    I'd like to receive updates about new products and features
                  </label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="contact-faq">
        <div class="container">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-grid">
            <div class="faq-item">
              <h4>How quickly will I receive a response?</h4>
              <p>We typically respond to all inquiries within 24 hours during business days. For urgent technical issues, we aim to respond within 4 hours.</p>
            </div>
            
            <div class="faq-item">
              <h4>Do you offer phone support?</h4>
              <p>Yes! Our phone support is available Monday through Friday, 9:00 AM to 6:00 PM EST. Call 1-800-TENDER-CELLS for immediate assistance.</p>
            </div>
            
            <div class="faq-item">
              <h4>Can I schedule a product demonstration?</h4>
              <p>Absolutely! We offer both virtual and in-person demonstrations. Contact us to schedule a demo that works for your schedule.</p>
            </div>
            
            <div class="faq-item">
              <h4>Do you provide international support?</h4>
              <p>Yes, we provide support to customers worldwide. While our primary support hours are EST, we work with international customers to accommodate different time zones.</p>
            </div>
            
            <div class="faq-item">
              <h4>How can educators get started with Tender Cells?</h4>
              <p>Educators can contact our education team directly at education@tendercells.com or visit our Education section for curriculum information and pricing.</p>
            </div>
            
            <div class="faq-item">
              <h4>Is there a community forum for users?</h4>
              <p>Yes! We have an active community forum where users share experiences, ask questions, and collaborate on projects. Join us on Discord or GitHub.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeContactPage() {
  // Contact form submission
  const contactForm = document.querySelector('.main-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      // Track form submission
      trackFormSubmit('contact_form', {
        inquiry_type: data.inquiryType,
        company: data.company ? 'yes' : 'no'
      });
      
      alert(`Thank you for contacting us! We'll respond to your ${data.inquiryType} inquiry within 24 hours.`);
      e.target.reset();
    });
  }
  
  console.log('Contact page initialized');
}
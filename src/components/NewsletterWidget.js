// Newsletter Widget Component - Modular newsletter signup
export function createNewsletterWidget() {
  return `
    <!-- Floating Newsletter Signup -->
    <div class="floating-newsletter" id="floatingNewsletter">
      <div class="newsletter-content">
        <button class="newsletter-close" id="closeNewsletter">×</button>
        <h3>Want to learn more about Tender Cells?</h3>
        <p>Subscribe to our email newsletter to get occasional updates and promos!</p>
        <form class="newsletter-form">
          <input type="email" placeholder="Email" class="newsletter-input" required>
          <button type="submit" class="newsletter-submit">SUBSCRIBE</button>
        </form>
      </div>
    </div>
  `;
}

export function initializeNewsletterWidget() {
  const floatingNewsletter = document.getElementById('floatingNewsletter');
  const closeNewsletter = document.getElementById('closeNewsletter');
  
  // Show newsletter after 5 seconds
  setTimeout(() => {
    if (floatingNewsletter) {
      floatingNewsletter.classList.add('show');
    }
  }, 5000);
  
  if (closeNewsletter) {
    closeNewsletter.addEventListener('click', () => {
      floatingNewsletter.classList.remove('show');
    });
  }

  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      
      // Track newsletter signup
      if (typeof trackNewsletter === 'function') {
        trackNewsletter(email, 'floating_newsletter');
      }
      
      alert(`Thank you for subscribing with ${email}!`);
      floatingNewsletter.classList.remove('show');
    });
  }

  console.log('Newsletter widget initialized');
}
// Dedicated Footer Component
export function createFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>Tender Cells</h4>
            <p>Empowering homesteaders with intelligent, open-source farming solutions that make animal care easier and more effective.</p>
            <div class="social-links">
              <a href="#" class="social-link">GitHub</a>
              <a href="#" class="social-link">Discord</a>
              <a href="#" class="social-link">Twitter</a>
            </div>
          </div>
          <div class="footer-section">
            <h4>Applications</h4>
            <ul class="footer-links">
              <li><a href="#">Chicken Tender</a></li>
              <li><a href="#">Cattle Care (Soon)</a></li>
              <li><a href="#">Pig Pal (Soon)</a></li>
              <li><a href="#">Goat Guardian (Soon)</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Developers</h4>
            <ul class="footer-links">
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Contributing Guide</a></li>
              <li><a href="#">Community Forum</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <ul class="footer-links">
              <li><a href="mailto:hello@tendercells.com">hello@tendercells.com</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Bug Reports</a></li>
              <li><a href="#">Feature Requests</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 Tender Cells. Open source software for the farming community.</p>
          <div class="company-info">
            A WeCr8 Solutions LLC company • Open source project
          </div>
        </div>
      </div>
    </footer>
  `;
}
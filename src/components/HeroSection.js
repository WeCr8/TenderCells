// Hero Section Component - Modular hero content
export function createHeroSection() {
  return `
    <!-- Video Hero Section -->
    <section class="video-hero">
      <div class="video-background">
        <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop" alt="Smart farming background" class="hero-bg-image">
        <div class="video-overlay"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Tender Cells</h1>
          <p class="hero-subtitle">Bring Smart Farming to the Homestead</p>
          <div class="hero-buttons">
            <button class="btn btn-video">
              <span>▶</span>
              WATCH THE VIDEO
            </button>
            <button class="btn btn-order">
              ORDER NOW
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Press Quote Section -->
    <section class="press-section">
      <div class="container">
        <p class="press-quote">"Tender Cells makes smart farming as easy as playing Farmville"</p>
      </div>
    </section>
  `;
}

export function initializeHeroSection() {
  // Video button functionality
  const videoBtn = document.querySelector('.btn-video');
  if (videoBtn) {
    videoBtn.addEventListener('click', () => {
      // TODO: Implement video modal or redirect
      console.log('Video button clicked');
    });
  }

  // Order button functionality
  const orderBtn = document.querySelector('.btn-order');
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      window.location.hash = 'store';
    });
  }

  console.log('Hero section initialized');
}
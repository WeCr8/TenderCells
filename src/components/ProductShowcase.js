// Product Showcase Component - Modular product display
export function createProductShowcase() {
  return `
    <!-- Product Hero Section -->
    <section class="product-hero">
      <div class="container">
        <div class="product-content">
          <div class="product-image">
            <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Chicken Tender Smart Coop" class="product-img">
          </div>
          <div class="product-info">
            <h2 class="product-title">Explore our models</h2>
            <p class="product-description">
              Chicken Tender is our flagship smart coop system currently in build and beta testing phase. 
              Designed specifically for homesteaders and chicken enthusiasts, this system will feature our 
              most advanced technology and come 95% pre-assembled for easy installation.

              Join our beta testing program to be among the first to experience smart farming technology.
            </p>
            <button class="btn btn-product-order">JOIN BETA PROGRAM</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initializeProductShowcase() {
  // Product order button functionality
  const orderBtn = document.querySelector('.btn-product-order');
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      window.location.hash = 'store';
    });
  }

  console.log('Product showcase initialized');
}
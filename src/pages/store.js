// Store Page Component
import { products, getProductById } from '../store/products.js';
import { cart } from '../store/cart.js';
import { trackEvent, trackAddToCart, trackEngagement } from '../utils/analytics.js';
import { generateProductData } from '../utils/seo.js';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock.js';

export function createStorePage() {
  // Generate structured data for products
  products.forEach(product => {
    if (product.featured) {
      generateProductData(product);
    }
  });
  
  return `
    <div class="store-page">
      <!-- Store Header -->
      <section class="store-header">
        <div class="container">
          <div class="store-header-content">
            <h1>Tender Cells Store</h1>
            <p>Smart farming solutions for modern homesteaders</p>
          </div>
        </div>
      </section>

      <!-- Product Grid -->
      <section class="store-products">
        <div class="container">
          <div class="store-filters">
            <div class="filter-group">
              <label>Category:</label>
              <select id="categoryFilter">
                <option value="">All Categories</option>
                <option value="Smart Coops">Smart Coops</option>
                <option value="Smart Systems">Smart Systems</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Availability:</label>
              <select id="availabilityFilter">
                <option value="">All Products</option>
                <option value="available">In Stock</option>
                <option value="preorder">Pre-order</option>
              </select>
            </div>
          </div>

          <div class="products-grid" id="productsGrid">
            ${products.map(product => createProductCard(product)).join('')}
          </div>
        </div>
      </section>
    </div>
  `;
}

function createProductCard(product) {
  const isPreorder = product.status === 'preorder';
  const isOutOfStock = !product.inStock;
  
  return `
    <div class="product-card" data-category="${product.category}" data-status="${product.status}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${isPreorder ? '<div class="product-badge preorder">Pre-order</div>' : ''}
        ${isOutOfStock && !isPreorder ? '<div class="product-badge out-of-stock">Out of Stock</div>' : ''}
        ${product.originalPrice ? '<div class="product-badge sale">Sale</div>' : ''}
      </div>
      
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        
        <div class="product-features">
          ${product.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
        </div>
        
        <div class="product-pricing">
          ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
          <span class="current-price">$${product.price.toFixed(2)}</span>
        </div>
        
        <div class="product-actions">
          <button class="btn btn-primary add-to-cart" 
                  data-product-id="${product.id}"
                  ${isOutOfStock && !isPreorder ? 'disabled' : ''}>
            ${isPreorder ? 'Pre-order Now' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button class="btn btn-secondary view-details" data-product-id="${product.id}">
            View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

export function createProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return '';

  return `
    <div class="product-modal" id="productModal">
      <div class="product-modal-overlay"></div>
      <div class="product-modal-content">
        <button class="product-modal-close" id="closeProductModal">&times;</button>
        
        <div class="product-modal-body">
          <div class="product-gallery">
            <div class="main-image">
              <img src="${product.image}" alt="${product.name}" id="mainProductImage">
            </div>
            ${product.gallery ? `
              <div class="gallery-thumbnails">
                ${product.gallery.map((img, index) => `
                  <img src="${img}" alt="${product.name} ${index + 1}" 
                       class="thumbnail ${index === 0 ? 'active' : ''}"
                       onclick="changeMainImage('${img}', this)">
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="product-details">
            <h2>${product.name}</h2>
            <div class="product-pricing">
              ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
              <span class="current-price">$${product.price.toFixed(2)}</span>
            </div>
            
            <div class="product-description">
              <p>${product.longDescription || product.description}</p>
            </div>
            
            <div class="product-features">
              <h4>Features:</h4>
              <ul>
                ${product.features.map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
            
            ${product.specifications ? `
              <div class="product-specifications">
                <h4>Specifications:</h4>
                <dl>
                  ${Object.entries(product.specifications).map(([key, value]) => `
                    <dt>${key}:</dt>
                    <dd>${value}</dd>
                  `).join('')}
                </dl>
              </div>
            ` : ''}
            
            <div class="product-actions">
              <div class="quantity-selector">
                <label for="quantity">Quantity:</label>
                <div class="quantity-controls">
                  <button type="button" onclick="changeQuantity(-1)">-</button>
                  <input type="number" id="quantity" value="1" min="1" max="10">
                  <button type="button" onclick="changeQuantity(1)">+</button>
                </div>
              </div>
              
              <button class="btn btn-primary btn-large add-to-cart" 
                      data-product-id="${product.id}"
                      ${!product.inStock && product.status !== 'preorder' ? 'disabled' : ''}>
                ${product.status === 'preorder' ? 'Pre-order Now' : !product.inStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
            
            ${product.shipping ? `
              <div class="shipping-info">
                <h4>Shipping:</h4>
                <p>
                  ${product.shipping.free ? '✅ Free shipping worldwide' : 'Shipping calculated at checkout'}
                  <br>
                  📦 Estimated delivery: ${product.shipping.estimatedDays}
                </p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Store page functionality
export function initializeStore() {
  // Filter functionality
  const categoryFilter = document.getElementById('categoryFilter');
  const availabilityFilter = document.getElementById('availabilityFilter');
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
  
  if (availabilityFilter) {
    availabilityFilter.addEventListener('change', filterProducts);
  }
  
  // Add to cart buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const productId = e.target.dataset.productId;
      const quantity = document.getElementById('quantity')?.value || 1;
      addToCart(productId, parseInt(quantity));
    }
    
    if (e.target.classList.contains('view-details')) {
      const productId = e.target.dataset.productId;
      showProductModal(productId);
    }
  });
}

function filterProducts() {
  const categoryFilter = document.getElementById('categoryFilter').value;
  const availabilityFilter = document.getElementById('availabilityFilter').value;
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    const category = card.dataset.category;
    const status = card.dataset.status;
    
    const categoryMatch = !categoryFilter || category === categoryFilter;
    const availabilityMatch = !availabilityFilter || status === availabilityFilter;
    
    if (categoryMatch && availabilityMatch) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function addToCart(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return;
  
  // Track add to cart event
  trackAddToCart(product, product.price * quantity);
  
  cart.addItem(product, quantity);
  
  // Show success message
  showNotification(`${product.shortName} added to cart!`, 'success');
  
  // Close modal if open
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.remove();
  }
}

function showProductModal(productId) {
  // Track product view
  const product = getProductById(productId);
  if (product) {
    trackEvent('view_item', {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      value: product.price
    });
  }
  
  // Remove existing modal
  const existingModal = document.getElementById('productModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create and show new modal
  const modalHTML = createProductModal(productId);
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('productModal');
  const closeBtn = document.getElementById('closeProductModal');
  const overlay = modal.querySelector('.product-modal-overlay');
  
  // Show modal
  modal.style.display = 'flex';
  lockBodyScroll();
  
  // Close modal events
  closeBtn.addEventListener('click', closeProductModal);
  overlay.addEventListener('click', closeProductModal);
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.remove();
    unlockBodyScroll();
  }
}

// Global functions for modal
window.changeMainImage = function(src, thumbnail) {
  document.getElementById('mainProductImage').src = src;
  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  thumbnail.classList.add('active');
};

window.changeQuantity = function(delta) {
  const quantityInput = document.getElementById('quantity');
  const currentValue = parseInt(quantityInput.value);
  const newValue = Math.max(1, Math.min(10, currentValue + delta));
  quantityInput.value = newValue;
};

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Hide notification
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
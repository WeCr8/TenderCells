// Cart Modal Component
import { cart } from '../store/cart.js';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock.js';

export class CartModal {
  constructor() {
    this.isOpen = false;
    this.createModal();
    this.bindEvents();
    
    // Listen for cart changes
    cart.addListener(() => this.updateCartDisplay());
  }

  createModal() {
    const modalHTML = `
      <div id="cartModal" class="cart-modal">
        <div class="cart-modal-overlay"></div>
        <div class="cart-modal-content">
          <div class="cart-modal-header">
            <h2>Shopping Cart</h2>
            <button id="closeCartModal" class="cart-modal-close">&times;</button>
          </div>
          
          <div class="cart-modal-body" id="cartModalBody">
            <!-- Cart content will be inserted here -->
          </div>
          
          <div class="cart-modal-footer" id="cartModalFooter">
            <!-- Cart footer will be inserted here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    const modal = document.getElementById('cartModal');
    const closeBtn = document.getElementById('closeCartModal');
    const overlay = modal.querySelector('.cart-modal-overlay');
    
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', () => this.close());
    
    // Handle cart item actions
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-item')) {
        const productId = e.target.dataset.productId;
        cart.removeItem(productId);
      }
      
      if (e.target.classList.contains('quantity-btn')) {
        const productId = e.target.dataset.productId;
        const change = parseInt(e.target.dataset.change);
        const currentItem = cart.getItems().find(item => item.id === productId);
        if (currentItem) {
          cart.updateQuantity(productId, currentItem.quantity + change);
        }
      }
    });
  }

  open() {
    this.updateCartDisplay();
    const modal = document.getElementById('cartModal');
    modal.style.display = 'flex';
    lockBodyScroll();
    this.isOpen = true;
  }

  close() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'none';
    unlockBodyScroll();
    this.isOpen = false;
  }

  updateCartDisplay() {
    const cartItems = cart.getItems();
    const total = cart.getTotal();
    const itemCount = cart.getItemCount();
    
    // Update cart button badge
    this.updateCartBadge(itemCount);
    
    // Update modal content
    const bodyEl = document.getElementById('cartModalBody');
    const footerEl = document.getElementById('cartModalFooter');
    
    if (cartItems.length === 0) {
      bodyEl.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
        </div>
      `;
      
      footerEl.innerHTML = `
        <button class="btn btn-primary btn-full" onclick="cartModal.close(); window.location.hash = 'store'">
          Continue Shopping
        </button>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="cart-items">
          ${cartItems.map(item => this.createCartItem(item)).join('')}
        </div>
      `;
      
      footerEl.innerHTML = `
        <div class="cart-total">
          <div class="total-row">
            <span>Subtotal (${itemCount} items):</span>
            <span class="total-amount">$${total.toFixed(2)}</span>
          </div>
          <p class="shipping-note">🚚 Free shipping worldwide</p>
        </div>
        <div class="cart-actions">
          <button class="btn btn-secondary" onclick="cartModal.close()">Continue Shopping</button>
          <button class="btn btn-primary" onclick="cartModal.close(); window.location.hash = 'checkout'">
            Checkout
          </button>
        </div>
      `;
    }
  }

  createCartItem(item) {
    return `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-price">$${item.price.toFixed(2)}</p>
          <div class="cart-item-controls">
            <div class="quantity-controls">
              <button class="quantity-btn" data-product-id="${item.id}" data-change="-1">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn" data-product-id="${item.id}" data-change="1">+</button>
            </div>
            <button class="remove-item" data-product-id="${item.id}">Remove</button>
          </div>
        </div>
        <div class="cart-item-total">
          $${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    `;
  }

  updateCartBadge(count) {
    let badge = document.querySelector('.cart-badge');
    
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        document.querySelector('.cart-btn').appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
}

// Create global cart modal instance
export const cartModal = new CartModal();
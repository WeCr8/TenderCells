// Checkout Page Component
import { cart } from '../store/cart.js';
import { getCurrentUser } from '../firebase/auth.js';
import { trackEvent, trackPurchase, trackJourney } from '../utils/analytics.js';

export function createCheckoutPage() {
  const cartItems = cart.getItems();
  const total = cart.getTotal();
  const user = getCurrentUser();

  if (cartItems.length === 0) {
    return `
      <div class="checkout-page">
        <div class="container">
          <div class="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to continue with checkout.</p>
            <a href="#store" class="btn btn-primary">Continue Shopping</a>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="checkout-page">
      <div class="container">
        <div class="checkout-header">
          <h1>Checkout</h1>
          <div class="checkout-steps">
            <div class="step active">1. Review Order</div>
            <div class="step">2. Shipping</div>
            <div class="step">3. Payment</div>
          </div>
        </div>

        <div class="checkout-content">
          <div class="checkout-main">
            <!-- Order Review -->
            <div class="checkout-section" id="orderReview">
              <h2>Order Review</h2>
              <div class="order-items">
                ${cartItems.map(item => createCheckoutItem(item)).join('')}
              </div>
            </div>

            <!-- Shipping Information -->
            <div class="checkout-section" id="shippingInfo" style="display: none;">
              <h2>Shipping Information</h2>
              <form class="shipping-form">
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
                
                <div class="form-group">
                  <label for="email">Email *</label>
                  <input type="email" id="email" value="${user?.email || ''}" required>
                </div>
                
                <div class="form-group">
                  <label for="phone">Phone Number</label>
                  <input type="tel" id="phone">
                </div>
                
                <div class="form-group">
                  <label for="address">Address *</label>
                  <input type="text" id="address" required>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="city">City *</label>
                    <input type="text" id="city" required>
                  </div>
                  <div class="form-group">
                    <label for="state">State/Province *</label>
                    <input type="text" id="state" required>
                  </div>
                  <div class="form-group">
                    <label for="zipCode">ZIP/Postal Code *</label>
                    <input type="text" id="zipCode" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="country">Country *</label>
                  <select id="country" required>
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </form>
            </div>

            <!-- Payment Information -->
            <div class="checkout-section" id="paymentInfo" style="display: none;">
              <h2>Payment Information</h2>
              <div class="payment-methods">
                <div class="payment-method active" data-method="card">
                  <input type="radio" id="creditCard" name="paymentMethod" value="card" checked>
                  <label for="creditCard">Credit/Debit Card</label>
                </div>
                <div class="payment-method" data-method="paypal">
                  <input type="radio" id="paypal" name="paymentMethod" value="paypal">
                  <label for="paypal">PayPal</label>
                </div>
              </div>

              <div class="payment-form" id="cardPayment">
                <div class="form-group">
                  <label for="cardNumber">Card Number *</label>
                  <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" required>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="expiryDate">Expiry Date *</label>
                    <input type="text" id="expiryDate" placeholder="MM/YY" required>
                  </div>
                  <div class="form-group">
                    <label for="cvv">CVV *</label>
                    <input type="text" id="cvv" placeholder="123" required>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="cardName">Name on Card *</label>
                  <input type="text" id="cardName" required>
                </div>
              </div>

              <div class="payment-form" id="paypalPayment" style="display: none;">
                <p>You will be redirected to PayPal to complete your payment.</p>
                <div class="paypal-button-container">
                  <button type="button" class="btn btn-paypal">Continue with PayPal</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="checkout-sidebar">
            <div class="order-summary">
              <h3>Order Summary</h3>
              
              <div class="summary-items">
                ${cartItems.map(item => `
                  <div class="summary-item">
                    <span class="item-name">${item.shortName} × ${item.quantity}</span>
                    <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>Shipping:</span>
                  <span class="free-shipping">FREE</span>
                </div>
                <div class="summary-row">
                  <span>Tax:</span>
                  <span>$${(total * 0.08).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>$${(total * 1.08).toFixed(2)}</span>
                </div>
              </div>
              
              <div class="checkout-actions">
                <button class="btn btn-secondary" id="prevStep" style="display: none;">Previous</button>
                <button class="btn btn-primary" id="nextStep">Continue to Shipping</button>
                <button class="btn btn-success btn-large" id="placeOrder" style="display: none;">
                  Place Order - $${(total * 1.08).toFixed(2)}
                </button>
              </div>
            </div>
            
            <div class="security-badges">
              <div class="security-item">
                <span class="security-icon">🔒</span>
                <span>Secure SSL Encryption</span>
              </div>
              <div class="security-item">
                <span class="security-icon">✅</span>
                <span>Money Back Guarantee</span>
              </div>
              <div class="security-item">
                <span class="security-icon">🚚</span>
                <span>Free Worldwide Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createCheckoutItem(item) {
  return `
    <div class="checkout-item">
      <div class="item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="item-details">
        <h4>${item.name}</h4>
        <p class="item-description">${item.description}</p>
        <div class="item-controls">
          <div class="quantity-controls">
            <button type="button" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <span class="quantity">${item.quantity}</span>
            <button type="button" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
          <button type="button" class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
      <div class="item-price">
        <span class="unit-price">$${item.price.toFixed(2)} each</span>
        <span class="total-price">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  `;
}

export function initializeCheckout() {
  let currentStep = 1;
  const totalSteps = 3;
  
  const nextBtn = document.getElementById('nextStep');
  const prevBtn = document.getElementById('prevStep');
  const placeOrderBtn = document.getElementById('placeOrder');
  
  // Step navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep(currentStep)) {
        currentStep++;
        updateCheckoutStep(currentStep);
      }
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentStep--;
      updateCheckoutStep(currentStep);
    });
  }
  
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', processOrder);
  }
  
  // Payment method selection
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
      });
      e.target.closest('.payment-method').classList.add('active');
      
      document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
      });
      
      if (e.target.value === 'card') {
        document.getElementById('cardPayment').style.display = 'block';
      } else if (e.target.value === 'paypal') {
        document.getElementById('paypalPayment').style.display = 'block';
      }
    });
  });
  
  // Format card number input
  const cardNumberInput = document.getElementById('cardNumber');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
  }
  
  // Format expiry date input
  const expiryInput = document.getElementById('expiryDate');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }
}

function updateCheckoutStep(step) {
  // Update step indicators
  document.querySelectorAll('.step').forEach((stepEl, index) => {
    if (index < step) {
      stepEl.classList.add('active');
    } else {
      stepEl.classList.remove('active');
    }
  });
  
  // Show/hide sections
  document.querySelectorAll('.checkout-section').forEach(section => {
    section.style.display = 'none';
  });
  
  const sections = ['orderReview', 'shippingInfo', 'paymentInfo'];
  document.getElementById(sections[step - 1]).style.display = 'block';
  
  // Update buttons
  const nextBtn = document.getElementById('nextStep');
  const prevBtn = document.getElementById('prevStep');
  const placeOrderBtn = document.getElementById('placeOrder');
  
  if (step === 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.textContent = 'Continue to Shipping';
    placeOrderBtn.style.display = 'none';
  } else if (step === 2) {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';
    nextBtn.textContent = 'Continue to Payment';
    placeOrderBtn.style.display = 'none';
  } else if (step === 3) {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'none';
    placeOrderBtn.style.display = 'block';
  }
}

function validateCurrentStep(step) {
  if (step === 1) {
    return true; // Order review doesn't need validation
  } else if (step === 2) {
    // Validate shipping form
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'country'];
    return requiredFields.every(field => {
      const input = document.getElementById(field);
      return input && input.value.trim() !== '';
    });
  } else if (step === 3) {
    // Validate payment form
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (paymentMethod === 'card') {
      const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
      return requiredFields.every(field => {
        const input = document.getElementById(field);
        return input && input.value.trim() !== '';
      });
    }
    return true;
  }
  return false;
}

async function processOrder() {
  const orderData = collectOrderData();
  
  // Track purchase initiation
  trackJourney('purchase_initiated', 'checkout', orderData.total);
  
  try {
    // Show loading state
    const placeOrderBtn = document.getElementById('placeOrder');
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Track successful purchase
    trackPurchase(orderData.orderId, orderData.items, orderData.total);
    
    // Clear cart
    cart.clearCart();
    
    // Show success message
    showOrderSuccess(orderData);
    
  } catch (error) {
    console.error('Order processing failed:', error);
    
    // Track purchase failure
    trackEvent('purchase_failed', {
      error_message: error.message,
      order_value: orderData.total
    });
    
    alert('Order processing failed. Please try again.');
    
    const placeOrderBtn = document.getElementById('placeOrder');
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';
  }
}

function collectOrderData() {
  const cartItems = cart.getItems();
  const total = cart.getTotal();
  
  return {
    orderId: 'TC-' + Date.now(),
    items: cartItems,
    subtotal: total,
    tax: total * 0.08,
    total: total * 1.08,
    shipping: {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipCode: document.getElementById('zipCode').value,
      country: document.getElementById('country').value
    },
    paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
    orderDate: new Date().toISOString()
  };
}

function showOrderSuccess(orderData) {
  const successHTML = `
    <div class="order-success">
      <div class="success-icon">✅</div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for your order. Your order number is <strong>${orderData.orderId}</strong></p>
      <p>We'll send you a confirmation email shortly with tracking information.</p>
      <div class="success-actions">
        <a href="#store" class="btn btn-primary">Continue Shopping</a>
        <a href="#" class="btn btn-secondary">View Order Status</a>
      </div>
    </div>
  `;
  
  document.querySelector('.checkout-content').innerHTML = successHTML;
}

// Global functions for checkout
window.updateCartQuantity = function(productId, newQuantity) {
  cart.updateQuantity(productId, newQuantity);
  // Refresh checkout page
  window.location.reload();
};

window.removeFromCart = function(productId) {
  cart.removeItem(productId);
  // Refresh checkout page
  window.location.reload();
};
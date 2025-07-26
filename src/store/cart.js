// Cart Management System
class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.listeners = [];
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const saved = localStorage.getItem('tender-cells-cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem('tender-cells-cart', JSON.stringify(this.items));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Add item to cart
  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    this.saveCart();
    return this.items;
  }

  // Remove item from cart
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    return this.items;
  }

  // Update item quantity
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
    return this.items;
  }

  // Clear cart
  clearCart() {
    this.items = [];
    this.saveCart();
    return this.items;
  }

  // Get cart items
  getItems() {
    return this.items;
  }

  // Get cart count
  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Get cart total
  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Add listener for cart changes
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.items));
  }
}

// Create global cart instance
export const cart = new CartManager();
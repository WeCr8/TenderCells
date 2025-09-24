// Event Bus - Global event system for component communication
class EventBus {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  // Emit an event
  emit(event, data = null) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  // Subscribe to an event only once
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
    return unsubscribe;
  }

  // Clear all event listeners
  clear() {
    this.events = {};
  }

  // Get list of active events
  getEvents() {
    return Object.keys(this.events);
  }

  // Get listener count for an event
  getListenerCount(event) {
    return this.events[event]?.length || 0;
  }
}

// Create global event bus instance
export const eventBus = new EventBus();

// Common event types
export const EVENTS = {
  // User events
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_PROFILE_UPDATE: 'user:profile_update',
  
  // Cart events
  CART_ADD_ITEM: 'cart:add_item',
  CART_REMOVE_ITEM: 'cart:remove_item',
  CART_UPDATE_QUANTITY: 'cart:update_quantity',
  CART_CLEAR: 'cart:clear',
  
  // Navigation events
  ROUTE_CHANGE: 'route:change',
  PAGE_LOAD: 'page:load',
  
  // Data events
  DATA_LOADING: 'data:loading',
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  
  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION_SHOW: 'notification:show',
  
  // Search events
  SEARCH_QUERY: 'search:query',
  SEARCH_RESULTS: 'search:results',
  FILTER_CHANGE: 'filter:change'
};

// Convenience functions
export const subscribe = (event, callback) => eventBus.on(event, callback);
export const unsubscribe = (event, callback) => eventBus.off(event, callback);
export const publish = (event, data) => eventBus.emit(event, data);
export const subscribeOnce = (event, callback) => eventBus.once(event, callback);
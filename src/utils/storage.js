// Storage Utilities - Local and session storage management
class StorageManager {
  constructor(prefix = 'tendercells_') {
    this.prefix = prefix;
  }

  // Local Storage methods
  setLocal(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeLocal(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  clearLocal() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Session Storage methods
  setSession(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(this.prefix + key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      return false;
    }
  }

  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  }

  removeSession(key) {
    try {
      sessionStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  }

  clearSession() {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }

  // Utility methods
  isStorageAvailable(type = 'localStorage') {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  getStorageSize(type = 'localStorage') {
    try {
      const storage = window[type];
      let total = 0;
      
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          total += storage[key].length + key.length;
        }
      }
      
      return total;
    } catch (error) {
      return 0;
    }
  }

  // Cache with expiration
  setCache(key, value, expirationMinutes = 60) {
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    const cacheData = {
      value,
      expiration: expirationTime
    };
    
    return this.setLocal(`cache_${key}`, cacheData);
  }

  getCache(key) {
    const cacheData = this.getLocal(`cache_${key}`);
    
    if (!cacheData) return null;
    
    if (Date.now() > cacheData.expiration) {
      this.removeLocal(`cache_${key}`);
      return null;
    }
    
    return cacheData.value;
  }

  clearExpiredCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix + 'cache_')) {
          const cacheData = this.getLocal(key.replace(this.prefix, ''));
          if (cacheData && Date.now() > cacheData.expiration) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
}

// Create global storage instance
export const storage = new StorageManager();

// Convenience exports
export const setLocal = (key, value) => storage.setLocal(key, value);
export const getLocal = (key, defaultValue) => storage.getLocal(key, defaultValue);
export const removeLocal = (key) => storage.removeLocal(key);
export const setSession = (key, value) => storage.setSession(key, value);
export const getSession = (key, defaultValue) => storage.getSession(key, defaultValue);
export const removeSession = (key) => storage.removeSession(key);
export const setCache = (key, value, minutes) => storage.setCache(key, value, minutes);
export const getCache = (key) => storage.getCache(key);
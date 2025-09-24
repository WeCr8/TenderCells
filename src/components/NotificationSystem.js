// Notification System Component - Toast notifications and alerts
export class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.createContainer();
  }

  createContainer() {
    if (!document.getElementById('notificationContainer')) {
      const container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
      this.container = container;
    }
  }

  show(message, type = 'info', duration = 5000, actions = []) {
    const id = 'notification_' + Date.now();
    const notification = {
      id,
      message,
      type,
      duration,
      actions,
      timestamp: new Date()
    };

    this.notifications.push(notification);
    this.render(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  render(notification) {
    const iconMap = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    const actionsHTML = notification.actions.length > 0 ? `
      <div class="notification-actions">
        ${notification.actions.map(action => `
          <button class="notification-action ${action.type || 'secondary'}" 
                  onclick="${action.onClick}">
            ${action.label}
          </button>
        `).join('')}
      </div>
    ` : '';

    const notificationHTML = `
      <div id="${notification.id}" class="notification notification-${notification.type}">
        <div class="notification-content">
          <div class="notification-icon">${iconMap[notification.type]}</div>
          <div class="notification-message">${notification.message}</div>
          <button class="notification-close" onclick="notificationSystem.remove('${notification.id}')">&times;</button>
        </div>
        ${actionsHTML}
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', notificationHTML);

    // Animate in
    setTimeout(() => {
      const element = document.getElementById(notification.id);
      if (element) {
        element.classList.add('show');
      }
    }, 100);
  }

  remove(id) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('show');
      setTimeout(() => {
        element.remove();
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification.id);
    });
  }

  // Convenience methods
  success(message, duration = 5000, actions = []) {
    return this.show(message, 'success', duration, actions);
  }

  error(message, duration = 8000, actions = []) {
    return this.show(message, 'error', duration, actions);
  }

  warning(message, duration = 6000, actions = []) {
    return this.show(message, 'warning', duration, actions);
  }

  info(message, duration = 5000, actions = []) {
    return this.show(message, 'info', duration, actions);
  }
}

// Create global notification system
export const notificationSystem = new NotificationSystem();

// Global convenience functions
window.showNotification = (message, type, duration) => notificationSystem.show(message, type, duration);
window.showSuccess = (message, duration) => notificationSystem.success(message, duration);
window.showError = (message, duration) => notificationSystem.error(message, duration);
window.showWarning = (message, duration) => notificationSystem.warning(message, duration);
window.showInfo = (message, duration) => notificationSystem.info(message, duration);
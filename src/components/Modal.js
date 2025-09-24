// Modal Component - Reusable modal system
export class Modal {
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      closable: true,
      backdrop: true,
      keyboard: true,
      size: 'medium',
      ...options
    };
    this.isOpen = false;
    this.onClose = null;
    this.onOpen = null;
  }

  create(title, content, footer = '') {
    const sizeClass = `modal-${this.options.size}`;
    
    const modalHTML = `
      <div id="${this.id}" class="modal ${sizeClass}">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            ${this.options.closable ? '<button class="modal-close">&times;</button>' : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById(this.id);
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById(this.id);
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');

    if (closeBtn && this.options.closable) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (overlay && this.options.backdrop) {
      overlay.addEventListener('click', () => this.close());
    }

    if (this.options.keyboard) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
  }

  open() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
      
      if (this.onOpen) {
        this.onOpen();
      }
    }
  }

  close() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.isOpen = false;
      
      if (this.onClose) {
        this.onClose();
      }
    }
  }

  updateContent(content) {
    const modal = document.getElementById(this.id);
    const body = modal?.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
    }
  }

  updateTitle(title) {
    const modal = document.getElementById(this.id);
    const titleEl = modal?.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  destroy() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.remove();
    }
    this.isOpen = false;
  }
}

// Utility functions for common modal types
export function createConfirmModal(title, message, onConfirm, onCancel = null) {
  const modal = new Modal('confirmModal', { size: 'small' });
  
  const footer = `
    <button class="btn btn-secondary" onclick="handleModalCancel()">Cancel</button>
    <button class="btn btn-primary" onclick="handleModalConfirm()">Confirm</button>
  `;
  
  modal.create(title, `<p>${message}</p>`, footer);
  
  window.handleModalConfirm = () => {
    if (onConfirm) onConfirm();
    modal.close();
  };
  
  window.handleModalCancel = () => {
    if (onCancel) onCancel();
    modal.close();
  };
  
  return modal;
}

export function createAlertModal(title, message, type = 'info') {
  const modal = new Modal('alertModal', { size: 'small' });
  
  const iconMap = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️'
  };
  
  const content = `
    <div class="alert-content ${type}">
      <div class="alert-icon">${iconMap[type]}</div>
      <p>${message}</p>
    </div>
  `;
  
  const footer = `<button class="btn btn-primary" onclick="document.getElementById('alertModal').style.display='none'">OK</button>`;
  
  modal.create(title, content, footer);
  return modal;
}
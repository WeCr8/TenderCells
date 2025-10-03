// Navigation dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
  // Get all dropdown buttons
  const dropdownButtons = document.querySelectorAll('.nav-item.dropdown .nav-link');
  
  // Handle click events on dropdown buttons
  dropdownButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other dropdowns
      dropdownButtons.forEach(otherButton => {
        if (otherButton !== button) {
          otherButton.setAttribute('aria-expanded', 'false');
          otherButton.closest('.dropdown').classList.remove('active');
        }
      });
      
      // Toggle current dropdown
      button.setAttribute('aria-expanded', !isExpanded);
      button.closest('.dropdown').classList.toggle('active');
    });
  });
  
  // Handle keyboard navigation
  document.addEventListener('keydown', (e) => {
    const activeDropdown = document.querySelector('.dropdown.active');
    
    if (activeDropdown) {
      const currentButton = activeDropdown.querySelector('.nav-link');
      const menu = activeDropdown.querySelector('.dropdown-menu');
      const items = Array.from(menu.querySelectorAll('.dropdown-item:not([aria-disabled="true"])'));
      const currentItem = document.activeElement;
      
      switch (e.key) {
        case 'Escape':
          // Close dropdown
          currentButton.setAttribute('aria-expanded', 'false');
          activeDropdown.classList.remove('active');
          currentButton.focus();
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          if (document.activeElement === currentButton) {
            // Focus first item
            items[0]?.focus();
          } else {
            // Focus next item
            const currentIndex = items.indexOf(currentItem);
            if (currentIndex < items.length - 1) {
              items[currentIndex + 1].focus();
            }
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (document.activeElement !== currentButton) {
            const currentIndex = items.indexOf(currentItem);
            if (currentIndex > 0) {
              // Focus previous item
              items[currentIndex - 1].focus();
            } else {
              // Focus button if at first item
              currentButton.focus();
            }
          }
          break;
          
        case 'Home':
          e.preventDefault();
          items[0]?.focus();
          break;
          
        case 'End':
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
      }
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.dropdown')) {
      dropdownButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.closest('.dropdown').classList.remove('active');
      });
    }
  });
  
  // Handle focus management
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    const dropdown = target.closest('.dropdown');
    
    // If focusing something outside dropdowns, close all dropdowns
    if (!dropdown) {
      dropdownButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.closest('.dropdown').classList.remove('active');
      });
    }
  });
});
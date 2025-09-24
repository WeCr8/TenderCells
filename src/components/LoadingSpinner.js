// Loading Spinner Component - Reusable loading states
export function createLoadingSpinner(size = 'medium', message = 'Loading...') {
  const sizeClass = `spinner-${size}`;
  
  return `
    <div class="loading-spinner ${sizeClass}">
      <div class="spinner-circle"></div>
      <p class="spinner-message">${message}</p>
    </div>
  `;
}

export function createSkeletonLoader(type = 'card') {
  switch (type) {
    case 'card':
      return `
        <div class="skeleton-loader skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>
      `;
    
    case 'list':
      return `
        <div class="skeleton-loader skeleton-list">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      `;
    
    case 'text':
      return `
        <div class="skeleton-loader skeleton-text-block">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      `;
    
    default:
      return createLoadingSpinner();
  }
}

export function showLoading(containerId, message = 'Loading...') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = createLoadingSpinner('medium', message);
  }
}

export function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
}
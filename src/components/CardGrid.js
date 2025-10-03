// Card Grid Component - Reusable grid layouts
export class CardGrid {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      columns: 'auto-fit',
      minCardWidth: '300px',
      gap: '24px',
      loading: false,
      loadingCount: 6,
      ...options
    };
    this.data = [];
    this.renderFunction = null;
  }

  render(data, renderFunction) {
    this.data = data;
    this.renderFunction = renderFunction;
    
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.options.loading) {
      this.showLoading();
      return;
    }

    if (!data || data.length === 0) {
      this.showEmpty();
      return;
    }

    const gridHTML = `
      <div class="card-grid" style="
        display: grid;
        grid-template-columns: repeat(${this.options.columns}, minmax(${this.options.minCardWidth}, 1fr));
        gap: ${this.options.gap};
      ">
        ${data.map(item => renderFunction(item)).join('')}
      </div>
    `;

    container.innerHTML = gridHTML;
  }

  showLoading() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const skeletonCards = Array(this.options.loadingCount).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>
    `).join('');

    const gridHTML = `
      <div class="card-grid loading" style="
        display: grid;
        grid-template-columns: repeat(${this.options.columns}, minmax(${this.options.minCardWidth}, 1fr));
        gap: ${this.options.gap};
      ">
        ${skeletonCards}
      </div>
    `;

    container.innerHTML = gridHTML;
  }

  showEmpty() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card-grid-empty">
        <div class="empty-icon">📭</div>
        <h3>No items to display</h3>
        <p>Check back later or try adjusting your filters</p>
      </div>
    `;
  }

  updateData(newData) {
    this.render(newData, this.renderFunction);
  }

  addItem(item) {
    this.data.push(item);
    this.updateData(this.data);
  }

  removeItem(predicate) {
    this.data = this.data.filter(item => !predicate(item));
    this.updateData(this.data);
  }

  updateItem(predicate, updater) {
    this.data = this.data.map(item => predicate(item) ? updater(item) : item);
    this.updateData(this.data);
  }
}
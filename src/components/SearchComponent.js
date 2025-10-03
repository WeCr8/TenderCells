// Search Component - Reusable search functionality
export class SearchComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      placeholder: 'Search...',
      showFilters: false,
      showResults: true,
      debounceTime: 300,
      minSearchLength: 2,
      ...options
    };
    this.searchTimeout = null;
    this.onSearch = null;
    this.onFilter = null;
    this.results = [];
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const filtersHTML = this.options.showFilters ? `
      <div class="search-filters">
        <select class="search-filter" id="${this.containerId}_categoryFilter">
          <option value="">All Categories</option>
          ${this.options.categories?.map(cat => `
            <option value="${cat.value}">${cat.label}</option>
          `).join('') || ''}
        </select>
        
        <select class="search-filter" id="${this.containerId}_sortFilter">
          <option value="relevance">Sort by Relevance</option>
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="rating">Sort by Rating</option>
        </select>
        
        <button class="btn btn-secondary" onclick="searchComponent_${this.containerId}.clearFilters()">
          Clear Filters
        </button>
      </div>
    ` : '';

    const resultsHTML = this.options.showResults ? `
      <div class="search-results" id="${this.containerId}_results">
        <div class="search-placeholder">
          <div class="placeholder-icon">🔍</div>
          <p>Start typing to search...</p>
        </div>
      </div>
    ` : '';

    const searchHTML = `
      <div class="search-component">
        <div class="search-input-container">
          <input type="text" 
                 class="search-input" 
                 id="${this.containerId}_searchInput"
                 placeholder="${this.options.placeholder}">
          <button class="search-btn" id="${this.containerId}_searchBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
        ${filtersHTML}
        ${resultsHTML}
      </div>
    `;

    container.innerHTML = searchHTML;
    this.bindEvents();
  }

  bindEvents() {
    const searchInput = document.getElementById(`${this.containerId}_searchInput`);
    const searchBtn = document.getElementById(`${this.containerId}_searchBtn`);
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(e.target.value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput.value;
        this.performSearch(query);
      });
    }

    // Filter event listeners
    if (this.options.showFilters) {
      const categoryFilter = document.getElementById(`${this.containerId}_categoryFilter`);
      const sortFilter = document.getElementById(`${this.containerId}_sortFilter`);
      
      if (categoryFilter) {
        categoryFilter.addEventListener('change', () => this.handleFilters());
      }
      
      if (sortFilter) {
        sortFilter.addEventListener('change', () => this.handleFilters());
      }
    }

    // Make this instance globally accessible for clear filters
    window[`searchComponent_${this.containerId}`] = this;
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);
    
    if (query.length < this.options.minSearchLength) {
      this.showPlaceholder();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, this.options.debounceTime);
  }

  performSearch(query) {
    if (this.onSearch) {
      const filters = this.getFilters();
      this.onSearch(query, filters);
    }
  }

  handleFilters() {
    const query = document.getElementById(`${this.containerId}_searchInput`).value;
    const filters = this.getFilters();
    
    if (this.onFilter) {
      this.onFilter(query, filters);
    }
  }

  getFilters() {
    if (!this.options.showFilters) return {};

    return {
      category: document.getElementById(`${this.containerId}_categoryFilter`)?.value || '',
      sort: document.getElementById(`${this.containerId}_sortFilter`)?.value || 'relevance'
    };
  }

  updateResults(results, renderFunction) {
    const resultsContainer = document.getElementById(`${this.containerId}_results`);
    if (!resultsContainer) return;

    this.results = results;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      `;
    } else {
      const resultsHTML = results.map(result => renderFunction(result)).join('');
      resultsContainer.innerHTML = `
        <div class="search-results-header">
          <h3>Search Results (${results.length})</h3>
        </div>
        <div class="search-results-grid">
          ${resultsHTML}
        </div>
      `;
    }
  }

  showPlaceholder() {
    const resultsContainer = document.getElementById(`${this.containerId}_results`);
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="search-placeholder">
          <div class="placeholder-icon">🔍</div>
          <p>Start typing to search...</p>
        </div>
      `;
    }
  }

  clearFilters() {
    if (this.options.showFilters) {
      document.getElementById(`${this.containerId}_categoryFilter`).value = '';
      document.getElementById(`${this.containerId}_sortFilter`).value = 'relevance';
      this.handleFilters();
    }
  }

  clear() {
    document.getElementById(`${this.containerId}_searchInput`).value = '';
    this.showPlaceholder();
  }
}
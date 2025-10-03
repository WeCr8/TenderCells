// Data Table Component - Reusable table with sorting and pagination
export class DataTable {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      columns: [],
      data: [],
      sortable: true,
      paginated: true,
      pageSize: 10,
      searchable: false,
      selectable: false,
      ...options
    };
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filteredData = [...this.options.data];
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const searchHTML = this.options.searchable ? `
      <div class="table-search">
        <input type="text" 
               class="table-search-input" 
               placeholder="Search table..."
               onkeyup="dataTable_${this.containerId}.handleSearch(this.value)">
      </div>
    ` : '';

    const tableHTML = `
      <div class="data-table-container">
        ${searchHTML}
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                ${this.options.selectable ? '<th class="select-column"><input type="checkbox" onchange="dataTable_' + this.containerId + '.toggleSelectAll(this.checked)"></th>' : ''}
                ${this.options.columns.map(col => `
                  <th class="table-header ${col.sortable !== false && this.options.sortable ? 'sortable' : ''}" 
                      onclick="${col.sortable !== false && this.options.sortable ? `dataTable_${this.containerId}.sort('${col.key}')` : ''}">
                    ${col.label}
                    ${this.sortColumn === col.key ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody id="${this.containerId}_tableBody">
              ${this.renderRows()}
            </tbody>
          </table>
        </div>
        ${this.options.paginated ? this.renderPagination() : ''}
      </div>
    `;

    container.innerHTML = tableHTML;
    
    // Make this instance globally accessible
    window[`dataTable_${this.containerId}`] = this;
  }

  renderRows() {
    const startIndex = (this.currentPage - 1) * this.options.pageSize;
    const endIndex = this.options.paginated ? startIndex + this.options.pageSize : this.filteredData.length;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return pageData.map((row, index) => {
      const actualIndex = startIndex + index;
      return `
        <tr class="table-row" data-index="${actualIndex}">
          ${this.options.selectable ? `<td class="select-column"><input type="checkbox" onchange="dataTable_${this.containerId}.toggleSelectRow(${actualIndex}, this.checked)"></td>` : ''}
          ${this.options.columns.map(col => `
            <td class="table-cell" data-column="${col.key}">
              ${this.renderCell(row, col)}
            </td>
          `).join('')}
        </tr>
      `;
    }).join('');
  }

  renderCell(row, column) {
    const value = this.getNestedValue(row, column.key);
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'currency') {
      return `$${parseFloat(value).toFixed(2)}`;
    }
    
    if (column.type === 'boolean') {
      return value ? '✅' : '❌';
    }
    
    return value || '';
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
    
    if (totalPages <= 1) return '';

    const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
    const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';

    return `
      <div class="table-pagination">
        <div class="pagination-info">
          Showing ${(this.currentPage - 1) * this.options.pageSize + 1} to 
          ${Math.min(this.currentPage * this.options.pageSize, this.filteredData.length)} 
          of ${this.filteredData.length} entries
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn ${prevDisabled}" 
                  onclick="dataTable_${this.containerId}.goToPage(${this.currentPage - 1})" 
                  ${prevDisabled}>
            Previous
          </button>
          ${this.renderPageNumbers(totalPages)}
          <button class="pagination-btn ${nextDisabled}" 
                  onclick="dataTable_${this.containerId}.goToPage(${this.currentPage + 1})" 
                  ${nextDisabled}>
            Next
          </button>
        </div>
      </div>
    `;
  }

  renderPageNumbers(totalPages) {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      pages.push(`
        <button class="pagination-btn page-number ${activeClass}" 
                onclick="dataTable_${this.containerId}.goToPage(${i})">
          ${i}
        </button>
      `);
    }

    return pages.join('');
  }

  // Data manipulation methods
  updateData(newData) {
    this.options.data = newData;
    this.filteredData = [...newData];
    this.currentPage = 1;
    this.render();
  }

  sort(columnKey) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = this.getNestedValue(a, columnKey);
      const bVal = this.getNestedValue(b, columnKey);
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;
      
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });

    this.render();
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);
    
    this.searchTimeout = setTimeout(() => {
      if (query.length < this.options.minSearchLength) {
        this.filteredData = [...this.options.data];
      } else {
        this.filteredData = this.options.data.filter(row => {
          return this.options.columns.some(col => {
            const value = this.getNestedValue(row, col.key);
            return String(value).toLowerCase().includes(query.toLowerCase());
          });
        });
      }
      
      this.currentPage = 1;
      this.render();
    }, this.options.debounceTime);
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.render();
    }
  }

  toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll(`#${this.containerId} .table-row input[type="checkbox"]`);
    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
    });
  }

  toggleSelectRow(index, checked) {
    // Handle individual row selection
    console.log(`Row ${index} ${checked ? 'selected' : 'deselected'}`);
  }

  getSelectedRows() {
    const selected = [];
    const checkboxes = document.querySelectorAll(`#${this.containerId} .table-row input[type="checkbox"]:checked`);
    
    checkboxes.forEach(checkbox => {
      const row = checkbox.closest('.table-row');
      const index = parseInt(row.dataset.index);
      selected.push(this.filteredData[index]);
    });
    
    return selected;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
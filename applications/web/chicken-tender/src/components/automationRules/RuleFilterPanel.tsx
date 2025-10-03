import React from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { RuleFilter, RuleStatus, RuleCategory } from '../../types/automationRules';

interface RuleFilterPanelProps {
  filters: RuleFilter;
  onFiltersChange: (filters: RuleFilter) => void;
  onClose: () => void;
  className?: string;
}

export default function RuleFilterPanel({
  filters,
  onFiltersChange,
  onClose,
  className = ''
}: RuleFilterPanelProps) {
  const statusOptions: { value: RuleStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'paused', label: 'Paused' },
    { value: 'error', label: 'Error' },
    { value: 'testing', label: 'Testing' }
  ];

  const categoryOptions: { value: RuleCategory; label: string }[] = [
    { value: 'feeding', label: 'Feeding' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'door', label: 'Door Control' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'health_check', label: 'Health Check' },
    { value: 'security', label: 'Security' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const handleStatusChange = (status: RuleStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handleCategoryChange = (category: RuleCategory, checked: boolean) => {
    const currentCategories = filters.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    onFiltersChange({
      ...filters,
      category: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    onFiltersChange({
      ...filters,
      tags: tags.length > 0 ? tags : undefined
    });
  };

  const handleAuthorChange = (author: string) => {
    onFiltersChange({
      ...filters,
      author: author.trim() || undefined
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const currentRange = filters.dateRange || { start: '', end: '' };
    const newRange = { ...currentRange, [field]: value };
    
    onFiltersChange({
      ...filters,
      dateRange: (newRange.start || newRange.end) ? newRange : undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(option.value) || false}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
          <div className="space-y-2">
            {categoryOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.category?.includes(option.value) || false}
                  onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags and Author */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
          <input
            type="text"
            placeholder="Enter tags (comma-separated)"
            value={filters.tags?.join(', ') || ''}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-500 focus:border-transparent text-sm"
          />
          
          <h4 className="text-sm font-medium text-gray-900 mb-3 mt-4">Author</h4>
          <input
            type="text"
            placeholder="Filter by author"
            value={filters.author || ''}
            onChange={(e) => handleAuthorChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.status?.map((status) => (
              <span
                key={status}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-farm-100 text-farm-800"
              >
                Status: {status}
                <button
                  onClick={() => handleStatusChange(status, false)}
                  className="ml-1 text-farm-600 hover:text-farm-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.category?.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Category: {category.replace('_', ' ')}
                <button
                  onClick={() => handleCategoryChange(category, false)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.author && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Author: {filters.author}
                <button
                  onClick={() => handleAuthorChange('')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
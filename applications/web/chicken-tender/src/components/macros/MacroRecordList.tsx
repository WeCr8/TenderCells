import React, { useState } from 'react';
import { Search, Filter, History, Download } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import MacroRecordCard from './MacroRecordCard';
import type { MacroRecord, MacroFilter } from '../../types/macros';

interface MacroRecordListProps {
  records: MacroRecord[];
  onViewRecord?: (record: MacroRecord) => void;
  onFilterChange?: (filter: MacroFilter) => void;
  onExport?: () => void;
  loading?: boolean;
  className?: string;
}

export default function MacroRecordList({
  records,
  onViewRecord,
  onFilterChange,
  onExport,
  loading = false,
  className = ''
}: MacroRecordListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (onFilterChange) {
      onFilterChange({ search: term });
    }
  };

  const handleTypeFilter = (type: string | null) => {
    setTypeFilter(type);
    if (onFilterChange) {
      onFilterChange({
        types: type ? [type as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    if (onFilterChange) {
      onFilterChange({
        status: status ? [status as any] : undefined,
        types: typeFilter ? [typeFilter as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  // Filter records based on search, type, and status
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === null || record.type === typeFilter;
    const matchesStatus = statusFilter === null || record.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group records by date
  const groupedRecords: Record<string, MacroRecord[]> = {};
  
  filteredRecords.forEach(record => {
    const date = new Date(record.executedAt).toLocaleDateString();
    if (!groupedRecords[date]) {
      groupedRecords[date] = [];
    }
    groupedRecords[date].push(record);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search execution history..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={typeFilter || ''}
            onChange={(e) => handleTypeFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="record">Record</option>
            <option value="task">Task</option>
            <option value="configuration">Configuration</option>
            <option value="flock">Flock</option>
            <option value="chicken">Chicken</option>
          </select>
          
          <select
            value={statusFilter || ''}
            onChange={(e) => handleStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            More Filters
          </Button>
          {onExport && (
            <Button
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              size="sm"
              onClick={onExport}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Records by Date */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No execution history found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || typeFilter || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Execute a macro to see its history here'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                <span className="text-sm text-gray-500">({groupedRecords[date].length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedRecords[date].map((record) => (
                  <MacroRecordCard
                    key={record.id}
                    record={record}
                    onClick={() => onViewRecord?.(record)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
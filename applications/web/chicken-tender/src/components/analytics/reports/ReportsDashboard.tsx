import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import AnalyticsReportCard from '../shared/AnalyticsReportCard';
import ReportDetailView from './ReportDetailView';
import type { AnalyticsReport, AnalyticsFilter } from '../../../types/analytics';

interface ReportsDashboardProps {
  reports: AnalyticsReport[];
  loading?: boolean;
  onCreateReport?: () => void;
  onRefresh?: () => void;
  onFilterChange?: (filter: AnalyticsFilter) => void;
  onExport?: (reportId: string) => void;
  className?: string;
}

export default function ReportsDashboard({
  reports,
  loading = false,
  onCreateReport,
  onRefresh,
  onFilterChange,
  onExport,
  className = ''
}: ReportsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (onFilterChange) {
      onFilterChange({
        search: term || undefined,
        categories: selectedCategory !== 'all' ? [selectedCategory as any] : undefined
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    if (onFilterChange) {
      onFilterChange({
        categories: category !== 'all' ? [category as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    // Convert period to date range
    if (period !== 'all' && onFilterChange) {
      let startDate = new Date();
      const endDate = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date(endDate.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      onFilterChange({
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        categories: selectedCategory !== 'all' ? [selectedCategory as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleReportClick = (report: AnalyticsReport) => {
    setSelectedReport(report);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || report.type === selectedCategory;
    
    // Period filtering would be handled by the API in a real application
    
    return matchesSearch && matchesCategory;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View and generate detailed analytics reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            size="sm"
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreateReport}
          >
            Create Report
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="production">Production</option>
            <option value="health">Health</option>
            <option value="environment">Environment</option>
            <option value="automation">Automation</option>
            <option value="financial">Financial</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            Advanced Filters
          </Button>
          <Button
            variant="outline"
            icon={<Calendar className="w-4 h-4" />}
            size="sm"
          >
            Custom Range
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          icon={<BarChart3 className="w-4 h-4" />}
          size="sm"
        >
          Production Reports
        </Button>
        <Button
          variant="outline"
          icon={<LineChart className="w-4 h-4" />}
          size="sm"
        >
          Health Reports
        </Button>
        <Button
          variant="outline"
          icon={<PieChart className="w-4 h-4" />}
          size="sm"
        >
          Financial Reports
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-${selectedReport ? '2' : '4'}`}>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || selectedPeriod !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first report'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedPeriod === 'all' && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onCreateReport}
                >
                  Create First Report
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <AnalyticsReportCard
                  key={report.id}
                  report={report}
                  onClick={() => handleReportClick(report)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Report Detail View */}
        {selectedReport && (
          <div className="lg:col-span-2">
            <ReportDetailView
              report={selectedReport}
              onClose={() => setSelectedReport(null)}
              onExport={() => onExport?.(selectedReport.id)}
            />
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          icon={<Upload className="w-4 h-4" />}
        >
          Import Reports
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
        >
          Export All Reports
        </Button>
      </div>
    </div>
  );
}
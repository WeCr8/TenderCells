import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  RefreshCw,
  Plus,
  Eye,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import AnalyticsMetricCard from '../shared/AnalyticsMetricCard';
import AnalyticsChartCard from '../shared/AnalyticsChartCard';
import AnalyticsReportCard from '../shared/AnalyticsReportCard';
import AnalyticsAlertPanel from '../shared/AnalyticsAlertPanel';
import type { AnalyticsDashboard, AnalyticsFilter } from '../../../types/analytics';

interface AnalyticsOverviewProps {
  dashboard: AnalyticsDashboard;
  loading?: boolean;
  onFilterChange?: (filter: AnalyticsFilter) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onCreateReport?: () => void;
  onViewReport?: (reportId: string) => void;
  className?: string;
}

export default function AnalyticsOverview({
  dashboard,
  loading = false,
  onFilterChange,
  onRefresh,
  onExport,
  onCreateReport,
  onViewReport,
  className = ''
}: AnalyticsOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    // Convert period to date range
    let startDate = new Date();
    const endDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    if (onFilterChange) {
      onFilterChange({
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        categories: selectedCategory !== 'all' ? [selectedCategory as any] : undefined
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    if (onFilterChange) {
      onFilterChange({
        categories: category !== 'all' ? [category as any] : undefined
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (onFilterChange) {
      onFilterChange({
        search: term || undefined
      });
    }
  };

  const filteredMetrics = dashboard.metrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const filteredCharts = dashboard.charts.filter(chart => 
    selectedCategory === 'all' || chart.type === selectedCategory
  ).filter(chart =>
    searchTerm === '' || 
    chart.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chart.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor performance and insights across your farm operations</p>
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
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            size="sm"
            onClick={onExport}
          >
            Export
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

      {/* Alerts */}
      {dashboard.alerts.length > 0 && (
        <AnalyticsAlertPanel alerts={dashboard.alerts} />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
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
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search analytics..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
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

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMetrics.slice(0, 4).map((metric) => (
            <AnalyticsMetricCard
              key={metric.id}
              metric={metric}
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCharts.slice(0, 4).map((chart) => (
            <AnalyticsChartCard
              key={chart.id}
              report={chart}
            />
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewReport?.('all')}
          >
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.charts.slice(0, 6).map((report) => (
            <AnalyticsReportCard
              key={report.id}
              report={report}
              onClick={() => onViewReport?.(report.id)}
            />
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
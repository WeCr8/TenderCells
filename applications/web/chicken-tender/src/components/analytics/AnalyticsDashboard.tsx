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
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AnalyticsMetricCard from './AnalyticsMetricCard';
import AnalyticsChartCard from './AnalyticsChartCard';
import AnalyticsReportCard from './AnalyticsReportCard';
import type { AnalyticsDashboard as AnalyticsDashboardType, AnalyticsFilter } from '../../types/analytics';

interface AnalyticsDashboardProps {
  dashboard: AnalyticsDashboardType;
  loading?: boolean;
  onFilterChange?: (filter: AnalyticsFilter) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onCreateReport?: () => void;
  onViewReport?: (reportId: string) => void;
}

export default function AnalyticsDashboard({
  dashboard,
  loading = false,
  onFilterChange,
  onRefresh,
  onExport,
  onCreateReport,
  onViewReport
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredMetrics = dashboard.metrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const filteredCharts = dashboard.charts.filter(chart => 
    selectedCategory === 'all' || chart.type === selectedCategory
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
    <div className="space-y-6">
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-medium text-amber-800">Analytics Alerts</h3>
          </div>
          <div className="space-y-2">
            {dashboard.alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm text-amber-700">
                <span className="font-medium">{alert.title}:</span> {alert.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
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
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="production">Production</option>
            <option value="health">Health</option>
            <option value="environment">Environment</option>
            <option value="automation">Automation</option>
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
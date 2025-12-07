import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AnalyticsOverview from '../components/analytics/overview/AnalyticsOverview';
import ReportsDashboard from '../components/analytics/reports/ReportsDashboard';
import InsightsDashboard from '../components/analytics/insights/InsightsDashboard';
import { useAnalytics } from '../hooks/useAnalytics';
import type { AnalyticsFilter } from '../types/analytics';

export default function AnalyticsPage() {
  const location = useLocation();
  const { 
    dashboard, 
    reports, 
    insights, 
    loading, 
    fetchDashboard, 
    fetchReports, 
    fetchInsights,
    generateReport,
    exportData
  } = useAnalytics();

  const [activeView, setActiveView] = useState(() => {
    if (location.pathname.includes('/reports')) return 'reports';
    if (location.pathname.includes('/insights')) return 'insights';
    return 'overview';
  });

  const handleFilterChange = (filter: AnalyticsFilter) => {
    if (activeView === 'overview') {
      fetchDashboard(filter);
    } else if (activeView === 'reports') {
      fetchReports(filter);
    } else if (activeView === 'insights') {
      fetchInsights(filter);
    }
  };

  const handleRefresh = () => {
    if (activeView === 'overview') {
      fetchDashboard();
    } else if (activeView === 'reports') {
      fetchReports();
    } else if (activeView === 'insights') {
      fetchInsights();
    }
  };

  const handleCreateReport = () => {
    // In a real app, this would open a modal or navigate to a form
    console.log('Create report clicked');
  };

  const handleViewReport = (reportId: string) => {
    // In a real app, this would navigate to a report detail page
    console.log('View report:', reportId);
  };

  const handleExport = (id: string = 'dashboard') => {
    const options = {
      format: 'pdf' as const,
      includeCharts: true,
      includeInsights: true,
      includeRecommendations: true
    };

    if (activeView === 'overview') {
      exportData('dashboard', id, options);
    } else if (activeView === 'reports') {
      exportData('report', id, options);
    } else if (activeView === 'insights') {
      exportData('insight', id, options);
    }
  };

  // Render the appropriate view based on the active tab
  const renderActiveView = () => {
    if (activeView === 'reports') {
      return (
        <ReportsDashboard
          reports={reports}
          loading={loading}
          onCreateReport={handleCreateReport}
          onRefresh={handleRefresh}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
        />
      );
    } else if (activeView === 'insights') {
      return (
        <InsightsDashboard
          insights={insights}
          loading={loading}
          onCreateInsight={handleCreateReport}
          onRefresh={handleRefresh}
          onFilterChange={handleFilterChange}
        />
      );
    } else {
      return (
        <AnalyticsOverview
          dashboard={dashboard || {
            metrics: [],
            charts: [],
            alerts: [],
            lastUpdated: new Date().toISOString()
          }}
          loading={loading}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          onExport={() => handleExport()}
          onCreateReport={handleCreateReport}
          onViewReport={handleViewReport}
        />
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'overview'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('reports')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'reports'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'insights'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights
          </button>
        </nav>
      </div>

      {/* Active View Content */}
      {renderActiveView()}
    </div>
  );
}
import React from 'react';
import ReportsDashboard from '../components/analytics/reports/ReportsDashboard';
import { useAnalytics } from '../hooks/useAnalytics';
import type { AnalyticsFilter } from '../types/analytics';

export default function AnalyticsReportsPage() {
  const { 
    reports, 
    loading, 
    fetchReports, 
    generateReport,
    exportData
  } = useAnalytics();

  const handleFilterChange = (filter: AnalyticsFilter) => {
    fetchReports(filter);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handleCreateReport = () => {
    // In a real app, this would open a modal or navigate to a form
    console.log('Create report clicked');
  };

  const handleExport = (reportId: string) => {
    exportData('report', reportId, {
      format: 'pdf',
      includeCharts: true,
      includeInsights: true,
      includeRecommendations: true
    });
  };

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
}
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportsDashboard from './reports/ReportsDashboard';
import AddReportButton from './AddReportButton';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { AnalyticsFilter } from '../../types/analytics';

export default function AnalyticsReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    reports, 
    loading, 
    fetchReports, 
    generateReport,
    exportData
  } = useAnalytics();

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'create-report') {
      // This would open the create report modal
      // For now, we'll just clear the URL parameter
      navigate('/analytics/reports', { replace: true });
    }
  }, [location, navigate]);

  const handleFilterChange = (filter: AnalyticsFilter) => {
    fetchReports(filter);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handleCreateReport = () => {
    // This would be handled by the AddReportButton component
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
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View and generate detailed analytics reports</p>
        </div>
        <AddReportButton onSuccess={handleRefresh} />
      </div>
      
      <ReportsDashboard
        reports={reports}
        loading={loading}
        onCreateReport={handleCreateReport}
        onRefresh={handleRefresh}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
      />
    </>
  );
}
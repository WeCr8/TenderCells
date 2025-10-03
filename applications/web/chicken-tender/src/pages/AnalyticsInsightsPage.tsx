import React from 'react';
import InsightsDashboard from '../components/analytics/insights/InsightsDashboard';
import { useAnalytics } from '../hooks/useAnalytics';
import type { AnalyticsFilter } from '../types/analytics';

export default function AnalyticsInsightsPage() {
  const { 
    insights, 
    loading, 
    fetchInsights
  } = useAnalytics();

  const handleFilterChange = (filter: AnalyticsFilter) => {
    fetchInsights(filter);
  };

  const handleRefresh = () => {
    fetchInsights();
  };

  const handleCreateInsight = () => {
    // In a real app, this would open a modal or navigate to a form
    console.log('Generate insights clicked');
  };

  return (
    <InsightsDashboard
      insights={insights}
      loading={loading}
      onCreateInsight={handleCreateInsight}
      onRefresh={handleRefresh}
      onFilterChange={handleFilterChange}
    />
  );
}
import { useState, useEffect } from 'react';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsUtils } from '../utils/analyticsUtils';
import type { 
  AnalyticsDashboard, 
  AnalyticsReport, 
  AnalyticsInsight, 
  AnalyticsFilter,
  AnalyticsComparison,
  AnalyticsForecast,
  AnalyticsReportTemplate,
  AnalyticsExportOptions
} from '../types/analytics';

/**
 * Custom hook for managing analytics data
 */
export function useAnalytics() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [comparisons, setComparisons] = useState<AnalyticsComparison[]>([]);
  const [forecasts, setForecasts] = useState<AnalyticsForecast[]>([]);
  const [templates, setTemplates] = useState<AnalyticsReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (filter?: AnalyticsFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getDashboard(filter);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (filter?: AnalyticsFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getReports(filter);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async (filter?: AnalyticsFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getInsights(filter);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisons = async (filter?: AnalyticsFilter) => {
    try {
      const data = await AnalyticsService.getComparisons(filter);
      setComparisons(data);
    } catch (err) {
      console.error('Failed to fetch comparisons:', err);
    }
  };

  const fetchForecasts = async (filter?: AnalyticsFilter) => {
    try {
      const data = await AnalyticsService.getForecasts(filter);
      setForecasts(data);
    } catch (err) {
      console.error('Failed to fetch forecasts:', err);
    }
  };

  const fetchReportTemplates = async () => {
    try {
      const data = await AnalyticsService.getReportTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch report templates:', err);
    }
  };

  const generateReport = async (templateId: string, parameters: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      const report = await AnalyticsService.generateReport(templateId, parameters);
      setReports(prev => [report, ...prev]);
      return report;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createComparison = async (
    baselinePeriod: { start: string; end: string },
    comparisonPeriod: { start: string; end: string },
    metrics: string[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      const comparison = await AnalyticsService.createComparison(baselinePeriod, comparisonPeriod, metrics);
      setComparisons(prev => [comparison, ...prev]);
      return comparison;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comparison');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createForecast = async (
    targetMetric: string,
    forecastPeriod: { start: string; end: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const forecast = await AnalyticsService.createForecast(targetMetric, forecastPeriod);
      setForecasts(prev => [forecast, ...prev]);
      return forecast;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create forecast');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (
    dataType: 'report' | 'dashboard' | 'insight' | 'comparison' | 'forecast',
    id: string,
    options: AnalyticsExportOptions
  ) => {
    try {
      const blob = await AnalyticsService.exportData(dataType, id, options);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-${id}-${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      throw err;
    }
  };

  // Generate mock data for development
  const generateMockData = () => {
    // Mock dashboard data
    const mockDashboard: AnalyticsDashboard = {
      metrics: [
        {
          id: 'metric1',
          name: 'Daily Egg Production',
          value: 18,
          unit: 'eggs',
          trend: 'up',
          change: 3,
          changePercent: 20,
          period: 'vs yesterday',
          category: 'production'
        },
        {
          id: 'metric2',
          name: 'Average Health Score',
          value: 87,
          unit: '%',
          trend: 'stable',
          change: 0,
          changePercent: 0,
          period: 'vs last week',
          category: 'health'
        },
        {
          id: 'metric3',
          name: 'Feed Consumption',
          value: 12.5,
          unit: 'kg',
          trend: 'down',
          change: -1.2,
          changePercent: -8.7,
          period: 'vs last week',
          category: 'production'
        },
        {
          id: 'metric4',
          name: 'Automation Success',
          value: 96.5,
          unit: '%',
          trend: 'up',
          change: 2.1,
          changePercent: 2.2,
          period: 'vs last month',
          category: 'automation'
        }
      ],
      charts: [
        {
          id: 'chart1',
          title: 'Egg Production Trends',
          description: 'Daily egg production over the last 30 days',
          type: 'production',
          period: 'monthly',
          chartType: 'line',
          data: AnalyticsUtils.generateMockChartData('production', 'monthly'),
          insights: [
            'Production increased by 15% this month',
            'Peak production on Tuesdays and Wednesdays'
          ],
          recommendations: [
            'Consider adjusting feed schedule for optimal production',
            'Monitor health during peak laying periods'
          ],
          generatedAt: new Date().toISOString(),
          status: 'ready'
        },
        {
          id: 'chart2',
          title: 'Health Monitoring',
          description: 'Flock health scores and trends',
          type: 'health',
          period: 'weekly',
          chartType: 'line',
          data: AnalyticsUtils.generateMockChartData('health', 'weekly'),
          insights: [
            'Overall health trending upward',
            'Minor dip on weekends'
          ],
          recommendations: [
            'Maintain current health protocols',
            'Increase weekend monitoring'
          ],
          generatedAt: new Date().toISOString(),
          status: 'ready'
        }
      ],
      alerts: [
        {
          id: 'alert1',
          type: 'warning',
          title: 'Feed Consumption Drop',
          description: 'Feed consumption has decreased by 15% over the last 3 days',
          metric: 'feed_consumption',
          threshold: 15,
          currentValue: 12.5,
          createdAt: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    // Mock insights
    const mockInsights: AnalyticsInsight[] = [
      {
        id: 'insight1',
        title: 'Production Efficiency Opportunity',
        description: 'Your feed-to-egg ratio is 20% higher than industry average, suggesting an opportunity to optimize feed usage.',
        category: 'production',
        severity: 'medium',
        impact: 'negative',
        relatedMetrics: ['feed_consumption', 'egg_production'],
        recommendations: [
          'Review feed composition and quality',
          'Adjust feeding schedule to match peak laying times',
          'Consider feed supplements to improve conversion efficiency'
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'insight2',
        title: 'Health Improvement Trend',
        description: 'Flock health scores have improved by 12% since implementing the new ventilation system.',
        category: 'health',
        severity: 'low',
        impact: 'positive',
        relatedMetrics: ['health_score', 'air_quality'],
        recommendations: [
          'Continue current ventilation settings',
          'Document correlation for future reference',
          'Consider similar improvements in other areas'
        ],
        createdAt: new Date().toISOString()
      }
    ];

    // Set mock data
    setDashboard(mockDashboard);
    setInsights(mockInsights);
    setLoading(false);
  };

  useEffect(() => {
    // For development, use mock data
    // In production, this would call the actual API
    generateMockData();
    
    // Uncomment these for real API calls
    // fetchDashboard();
    // fetchReports();
    // fetchInsights();
    // fetchComparisons();
    // fetchForecasts();
    // fetchReportTemplates();
  }, []);

  return {
    // State
    dashboard,
    reports,
    insights,
    comparisons,
    forecasts,
    templates,
    loading,
    error,
    
    // Fetch functions
    fetchDashboard,
    fetchReports,
    fetchInsights,
    fetchComparisons,
    fetchForecasts,
    fetchReportTemplates,
    
    // Action functions
    generateReport,
    createComparison,
    createForecast,
    exportData,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchDashboard(),
        fetchReports(),
        fetchInsights()
      ]);
    }
  };
}
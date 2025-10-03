import { apiService } from './api';
import type { 
  AnalyticsDashboard, 
  AnalyticsReport, 
  AnalyticsFilter, 
  AnalyticsInsight,
  AnalyticsComparison,
  AnalyticsForecast,
  AnalyticsReportTemplate,
  AnalyticsExportOptions
} from '../types/analytics';

/**
 * Service for managing analytics and reporting
 */
export class AnalyticsService {
  private static readonly ENDPOINTS = {
    DASHBOARD: '/analytics/dashboard',
    REPORTS: '/analytics/reports',
    REPORT_BY_ID: (id: string) => `/analytics/reports/${id}`,
    GENERATE_REPORT: '/analytics/reports/generate',
    INSIGHTS: '/analytics/insights',
    INSIGHT_BY_ID: (id: string) => `/analytics/insights/${id}`,
    COMPARISONS: '/analytics/comparisons',
    COMPARISON_BY_ID: (id: string) => `/analytics/comparisons/${id}`,
    FORECASTS: '/analytics/forecasts',
    FORECAST_BY_ID: (id: string) => `/analytics/forecasts/${id}`,
    TEMPLATES: '/analytics/templates',
    TEMPLATE_BY_ID: (id: string) => `/analytics/templates/${id}`,
    EXPORT: '/analytics/export',
  };

  /**
   * Get analytics dashboard data
   */
  static async getDashboard(filter?: AnalyticsFilter): Promise<AnalyticsDashboard> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      if (filter.categories) params.append('categories', filter.categories.join(','));
      if (filter.locations) params.append('locations', filter.locations.join(','));
      if (filter.flockGroups) params.append('flockGroups', filter.flockGroups.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.DASHBOARD}?${queryString}` : this.ENDPOINTS.DASHBOARD;
    
    return apiService.get<AnalyticsDashboard>(endpoint);
  }

  /**
   * Get all reports
   */
  static async getReports(filter?: AnalyticsFilter): Promise<AnalyticsReport[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      if (filter.categories) params.append('categories', filter.categories.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.REPORTS}?${queryString}` : this.ENDPOINTS.REPORTS;
    
    return apiService.get<AnalyticsReport[]>(endpoint);
  }

  /**
   * Get a specific report by ID
   */
  static async getReportById(id: string): Promise<AnalyticsReport> {
    return apiService.get<AnalyticsReport>(this.ENDPOINTS.REPORT_BY_ID(id));
  }

  /**
   * Generate a new report
   */
  static async generateReport(
    templateId: string, 
    parameters: Record<string, any>
  ): Promise<AnalyticsReport> {
    return apiService.post<AnalyticsReport>(this.ENDPOINTS.GENERATE_REPORT, {
      templateId,
      parameters
    });
  }

  /**
   * Get all insights
   */
  static async getInsights(filter?: AnalyticsFilter): Promise<AnalyticsInsight[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      if (filter.categories) params.append('categories', filter.categories.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.INSIGHTS}?${queryString}` : this.ENDPOINTS.INSIGHTS;
    
    return apiService.get<AnalyticsInsight[]>(endpoint);
  }

  /**
   * Get a specific insight by ID
   */
  static async getInsightById(id: string): Promise<AnalyticsInsight> {
    return apiService.get<AnalyticsInsight>(this.ENDPOINTS.INSIGHT_BY_ID(id));
  }

  /**
   * Get all comparisons
   */
  static async getComparisons(filter?: AnalyticsFilter): Promise<AnalyticsComparison[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      if (filter.categories) params.append('categories', filter.categories.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.COMPARISONS}?${queryString}` : this.ENDPOINTS.COMPARISONS;
    
    return apiService.get<AnalyticsComparison[]>(endpoint);
  }

  /**
   * Create a new comparison
   */
  static async createComparison(
    baselinePeriod: { start: string; end: string },
    comparisonPeriod: { start: string; end: string },
    metrics: string[]
  ): Promise<AnalyticsComparison> {
    return apiService.post<AnalyticsComparison>(this.ENDPOINTS.COMPARISONS, {
      baselinePeriod,
      comparisonPeriod,
      metrics
    });
  }

  /**
   * Get all forecasts
   */
  static async getForecasts(filter?: AnalyticsFilter): Promise<AnalyticsForecast[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      if (filter.categories) params.append('categories', filter.categories.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.FORECASTS}?${queryString}` : this.ENDPOINTS.FORECASTS;
    
    return apiService.get<AnalyticsForecast[]>(endpoint);
  }

  /**
   * Create a new forecast
   */
  static async createForecast(
    targetMetric: string,
    forecastPeriod: { start: string; end: string }
  ): Promise<AnalyticsForecast> {
    return apiService.post<AnalyticsForecast>(this.ENDPOINTS.FORECASTS, {
      targetMetric,
      forecastPeriod
    });
  }

  /**
   * Get report templates
   */
  static async getReportTemplates(): Promise<AnalyticsReportTemplate[]> {
    return apiService.get<AnalyticsReportTemplate[]>(this.ENDPOINTS.TEMPLATES);
  }

  /**
   * Export analytics data
   */
  static async exportData(
    dataType: 'report' | 'dashboard' | 'insight' | 'comparison' | 'forecast',
    id: string,
    options: AnalyticsExportOptions
  ): Promise<Blob> {
    const params = new URLSearchParams({
      dataType,
      id,
      format: options.format,
      includeCharts: options.includeCharts.toString(),
      includeInsights: options.includeInsights.toString(),
      includeRecommendations: options.includeRecommendations.toString()
    });
    
    const response = await fetch(`${this.ENDPOINTS.EXPORT}?${params.toString()}`);
    return response.blob();
  }
}
/**
 * Type definitions for analytics and reporting
 */

export type AnalyticsChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'heatmap';
export type AnalyticsDataType = 'production' | 'health' | 'environment' | 'automation' | 'financial';
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type AnalyticsStatus = 'ready' | 'generating' | 'error';
export type AnalyticsTrend = 'up' | 'down' | 'stable';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: AnalyticsTrend;
  change: number;
  changePercent: number;
  period: string;
  category: AnalyticsDataType;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: AnalyticsDataType;
  period: AnalyticsPeriod;
  chartType: AnalyticsChartType;
  data: ChartData;
  insights: string[];
  recommendations: string[];
  generatedAt: string;
  status: AnalyticsStatus;
}

export interface AnalyticsFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: AnalyticsDataType[];
  locations?: string[];
  flockGroups?: string[];
  search?: string;
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  charts: AnalyticsReport[];
  alerts: AnalyticsAlert[];
  lastUpdated: string;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  category: AnalyticsDataType;
  severity: 'low' | 'medium' | 'high';
  impact: 'positive' | 'negative' | 'neutral';
  relatedMetrics: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AnalyticsReportTemplate {
  id: string;
  name: string;
  description: string;
  type: AnalyticsDataType;
  chartType: AnalyticsChartType;
  parameters: AnalyticsReportParameter[];
}

export interface AnalyticsReportParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface AnalyticsExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

export interface AnalyticsComparison {
  id: string;
  title: string;
  description: string;
  baselinePeriod: {
    start: string;
    end: string;
  };
  comparisonPeriod: {
    start: string;
    end: string;
  };
  metrics: {
    name: string;
    baselineValue: number;
    comparisonValue: number;
    change: number;
    changePercent: number;
  }[];
  insights: string[];
  createdAt: string;
}

export interface AnalyticsForecast {
  id: string;
  title: string;
  description: string;
  targetMetric: string;
  forecastPeriod: {
    start: string;
    end: string;
  };
  dataPoints: {
    date: string;
    value: number;
    confidence: {
      low: number;
      high: number;
    };
  }[];
  factors: {
    name: string;
    impact: number; // -1 to 1 scale
    description: string;
  }[];
  accuracy: number;
  createdAt: string;
}

export interface AnalyticsPreference {
  defaultDateRange: 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'custom';
  defaultChartType: AnalyticsChartType;
  dashboardLayout: 'grid' | 'list';
  favoriteReports: string[];
  emailReports: boolean;
  emailFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}
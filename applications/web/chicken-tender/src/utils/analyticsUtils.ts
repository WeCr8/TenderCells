import type { 
  AnalyticsReport, 
  AnalyticsMetric, 
  AnalyticsInsight,
  AnalyticsComparison,
  AnalyticsForecast,
  AnalyticsDataType,
  ChartData
} from '../types/analytics';

/**
 * Utility functions for analytics and reporting
 */
export class AnalyticsUtils {
  /**
   * Format metric value with appropriate unit
   */
  static formatMetricValue(value: number, unit: string): string {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'kg') return `${value.toFixed(2)} kg`;
    if (unit === 'g') return `${value.toFixed(0)} g`;
    if (unit === '°C' || unit === '°F') return `${value.toFixed(1)}${unit}`;
    if (unit === 'eggs') return `${value.toFixed(0)} eggs`;
    if (unit === '$') return `$${value.toFixed(2)}`;
    return `${value.toFixed(1)} ${unit}`;
  }

  /**
   * Get color for trend
   */
  static getTrendColor(trend: string, impact: 'positive' | 'negative' | 'neutral' = 'neutral'): string {
    // For metrics where up is good (e.g., production)
    if (impact === 'positive') {
      if (trend === 'up') return 'text-emerald-600';
      if (trend === 'down') return 'text-red-600';
      return 'text-gray-600';
    }
    
    // For metrics where down is good (e.g., mortality)
    if (impact === 'negative') {
      if (trend === 'up') return 'text-red-600';
      if (trend === 'down') return 'text-emerald-600';
      return 'text-gray-600';
    }
    
    // Neutral metrics
    if (trend === 'up') return 'text-blue-600';
    if (trend === 'down') return 'text-amber-600';
    return 'text-gray-600';
  }

  /**
   * Get background color for trend
   */
  static getTrendBgColor(trend: string, impact: 'positive' | 'negative' | 'neutral' = 'neutral'): string {
    // For metrics where up is good (e.g., production)
    if (impact === 'positive') {
      if (trend === 'up') return 'bg-emerald-100';
      if (trend === 'down') return 'bg-red-100';
      return 'bg-gray-100';
    }
    
    // For metrics where down is good (e.g., mortality)
    if (impact === 'negative') {
      if (trend === 'up') return 'bg-red-100';
      if (trend === 'down') return 'bg-emerald-100';
      return 'bg-gray-100';
    }
    
    // Neutral metrics
    if (trend === 'up') return 'bg-blue-100';
    if (trend === 'down') return 'bg-amber-100';
    return 'bg-gray-100';
  }

  /**
   * Get category color
   */
  static getCategoryColor(category: AnalyticsDataType): {
    text: string;
    bg: string;
    border: string;
  } {
    const colors = {
      production: {
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
      },
      health: {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200'
      },
      environment: {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
      },
      automation: {
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200'
      },
      financial: {
        text: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200'
      }
    };

    return colors[category] || colors.production;
  }

  /**
   * Calculate percentage change
   */
  static calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Determine trend from percentage change
   */
  static determineTrend(percentChange: number): 'up' | 'down' | 'stable' {
    if (percentChange > 2) return 'up';
    if (percentChange < -2) return 'down';
    return 'stable';
  }

  /**
   * Generate mock chart data
   * Note: In a real application, this would be replaced with actual data
   */
  static generateMockChartData(
    type: AnalyticsDataType,
    period: string,
    dataPoints: number = 12
  ): ChartData {
    const labels = Array.from({ length: dataPoints }, (_, i) => `Day ${i + 1}`);
    
    let data: number[];
    let baseValue: number;
    
    switch (type) {
      case 'production':
        baseValue = 15;
        data = Array.from({ length: dataPoints }, () => baseValue + Math.floor(Math.random() * 10));
        break;
      case 'health':
        baseValue = 85;
        data = Array.from({ length: dataPoints }, () => baseValue + Math.floor(Math.random() * 15) - 5);
        break;
      case 'environment':
        baseValue = 72;
        data = Array.from({ length: dataPoints }, () => baseValue + Math.floor(Math.random() * 8) - 4);
        break;
      case 'automation':
        baseValue = 90;
        data = Array.from({ length: dataPoints }, () => baseValue + Math.floor(Math.random() * 10) - 5);
        break;
      case 'financial':
        baseValue = 100;
        data = Array.from({ length: dataPoints }, (_, i) => baseValue + (i * 5) + Math.floor(Math.random() * 20) - 10);
        break;
      default:
        data = Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 100));
    }
    
    return {
      labels,
      datasets: [{
        label: this.getDataTypeLabel(type),
        data,
        borderColor: this.getDataTypeColor(type),
        backgroundColor: this.getDataTypeColor(type, 0.2)
      }]
    };
  }

  /**
   * Get label for data type
   */
  static getDataTypeLabel(type: AnalyticsDataType): string {
    switch (type) {
      case 'production': return 'Egg Production';
      case 'health': return 'Health Score';
      case 'environment': return 'Temperature';
      case 'automation': return 'Automation Success';
      case 'financial': return 'Revenue';
      default: return 'Value';
    }
  }

  /**
   * Get color for data type
   */
  static getDataTypeColor(type: AnalyticsDataType, alpha: number = 1): string {
    switch (type) {
      case 'production': return `rgba(16, 185, 129, ${alpha})`;  // Emerald
      case 'health': return `rgba(239, 68, 68, ${alpha})`;       // Red
      case 'environment': return `rgba(59, 130, 246, ${alpha})`;  // Blue
      case 'automation': return `rgba(139, 92, 246, ${alpha})`;   // Purple
      case 'financial': return `rgba(245, 158, 11, ${alpha})`;    // Amber
      default: return `rgba(107, 114, 128, ${alpha})`;           // Gray
    }
  }

  /**
   * Generate insights from data
   * Note: In a real application, this would use actual algorithms
   */
  static generateInsightsFromData(data: ChartData, type: AnalyticsDataType): string[] {
    const values = data.datasets[0].data;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    const trend = this.determineTrend(this.calculatePercentChange(lastValue, firstValue));
    
    const insights: string[] = [];
    
    // General trend insight
    if (trend === 'up') {
      insights.push(`Overall ${this.getDataTypeLabel(type)} is trending upward by ${this.calculatePercentChange(lastValue, firstValue).toFixed(1)}%`);
    } else if (trend === 'down') {
      insights.push(`Overall ${this.getDataTypeLabel(type)} is trending downward by ${Math.abs(this.calculatePercentChange(lastValue, firstValue)).toFixed(1)}%`);
    } else {
      insights.push(`Overall ${this.getDataTypeLabel(type)} remains stable`);
    }
    
    // Peak insight
    insights.push(`Peak ${this.getDataTypeLabel(type)} of ${max.toFixed(1)} occurred on ${data.labels[maxIndex]}`);
    
    // Type-specific insights
    switch (type) {
      case 'production':
        insights.push(`Average daily egg production is ${average.toFixed(1)} eggs`);
        if (lastValue > average) {
          insights.push('Recent production is above average');
        }
        break;
      case 'health':
        if (min < 70) {
          insights.push(`Health score dropped to ${min.toFixed(1)} on ${data.labels[minIndex]}, which may require attention`);
        }
        break;
      case 'environment':
        const tempVariation = max - min;
        insights.push(`Temperature variation of ${tempVariation.toFixed(1)}°F observed during this period`);
        break;
      case 'automation':
        if (min < 80) {
          insights.push(`Automation success rate dropped to ${min.toFixed(1)}% on ${data.labels[minIndex]}`);
        }
        break;
      case 'financial':
        const totalRevenue = values.reduce((sum, val) => sum + val, 0);
        insights.push(`Total revenue for this period is $${totalRevenue.toFixed(2)}`);
        break;
    }
    
    return insights;
  }

  /**
   * Generate recommendations based on insights
   * Note: In a real application, this would use actual algorithms
   */
  static generateRecommendationsFromInsights(insights: string[], type: AnalyticsDataType): string[] {
    const recommendations: string[] = [];
    
    // Look for specific patterns in insights
    const lowHealthPattern = insights.find(insight => insight.includes('Health score dropped'));
    const productionTrendDown = insights.find(insight => insight.includes('trending downward'));
    const tempVariation = insights.find(insight => insight.includes('Temperature variation'));
    const automationIssue = insights.find(insight => insight.includes('Automation success rate dropped'));
    
    if (lowHealthPattern) {
      recommendations.push('Schedule a flock health check to address potential issues');
      recommendations.push('Review nutrition and supplement regimen');
    }
    
    if (productionTrendDown) {
      recommendations.push('Evaluate feed quality and consumption patterns');
      recommendations.push('Check for environmental stressors affecting egg production');
    }
    
    if (tempVariation && parseFloat(tempVariation.split('of ')[1]) > 10) {
      recommendations.push('Improve coop insulation to reduce temperature fluctuations');
      recommendations.push('Adjust heating/cooling schedule to maintain optimal temperature');
    }
    
    if (automationIssue) {
      recommendations.push('Inspect automation equipment for potential maintenance needs');
      recommendations.push('Review automation rules for conflicts or inefficiencies');
    }
    
    // Add general recommendations based on data type
    switch (type) {
      case 'production':
        recommendations.push('Monitor egg quality alongside quantity metrics');
        break;
      case 'health':
        recommendations.push('Implement regular health screening protocol');
        break;
      case 'environment':
        recommendations.push('Consider seasonal adjustments to environmental controls');
        break;
      case 'automation':
        recommendations.push('Schedule regular maintenance checks for all automated systems');
        break;
      case 'financial':
        recommendations.push('Analyze cost-to-production ratio for optimization opportunities');
        break;
    }
    
    return recommendations;
  }

  /**
   * Format date range for display
   */
  static formatDateRange(start: Date | string, end: Date | string): string {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  /**
   * Get appropriate time intervals for a date range
   */
  static getTimeIntervalsForRange(start: Date | string, end: Date | string): string[] {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      // Hourly intervals for a single day
      return Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (diffDays <= 31) {
      // Daily intervals for a month or less
      const result = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        result.push(currentDate.toLocaleDateString());
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return result;
    } else if (diffDays <= 90) {
      // Weekly intervals for up to 3 months
      const result = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        result.push(`Week of ${currentDate.toLocaleDateString()}`);
        currentDate.setDate(currentDate.getDate() + 7);
      }
      return result;
    } else {
      // Monthly intervals for longer periods
      const result = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        result.push(`${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}`);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return result;
    }
  }
}
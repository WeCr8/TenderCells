import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsMetric } from '../../../types/analytics';

interface AnalyticsMetricCardProps {
  metric: AnalyticsMetric;
  className?: string;
}

export default function AnalyticsMetricCard({
  metric,
  className = ''
}: AnalyticsMetricCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  // Determine if this trend is positive or negative based on the metric category
  const getTrendImpact = (): 'positive' | 'negative' | 'neutral' => {
    // For most metrics, up is good
    if (['production', 'automation'].includes(metric.category)) {
      return 'positive';
    }
    
    // For health, it depends on the specific metric
    if (metric.category === 'health') {
      // Health score going up is good
      if (metric.name.toLowerCase().includes('score')) {
        return 'positive';
      }
      // Mortality rate going up is bad
      if (metric.name.toLowerCase().includes('mortality')) {
        return 'negative';
      }
    }
    
    // Default to neutral
    return 'neutral';
  };

  const impact = getTrendImpact();
  const trendColor = AnalyticsUtils.getTrendColor(metric.trend, impact);
  const categoryColors = AnalyticsUtils.getCategoryColor(metric.category);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
          {metric.category}
        </div>
        <div className={`flex items-center space-x-1 ${trendColor}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Metric Value */}
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.name}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {AnalyticsUtils.formatMetricValue(metric.value, metric.unit)}
        </p>
      </div>

      {/* Change Details */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${trendColor}`}>
          {metric.change > 0 ? '+' : ''}{metric.change.toLocaleString()} {metric.unit}
        </span>
        <span className="text-gray-500">{metric.period}</span>
      </div>
    </div>
  );
}
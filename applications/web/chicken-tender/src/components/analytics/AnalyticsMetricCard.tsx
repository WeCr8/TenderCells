import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AnalyticsMetric } from '../../types/analytics';

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

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryColor = () => {
    switch (metric.category) {
      case 'production':
        return 'text-green-600 bg-green-50';
      case 'health':
        return 'text-red-600 bg-red-50';
      case 'environment':
        return 'text-blue-600 bg-blue-50';
      case 'automation':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor()}`}>
          {metric.category}
        </div>
        <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
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
          {metric.value.toLocaleString()} {metric.unit}
        </p>
      </div>

      {/* Change Details */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${getTrendColor()}`}>
          {metric.change > 0 ? '+' : ''}{metric.change.toLocaleString()} {metric.unit}
        </span>
        <span className="text-gray-500">{metric.period}</span>
      </div>
    </div>
  );
}
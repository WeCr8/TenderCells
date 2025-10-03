import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { HealthMetrics } from '../../../types/flockHealth';

interface HealthMetricsChartProps {
  metrics: HealthMetrics[];
  title: string;
  className?: string;
}

export default function HealthMetricsChart({
  metrics,
  title,
  className = ''
}: HealthMetricsChartProps) {
  // Sort metrics by date
  const sortedMetrics = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate trend
  const getTrend = () => {
    if (sortedMetrics.length < 2) return 'stable';
    const first = sortedMetrics[0].bodyConditionScore;
    const last = sortedMetrics[sortedMetrics.length - 1].bodyConditionScore;
    return last > first ? 'up' : last < first ? 'down' : 'stable';
  };

  const trend = getTrend();

  // Mock chart data visualization
  const renderChart = () => {
    if (sortedMetrics.length === 0) {
      return (
        <div className="h-32 flex items-center justify-center text-gray-500">
          <p>No health metrics data available</p>
        </div>
      );
    }

    const maxScore = 5; // Body condition score max
    return (
      <div className="h-32 flex items-end space-x-1">
        {sortedMetrics.slice(-12).map((metric, index) => {
          const height = (metric.bodyConditionScore / maxScore) * 100;
          return (
            <div
              key={index}
              className="flex-1 bg-farm-200 rounded-t hover:bg-farm-300 transition-colors"
              style={{ height: `${height}%`, minHeight: '4px' }}
              title={`${metric.bodyConditionScore}/5 on ${new Date(metric.date).toLocaleDateString()}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-1">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-emerald-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      {renderChart()}

      {sortedMetrics.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {sortedMetrics[sortedMetrics.length - 1]?.bodyConditionScore || 0}/5
            </p>
            <p className="text-gray-500">Latest Score</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {(sortedMetrics.reduce((sum, m) => sum + m.bodyConditionScore, 0) / sortedMetrics.length).toFixed(1)}/5
            </p>
            <p className="text-gray-500">Average</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">{sortedMetrics.length}</p>
            <p className="text-gray-500">Records</p>
          </div>
        </div>
      )}
    </div>
  );
}
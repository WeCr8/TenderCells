import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsInsight } from '../../../types/analytics';

interface InsightCardProps {
  insight: AnalyticsInsight;
  onClick?: () => void;
  className?: string;
}

export default function InsightCard({
  insight,
  onClick,
  className = ''
}: InsightCardProps) {
  const categoryColors = AnalyticsUtils.getCategoryColor(insight.category);
  
  const getImpactIcon = () => {
    switch (insight.impact) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <ArrowRight className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${categoryColors.bg}`}>
          <Lightbulb className={`w-5 h-5 ${categoryColors.text}`} />
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor()}`}>
            {insight.severity}
          </span>
          {getImpactIcon()}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {insight.description}
      </p>

      {/* Related Metrics */}
      {insight.relatedMetrics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Related Metrics</h4>
          <div className="flex flex-wrap gap-1">
            {insight.relatedMetrics.slice(0, 3).map((metric, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                {metric}
              </span>
            ))}
            {insight.relatedMetrics.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{insight.relatedMetrics.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Generated: {new Date(insight.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center text-farm-600 hover:text-farm-700">
          <span className="font-medium">View Details</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { 
  X, 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  BarChart3,
  CheckCircle,
  Calendar,
  Tag,
  Download
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsInsight } from '../../../types/analytics';

interface InsightDetailViewProps {
  insight: AnalyticsInsight;
  onClose: () => void;
  className?: string;
}

export default function InsightDetailView({
  insight,
  onClose,
  className = ''
}: InsightDetailViewProps) {
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

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${categoryColors.bg}`}>
            <Lightbulb className={`w-5 h-5 ${categoryColors.text}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{insight.title}</h2>
            <p className="text-sm text-gray-600 capitalize">{insight.category} Insight</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-5 h-5" />}
          onClick={onClose}
        />
      </div>

      {/* Impact & Severity */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor()}`}>
            {insight.severity} severity
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor()}`}>
            {getImpactIcon()}
            <span className="ml-1 capitalize">{insight.impact} impact</span>
          </span>
        </div>
        <span className="text-xs text-gray-600">
          Generated: {new Date(insight.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
            {insight.description}
          </p>
        </div>

        {/* Related Metrics */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Related Metrics
          </h3>
          <div className="flex flex-wrap gap-2">
            {insight.relatedMetrics.map((metric, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                {metric}
              </span>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {insight.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-sm text-emerald-800">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Visualization Placeholder */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Data Visualization
          </h3>
          <div className="h-48 flex items-center justify-center">
            <p className="text-gray-500">Visualization would appear here</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Generated: {new Date(insight.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Tag className="w-4 h-4" />}
          >
            Add Tags
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
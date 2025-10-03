import React from 'react';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Download, 
  MoreVertical,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp
} from 'lucide-react';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsReport } from '../../../types/analytics';

interface AnalyticsReportCardProps {
  report: AnalyticsReport;
  onClick?: () => void;
  className?: string;
}

export default function AnalyticsReportCard({
  report,
  onClick,
  className = ''
}: AnalyticsReportCardProps) {
  const categoryColors = AnalyticsUtils.getCategoryColor(report.type);

  const getChartIcon = () => {
    switch (report.chartType) {
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      case 'line':
        return <LineChart className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (report.status) {
      case 'ready':
        return 'text-emerald-600 bg-emerald-50';
      case 'generating':
        return 'text-amber-600 bg-amber-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${categoryColors.bg}`}>
            {getChartIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{report.type.replace('_', ' ')}</p>
          </div>
        </div>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status and Period */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {report.status}
        </span>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span className="capitalize">{report.period}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {report.description}
      </p>

      {/* Key Insights */}
      {report.insights.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Findings</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {report.insights.slice(0, 2).map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-farm-500 rounded-full mt-2 flex-shrink-0"></span>
                <span className="line-clamp-1">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
          <div className="text-sm text-gray-600">
            <span className="line-clamp-1">{report.recommendations[0]}</span>
            {report.recommendations.length > 1 && (
              <span className="text-xs text-gray-500">
                +{report.recommendations.length - 1} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex items-center space-x-1 text-sm text-farm-600 hover:text-farm-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(report.generatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
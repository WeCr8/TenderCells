import React from 'react';
import { BarChart3, LineChart, PieChart, TrendingUp, Download, MoreVertical } from 'lucide-react';
import type { AnalyticsReport } from '../../types/analytics';

interface AnalyticsChartCardProps {
  report: AnalyticsReport;
  className?: string;
}

export default function AnalyticsChartCard({
  report,
  className = ''
}: AnalyticsChartCardProps) {
  const getTypeIcon = () => {
    switch (report.type) {
      case 'production':
        return <BarChart3 className="w-5 h-5" />;
      case 'health':
        return <LineChart className="w-5 h-5" />;
      case 'environment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <PieChart className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (report.type) {
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

  // Mock chart visualization
  const renderMockChart = () => {
    const data = report.data.datasets[0]?.data || [];
    const maxValue = Math.max(...data);
    
    return (
      <div className="h-32 flex items-end space-x-1 mb-4">
        {data.slice(0, 12).map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-farm-200 rounded-t"
            style={{
              height: `${(value / maxValue) * 100}%`,
              minHeight: '4px'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{report.title}</h3>
            <p className="text-sm text-gray-500 capitalize">{report.period}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {report.status}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chart */}
      {report.status === 'ready' ? (
        renderMockChart()
      ) : report.status === 'generating' ? (
        <div className="h-32 flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farm-600"></div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center mb-4 text-gray-400">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Chart unavailable</p>
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {report.description}
      </p>

      {/* Insights */}
      {report.insights.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
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

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
        <button className="flex items-center space-x-1 hover:text-farm-600 transition-colors">
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
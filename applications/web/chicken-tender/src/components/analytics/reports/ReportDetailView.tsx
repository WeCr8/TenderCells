import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  Calendar, 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsReport } from '../../../types/analytics';

interface ReportDetailViewProps {
  report: AnalyticsReport;
  onClose: () => void;
  onExport: () => void;
  className?: string;
}

export default function ReportDetailView({
  report,
  onClose,
  onExport,
  className = ''
}: ReportDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'data'>('overview');
  
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

  // Mock chart visualization
  const renderMockChart = () => {
    const data = report.data.datasets[0]?.data || [];
    const maxValue = Math.max(...data);
    
    return (
      <div className="h-64 flex items-end space-x-1">
        {data.map((value, index) => (
          <div
            key={index}
            className={`flex-1 ${categoryColors.bg} rounded-t hover:opacity-80 transition-opacity`}
            style={{
              height: `${(value / maxValue) * 100}%`,
              minHeight: '4px'
            }}
            title={`${value} on ${report.data.labels[index]}`}
          />
        ))}
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{report.title}</h3>
        {renderMockChart()}
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span>Period: {report.period}</span>
            <span>Data Type: {report.type}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-2">Summary</h3>
        <p className="text-sm text-gray-600">{report.description}</p>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {report.data.datasets[0]?.data.slice(0, 4).map((value, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{report.data.labels[index]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
          Key Insights
        </h3>
        <ul className="space-y-3">
          {report.insights.map((insight, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-xs font-medium">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
          Recommendations
        </h3>
        <ul className="space-y-3">
          {report.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-xs font-medium">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Raw Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                {report.data.datasets.map((dataset, i) => (
                  <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dataset.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.data.labels.map((label, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {label}
                  </td>
                  {report.data.datasets.map((dataset, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dataset.data[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Report Metadata</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Report ID</p>
            <p className="font-medium text-gray-900">{report.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Generated At</p>
            <p className="font-medium text-gray-900">{new Date(report.generatedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium text-gray-900 capitalize">{report.type}</p>
          </div>
          <div>
            <p className="text-gray-500">Period</p>
            <p className="font-medium text-gray-900 capitalize">{report.period}</p>
          </div>
          <div>
            <p className="text-gray-500">Chart Type</p>
            <p className="font-medium text-gray-900 capitalize">{report.chartType}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-gray-900 capitalize">{report.status}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${categoryColors.bg}`}>
            {getChartIcon()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
            <p className="text-sm text-gray-600">
              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report • {report.period}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-5 h-5" />}
          onClick={onClose}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'insights'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights & Recommendations
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'data'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Raw Data
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'data' && renderDataTab()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={onExport}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
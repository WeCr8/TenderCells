import React, { useState } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import InsightCard from './InsightCard';
import InsightDetailView from './InsightDetailView';
import { AnalyticsUtils } from '../../../utils/analyticsUtils';
import type { AnalyticsInsight, AnalyticsFilter } from '../../../types/analytics';

interface InsightsDashboardProps {
  insights: AnalyticsInsight[];
  loading?: boolean;
  onCreateInsight?: () => void;
  onRefresh?: () => void;
  onFilterChange?: (filter: AnalyticsFilter) => void;
  className?: string;
}

export default function InsightsDashboard({
  insights,
  loading = false,
  onCreateInsight,
  onRefresh,
  onFilterChange,
  className = ''
}: InsightsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState<AnalyticsInsight | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (onFilterChange) {
      onFilterChange({
        search: term || undefined,
        categories: selectedCategory !== 'all' ? [selectedCategory as any] : undefined
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    if (onFilterChange) {
      onFilterChange({
        categories: category !== 'all' ? [category as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleSeverityChange = (severity: string) => {
    setSelectedSeverity(severity);
    // In a real app, this would be part of the filter
  };

  const handleInsightClick = (insight: AnalyticsInsight) => {
    setSelectedInsight(insight);
  };

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchTerm === '' || 
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;
    
    const matchesSeverity = selectedSeverity === 'all' || insight.severity === selectedSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Group insights by impact
  const positiveInsights = filteredInsights.filter(insight => insight.impact === 'positive');
  const negativeInsights = filteredInsights.filter(insight => insight.impact === 'negative');
  const neutralInsights = filteredInsights.filter(insight => insight.impact === 'neutral');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600">Discover actionable insights and opportunities for your farm</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            size="sm"
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreateInsight}
          >
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="production">Production</option>
            <option value="health">Health</option>
            <option value="environment">Environment</option>
            <option value="automation">Automation</option>
            <option value="financial">Financial</option>
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            Advanced Filters
          </Button>
          <Button
            variant="outline"
            icon={<Calendar className="w-4 h-4" />}
            size="sm"
          >
            Custom Range
          </Button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-${selectedInsight ? '2' : '4'}`}>
          {filteredInsights.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No insights found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Generate insights to discover opportunities'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedSeverity === 'all' && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onCreateInsight}
                >
                  Generate Insights
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Positive Insights */}
              {positiveInsights.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Positive Trends</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {positiveInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onClick={() => handleInsightClick(insight)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Insights */}
              {negativeInsights.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Opportunities for Improvement</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {negativeInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onClick={() => handleInsightClick(insight)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Neutral Insights */}
              {neutralInsights.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Other Insights</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {neutralInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onClick={() => handleInsightClick(insight)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insight Detail View */}
        {selectedInsight && (
          <div className="lg:col-span-2">
            <InsightDetailView
              insight={selectedInsight}
              onClose={() => setSelectedInsight(null)}
            />
          </div>
        )}
      </div>

      {/* Export */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
        >
          Export Insights
        </Button>
      </div>
    </div>
  );
}
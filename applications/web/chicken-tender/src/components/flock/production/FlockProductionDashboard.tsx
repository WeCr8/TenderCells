import React, { useState } from 'react';
import { 
  Egg, 
  TrendingUp, 
  Target, 
  Calendar,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  BarChart3,
  Award
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import ProductionStatsCard from './ProductionStatsCard';
import ProductionRecordCard from './ProductionRecordCard';
import ProductionChart from './ProductionChart';
import ProductionGoalCard from './ProductionGoalCard';
import type { 
  ProductionRecord, 
  ProductionStats, 
  ProductionGoal,
  ProductionAlert,
  ProductionFilter
} from '../../../types/flockProduction';

interface FlockProductionDashboardProps {
  stats: ProductionStats;
  records: ProductionRecord[];
  goals: ProductionGoal[];
  alerts: ProductionAlert[];
  loading?: boolean;
  onAddRecord?: () => void;
  onAddGoal?: () => void;
  onRecordClick?: (record: ProductionRecord) => void;
  onGoalClick?: (goal: ProductionGoal) => void;
  onFilterChange?: (filter: ProductionFilter) => void;
}

export default function FlockProductionDashboard({
  stats,
  records,
  goals,
  alerts,
  loading = false,
  onAddRecord,
  onAddGoal,
  onRecordClick,
  onGoalClick,
  onFilterChange
}: FlockProductionDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ProductionFilter>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [activeTab, setActiveTab] = useState<'records' | 'goals'>('records');

  // Ensure records, goals, and alerts are arrays
  const safeRecords = Array.isArray(records) ? records : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  // Ensure stats.qualityDistribution exists
  const qualityDistribution = stats?.qualityDistribution || { AA: 0, A: 0, B: 0, C: 0, reject: 0 };
  
  // Calculate quality percentage safely
  const qualityTotal = Object.values(qualityDistribution).reduce((a, b) => a + b, 0);
  const qualityPercentage = qualityTotal > 0 
    ? Math.round(((qualityDistribution.AA || 0) + (qualityDistribution.A || 0)) / qualityTotal * 100) 
    : 0;

  const filteredRecords = safeRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.chickenName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-600">Track and analyze flock production performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            size="sm"
          >
            Import
          </Button>
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            size="sm"
          >
            Export
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddRecord}
          >
            Add Record
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductionStatsCard
          title="Today's Eggs"
          value={stats.totalEggsToday || 0}
          icon={Egg}
          trend={{ value: 8, label: "vs yesterday" }}
          status="good"
        />
        <ProductionStatsCard
          title="Weekly Total"
          value={stats.totalEggsThisWeek || 0}
          icon={TrendingUp}
          trend={{ value: 12, label: "vs last week" }}
          status="good"
        />
        <ProductionStatsCard
          title="Production Rate"
          value={`${Math.round(stats.productionRate || 0)}%`}
          icon={BarChart3}
          status={(stats.productionRate || 0) >= 80 ? "good" : (stats.productionRate || 0) >= 60 ? "warning" : "danger"}
        />
        <ProductionStatsCard
          title="Quality AA/A"
          value={`${qualityPercentage}%`}
          icon={Award}
          status="good"
        />
      </div>

      {/* Production Alerts */}
      {safeAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h3 className="font-medium text-amber-800">Production Alerts</h3>
          </div>
          <div className="space-y-2">
            {safeAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm text-amber-700">
                <span className="font-medium">{alert.title}:</span> {alert.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionChart
          records={safeRecords}
          title="Production Trend"
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Producers</h3>
          <div className="space-y-3">
            {(stats.topProducers || []).slice(0, 5).map((producer, index) => (
              <div key={producer.chickenId || index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{producer.chickenName}</span>
                </div>
                <span className="text-sm text-gray-600">{producer.eggsThisWeek} eggs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'records'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Production Records
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'goals'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Production Goals
          </button>
        </nav>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            Filters
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'goals' && (
            <Button
              variant="outline"
              icon={<Target className="w-4 h-4" />}
              onClick={onAddGoal}
            >
              Add Goal
            </Button>
          )}
          <Button
            variant={viewMode === 'cards' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'records' ? (
        <div className={
          viewMode === 'cards' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredRecords.map((record) => (
            <ProductionRecordCard
              key={record.id}
              record={record}
              viewMode={viewMode}
              onClick={() => onRecordClick?.(record)}
            />
          ))}
        </div>
      ) : (
        <div className={
          viewMode === 'cards' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {safeGoals.map((goal) => (
            <ProductionGoalCard
              key={goal.id}
              goal={goal}
              records={safeRecords}
              viewMode={viewMode}
              onClick={() => onGoalClick?.(goal)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {((activeTab === 'records' && filteredRecords.length === 0) || 
        (activeTab === 'goals' && safeGoals.length === 0)) && (
        <div className="text-center py-12">
          {activeTab === 'records' ? (
            <Egg className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : `Get started by adding your first ${activeTab.slice(0, -1)}`
            }
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={activeTab === 'records' ? onAddRecord : onAddGoal}
            >
              Add First {activeTab === 'records' ? 'Record' : 'Goal'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
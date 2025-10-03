import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  Calendar,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import HealthStatsCard from './HealthStatsCard';
import HealthRecordCard from './HealthRecordCard';
import HealthMetricsChart from './HealthMetricsChart';
import HealthAlertPanel from './HealthAlertPanel';
import type { 
  HealthRecord, 
  HealthStats, 
  HealthAlert, 
  HealthFilter,
  HealthMetrics
} from '../../../types/flockHealth';

interface FlockHealthDashboardProps {
  stats: HealthStats;
  records: HealthRecord[];
  alerts: HealthAlert[];
  metrics: HealthMetrics[];
  loading?: boolean;
  onAddRecord?: () => void;
  onRecordClick?: (record: HealthRecord) => void;
  onAlertClick?: (alert: HealthAlert) => void;
  onFilterChange?: (filter: HealthFilter) => void;
}

export default function FlockHealthDashboard({
  stats,
  records,
  alerts,
  metrics,
  loading = false,
  onAddRecord,
  onRecordClick,
  onAlertClick,
  onFilterChange
}: FlockHealthDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<HealthFilter>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.chickenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Flock Health Records</h1>
          <p className="text-gray-600">Monitor and manage health records for your flock</p>
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
        <HealthStatsCard
          title="Total Records"
          value={stats.totalRecords}
          icon={Stethoscope}
          trend={{ value: 12, label: "this month" }}
          status="good"
        />
        <HealthStatsCard
          title="Active Issues"
          value={stats.activeIssues}
          icon={AlertTriangle}
          status={stats.activeIssues === 0 ? "good" : "warning"}
        />
        <HealthStatsCard
          title="Health Score"
          value={`${Math.round(stats.averageHealthScore)}%`}
          icon={Heart}
          trend={{ value: 3, label: "vs last week" }}
          status={stats.averageHealthScore >= 80 ? "good" : stats.averageHealthScore >= 60 ? "warning" : "danger"}
        />
        <HealthStatsCard
          title="Vaccinations"
          value={stats.vaccinationsThisMonth}
          icon={Activity}
          trend={{ value: 5, label: "this month" }}
          status="good"
        />
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <HealthAlertPanel
          alerts={alerts}
          onAlertClick={onAlertClick}
        />
      )}

      {/* Health Metrics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthMetricsChart
          metrics={metrics}
          title="Health Trend"
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Excellent (90-100%)</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Good (70-89%)</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fair (50-69%)</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
                <span className="text-sm font-medium">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search health records..."
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

      {/* Health Records */}
      <div className={
        viewMode === 'cards' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {filteredRecords.map((record) => (
          <HealthRecordCard
            key={record.id}
            record={record}
            viewMode={viewMode}
            onClick={() => onRecordClick?.(record)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No health records found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first health record'
            }
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onAddRecord}
            >
              Add First Record
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
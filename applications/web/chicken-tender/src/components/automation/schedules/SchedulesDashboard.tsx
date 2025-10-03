import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Filter,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import ScheduleCard from './ScheduleCard';
import ScheduleDetailPanel from './ScheduleDetailPanel';
import type { 
  Schedule, 
  ScheduleStats, 
  ScheduleExecution,
  ScheduleFilter,
  ScheduleSortOptions
} from '../../../types/automationSchedules';

interface SchedulesDashboardProps {
  schedules: Schedule[];
  stats: ScheduleStats;
  executions: ScheduleExecution[];
  loading?: boolean;
  onAddSchedule?: () => void;
  onRefresh?: () => void;
  onFilterChange?: (filter: ScheduleFilter) => void;
  onToggleSchedule?: (scheduleId: string) => void;
  onExecuteSchedule?: (scheduleId: string) => void;
  onEditSchedule?: (schedule: Schedule) => void;
  onViewSchedule?: (schedule: Schedule) => void;
  className?: string;
}

export default function SchedulesDashboard({
  schedules,
  stats,
  executions,
  loading = false,
  onAddSchedule,
  onRefresh,
  onFilterChange,
  onToggleSchedule,
  onExecuteSchedule,
  onEditSchedule,
  onViewSchedule,
  className = ''
}: SchedulesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (onFilterChange) {
      onFilterChange({ search: term });
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    if (onFilterChange) {
      onFilterChange({
        status: status ? [status as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
    if (onFilterChange) {
      onFilterChange({
        types: type ? [type as any] : undefined,
        status: selectedStatus ? [selectedStatus as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    if (onViewSchedule) {
      onViewSchedule(schedule);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchTerm === '' || 
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === null || schedule.status === selectedStatus;
    
    const matchesType = selectedType === null || schedule.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const scheduleExecutions = (scheduleId: string) => {
    return executions.filter(execution => execution.scheduleId === scheduleId);
  };

  // Show loading state if loading or stats is not available
  if (loading || !stats) {
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600">Manage and monitor your automation schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddSchedule}
          >
            Add Schedule
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalSchedules || 0}</p>
              <p className="text-sm text-emerald-600">
                {stats.activeSchedules || 0} active
              </p>
            </div>
            <div className="p-3 bg-farm-100 rounded-lg">
              <Calendar className="h-6 w-6 text-farm-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Executions Today</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stats.executionsToday || 0}</p>
              <p className="text-sm text-emerald-600">
                {stats.executionsThisWeek || 0} this week
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.successRate != null ? stats.successRate.toFixed(1) : '0.0'}%
              </p>
              <p className="text-sm text-emerald-600">
                {stats.errorSchedules || 0} with errors
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.upcomingExecutions?.length || 0}
              </p>
              <p className="text-sm text-emerald-600">
                Next in {(stats.upcomingExecutions?.length || 0) > 0 ? '30 min' : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Schedules Alert */}
      {(stats.errorSchedules || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {stats.errorSchedules} schedule{stats.errorSchedules !== 1 ? 's' : ''} with errors
              </h4>
              <p className="text-sm text-red-700">
                Some schedules have encountered errors and may need attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={selectedStatus || ''}
            onChange={(e) => handleStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
          
          <select
            value={selectedType || ''}
            onChange={(e) => handleTypeFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="interval">Interval</option>
            <option value="cron">Cron</option>
            <option value="sunrise_sunset">Sunrise/Sunset</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            More Filters
          </Button>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-current rounded-sm"></div>
                ))}
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-0.5 bg-current rounded"></div>
                ))}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-${selectedSchedule ? '3' : '4'}`}>
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No schedules found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStatus || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first schedule'
                }
              </p>
              {!searchTerm && !selectedStatus && !selectedType && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onAddSchedule}
                >
                  Add First Schedule
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  viewMode={viewMode}
                  onToggle={() => onToggleSchedule?.(schedule.id)}
                  onExecute={() => onExecuteSchedule?.(schedule.id)}
                  onEdit={() => onEditSchedule?.(schedule)}
                  onView={() => handleScheduleClick(schedule)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Schedule Detail Panel */}
        {selectedSchedule && (
          <div className="lg:col-span-1">
            <ScheduleDetailPanel
              schedule={selectedSchedule}
              executions={scheduleExecutions(selectedSchedule.id)}
              onClose={() => setSelectedSchedule(null)}
              onToggle={() => onToggleSchedule?.(selectedSchedule.id)}
              onExecute={() => onExecuteSchedule?.(selectedSchedule.id)}
              onEdit={() => onEditSchedule?.(selectedSchedule)}
            />
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          icon={<Upload className="w-4 h-4" />}
        >
          Import Schedules
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
        >
          Export Schedules
        </Button>
      </div>
    </div>
  );
}
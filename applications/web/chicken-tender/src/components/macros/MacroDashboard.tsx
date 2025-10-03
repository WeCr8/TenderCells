import React, { useState } from 'react';
import { 
  Zap, 
  Calendar, 
  History, 
  Plus, 
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import MacroList from './MacroList';
import MacroTaskList from './MacroTaskList';
import MacroRecordList from './MacroRecordList';
import type { 
  MacroFunction, 
  MacroTask, 
  MacroRecord, 
  MacroStats,
  MacroFilter
} from '../../types/macros';

interface MacroDashboardProps {
  macros: MacroFunction[];
  tasks: MacroTask[];
  records: MacroRecord[];
  stats: MacroStats;
  onExecuteMacro: (macroId: string, parameters: Record<string, any>) => Promise<void>;
  onScheduleMacro: (macroId: string, parameters: Record<string, any>, schedule: any) => Promise<void>;
  onExecuteTask: (taskId: string) => Promise<void>;
  onCancelTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onRefresh: () => void;
  onFilterChange?: (filter: MacroFilter) => void;
  loading?: boolean;
  className?: string;
}

export default function MacroDashboard({
  macros,
  tasks,
  records,
  stats,
  onExecuteMacro,
  onScheduleMacro,
  onExecuteTask,
  onCancelTask,
  onDeleteTask,
  onRefresh,
  onFilterChange,
  loading = false,
  className = ''
}: MacroDashboardProps) {
  const [activeTab, setActiveTab] = useState<'macros' | 'tasks' | 'history'>('macros');

  // Ensure tasks and records are arrays
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeRecords = Array.isArray(records) ? records : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Macro Functions</h1>
          <p className="text-gray-600">Automate common tasks and operations</p>
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
          >
            Create Macro
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalExecutions || 0}</p>
              <p className="text-sm text-emerald-600">
                {safeRecords.length} today
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{(stats.successRate || 0).toFixed(1)}%</p>
              <p className="text-sm text-emerald-600">
                {macros.length} active macros
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Scheduled Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{safeTasks.length}</p>
              <p className="text-sm text-emerald-600">
                {safeTasks.filter(t => t.status === 'running').length} running
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {stats.averageDuration < 1000 
                  ? `${stats.averageDuration || 0}ms` 
                  : `${((stats.averageDuration || 0) / 1000).toFixed(1)}s`}
              </p>
              <p className="text-sm text-emerald-600">
                Efficient execution
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'macros'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Available Macros</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tasks'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scheduled Tasks</span>
            {safeTasks.filter(t => t.status === 'running').length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {safeTasks.filter(t => t.status === 'running').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Execution History</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'macros' && (
        <MacroList
          macros={macros}
          onExecuteMacro={onExecuteMacro}
          onScheduleMacro={onScheduleMacro}
          onFilterChange={onFilterChange}
          loading={loading}
        />
      )}

      {activeTab === 'tasks' && (
        <MacroTaskList
          tasks={safeTasks}
          onExecuteTask={onExecuteTask}
          onCancelTask={onCancelTask}
          onDeleteTask={onDeleteTask}
          onFilterChange={onFilterChange}
          loading={loading}
        />
      )}

      {activeTab === 'history' && (
        <MacroRecordList
          records={safeRecords}
          onFilterChange={onFilterChange}
          loading={loading}
        />
      )}
    </div>
  );
}
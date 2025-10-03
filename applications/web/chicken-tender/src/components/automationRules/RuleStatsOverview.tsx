import React from 'react';
import { 
  Zap, 
  Play, 
  Pause, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { AutomationStats } from '../../types/automationRules';

interface RuleStatsOverviewProps {
  stats: AutomationStats;
  onRefresh: () => void;
  className?: string;
}

export default function RuleStatsOverview({
  stats,
  onRefresh,
  className = ''
}: RuleStatsOverviewProps) {
  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-emerald-600';
    if (rate >= 85) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Rules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.activeRules} active
              </p>
            </div>
            <div className="p-3 bg-farm-100 rounded-lg">
              <Zap className="h-6 w-6 text-farm-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRules}</p>
              <p className="text-sm text-emerald-600 mt-1">
                {stats.pausedRules} paused
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Play className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
              <p className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                {stats.successRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.executionsToday} today
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg. Execution</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatExecutionTime(stats.averageExecutionTime)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.upcomingTasks} upcoming
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Rules by Category</h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={onRefresh}
            />
          </div>
          
          <div className="space-y-4">
            {stats.topCategories.map((category, index) => {
              const percentage = (category.count / stats.totalRules) * 100;
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-farm-500" style={{
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                    }}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {category.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{category.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-farm-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Executions</h3>
          
          {stats.recentExecutions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentExecutions.slice(0, 5).map((execution) => {
                const statusColors = {
                  completed: 'bg-emerald-100 text-emerald-800',
                  failed: 'bg-red-100 text-red-800',
                  running: 'bg-blue-100 text-blue-800',
                  cancelled: 'bg-gray-100 text-gray-800'
                };

                return (
                  <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[execution.status]}`}>
                        {execution.status}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{execution.ruleName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(execution.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatExecutionTime(execution.executionTime)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {execution.actionsSucceeded}/{execution.actionsExecuted} actions
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent executions</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Rules Alert */}
      {stats.errorRules > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {stats.errorRules} rule{stats.errorRules !== 1 ? 's' : ''} with errors
              </h4>
              <p className="text-sm text-red-700">
                Some automation rules have encountered errors and may need attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
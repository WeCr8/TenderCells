import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Play, 
  Clock, 
  Target, 
  Zap,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { AutomationRulesService } from '../../services/automationRulesService';
import { AutomationRulesUtils } from '../../utils/automationRulesUtils';
import type { AutomationRule, RuleExecution } from '../../types/automationRules';

interface AutomationRulePreviewProps {
  rule: AutomationRule;
  onClose: () => void;
  onEdit: () => void;
  onExecute: () => void;
  className?: string;
}

export default function AutomationRulePreview({
  rule,
  onClose,
  onEdit,
  onExecute,
  className = ''
}: AutomationRulePreviewProps) {
  const [recentExecutions, setRecentExecutions] = useState<RuleExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentExecutions();
  }, [rule.id]);

  const loadRecentExecutions = async () => {
    try {
      setLoading(true);
      const executions = await AutomationRulesService.getExecutions(rule.id, 5);
      setRecentExecutions(executions);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    active: { color: 'text-emerald-600 bg-emerald-100', icon: CheckCircle },
    inactive: { color: 'text-gray-600 bg-gray-100', icon: Clock },
    paused: { color: 'text-amber-600 bg-amber-100', icon: Clock },
    error: { color: 'text-red-600 bg-red-100', icon: AlertTriangle },
    testing: { color: 'text-blue-600 bg-blue-100', icon: Activity }
  };

  const { color: statusColor, icon: StatusIcon } = statusConfig[rule.status];

  const successRate = rule.metadata.executionCount > 0 
    ? (rule.metadata.successCount / rule.metadata.executionCount) * 100 
    : 0;

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 bg-emerald-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusColor}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{rule.category.replace('_', ' ')}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-4 h-4" />}
          onClick={onClose}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-600">{rule.description}</p>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
            <span className="text-sm text-gray-600">{rule.priority}</span>
          </div>
        </div>

        {/* Triggers */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Triggers ({rule.triggers.length})
          </h4>
          <div className="space-y-2">
            {rule.triggers.map((trigger, index) => (
              <div key={trigger.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{trigger.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${trigger.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                    {trigger.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{trigger.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {trigger.conditions.length} condition{trigger.conditions.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Actions ({rule.actions.length})
          </h4>
          <div className="space-y-2">
            {rule.actions.map((action, index) => (
              <div key={action.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${action.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                    {action.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{action.description}</p>
                {action.delay && (
                  <div className="mt-1 text-xs text-gray-500">
                    Delay: {action.delay}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        {rule.schedule && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-900">
                {AutomationRulesUtils.formatSchedule(rule.schedule)}
              </p>
              {rule.nextExecution && (
                <p className="text-xs text-gray-500 mt-1">
                  Next execution: {new Date(rule.nextExecution).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">{rule.metadata.executionCount}</p>
              <p className="text-xs text-gray-500">Total Executions</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">{successRate.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Success Rate</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">
                {formatExecutionTime(rule.metadata.averageExecutionTime)}
              </p>
              <p className="text-xs text-gray-500">Avg. Duration</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">
                {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}
              </p>
              <p className="text-xs text-gray-500">Last Executed</p>
            </div>
          </div>
        </div>

        {/* Recent Executions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Recent Executions
          </h4>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentExecutions.length > 0 ? (
            <div className="space-y-2">
              {recentExecutions.map((execution) => (
                <div key={execution.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getExecutionStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(execution.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Duration: {formatExecutionTime(execution.executionTime)}</span>
                    <span>Actions: {execution.actionsSucceeded}/{execution.actionsExecuted}</span>
                  </div>
                  {execution.error && (
                    <p className="text-xs text-red-600 mt-1">{execution.error}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No executions yet</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {rule.metadata.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {rule.metadata.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Metadata</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Author:</span>
              <span>{rule.metadata.author}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>{rule.metadata.version}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Modified:</span>
              <span>{new Date(rule.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            icon={<Edit className="w-4 h-4" />}
            onClick={onEdit}
          >
            Edit Rule
          </Button>
          <Button
            variant="outline"
            icon={<Play className="w-4 h-4" />}
            onClick={onExecute}
            disabled={rule.status !== 'active'}
          >
            Execute Now
          </Button>
        </div>
        <Button
          variant="ghost"
          icon={<Settings className="w-4 h-4" />}
          size="sm"
        >
          Settings
        </Button>
      </div>
    </div>
  );
}
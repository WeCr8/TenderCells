import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Zap,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { AutomationRulesUtils } from '../../utils/automationRulesUtils';
import type { AutomationRule, RuleStatus } from '../../types/automationRules';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  viewMode?: 'grid' | 'list';
  onToggle: () => void;
  onExecute: () => void;
  onEdit: () => void;
  onView: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  className?: string;
}

export default function AutomationRuleCard({
  rule,
  viewMode = 'grid',
  onToggle,
  onExecute,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  className = ''
}: AutomationRuleCardProps) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    active: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
      label: 'Active'
    },
    inactive: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock,
      label: 'Inactive'
    },
    paused: {
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Pause,
      label: 'Paused'
    },
    error: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertTriangle,
      label: 'Error'
    },
    testing: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Activity,
      label: 'Testing'
    }
  };

  const categoryColors = {
    feeding: 'text-green-600 bg-green-50',
    lighting: 'text-yellow-600 bg-yellow-50',
    temperature: 'text-blue-600 bg-blue-50',
    door: 'text-purple-600 bg-purple-50',
    cleaning: 'text-gray-600 bg-gray-50',
    health_check: 'text-red-600 bg-red-50',
    security: 'text-orange-600 bg-orange-50',
    maintenance: 'text-indigo-600 bg-indigo-50'
  };

  const { color: statusColor, icon: StatusIcon, label: statusLabel } = statusConfig[rule.status];
  const categoryColor = categoryColors[rule.category] || 'text-gray-600 bg-gray-50';

  const successRate = rule.metadata.executionCount > 0 
    ? (rule.metadata.successCount / rule.metadata.executionCount) * 100 
    : 0;

  const formatLastExecuted = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      return date.toLocaleDateString();
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      return date.toLocaleDateString();
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes}m`;
    } else {
      return 'Soon';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Status Icon */}
            <div className={`p-2 rounded-lg ${statusColor}`}>
              <StatusIcon className="w-4 h-4" />
            </div>

            {/* Rule Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                  {rule.category.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{rule.description}</p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-900">{rule.metadata.executionCount}</p>
                <p className="text-gray-500">Executions</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{successRate.toFixed(0)}%</p>
                <p className="text-gray-500">Success</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{formatLastExecuted(rule.lastExecuted)}</p>
                <p className="text-gray-500">Last Run</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              onClick={onView}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={onToggle}
              className={rule.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={onEdit}
            />
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                icon={<MoreVertical className="w-4 h-4" />}
                onClick={() => setShowActions(!showActions)}
              />
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { onExecute(); setShowActions(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Execute Now</span>
                    </button>
                    <button
                      onClick={() => { onDuplicate(); setShowActions(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowActions(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${categoryColor}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {rule.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{rule.category.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`${rule.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
          />
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              icon={<MoreVertical className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); setShowActions(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExecute(); setShowActions(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Execute Now</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowActions(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); setShowActions(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {rule.description}
      </p>

      {/* Rule Summary */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Target className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {rule.triggers.length} trigger{rule.triggers.length !== 1 ? 's' : ''}, {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {rule.schedule && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {AutomationRulesUtils.formatSchedule(rule.schedule)}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{rule.metadata.executionCount}</p>
          <p className="text-xs text-gray-500">Executions</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{successRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Success Rate</p>
        </div>
      </div>

      {/* Timing Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div>
          <span>Last: {formatLastExecuted(rule.lastExecuted)}</span>
        </div>
        <div>
          <span>Next: {formatNextExecution(rule.nextExecution)}</span>
        </div>
      </div>

      {/* Tags */}
      {rule.metadata.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {rule.metadata.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {rule.metadata.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{rule.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  MoreVertical,
  Thermometer,
  Lightbulb,
  DoorOpen,
  Utensils,
  Stethoscope,
  Trash2
} from 'lucide-react';
import type { AutomationRule } from '../../types/automation';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onClick?: () => void;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

export default function AutomationRuleCard({
  rule,
  onClick,
  onToggle,
  className = ''
}: AutomationRuleCardProps) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    paused: 'bg-amber-100 text-amber-800 border-amber-200'
  };

  const typeIcons = {
    feeding: Utensils,
    lighting: Lightbulb,
    temperature: Thermometer,
    door: DoorOpen,
    cleaning: Trash2,
    health_check: Stethoscope
  };

  const typeColors = {
    feeding: 'text-green-600 bg-green-50',
    lighting: 'text-yellow-600 bg-yellow-50',
    temperature: 'text-blue-600 bg-blue-50',
    door: 'text-purple-600 bg-purple-50',
    cleaning: 'text-gray-600 bg-gray-50',
    health_check: 'text-red-600 bg-red-50'
  };

  const TypeIcon = typeIcons[rule.type];

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

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${typeColors[rule.type]}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {rule.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{rule.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(rule.status !== 'active');
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              rule.status === 'active' 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {rule.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[rule.status]}`}>
          {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {rule.description}
      </p>

      {/* Schedule Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Next: {formatNextExecution(rule.nextExecution)}
            </p>
            {rule.schedule && (
              <p className="text-xs text-gray-500">
                {rule.schedule.type} at {rule.schedule.time}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{rule.executionCount}</p>
          <p className="text-xs text-gray-500">Executions</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}
          </p>
          <p className="text-xs text-gray-500">Last Run</p>
        </div>
      </div>

      {/* Actions Count */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>
        <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
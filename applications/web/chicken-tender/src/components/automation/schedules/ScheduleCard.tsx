import React from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AutomationSchedulesUtils } from '../../../utils/automationSchedulesUtils';
import type { Schedule } from '../../../types/automationSchedules';

interface ScheduleCardProps {
  schedule: Schedule;
  viewMode?: 'grid' | 'list';
  onToggle?: () => void;
  onExecute?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  className?: string;
}

export default function ScheduleCard({
  schedule,
  viewMode = 'grid',
  onToggle,
  onExecute,
  onEdit,
  onView,
  className = ''
}: ScheduleCardProps) {
  const statusColors = AutomationSchedulesUtils.getScheduleStatusColor(schedule.status);
  const priorityColor = AutomationSchedulesUtils.getSchedulePriorityColor(schedule.priority);
  const formattedSchedule = AutomationSchedulesUtils.formatSchedule(schedule);
  const nextExecution = schedule.nextExecution 
    ? AutomationSchedulesUtils.formatRelativeTime(new Date(schedule.nextExecution))
    : 'Not scheduled';

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-2 rounded-lg ${statusColors.bgColor}`}>
              <Calendar className={`w-5 h-5 ${statusColors.textColor}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors.borderColor} ${statusColors.textColor} ${statusColors.bgColor}`}>
                  {schedule.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor} bg-opacity-10`}>
                  {schedule.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{formattedSchedule}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Next: {nextExecution}
                </span>
                <span>{schedule.actions.length} action{schedule.actions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={schedule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className={schedule.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onExecute?.();
              }}
              disabled={schedule.status !== 'active'}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            />
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
          <div className={`p-2 rounded-lg ${statusColors.bgColor}`}>
            <Calendar className={`w-5 h-5 ${statusColors.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {schedule.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{schedule.type.replace('_', ' ')}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors.borderColor} ${statusColors.textColor} ${statusColors.bgColor}`}>
          {schedule.status}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor} bg-opacity-10`}>
          {schedule.priority}
        </span>
      </div>

      {/* Schedule Info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-900">{formattedSchedule}</p>
        </div>
      </div>

      {/* Next Execution */}
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Next: {nextExecution}
          </p>
          {schedule.lastExecution && (
            <p className="text-xs text-gray-500">
              Last: {new Date(schedule.lastExecution).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{schedule.executionCount}</p>
          <p className="text-xs text-gray-500">Executions</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {schedule.executionCount > 0 
              ? `${Math.round((schedule.successCount / schedule.executionCount) * 100)}%` 
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">Success Rate</p>
        </div>
      </div>

      {/* Tags */}
      {schedule.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {schedule.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {schedule.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{schedule.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
        <span>{schedule.actions.length} action{schedule.actions.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
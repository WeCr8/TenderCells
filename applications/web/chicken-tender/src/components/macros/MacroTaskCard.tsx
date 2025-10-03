import React from 'react';
import { Calendar, Clock, Play, Pause, X, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroTask } from '../../types/macros';

interface MacroTaskCardProps {
  task: MacroTask;
  onExecute: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  className?: string;
}

export default function MacroTaskCard({
  task,
  onExecute,
  onCancel,
  onDelete,
  onEdit,
  className = ''
}: MacroTaskCardProps) {
  const statusColors = MacroUtils.getMacroStatusColor(task.status);
  const typeColors = MacroUtils.getMacroTypeColor(task.macroId.split('-')[0]); // Assuming ID prefix indicates type

  const formatNextExecution = () => {
    if (!task.schedule?.nextExecution) return 'Not scheduled';
    return MacroUtils.formatNextExecution(task);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${typeColors.bg}`}>
            <Calendar className={`w-5 h-5 ${typeColors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{task.name}</h3>
            <p className="text-sm text-gray-500">{MacroUtils.formatMacroSchedule(task.schedule)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
            {task.status}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={<MoreVertical className="w-4 h-4" />}
            aria-label="More options"
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {task.description}
      </p>

      {/* Schedule Info */}
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">
          Next execution: {formatNextExecution()}
        </span>
      </div>

      {/* Execution Info */}
      {task.startTime && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last run:</span>
            <span className="font-medium text-gray-900">
              {new Date(task.startTime).toLocaleString()}
            </span>
          </div>
          {task.endTime && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">
                {MacroUtils.formatExecutionTime(
                  new Date(task.endTime).getTime() - new Date(task.startTime).getTime()
                )}
              </span>
            </div>
          )}
          {task.error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {task.error}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          icon={<X className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </Button>
        <div className="flex items-center space-x-2">
          {task.status === 'running' ? (
            <Button
              variant="outline"
              size="sm"
              icon={<Pause className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              disabled={task.status === 'running'}
            >
              Run Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
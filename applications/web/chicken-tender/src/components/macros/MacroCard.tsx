import React from 'react';
import { Play, Clock, Calendar, Tag, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroFunction } from '../../types/macros';

interface MacroCardProps {
  macro: MacroFunction;
  onExecute: () => void;
  onSchedule: () => void;
  onEdit?: () => void;
  className?: string;
}

export default function MacroCard({
  macro,
  onExecute,
  onSchedule,
  onEdit,
  className = ''
}: MacroCardProps) {
  const typeColors = MacroUtils.getMacroTypeColor(macro.type);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${typeColors.bg}`}>
            {macro.icon ? (
              <span className="text-xl">{macro.icon}</span>
            ) : (
              <Play className={`w-5 h-5 ${typeColors.text}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{macro.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{macro.category}</p>
          </div>
        </div>
        <div className="flex items-center">
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
        {macro.description}
      </p>

      {/* Tags */}
      {macro.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {macro.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {macro.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{macro.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Parameters */}
      {macro.parameters.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-xs text-gray-500">
              {macro.parameters.length} parameter{macro.parameters.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {macro.parameters.slice(0, 2).map((param) => (
              <div key={param.id} className="flex justify-between text-xs">
                <span className="text-gray-600">{param.name}</span>
                <span className="text-gray-900 font-medium">
                  {param.required ? 'Required' : 'Optional'}
                </span>
              </div>
            ))}
            {macro.parameters.length > 2 && (
              <div className="text-xs text-gray-500 text-right">
                +{macro.parameters.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          icon={<Calendar className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
        >
          Schedule
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Play className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onExecute();
          }}
        >
          Execute
        </Button>
      </div>
    </div>
  );
}
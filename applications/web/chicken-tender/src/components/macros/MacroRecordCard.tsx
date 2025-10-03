import React from 'react';
import { Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroRecord } from '../../types/macros';

interface MacroRecordCardProps {
  record: MacroRecord;
  onClick?: () => void;
  className?: string;
}

export default function MacroRecordCard({
  record,
  onClick,
  className = ''
}: MacroRecordCardProps) {
  const typeColors = MacroUtils.getMacroTypeColor(record.type);
  const statusColors = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    partial: 'bg-amber-100 text-amber-800 border-amber-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${typeColors.bg}`}>
            {record.status === 'success' ? (
              <CheckCircle className={`w-5 h-5 ${typeColors.text}`} />
            ) : record.status === 'failed' ? (
              <XCircle className={`w-5 h-5 text-red-600`} />
            ) : (
              <Clock className={`w-5 h-5 ${typeColors.text}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{record.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{record.type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[record.status]}`}>
            {record.status}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Execution Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Executed By</p>
          <p className="text-sm font-medium text-gray-900">{record.executedBy}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm font-medium text-gray-900">{MacroUtils.formatExecutionTime(record.duration)}</p>
        </div>
      </div>

      {/* Result Summary */}
      {record.result && typeof record.result === 'object' && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Result Summary</p>
          <div className="space-y-1">
            {Object.entries(record.result).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-600">{key}:</span>
                <span className="text-gray-900 font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
            {Object.keys(record.result).length > 3 && (
              <p className="text-xs text-gray-500 text-right">
                +{Object.keys(record.result).length - 3} more fields
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>ID: {record.id.substring(0, 8)}...</span>
        <span>{new Date(record.executedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}
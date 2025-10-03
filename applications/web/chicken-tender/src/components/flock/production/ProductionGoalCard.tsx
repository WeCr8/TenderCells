import React from 'react';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { FlockProductionUtils } from '../../../utils/flockProductionUtils';
import type { ProductionGoal, ProductionRecord } from '../../../types/flockProduction';

interface ProductionGoalCardProps {
  goal: ProductionGoal;
  records: ProductionRecord[];
  viewMode?: 'cards' | 'list';
  onClick?: () => void;
  className?: string;
}

export default function ProductionGoalCard({
  goal,
  records,
  viewMode = 'cards',
  onClick,
  className = ''
}: ProductionGoalCardProps) {
  const progress = FlockProductionUtils.calculateGoalProgress(goal, records);
  
  const statusColors = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    not_started: Clock,
    in_progress: TrendingUp,
    completed: CheckCircle,
    overdue: AlertTriangle
  };

  const StatusIcon = statusIcons[goal.status] || Clock;

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="p-2 bg-farm-100 rounded-lg">
              <Target className="w-5 h-5 text-farm-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {goal.targetQuantity} {goal.type}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 capitalize">{goal.period} goal</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                </span>
                <span>{progress.progress.toFixed(1)}% complete</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress.onTrack ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, progress.progress)}%` }}
              />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-farm-100 rounded-lg">
            <Target className="w-5 h-5 text-farm-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {goal.targetQuantity} {goal.type}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{goal.period} Goal</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {goal.status.replace('_', ' ')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{progress.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.onTrack ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, progress.progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
          <span>{goal.currentProgress} / {goal.targetQuantity}</span>
          <span className={progress.onTrack ? 'text-emerald-600' : 'text-amber-600'}>
            {progress.onTrack ? 'On track' : 'Behind schedule'}
          </span>
        </div>
      </div>

      {/* Goal Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{progress.remaining}</p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{progress.daysLeft}</p>
          <p className="text-xs text-gray-500">Days Left</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Created by {goal.createdBy}</span>
        <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
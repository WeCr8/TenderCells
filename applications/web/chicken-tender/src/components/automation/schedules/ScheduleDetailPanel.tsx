import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Tag,
  User,
  Info
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AutomationSchedulesUtils } from '../../../utils/automationSchedulesUtils';
import type { Schedule, ScheduleExecution } from '../../../types/automationSchedules';

interface ScheduleDetailPanelProps {
  schedule: Schedule;
  executions: ScheduleExecution[];
  onClose: () => void;
  onToggle: () => void;
  onExecute: () => void;
  onEdit: () => void;
  className?: string;
}

export default function ScheduleDetailPanel({
  schedule,
  executions,
  onClose,
  onToggle,
  onExecute,
  onEdit,
  className = ''
}: ScheduleDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'executions' | 'settings'>('overview');

  const statusColors = AutomationSchedulesUtils.getScheduleStatusColor(schedule.status);
  const priorityColor = AutomationSchedulesUtils.getSchedulePriorityColor(schedule.priority);
  const formattedSchedule = AutomationSchedulesUtils.formatSchedule(schedule);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Schedule Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule Information</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{schedule.type.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${statusColors.textColor}`}>{schedule.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Priority:</span>
            <span className={`text-sm font-medium ${priorityColor}`}>{schedule.priority}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Schedule:</span>
            <span className="text-sm font-medium text-gray-900">{formattedSchedule}</span>
          </div>
        </div>
      </div>

      {/* Time Configuration */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Time Configuration</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {schedule.time && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time:</span>
              <span className="text-sm font-medium text-gray-900">
                {AutomationSchedulesUtils.formatScheduleTime(schedule.time)}
              </span>
            </div>
          )}
          
          {schedule.days && schedule.days.length > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Days:</span>
              <span className="text-sm font-medium text-gray-900">
                {schedule.days.join(', ')}
              </span>
            </div>
          )}
          
          {schedule.dates && schedule.dates.length > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dates:</span>
              <span className="text-sm font-medium text-gray-900">
                {schedule.dates.join(', ')}
              </span>
            </div>
          )}
          
          {schedule.interval && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interval:</span>
              <span className="text-sm font-medium text-gray-900">
                {schedule.interval} minutes
              </span>
            </div>
          )}
          
          {schedule.cronExpression && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cron:</span>
              <span className="text-sm font-medium text-gray-900">
                {schedule.cronExpression}
              </span>
            </div>
          )}
          
          {schedule.sunEvent && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sun Event:</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {schedule.sunEvent}
                {schedule.sunOffset && (
                  schedule.sunOffset > 0 
                    ? ` + ${schedule.sunOffset} minutes` 
                    : ` - ${Math.abs(schedule.sunOffset)} minutes`
                )}
              </span>
            </div>
          )}
          
          {schedule.startDate && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Start Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(schedule.startDate).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {schedule.endDate && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">End Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(schedule.endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Execution Information</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Next Execution:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.nextExecution 
                ? new Date(schedule.nextExecution).toLocaleString()
                : 'Not scheduled'}
            </span>
          </div>
          
          {schedule.lastExecution && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Execution:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(schedule.lastExecution).toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Execution Count:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionCount}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Success Rate:</span>
            <span className={`text-sm font-medium ${
              schedule.executionCount === 0 ? 'text-gray-900' :
              schedule.successCount / schedule.executionCount > 0.9 ? 'text-emerald-600' :
              schedule.successCount / schedule.executionCount > 0.7 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {schedule.executionCount === 0 
                ? 'N/A' 
                : `${Math.round((schedule.successCount / schedule.executionCount) * 100)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {schedule.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {schedule.tags.map((tag, index) => (
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
    </div>
  );

  const renderActionsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule Actions</h3>
      
      {schedule.actions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No actions defined for this schedule</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.actions.map((action, index) => (
            <div key={action.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <span className="w-5 h-5 inline-flex items-center justify-center bg-gray-200 rounded-full text-xs mr-2">
                    {index + 1}
                  </span>
                  {action.name}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  action.enabled 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {action.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              
              <div className="bg-white rounded border border-gray-200 p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Target:</span>
                  <span className="text-xs text-gray-900">{action.target.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Type:</span>
                  <span className="text-xs text-gray-900 capitalize">{action.type.replace('_', ' ')}</span>
                </div>
              </div>
              
              {Object.keys(action.parameters).length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Parameters:</h5>
                  <div className="bg-white rounded border border-gray-200 p-3">
                    {Object.entries(action.parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExecutionsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Execution History</h3>
      
      {executions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No execution history available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <div key={execution.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  execution.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                  execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {execution.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(execution.startTime).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {AutomationSchedulesUtils.formatExecutionTime(execution)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Actions</p>
                  <p className="text-sm font-medium text-gray-900">
                    {execution.actions.completed}/{execution.actions.total}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Success</p>
                  <p className={`text-sm font-medium ${
                    execution.status === 'completed' ? 'text-emerald-600' :
                    execution.status === 'failed' ? 'text-red-600' :
                    'text-gray-900'
                  }`}>
                    {execution.status === 'completed' ? '100%' :
                     execution.status === 'running' ? 'In Progress' :
                     execution.status === 'failed' ? 'Failed' :
                     'Skipped'}
                  </p>
                </div>
              </div>
              
              {execution.error && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                  {execution.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
        >
          View Full History
        </Button>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule Settings</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Execution Settings</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Timeout:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionSettings.timeout} seconds
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Retry Count:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionSettings.retryCount}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Retry Delay:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionSettings.retryDelay} seconds
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Skip If Missed:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionSettings.skipIfMissed ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Run On Startup:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.executionSettings.runOnStartup ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Created By:</span>
            <span className="text-sm font-medium text-gray-900">
              {schedule.createdBy}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Created At:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(schedule.createdAt).toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Last Updated:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(schedule.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
          onClick={onEdit}
        >
          Edit Schedule
        </Button>
        <Button
          variant={schedule.status === 'active' ? 'danger' : 'success'}
          size="sm"
          icon={schedule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          onClick={onToggle}
        >
          {schedule.status === 'active' ? 'Pause Schedule' : 'Activate Schedule'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusColors.bgColor}`}>
            <Calendar className={`w-5 h-5 ${statusColors.textColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{schedule.name}</h2>
            <p className="text-sm text-gray-600">{formattedSchedule}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-5 h-5" />}
          onClick={onClose}
        />
      </div>

      {/* Status Bar */}
      <div className={`px-6 py-2 ${statusColors.bgColor} border-b border-gray-200 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors.borderColor} ${statusColors.textColor}`}>
            {schedule.status}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor} bg-opacity-10`}>
            {schedule.priority} Priority
          </span>
        </div>
        <span className="text-xs text-gray-600">
          Next execution: {nextExecution}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'actions'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'executions'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Executions
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'actions' && renderActionsTab()}
        {activeTab === 'executions' && renderExecutionsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={onEdit}
          >
            Edit Schedule
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={onExecute}
              disabled={schedule.status !== 'active'}
            >
              Run Now
            </Button>
            <Button
              variant={schedule.status === 'active' ? 'danger' : 'success'}
              size="sm"
              icon={schedule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={onToggle}
            >
              {schedule.status === 'active' ? 'Pause' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
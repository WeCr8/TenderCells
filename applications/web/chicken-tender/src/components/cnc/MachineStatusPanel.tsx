import React from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, Play, Pause, Square, PenTool as Tool, Gauge } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { MachineStatus, JobProgress, GCodeFile, CNCAlarm } from '../../types/cnc';

interface MachineStatusPanelProps {
  status: MachineStatus | null;
  progress: JobProgress | null;
  currentFile: GCodeFile | null;
  alarms: CNCAlarm[];
  onPause: () => void;
  onResume: () => void;
  className?: string;
}

export default function MachineStatusPanel({
  status,
  progress,
  currentFile,
  alarms,
  onPause,
  onResume,
  className = ''
}: MachineStatusPanelProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'Idle':
        return 'text-emerald-600 bg-emerald-100';
      case 'Run':
        return 'text-blue-600 bg-blue-100';
      case 'Hold':
        return 'text-amber-600 bg-amber-100';
      case 'Alarm':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Machine Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Machine Status</h3>
          {status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(status.state)}`}>
              {status.state}
            </span>
          )}
        </div>

        {status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Position */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Position
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">X:</span>
                  <span>{status.position.work.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Y:</span>
                  <span>{status.position.work.y.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Z:</span>
                  <span>{status.position.work.z.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Feed & Spindle */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Gauge className="w-4 h-4 mr-2" />
                Feed & Spindle
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Feed Rate:</span>
                  <span>{status.feedRate} mm/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spindle:</span>
                  <span>{status.spindleSpeed} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tool:</span>
                  <span>T{status.toolNumber}</span>
                </div>
              </div>
            </div>

            {/* Overrides */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Tool className="w-4 h-4 mr-2" />
                Overrides
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Feed:</span>
                  <span>{status.overrides.feed}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rapid:</span>
                  <span>{status.overrides.rapid}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spindle:</span>
                  <span>{status.overrides.spindle}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No machine status available</p>
            <p className="text-sm">Connect to GRBL controller to view status</p>
          </div>
        )}
      </div>

      {/* Job Progress */}
      {progress && currentFile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Job Progress</h3>
            <div className="flex items-center space-x-2">
              {status?.state === 'Run' ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Pause className="w-4 h-4" />}
                  onClick={onPause}
                >
                  Pause
                </Button>
              ) : status?.state === 'Hold' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-4 h-4" />}
                  onClick={onResume}
                >
                  Resume
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">File:</span>
              <span className="text-sm text-gray-900">{currentFile.name}</span>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress.percentComplete.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-farm-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentComplete}%` }}
                />
              </div>
            </div>

            {/* Time Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Elapsed</p>
                  <p className="font-medium">{formatTime(progress.elapsedTime)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Remaining</p>
                  <p className="font-medium">{formatTime(progress.estimatedTimeRemaining)}</p>
                </div>
              </div>
            </div>

            {/* Line Progress */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Line:</span>
              <span className="font-mono">{progress.currentLine} / {progress.totalLines}</span>
            </div>

            {/* Current Operation */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Operation:</span>
              <span className="font-medium">{progress.currentOperation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alarms */}
      {alarms.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
            Recent Alarms
          </h3>
          <div className="space-y-3">
            {alarms.slice(0, 5).map((alarm, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  alarm.severity === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : alarm.severity === 'error'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Alarm {alarm.code}: {alarm.message}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{alarm.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alarm.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
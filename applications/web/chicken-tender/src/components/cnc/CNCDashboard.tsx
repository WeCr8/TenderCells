import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Home, 
  AlertTriangle,
  Settings,
  Upload,
  Download,
  RefreshCw,
  Zap,
  WifiOff
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import ManualControlPanel from './ManualControlPanel';
import MachineStatusPanel from './MachineStatusPanel';
import FileManagerPanel from './FileManagerPanel';
import ToolpathPreview from './ToolpathPreview';
import { GRBLService } from '../../services/grblService';
import type { MachineStatus, GCodeFile, JobProgress, CNCAlarm } from '../../types/cnc';

interface CNCDashboardProps {
  className?: string;
}

export default function CNCDashboard({ className = '' }: CNCDashboardProps) {
  const [machineStatus, setMachineStatus] = useState<MachineStatus | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [currentFile, setCurrentFile] = useState<GCodeFile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [alarms, setAlarms] = useState<CNCAlarm[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'files' | 'preview'>('control');

  const grblService = GRBLService.getInstance();

  useEffect(() => {
    // Set up GRBL service callbacks
    grblService.onStatusUpdate(setMachineStatus);
    grblService.onProgress(setJobProgress);
    grblService.onAlarm((alarm) => {
      setAlarms(prev => [alarm, ...prev.slice(0, 9)]); // Keep last 10 alarms
    });

    // Attempt to connect
    connectToGRBL();

    return () => {
      grblService.disconnect();
    };
  }, []);

  const connectToGRBL = async () => {
    try {
      setConnectionError(null);
      
      // In a real app, we would connect to a real WebSocket server
      // For demo purposes, we'll simulate a connection
      // await grblService.connect();
      
      // Instead of actually connecting, we'll just set a mock status
      setMachineStatus({
        state: 'Idle',
        position: {
          work: { x: 0, y: 0, z: 0 },
          machine: { x: 0, y: 0, z: 0 }
        },
        feedRate: 1000,
        spindleSpeed: 0,
        toolNumber: 1,
        coordinateSystem: 'G54',
        overrides: {
          feed: 100,
          rapid: 100,
          spindle: 100
        },
        pins: {
          probe: false,
          door: false,
          hold: false,
          softReset: false,
          cycleStart: false
        },
        lastUpdate: new Date().toISOString()
      });
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to GRBL:', error);
      setIsConnected(false);
      setConnectionError(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect to GRBL controller. Please ensure the GRBL server is running and accessible.'
      );
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await grblService.emergencyStop();
    } catch (error) {
      console.error('Emergency stop failed:', error);
    }
  };

  const handleSoftReset = async () => {
    try {
      await grblService.softReset();
    } catch (error) {
      console.error('Soft reset failed:', error);
    }
  };

  const handleHomeAll = async () => {
    try {
      await grblService.homeAll();
    } catch (error) {
      console.error('Homing failed:', error);
    }
  };

  const handleRunFile = async (file: GCodeFile) => {
    try {
      setCurrentFile(file);
      await grblService.runGCodeFile(file);
    } catch (error) {
      console.error('Failed to run file:', error);
    }
  };

  const handlePauseJob = async () => {
    try {
      await grblService.pauseJob();
    } catch (error) {
      console.error('Failed to pause job:', error);
    }
  };

  const handleResumeJob = async () => {
    try {
      await grblService.resumeJob();
    } catch (error) {
      console.error('Failed to resume job:', error);
    }
  };

  const tabs = [
    { id: 'control', label: 'Manual Control', icon: Settings },
    { id: 'files', label: 'File Manager', icon: Upload },
    { id: 'preview', label: 'Toolpath Preview', icon: Play }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CNC Control Center</h1>
          <p className="text-gray-600">GRBL-based CNC automation and control system</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {!isConnected && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={connectToGRBL}
            >
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800">Connection Issue</h4>
              <p className="text-sm text-amber-700 mt-1">{connectionError}</p>
              <p className="text-xs text-amber-600 mt-2">
                Note: This demo requires a GRBL controller to be connected. In a production environment, 
                ensure your GRBL device is properly connected and the WebSocket server is running.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Controls */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Emergency Controls</h3>
              <p className="text-sm text-red-600">Use these controls for immediate machine safety</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="danger"
              icon={<Square className="w-4 h-4" />}
              onClick={handleEmergencyStop}
              disabled={!isConnected}
            >
              Emergency Stop
            </Button>
            <Button
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleSoftReset}
              disabled={!isConnected}
            >
              Soft Reset
            </Button>
            <Button
              variant="outline"
              icon={<Home className="w-4 h-4" />}
              onClick={handleHomeAll}
              disabled={!isConnected}
            >
              Home All
            </Button>
          </div>
        </div>
      </div>

      {/* Machine Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MachineStatusPanel 
            status={machineStatus}
            progress={jobProgress}
            currentFile={currentFile}
            alarms={alarms}
            onPause={handlePauseJob}
            onResume={handleResumeJob}
          />
        </div>
        <div>
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="primary"
                icon={<Play className="w-4 h-4" />}
                fullWidth
                disabled={!isConnected || !currentFile}
                onClick={() => currentFile && handleRunFile(currentFile)}
              >
                Start Job
              </Button>
              <Button
                variant="outline"
                icon={<Pause className="w-4 h-4" />}
                fullWidth
                disabled={!isConnected || machineStatus?.state !== 'Run'}
                onClick={handlePauseJob}
              >
                Pause Job
              </Button>
              <Button
                variant="outline"
                icon={<Square className="w-4 h-4" />}
                fullWidth
                disabled={!isConnected}
                onClick={handleEmergencyStop}
              >
                Stop Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-farm-500 text-farm-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'control' && (
          <ManualControlPanel
            machineStatus={machineStatus}
            isConnected={isConnected}
            grblService={grblService}
          />
        )}
        
        {activeTab === 'files' && (
          <FileManagerPanel
            onFileSelect={setCurrentFile}
            onRunFile={handleRunFile}
            currentFile={currentFile}
          />
        )}
        
        {activeTab === 'preview' && (
          <ToolpathPreview
            file={currentFile}
            machineStatus={machineStatus}
            progress={jobProgress}
          />
        )}
      </div>
    </div>
  );
}
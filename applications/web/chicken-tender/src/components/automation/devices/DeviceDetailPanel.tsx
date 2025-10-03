import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  RefreshCw, 
  Power, 
  Wifi, 
  Battery, 
  Download,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  MapPin,
  Info
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AutomationDevicesUtils } from '../../../utils/automationDevicesUtils';
import type { Device, DeviceReading, DeviceEvent } from '../../../types/automationDevices';

interface DeviceDetailPanelProps {
  device: Device;
  events: DeviceEvent[];
  onClose: () => void;
  onExecuteAction: (actionId: string, parameters?: Record<string, any>) => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onUpdateFirmware: () => void;
  className?: string;
}

export default function DeviceDetailPanel({
  device,
  events,
  onClose,
  onExecuteAction,
  onUpdateSettings,
  onUpdateFirmware,
  className = ''
}: DeviceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'readings' | 'actions' | 'events' | 'settings'>('overview');
  const [actionParameters, setActionParameters] = useState<Record<string, Record<string, any>>>({});

  const statusColors = AutomationDevicesUtils.getDeviceStatusColor(device.status);
  const needsAttention = AutomationDevicesUtils.deviceNeedsAttention(device);

  const handleExecuteAction = (actionId: string) => {
    onExecuteAction(actionId, actionParameters[actionId]);
  };

  const handleParameterChange = (actionId: string, paramId: string, value: any) => {
    setActionParameters(prev => ({
      ...prev,
      [actionId]: {
        ...(prev[actionId] || {}),
        [paramId]: value
      }
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Device Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Device Information</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{device.type.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${statusColors.textColor}`}>{device.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Location:</span>
            <span className="text-sm font-medium text-gray-900">{device.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Last Seen:</span>
            <span className="text-sm font-medium text-gray-900">{new Date(device.lastSeen).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Key Readings */}
      {device.readings.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Key Readings</h3>
          <div className="grid grid-cols-2 gap-3">
            {device.readings.slice(0, 4).map((reading) => {
              const formatted = AutomationDevicesUtils.formatDeviceReading(reading);
              return (
                <div key={reading.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{reading.name}</p>
                  <p className={`text-lg font-medium ${formatted.statusColor}`}>
                    {formatted.value} {formatted.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {device.actions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {device.actions.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleExecuteAction(action.id)}
                disabled={device.status !== 'online'}
              >
                {action.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Network & Battery */}
      <div className="grid grid-cols-2 gap-4">
        {device.network && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Wifi className="w-4 h-4 mr-1" />
              Network
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Type:</span>
                <span className="text-xs font-medium text-gray-900 capitalize">{device.network.type}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Signal:</span>
                <span className="text-xs font-medium text-gray-900">{Math.round(device.network.signalStrength * 100)}%</span>
              </div>
              {device.network.ipAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">IP:</span>
                  <span className="text-xs font-medium text-gray-900">{device.network.ipAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {device.battery && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Battery className="w-4 h-4 mr-1" />
              Battery
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Level:</span>
                <span className={`text-xs font-medium ${
                  device.battery.level < 0.2 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {Math.round(device.battery.level * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Status:</span>
                <span className="text-xs font-medium text-gray-900">
                  {device.battery.charging ? 'Charging' : 'Discharging'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Remaining:</span>
                <span className="text-xs font-medium text-gray-900">
                  {AutomationDevicesUtils.calculateBatteryRemainingTime(device)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Firmware */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          Firmware
        </h3>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Version:</span>
            <span className="text-xs font-medium text-gray-900">{device.firmware.version}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Last Updated:</span>
            <span className="text-xs font-medium text-gray-900">
              {new Date(device.firmware.lastUpdated).toLocaleDateString()}
            </span>
          </div>
          {device.firmware.updateAvailable && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="xs"
                icon={<Download className="w-3 h-3" />}
                onClick={onUpdateFirmware}
                fullWidth
              >
                Update Available
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReadingsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Device Readings</h3>
      
      {device.readings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No readings available for this device</p>
        </div>
      ) : (
        <div className="space-y-3">
          {device.readings.map((reading) => {
            const formatted = AutomationDevicesUtils.formatDeviceReading(reading);
            return (
              <div key={reading.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{reading.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reading.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                    reading.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reading.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{reading.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${formatted.statusColor}`}>
                    {formatted.value} {formatted.unit}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(reading.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {(reading.min !== undefined || reading.max !== undefined) && (
                  <div className="mt-2 text-xs text-gray-500">
                    Range: {reading.min !== undefined ? reading.min : 'N/A'} - {reading.max !== undefined ? reading.max : 'N/A'} {formatted.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderActionsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Device Actions</h3>
      
      {device.actions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No actions available for this device</p>
        </div>
      ) : (
        <div className="space-y-4">
          {device.actions.map((action) => (
            <div key={action.id} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">{action.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              
              {/* Parameters */}
              {action.parameters.length > 0 && (
                <div className="space-y-3 mb-3">
                  {action.parameters.map((param) => (
                    <div key={param.id}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {param.name}{param.required ? ' *' : ''}
                      </label>
                      {param.type === 'boolean' ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={actionParameters[action.id]?.[param.id] ?? param.defaultValue ?? false}
                            onChange={(e) => handleParameterChange(action.id, param.id, e.target.checked)}
                            className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                          />
                          <span className="ml-2 text-sm text-gray-600">{param.description}</span>
                        </div>
                      ) : param.type === 'number' ? (
                        <div>
                          <input
                            type="number"
                            value={actionParameters[action.id]?.[param.id] ?? param.defaultValue ?? ''}
                            onChange={(e) => handleParameterChange(action.id, param.id, parseFloat(e.target.value))}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                          />
                          {param.unit && (
                            <span className="text-xs text-gray-500 mt-1 block">{param.unit}</span>
                          )}
                        </div>
                      ) : param.type === 'enum' && param.options ? (
                        <select
                          value={actionParameters[action.id]?.[param.id] ?? param.defaultValue ?? ''}
                          onChange={(e) => handleParameterChange(action.id, param.id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                        >
                          {param.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={actionParameters[action.id]?.[param.id] ?? param.defaultValue ?? ''}
                          onChange={(e) => handleParameterChange(action.id, param.id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExecuteAction(action.id)}
                disabled={device.status !== 'online'}
                fullWidth
              >
                Execute {action.name}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Device Events</h3>
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No events recorded for this device</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const formatted = AutomationDevicesUtils.formatDeviceEvent(event);
            return (
              <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${formatted.iconColor} bg-opacity-10 mt-0.5`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{formatted.title}</h4>
                      <span className="text-xs text-gray-500">{formatted.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{formatted.description}</p>
                    {event.value !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        Value: {typeof event.value === 'object' ? JSON.stringify(event.value) : event.value}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
        >
          Load More Events
        </Button>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Device Settings</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              defaultValue={device.name}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              defaultValue={device.location}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              defaultValue={device.description}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Device-specific settings */}
      {Object.keys(device.settings).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Device-Specific Settings</h4>
          
          <div className="space-y-3">
            {Object.entries(device.settings).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key.replace('_', ' ')}
                </label>
                {typeof value === 'boolean' ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={value}
                      className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enabled</span>
                  </div>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    defaultValue={value}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    defaultValue={value as string}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
          onClick={() => onUpdateSettings({})}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Zap className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{device.name}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="capitalize">{device.type.replace('_', ' ')}</span>
              <span>•</span>
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {device.location}
              </span>
            </div>
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
            {device.status}
          </span>
          {needsAttention.needsAttention && (
            <span className="flex items-center text-xs text-amber-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {needsAttention.reason}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600">
          Last seen: {new Date(device.lastSeen).toLocaleString()}
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
            onClick={() => setActiveTab('readings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'readings'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Readings
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
            onClick={() => setActiveTab('events')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'events'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Events
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
        {activeTab === 'readings' && renderReadingsTab()}
        {activeTab === 'actions' && renderActionsTab()}
        {activeTab === 'events' && renderEventsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <p>Model: {device.metadata.model}</p>
            <p>Manufacturer: {device.metadata.manufacturer}</p>
          </div>
          <div className="flex items-center space-x-3">
            {device.capabilities.includes('power') && (
              <Button
                variant={device.status === 'online' ? 'danger' : 'success'}
                size="sm"
                icon={<Power className="w-4 h-4" />}
                onClick={() => onTogglePower?.()}
              >
                {device.status === 'online' ? 'Turn Off' : 'Turn On'}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
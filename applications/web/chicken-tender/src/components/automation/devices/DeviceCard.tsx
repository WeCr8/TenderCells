import React from 'react';
import { 
  Wifi, 
  Battery, 
  AlertTriangle, 
  Settings, 
  MoreVertical,
  RefreshCw,
  Power,
  Zap
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { AutomationDevicesUtils } from '../../../utils/automationDevicesUtils';
import type { Device } from '../../../types/automationDevices';

interface DeviceCardProps {
  device: Device;
  viewMode?: 'grid' | 'list';
  onTogglePower?: () => void;
  onViewDetails?: () => void;
  onEditSettings?: () => void;
  onExecuteAction?: (actionId: string) => void;
  className?: string;
}

export default function DeviceCard({
  device,
  viewMode = 'grid',
  onTogglePower,
  onViewDetails,
  onEditSettings,
  onExecuteAction,
  className = ''
}: DeviceCardProps) {
  const statusColors = AutomationDevicesUtils.getDeviceStatusColor(device.status);
  const needsAttention = AutomationDevicesUtils.deviceNeedsAttention(device);
  
  // Get icon for device type
  const getDeviceIcon = () => {
    const iconName = AutomationDevicesUtils.getDeviceTypeIcon(device.type);
    // This would use dynamic imports in a real app
    return <Zap className="w-5 h-5" />;
  };

  // Format main reading
  const getMainReading = () => {
    if (device.readings.length === 0) return null;
    
    // Find the most important reading based on device type
    let mainReading = device.readings[0];
    
    if (device.type === 'temperature' || device.type === 'heater') {
      mainReading = device.readings.find(r => r.type === 'temperature') || mainReading;
    } else if (device.type === 'light') {
      mainReading = device.readings.find(r => r.type === 'light') || mainReading;
    }
    
    const formatted = AutomationDevicesUtils.formatDeviceReading(mainReading);
    
    return (
      <div className={`text-sm font-medium ${formatted.statusColor}`}>
        {formatted.value}{formatted.unit}
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              {getDeviceIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900">{device.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bgColor} ${statusColors.textColor}`}>
                  {device.status}
                </span>
                {needsAttention.needsAttention && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">{device.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <Wifi className="w-3 h-3 mr-1" />
                  {device.network ? `${device.network.type} (${Math.round(device.network.signalStrength * 100)}%)` : 'Not connected'}
                </span>
                {device.battery && (
                  <span className="flex items-center">
                    <Battery className="w-3 h-3 mr-1" />
                    {Math.round(device.battery.level * 100)}%
                  </span>
                )}
                <span>{device.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getMainReading()}
            
            <div className="flex items-center space-x-1">
              {device.capabilities.includes('power') && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Power className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePower?.();
                  }}
                  className={device.status === 'online' ? 'text-emerald-600' : 'text-gray-400'}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSettings?.();
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<MoreVertical className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  // Show more options
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {getDeviceIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {device.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{device.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors.bgColor} ${statusColors.textColor} border ${statusColors.borderColor}`}>
            {device.status}
          </span>
          {needsAttention.needsAttention && (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{device.description}</p>
        
        {/* Readings */}
        {device.readings.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {device.readings.slice(0, 4).map((reading) => {
              const formatted = AutomationDevicesUtils.formatDeviceReading(reading);
              return (
                <div key={reading.id} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">{reading.name}</p>
                  <p className={`text-sm font-medium ${formatted.statusColor}`}>
                    {formatted.value} {formatted.unit}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Quick Actions */}
        {device.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {device.actions.slice(0, 2).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onExecuteAction?.(action.id);
                }}
              >
                {action.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Wifi className="w-3 h-3" />
          <span>{device.network ? `${Math.round(device.network.signalStrength * 100)}%` : 'Offline'}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {device.battery && (
            <div className="flex items-center space-x-1">
              <Battery className="w-3 h-3" />
              <span>{Math.round(device.battery.level * 100)}%</span>
            </div>
          )}
          <span>{device.location}</span>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex flex-col items-center space-y-3">
          {device.capabilities.includes('power') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Power className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePower?.();
              }}
            >
              {device.status === 'online' ? 'Turn Off' : 'Turn On'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onEditSettings?.();
            }}
          >
            Settings
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Filter, 
  Search, 
  RefreshCw,
  Wifi,
  Battery,
  AlertTriangle,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import DeviceCard from './DeviceCard';
import DeviceDetailPanel from './DeviceDetailPanel';
import DeviceStatsCard from './DeviceStatsCard';
import type { 
  Device, 
  DeviceStats, 
  DeviceEvent,
  DeviceFilter,
  DeviceGroup
} from '../../../types/automationDevices';

interface DevicesDashboardProps {
  devices: Device[];
  deviceGroups: DeviceGroup[];
  stats: DeviceStats;
  events: DeviceEvent[];
  loading?: boolean;
  onAddDevice?: () => void;
  onRefresh?: () => void;
  onFilterChange?: (filter: DeviceFilter) => void;
  onExecuteAction?: (deviceId: string, actionId: string, parameters?: Record<string, any>) => void;
  onUpdateSettings?: (deviceId: string, settings: Record<string, any>) => void;
  onUpdateFirmware?: (deviceId: string) => void;
  className?: string;
}

export default function DevicesDashboard({
  devices,
  deviceGroups,
  stats,
  events,
  loading = false,
  onAddDevice,
  onRefresh,
  onFilterChange,
  onExecuteAction,
  onUpdateSettings,
  onUpdateFirmware,
  className = ''
}: DevicesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (onFilterChange) {
      onFilterChange({ search: term });
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    if (onFilterChange) {
      onFilterChange({
        status: status ? [status as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleGroupFilter = (groupId: string | null) => {
    setSelectedGroup(groupId);
    // In a real app, you'd filter devices by group
  };

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleExecuteAction = (deviceId: string, actionId: string, parameters?: Record<string, any>) => {
    if (onExecuteAction) {
      onExecuteAction(deviceId, actionId, parameters);
    }
  };

  const handleUpdateSettings = (deviceId: string, settings: Record<string, any>) => {
    if (onUpdateSettings) {
      onUpdateSettings(deviceId, settings);
    }
  };

  const handleUpdateFirmware = (deviceId: string) => {
    if (onUpdateFirmware) {
      onUpdateFirmware(deviceId);
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = searchTerm 
      ? device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = selectedStatus 
      ? device.status === selectedStatus
      : true;
    
    const matchesGroup = selectedGroup
      ? deviceGroups.find(g => g.id === selectedGroup)?.devices.includes(device.id)
      : true;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">Manage and monitor your connected devices</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddDevice}
          >
            Add Device
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DeviceStatsCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={Zap}
          status="good"
        />
        <DeviceStatsCard
          title="Online"
          value={stats.onlineDevices}
          icon={Wifi}
          status={stats.onlineDevices > stats.totalDevices * 0.8 ? "good" : "warning"}
        />
        <DeviceStatsCard
          title="Needs Attention"
          value={stats.errorDevices + stats.batteryLowDevices}
          icon={AlertTriangle}
          status={stats.errorDevices > 0 ? "danger" : "warning"}
        />
        <DeviceStatsCard
          title="Battery Low"
          value={stats.batteryLowDevices}
          icon={Battery}
          status={stats.batteryLowDevices > 0 ? "warning" : "good"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={selectedStatus || ''}
            onChange={(e) => handleStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
          </select>
          
          {deviceGroups.length > 0 && (
            <select
              value={selectedGroup || ''}
              onChange={(e) => handleGroupFilter(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            >
              <option value="">All Groups</option>
              {deviceGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            More Filters
          </Button>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-current rounded-sm"></div>
                ))}
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-0.5 bg-current rounded"></div>
                ))}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Devices Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-${selectedDevice ? '3' : '4'}`}>
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No devices found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStatus || selectedGroup
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first device'
                }
              </p>
              {!searchTerm && !selectedStatus && !selectedGroup && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onAddDevice}
                >
                  Add First Device
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  viewMode={viewMode}
                  onTogglePower={() => handleExecuteAction(device.id, 'power_toggle', {})}
                  onViewDetails={() => handleDeviceClick(device)}
                  onEditSettings={() => {
                    handleDeviceClick(device);
                    setActiveTab('settings');
                  }}
                  onExecuteAction={(actionId) => handleExecuteAction(device.id, actionId, {})}
                />
              ))}
            </div>
          )}
        </div>

        {/* Device Detail Panel */}
        {selectedDevice && (
          <div className="lg:col-span-1">
            <DeviceDetailPanel
              device={selectedDevice}
              events={events.filter(e => e.deviceId === selectedDevice.id)}
              onClose={() => setSelectedDevice(null)}
              onExecuteAction={(actionId, parameters) => 
                handleExecuteAction(selectedDevice.id, actionId, parameters)
              }
              onUpdateSettings={(settings) => 
                handleUpdateSettings(selectedDevice.id, settings)
              }
              onUpdateFirmware={() => 
                handleUpdateFirmware(selectedDevice.id)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
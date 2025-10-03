import React, { useState } from 'react';
import DevicesDashboard from '../components/automation/devices/DevicesDashboard';
import { useAutomationDevices } from '../hooks/useAutomationDevices';
import type { Device } from '../types/automationDevices';

export default function AutomationDevicesPage() {
  const { 
    devices, 
    deviceGroups, 
    stats, 
    events,
    loading, 
    executeDeviceAction,
    updateDeviceSettings,
    updateDeviceFirmware,
    refreshAll
  } = useAutomationDevices();

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleAddDevice = () => {
    // Navigate to device creation form or open modal
    console.log('Add device');
  };

  const handleExecuteAction = (deviceId: string, actionId: string, parameters?: Record<string, any>) => {
    executeDeviceAction(deviceId, actionId, parameters);
  };

  const handleUpdateSettings = (deviceId: string, settings: Record<string, any>) => {
    updateDeviceSettings(deviceId, settings);
  };

  const handleUpdateFirmware = (deviceId: string) => {
    updateDeviceFirmware(deviceId);
  };

  return (
    <DevicesDashboard
      devices={devices}
      deviceGroups={deviceGroups}
      stats={stats || {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        maintenanceDevices: 0,
        errorDevices: 0,
        batteryLowDevices: 0,
        firmwareOutdatedDevices: 0,
        byType: {},
        byLocation: {},
        lastUpdated: new Date().toISOString()
      }}
      events={events}
      loading={loading}
      onAddDevice={handleAddDevice}
      onRefresh={refreshAll}
      onExecuteAction={handleExecuteAction}
      onUpdateSettings={handleUpdateSettings}
      onUpdateFirmware={handleUpdateFirmware}
    />
  );
}
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DevicesDashboard from './devices/DevicesDashboard';
import AddDeviceButton from './AddDeviceButton';
import { useAutomationDevices } from '../../hooks/useAutomationDevices';
import type { Device } from '../../types/automationDevices';

export default function AutomationDevicesPage() {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-device') {
      // This would open the add device modal
      // For now, we'll just clear the URL parameter
      navigate('/automation/devices', { replace: true });
    }
  }, [location, navigate]);

  const handleAddDevice = () => {
    // This would be handled by the AddDeviceButton component
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
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">Manage and monitor your connected devices</p>
        </div>
        <AddDeviceButton onSuccess={refreshAll} />
      </div>
      
      <DevicesDashboard
        devices={devices}
        deviceGroups={deviceGroups}
        stats={stats || {
          totalDevices: devices.length,
          onlineDevices: devices.filter(d => d.status === 'online').length,
          offlineDevices: devices.filter(d => d.status === 'offline').length,
          maintenanceDevices: devices.filter(d => d.status === 'maintenance').length,
          errorDevices: devices.filter(d => d.status === 'error').length,
          batteryLowDevices: devices.filter(d => d.battery && d.battery.level < 0.2).length,
          firmwareOutdatedDevices: devices.filter(d => d.firmware.updateAvailable).length,
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
    </>
  );
}
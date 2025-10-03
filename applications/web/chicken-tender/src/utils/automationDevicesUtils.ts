import type { 
  Device, 
  DeviceReading, 
  DeviceStatus, 
  DeviceEvent,
  DeviceAction,
  DeviceCapability
} from '../types/automationDevices';

/**
 * Utility functions for automation devices
 */
export class AutomationDevicesUtils {
  /**
   * Get device status color class
   */
  static getDeviceStatusColor(status: DeviceStatus): {
    textColor: string;
    bgColor: string;
    borderColor: string;
  } {
    const statusColors = {
      online: {
        textColor: 'text-emerald-800',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200'
      },
      offline: {
        textColor: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      },
      maintenance: {
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200'
      },
      error: {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      },
      disabled: {
        textColor: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      }
    };

    return statusColors[status] || statusColors.offline;
  }

  /**
   * Get device type icon name
   */
  static getDeviceTypeIcon(type: string): string {
    const typeIcons = {
      feeder: 'utensils',
      water_dispenser: 'droplet',
      door: 'door-open',
      light: 'lightbulb',
      heater: 'thermometer',
      fan: 'wind',
      camera: 'camera',
      sensor: 'activity',
      motor: 'rotate-cw',
      custom: 'box'
    };

    return typeIcons[type as keyof typeof typeIcons] || 'device-desktop';
  }

  /**
   * Format device reading for display
   */
  static formatDeviceReading(reading: DeviceReading): {
    value: string;
    unit: string;
    status: string;
    statusColor: string;
  } {
    let formattedValue = reading.value.toString();
    let unit = reading.unit || '';
    
    // Format based on reading type
    switch (reading.type) {
      case 'temperature':
        formattedValue = typeof reading.value === 'number' ? reading.value.toFixed(1) : reading.value;
        break;
      case 'humidity':
        formattedValue = typeof reading.value === 'number' ? `${reading.value.toFixed(0)}` : reading.value;
        break;
      case 'level':
        formattedValue = typeof reading.value === 'number' ? `${(reading.value * 100).toFixed(0)}` : reading.value;
        unit = unit || '%';
        break;
    }

    const statusColors = {
      normal: 'text-emerald-600',
      warning: 'text-amber-600',
      critical: 'text-red-600'
    };

    return {
      value: formattedValue,
      unit,
      status: reading.status,
      statusColor: statusColors[reading.status] || 'text-gray-600'
    };
  }

  /**
   * Calculate device battery remaining time
   */
  static calculateBatteryRemainingTime(device: Device): string {
    if (!device.battery || device.battery.charging) return 'Charging';
    if (device.battery.level >= 0.95) return 'Fully Charged';
    
    // This is a simplified estimation - in a real app, you'd use historical data
    // and device-specific power consumption rates
    const batteryLevel = device.battery.level;
    
    // Rough estimate based on battery level
    if (batteryLevel > 0.7) return 'About 1 week';
    if (batteryLevel > 0.5) return 'About 4 days';
    if (batteryLevel > 0.3) return 'About 2 days';
    if (batteryLevel > 0.15) return 'About 1 day';
    return 'Less than 12 hours';
  }

  /**
   * Check if device needs attention
   */
  static deviceNeedsAttention(device: Device): {
    needsAttention: boolean;
    reason?: string;
  } {
    if (device.status === 'error') {
      return { needsAttention: true, reason: 'Device error' };
    }
    
    if (device.status === 'maintenance') {
      return { needsAttention: true, reason: 'Maintenance required' };
    }
    
    if (device.battery && device.battery.level < 0.15 && !device.battery.charging) {
      return { needsAttention: true, reason: 'Low battery' };
    }
    
    if (device.firmware.updateAvailable) {
      return { needsAttention: true, reason: 'Firmware update available' };
    }
    
    // Check for critical readings
    const criticalReadings = device.readings.filter(r => r.status === 'critical');
    if (criticalReadings.length > 0) {
      return { 
        needsAttention: true, 
        reason: `Critical reading: ${criticalReadings[0].name}` 
      };
    }
    
    return { needsAttention: false };
  }

  /**
   * Format device event for display
   */
  static formatDeviceEvent(event: DeviceEvent): {
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    time: string;
  } {
    const eventIcons = {
      status_change: 'refresh-cw',
      reading: 'activity',
      action: 'play',
      error: 'alert-triangle',
      connection: 'wifi',
      maintenance: 'tool'
    };

    const severityColors = {
      info: 'text-blue-600',
      warning: 'text-amber-600',
      error: 'text-red-600',
      critical: 'text-red-700'
    };

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return {
      title: this.getEventTitle(event),
      description: event.description,
      icon: eventIcons[event.eventType as keyof typeof eventIcons] || 'info',
      iconColor: severityColors[event.severity] || 'text-gray-600',
      time: formatTime(event.timestamp)
    };
  }

  /**
   * Get device capability description
   */
  static getCapabilityDescription(capability: DeviceCapability): string {
    const descriptions = {
      power: 'Can be turned on and off',
      toggle: 'Can be toggled between states',
      level: 'Supports variable levels',
      temperature: 'Can measure temperature',
      humidity: 'Can measure humidity',
      motion: 'Can detect motion',
      open_close: 'Can be opened and closed',
      dispense: 'Can dispense materials',
      record: 'Can record data or media',
      custom: 'Custom capability'
    };

    return descriptions[capability] || 'Unknown capability';
  }

  /**
   * Check if device is compatible with action
   */
  static isDeviceCompatibleWithAction(device: Device, actionCapability: DeviceCapability): boolean {
    return device.capabilities.includes(actionCapability);
  }

  /**
   * Get device network status description
   */
  static getNetworkStatusDescription(device: Device): string {
    if (!device.network) return 'Not connected';
    
    const signalStrength = device.network.signalStrength;
    const networkType = device.network.type;
    
    let quality = 'Poor';
    if (signalStrength > 0.7) quality = 'Excellent';
    else if (signalStrength > 0.4) quality = 'Good';
    else if (signalStrength > 0.2) quality = 'Fair';
    
    return `${quality} ${networkType} connection`;
  }

  // Private helper methods
  private static getEventTitle(event: DeviceEvent): string {
    switch (event.eventType) {
      case 'status_change':
        return `Status changed to ${event.value}`;
      case 'reading':
        return `New reading: ${event.value}`;
      case 'action':
        return `Action performed: ${event.description}`;
      case 'error':
        return `Error: ${event.description}`;
      case 'connection':
        return event.value ? 'Device connected' : 'Device disconnected';
      case 'maintenance':
        return `Maintenance: ${event.description}`;
      default:
        return event.description;
    }
  }
}
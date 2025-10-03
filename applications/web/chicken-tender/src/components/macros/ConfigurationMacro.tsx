import React from 'react';
import type { MacroFunction, MacroParameter } from '../../types/macros';

/**
 * Factory function to create a configuration macro
 */
export function createConfigurationMacro(
  id: string,
  name: string,
  description: string,
  parameters: MacroParameter[],
  executeFunction: (params: Record<string, any>) => Promise<any>
): MacroFunction {
  return {
    id,
    name,
    description,
    type: 'configuration',
    icon: '⚙️',
    parameters,
    execute: executeFunction,
    isRepeatable: false,
    requiresConfirmation: true,
    category: 'Configuration',
    tags: ['settings', 'configuration']
  };
}

/**
 * Create a macro for configuring environment settings
 */
export const environmentConfigMacro: MacroFunction = createConfigurationMacro(
  'environment-config',
  'Configure Environment',
  'Update environment control settings',
  [
    {
      id: 'targetTemperature',
      name: 'Target Temperature (°F)',
      description: 'Set the target temperature for the coop',
      type: 'number',
      required: true,
      defaultValue: 70,
      validation: {
        min: 50,
        max: 90
      }
    },
    {
      id: 'lightSchedule',
      name: 'Lighting Schedule',
      description: 'Configure the lighting schedule',
      type: 'select',
      required: true,
      options: [
        { label: 'Natural Only', value: 'natural' },
        { label: '12 Hours (6am-6pm)', value: '12h_standard' },
        { label: '14 Hours (5am-7pm)', value: '14h_extended' },
        { label: '16 Hours (4am-8pm)', value: '16h_long' }
      ],
      defaultValue: '12h_standard'
    },
    {
      id: 'ventilationLevel',
      name: 'Ventilation Level',
      description: 'Set the ventilation fan speed',
      type: 'select',
      required: true,
      options: [
        { label: 'Off', value: 'off' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Auto', value: 'auto' }
      ],
      defaultValue: 'auto'
    },
    {
      id: 'doorSchedule',
      name: 'Door Schedule',
      description: 'Configure automatic door schedule',
      type: 'select',
      required: true,
      options: [
        { label: 'Manual Only', value: 'manual' },
        { label: 'Sunrise/Sunset', value: 'sun' },
        { label: 'Fixed Times', value: 'fixed' },
        { label: 'Light Sensor', value: 'light' }
      ],
      defaultValue: 'sun'
    },
    {
      id: 'doorOpenTime',
      name: 'Door Open Time',
      description: 'Time to open the door (for fixed schedule)',
      type: 'string',
      required: false,
      defaultValue: '06:00',
      dependsOn: 'doorSchedule'
    },
    {
      id: 'doorCloseTime',
      name: 'Door Close Time',
      description: 'Time to close the door (for fixed schedule)',
      type: 'string',
      required: false,
      defaultValue: '20:00',
      dependsOn: 'doorSchedule'
    }
  ],
  async (params) => {
    // In a real implementation, this would call the environment service
    console.log('Updating environment settings with params:', params);
    return {
      success: true,
      updatedSettings: {
        temperature: params.targetTemperature,
        lighting: params.lightSchedule,
        ventilation: params.ventilationLevel,
        door: {
          schedule: params.doorSchedule,
          openTime: params.doorOpenTime,
          closeTime: params.doorCloseTime
        }
      },
      timestamp: new Date().toISOString()
    };
  }
);

/**
 * Create a macro for configuring notification settings
 */
export const notificationConfigMacro: MacroFunction = createConfigurationMacro(
  'notification-config',
  'Configure Notifications',
  'Update notification preferences',
  [
    {
      id: 'emailNotifications',
      name: 'Email Notifications',
      description: 'Enable email notifications',
      type: 'boolean',
      required: true,
      defaultValue: true
    },
    {
      id: 'pushNotifications',
      name: 'Push Notifications',
      description: 'Enable browser push notifications',
      type: 'boolean',
      required: true,
      defaultValue: true
    },
    {
      id: 'smsNotifications',
      name: 'SMS Notifications',
      description: 'Enable text message notifications',
      type: 'boolean',
      required: true,
      defaultValue: false
    },
    {
      id: 'notificationTypes',
      name: 'Notification Types',
      description: 'Select which types of events to be notified about',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'Health Alerts', value: 'health' },
        { label: 'Production Updates', value: 'production' },
        { label: 'Environment Alerts', value: 'environment' },
        { label: 'Security Alerts', value: 'security' },
        { label: 'System Updates', value: 'system' }
      ],
      defaultValue: ['health', 'environment', 'security']
    },
    {
      id: 'quietHours',
      name: 'Enable Quiet Hours',
      description: 'Silence non-critical notifications during specified hours',
      type: 'boolean',
      required: false,
      defaultValue: false
    },
    {
      id: 'quietHoursStart',
      name: 'Quiet Hours Start',
      description: 'Start time for quiet hours',
      type: 'string',
      required: false,
      defaultValue: '22:00',
      dependsOn: 'quietHours'
    },
    {
      id: 'quietHoursEnd',
      name: 'Quiet Hours End',
      description: 'End time for quiet hours',
      type: 'string',
      required: false,
      defaultValue: '07:00',
      dependsOn: 'quietHours'
    }
  ],
  async (params) => {
    // In a real implementation, this would call the notification service
    console.log('Updating notification settings with params:', params);
    return {
      success: true,
      updatedSettings: {
        email: params.emailNotifications,
        push: params.pushNotifications,
        sms: params.smsNotifications,
        types: params.notificationTypes,
        quietHours: {
          enabled: params.quietHours,
          start: params.quietHoursStart,
          end: params.quietHoursEnd
        }
      },
      timestamp: new Date().toISOString()
    };
  }
);

/**
 * Create a macro for configuring automation rules
 */
export const automationConfigMacro: MacroFunction = createConfigurationMacro(
  'automation-config',
  'Configure Automation',
  'Update automation system settings',
  [
    {
      id: 'enableAutomation',
      name: 'Enable Automation System',
      description: 'Master switch for the automation system',
      type: 'boolean',
      required: true,
      defaultValue: true
    },
    {
      id: 'automationMode',
      name: 'Automation Mode',
      description: 'Select how automated the system should be',
      type: 'select',
      required: true,
      options: [
        { label: 'Manual Confirmation', value: 'manual' },
        { label: 'Semi-Automatic', value: 'semi' },
        { label: 'Fully Automatic', value: 'full' }
      ],
      defaultValue: 'semi'
    },
    {
      id: 'enabledSystems',
      name: 'Enabled Systems',
      description: 'Select which systems to automate',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'Feeding', value: 'feeding' },
        { label: 'Watering', value: 'watering' },
        { label: 'Lighting', value: 'lighting' },
        { label: 'Temperature', value: 'temperature' },
        { label: 'Ventilation', value: 'ventilation' },
        { label: 'Door Control', value: 'door' }
      ],
      defaultValue: ['feeding', 'lighting', 'door']
    },
    {
      id: 'failsafeMode',
      name: 'Failsafe Mode',
      description: 'How the system should behave during failures',
      type: 'select',
      required: true,
      options: [
        { label: 'Safe Defaults', value: 'safe' },
        { label: 'Maintain Last State', value: 'maintain' },
        { label: 'Alert Only', value: 'alert' }
      ],
      defaultValue: 'safe'
    },
    {
      id: 'loggingLevel',
      name: 'Logging Level',
      description: 'Detail level for automation logs',
      type: 'select',
      required: false,
      options: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Normal', value: 'normal' },
        { label: 'Verbose', value: 'verbose' },
        { label: 'Debug', value: 'debug' }
      ],
      defaultValue: 'normal'
    }
  ],
  async (params) => {
    // In a real implementation, this would call the automation service
    console.log('Updating automation settings with params:', params);
    return {
      success: true,
      updatedSettings: {
        enabled: params.enableAutomation,
        mode: params.automationMode,
        enabledSystems: params.enabledSystems,
        failsafeMode: params.failsafeMode,
        loggingLevel: params.loggingLevel
      },
      timestamp: new Date().toISOString()
    };
  }
);

/**
 * Component that exports all predefined configuration macros
 */
export default function ConfigurationMacro() {
  // This component doesn't render anything directly
  // It's used to export the macro definitions
  return null;
}

// Export all predefined configuration macros
export const predefinedConfigMacros: MacroFunction[] = [
  environmentConfigMacro,
  notificationConfigMacro,
  automationConfigMacro
];
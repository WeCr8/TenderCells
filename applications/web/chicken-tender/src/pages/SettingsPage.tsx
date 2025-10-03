import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Wifi,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button/Button';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'input' | 'range';
  value: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsSection[]>([
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure how and when you receive notifications',
      icon: Bell,
      settings: [
        {
          id: 'email_notifications',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          type: 'toggle',
          value: true
        },
        {
          id: 'push_notifications',
          label: 'Push Notifications',
          description: 'Receive browser push notifications',
          type: 'toggle',
          value: true
        },
        {
          id: 'notification_frequency',
          label: 'Notification Frequency',
          description: 'How often to check for new notifications',
          type: 'select',
          value: 'real-time',
          options: [
            { label: 'Real-time', value: 'real-time' },
            { label: 'Every 5 minutes', value: '5min' },
            { label: 'Every 15 minutes', value: '15min' },
            { label: 'Hourly', value: 'hourly' }
          ]
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of the application',
      icon: Palette,
      settings: [
        {
          id: 'theme',
          label: 'Theme',
          description: 'Choose your preferred color scheme',
          type: 'select',
          value: 'light',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto', value: 'auto' }
          ]
        },
        {
          id: 'compact_mode',
          label: 'Compact Mode',
          description: 'Use a more compact layout to fit more content',
          type: 'toggle',
          value: false
        },
        {
          id: 'animation_speed',
          label: 'Animation Speed',
          description: 'Control the speed of UI animations',
          type: 'range',
          value: 1,
          min: 0.5,
          max: 2,
          step: 0.1
        }
      ]
    },
    {
      id: 'regional',
      title: 'Regional Settings',
      description: 'Configure language, timezone, and regional preferences',
      icon: Globe,
      settings: [
        {
          id: 'language',
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          value: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' }
          ]
        },
        {
          id: 'timezone',
          label: 'Timezone',
          description: 'Your local timezone',
          type: 'select',
          value: 'America/New_York',
          options: [
            { label: 'Eastern Time', value: 'America/New_York' },
            { label: 'Central Time', value: 'America/Chicago' },
            { label: 'Mountain Time', value: 'America/Denver' },
            { label: 'Pacific Time', value: 'America/Los_Angeles' }
          ]
        },
        {
          id: 'temperature_unit',
          label: 'Temperature Unit',
          description: 'Display temperature in Celsius or Fahrenheit',
          type: 'select',
          value: 'fahrenheit',
          options: [
            { label: 'Fahrenheit (°F)', value: 'fahrenheit' },
            { label: 'Celsius (°C)', value: 'celsius' }
          ]
        }
      ]
    },
    {
      id: 'data',
      title: 'Data & Storage',
      description: 'Manage data retention and backup settings',
      icon: Database,
      settings: [
        {
          id: 'auto_backup',
          label: 'Automatic Backup',
          description: 'Automatically backup your data',
          type: 'toggle',
          value: true
        },
        {
          id: 'data_retention',
          label: 'Data Retention Period',
          description: 'How long to keep historical data',
          type: 'select',
          value: '1year',
          options: [
            { label: '3 months', value: '3months' },
            { label: '6 months', value: '6months' },
            { label: '1 year', value: '1year' },
            { label: '2 years', value: '2years' },
            { label: 'Forever', value: 'forever' }
          ]
        }
      ]
    },
    {
      id: 'connectivity',
      title: 'Connectivity',
      description: 'Configure network and device connections',
      icon: Wifi,
      settings: [
        {
          id: 'offline_mode',
          label: 'Offline Mode',
          description: 'Allow the app to work without internet connection',
          type: 'toggle',
          value: true
        },
        {
          id: 'sync_frequency',
          label: 'Sync Frequency',
          description: 'How often to sync data with the server',
          type: 'select',
          value: 'auto',
          options: [
            { label: 'Automatic', value: 'auto' },
            { label: 'Every 5 minutes', value: '5min' },
            { label: 'Every 15 minutes', value: '15min' },
            { label: 'Manual only', value: 'manual' }
          ]
        }
      ]
    }
  ]);

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateSetting = (sectionId: string, settingId: string, value: any) => {
    setSettings(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.id === settingId ? { ...setting, value } : setting
              )
            }
          : section
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
  };

  const renderSettingControl = (section: SettingsSection, setting: SettingItem) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <button
            onClick={() => updateSetting(section.id, setting.id, !setting.value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
              setting.value ? 'bg-farm-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                setting.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        );

      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'input':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
          />
        );

      case 'range':
        return (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{setting.min}</span>
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={setting.value}
              onChange={(e) => updateSetting(section.id, setting.id, parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-500">{setting.max}</span>
            <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
              {setting.value}x
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application preferences and configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Button
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleReset}
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {settings.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Section Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-farm-100 rounded-lg">
                <section.icon className="w-5 h-5 text-farm-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-6">
              {section.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-6">
                    <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <div className="flex-shrink-0 w-48">
                    {renderSettingControl(section, setting)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Settings are automatically saved to your account and synced across devices.
        </p>
      </div>
    </div>
  );
}
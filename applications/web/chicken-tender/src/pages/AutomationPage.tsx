import React from 'react';
import AutomationDashboard from '../components/automation/AutomationDashboard';
import type { AutomationStats, AutomationRule } from '../types/automation';

// Mock data - replace with actual API calls
const mockStats: AutomationStats = {
  totalRules: 12,
  activeRules: 8,
  executionsToday: 24,
  successRate: 96.5,
  lastExecution: new Date().toISOString(),
  upcomingTasks: 6
};

const mockRules: AutomationRule[] = [
  {
    id: 'rule1',
    name: 'Morning Feeding',
    description: 'Automatic feeding schedule for morning meal',
    type: 'feeding',
    status: 'active',
    trigger: {
      type: 'time',
      conditions: [{ parameter: 'time', operator: 'equals', value: '06:00' }]
    },
    actions: [
      {
        id: 'action1',
        type: 'device_control',
        device: 'feeder_1',
        parameters: { amount: 2.5, duration: 30 }
      }
    ],
    schedule: {
      type: 'daily',
      time: '06:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    lastExecuted: '2024-01-15T06:00:00Z',
    nextExecution: '2024-01-16T06:00:00Z',
    executionCount: 45,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'rule2',
    name: 'Temperature Control',
    description: 'Maintain optimal coop temperature',
    type: 'temperature',
    status: 'active',
    trigger: {
      type: 'sensor',
      conditions: [{ parameter: 'temperature', operator: 'less_than', value: 65, unit: 'F' }]
    },
    actions: [
      {
        id: 'action2',
        type: 'device_control',
        device: 'heater_1',
        parameters: { power: true, target: 70 }
      }
    ],
    executionCount: 12,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'rule3',
    name: 'Evening Door Close',
    description: 'Automatically close coop door at sunset',
    type: 'door',
    status: 'paused',
    trigger: {
      type: 'time',
      conditions: [{ parameter: 'sunset', operator: 'equals', value: 'sunset' }]
    },
    actions: [
      {
        id: 'action3',
        type: 'device_control',
        device: 'door_1',
        parameters: { position: 'closed' }
      }
    ],
    schedule: {
      type: 'daily',
      time: 'sunset'
    },
    executionCount: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

export default function AutomationPage() {
  const handleAddRule = () => {
    console.log('Add rule clicked');
  };

  const handleRuleClick = (rule: AutomationRule) => {
    console.log('Rule clicked:', rule);
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    console.log('Toggle rule:', ruleId, enabled);
  };

  return (
    <AutomationDashboard
      stats={mockStats}
      rules={mockRules}
      onAddRule={handleAddRule}
      onRuleClick={handleRuleClick}
      onToggleRule={handleToggleRule}
    />
  );
}
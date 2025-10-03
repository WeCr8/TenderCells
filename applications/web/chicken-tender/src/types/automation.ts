/**
 * Type definitions for automation system
 */

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'feeding' | 'lighting' | 'temperature' | 'door' | 'cleaning' | 'health_check';
  status: 'active' | 'inactive' | 'paused';
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  schedule?: AutomationSchedule;
  lastExecuted?: string;
  nextExecution?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: 'time' | 'sensor' | 'manual' | 'condition';
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  parameter: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
  unit?: string;
}

export interface AutomationAction {
  id: string;
  type: 'device_control' | 'notification' | 'data_log' | 'alert';
  device?: string;
  parameters: Record<string, any>;
  delay?: number;
}

export interface AutomationSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  days?: string[];
  interval?: number;
  endDate?: string;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  executionsToday: number;
  successRate: number;
  lastExecution: string;
  upcomingTasks: number;
}
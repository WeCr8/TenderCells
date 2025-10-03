/**
 * Enhanced type definitions for automation rules system
 */

export type TriggerType = 'time' | 'sensor' | 'manual' | 'condition' | 'event' | 'threshold';
export type ActionType = 'device_control' | 'notification' | 'data_log' | 'alert' | 'webhook' | 'script';
export type RuleStatus = 'active' | 'inactive' | 'paused' | 'error' | 'testing';
export type RuleCategory = 'feeding' | 'lighting' | 'temperature' | 'door' | 'cleaning' | 'health_check' | 'security' | 'maintenance';
export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'interval' | 'cron';
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains' | 'in_range';

export interface TriggerCondition {
  id: string;
  parameter: string;
  operator: ConditionOperator;
  value: any;
  unit?: string;
  threshold?: number;
  hysteresis?: number;
}

export interface AutomationTrigger {
  id: string;
  type: TriggerType;
  name: string;
  description: string;
  conditions: TriggerCondition[];
  logicOperator?: 'AND' | 'OR';
  enabled: boolean;
}

export interface AutomationAction {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  device?: string;
  parameters: Record<string, any>;
  delay?: number;
  retries?: number;
  timeout?: number;
  enabled: boolean;
}

export interface AutomationSchedule {
  id: string;
  type: ScheduleType;
  name: string;
  time?: string;
  days?: string[];
  interval?: number;
  cronExpression?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  status: RuleStatus;
  priority: number;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  schedule?: AutomationSchedule;
  conditions?: TriggerCondition[];
  metadata: {
    tags: string[];
    author: string;
    version: string;
    lastModified: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
  };
  settings: {
    maxExecutions?: number;
    cooldownPeriod?: number;
    retryOnFailure: boolean;
    notifyOnFailure: boolean;
    logExecution: boolean;
  };
  lastExecuted?: string;
  nextExecution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  triggeredBy: string;
  executionTime: number;
  actionsExecuted: number;
  actionsSucceeded: number;
  actionsFailed: number;
  logs: ExecutionLog[];
  error?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  template: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>;
  variables: TemplateVariable[];
  instructions: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'device' | 'sensor';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface RuleValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  pausedRules: number;
  errorRules: number;
  executionsToday: number;
  executionsThisWeek: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecution: string;
  upcomingTasks: number;
  topCategories: { category: RuleCategory; count: number }[];
  recentExecutions: RuleExecution[];
}

export interface RuleFilter {
  status?: RuleStatus[];
  category?: RuleCategory[];
  tags?: string[];
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface RuleSortOptions {
  field: 'name' | 'category' | 'status' | 'lastExecuted' | 'executionCount' | 'successRate' | 'createdAt';
  direction: 'asc' | 'desc';
}
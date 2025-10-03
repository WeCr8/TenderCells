/**
 * Type definitions for automation schedules
 */

export type ScheduleType = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'custom' 
  | 'interval' 
  | 'cron' 
  | 'sunrise_sunset';

export type ScheduleStatus = 
  | 'active' 
  | 'inactive' 
  | 'paused' 
  | 'completed' 
  | 'error';

export type SchedulePriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'critical';

export interface ScheduleTime {
  hour: number;
  minute: number;
  second?: number;
}

export interface ScheduleAction {
  id: string;
  type: 'device_control' | 'notification' | 'rule_trigger' | 'custom';
  name: string;
  description: string;
  target: {
    type: 'device' | 'rule' | 'notification' | 'custom';
    id: string;
    name: string;
  };
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  actions: {
    total: number;
    completed: number;
    failed: number;
  };
  error?: string;
  duration?: number;
}

export interface Schedule {
  id: string;
  name: string;
  description: string;
  type: ScheduleType;
  status: ScheduleStatus;
  priority: SchedulePriority;
  
  // Time configuration
  time?: ScheduleTime;
  days?: string[]; // For weekly schedules
  dates?: number[]; // For monthly schedules (1-31)
  months?: number[]; // For yearly schedules (1-12)
  interval?: number; // For interval schedules (in minutes)
  cronExpression?: string; // For cron schedules
  sunEvent?: 'sunrise' | 'sunset'; // For sunrise/sunset schedules
  sunOffset?: number; // Minutes before/after sun event
  
  // Location for sun events
  location?: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  
  // Date range
  startDate?: string;
  endDate?: string;
  
  // Actions to perform
  actions: ScheduleAction[];
  
  // Execution settings
  executionSettings: {
    timeout: number; // In seconds
    retryCount: number;
    retryDelay: number; // In seconds
    skipIfMissed: boolean;
    runOnStartup: boolean;
  };
  
  // Execution history
  lastExecution?: string;
  nextExecution?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  
  // Metadata
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  completedSchedules: number;
  errorSchedules: number;
  executionsToday: number;
  executionsThisWeek: number;
  successRate: number;
  upcomingExecutions: {
    scheduleId: string;
    scheduleName: string;
    executionTime: string;
  }[];
  lastUpdated: string;
}

export interface ScheduleFilter {
  types?: ScheduleType[];
  status?: ScheduleStatus[];
  priority?: SchedulePriority[];
  tags?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ScheduleSortOptions {
  field: 'name' | 'type' | 'status' | 'priority' | 'lastExecution' | 'nextExecution' | 'createdAt';
  direction: 'asc' | 'desc';
}
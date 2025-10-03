/**
 * Type definitions for macro functions and operations
 */

export type MacroType = 
  | 'record' 
  | 'task' 
  | 'configuration' 
  | 'flock' 
  | 'chicken' 
  | 'feeding' 
  | 'maintenance';

export type MacroStatus = 'idle' | 'running' | 'completed' | 'failed';

export type MacroSchedule = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface MacroFunction<T = any> {
  id: string;
  name: string;
  description: string;
  type: MacroType;
  icon?: string;
  parameters: MacroParameter[];
  execute: (params: Record<string, any>) => Promise<T>;
  validate?: (params: Record<string, any>) => MacroValidationResult;
  isRepeatable: boolean;
  requiresConfirmation: boolean;
  category: string;
  tags: string[];
}

export interface MacroParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'entity';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    entityType?: string;
  };
  placeholder?: string;
  dependsOn?: string; // ID of another parameter this depends on
}

export interface MacroValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

export interface MacroTask {
  id: string;
  macroId: string;
  name: string;
  description: string;
  status: MacroStatus;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  schedule?: {
    type: MacroSchedule;
    time?: string;
    days?: string[];
    dates?: number[];
    nextExecution?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MacroRecord {
  id: string;
  macroId: string;
  name: string;
  type: MacroType;
  parameters: Record<string, any>;
  result: any;
  executedBy: string;
  executedAt: string;
  status: 'success' | 'partial' | 'failed';
  duration: number;
  notes?: string;
}

export interface MacroStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  mostUsedMacros: {
    macroId: string;
    name: string;
    count: number;
  }[];
  recentExecutions: MacroRecord[];
}

export interface MacroFilter {
  types?: MacroType[];
  status?: MacroStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  tags?: string[];
}
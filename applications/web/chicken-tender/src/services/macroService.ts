import { apiService } from './api';
import type { 
  MacroFunction, 
  MacroTask, 
  MacroRecord, 
  MacroStats,
  MacroFilter,
  MacroValidationResult
} from '../types/macros';

/**
 * Service for managing macro functions and tasks
 */
export class MacroService {
  private static readonly ENDPOINTS = {
    MACROS: '/macros',
    MACRO_BY_ID: (id: string) => `/macros/${id}`,
    MACRO_EXECUTE: (id: string) => `/macros/${id}/execute`,
    MACRO_VALIDATE: (id: string) => `/macros/${id}/validate`,
    TASKS: '/macro-tasks',
    TASK_BY_ID: (id: string) => `/macro-tasks/${id}`,
    TASK_CANCEL: (id: string) => `/macro-tasks/${id}/cancel`,
    RECORDS: '/macro-records',
    STATS: '/macros/stats',
  };

  /**
   * Get all available macro functions
   */
  static async getMacroFunctions(filter?: MacroFilter): Promise<MacroFunction[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.types) params.append('types', filter.types.join(','));
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.MACROS}?${queryString}` : this.ENDPOINTS.MACROS;
    
    return apiService.get<MacroFunction[]>(endpoint);
  }

  /**
   * Get a specific macro function by ID
   */
  static async getMacroFunctionById(id: string): Promise<MacroFunction> {
    return apiService.get<MacroFunction>(this.ENDPOINTS.MACRO_BY_ID(id));
  }

  /**
   * Execute a macro function
   */
  static async executeMacro(id: string, parameters: Record<string, any>): Promise<MacroRecord> {
    return apiService.post<MacroRecord>(this.ENDPOINTS.MACRO_EXECUTE(id), { parameters });
  }

  /**
   * Validate macro parameters
   */
  static async validateMacroParameters(id: string, parameters: Record<string, any>): Promise<MacroValidationResult> {
    return apiService.post<MacroValidationResult>(this.ENDPOINTS.MACRO_VALIDATE(id), { parameters });
  }

  /**
   * Get all scheduled macro tasks
   */
  static async getMacroTasks(filter?: MacroFilter): Promise<MacroTask[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.types) params.append('types', filter.types.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.search) params.append('search', filter.search);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.TASKS}?${queryString}` : this.ENDPOINTS.TASKS;
    
    return apiService.get<MacroTask[]>(endpoint);
  }

  /**
   * Get a specific macro task by ID
   */
  static async getMacroTaskById(id: string): Promise<MacroTask> {
    return apiService.get<MacroTask>(this.ENDPOINTS.TASK_BY_ID(id));
  }

  /**
   * Create a new scheduled macro task
   */
  static async createMacroTask(macroId: string, parameters: Record<string, any>, schedule?: MacroTask['schedule']): Promise<MacroTask> {
    return apiService.post<MacroTask>(this.ENDPOINTS.TASKS, {
      macroId,
      parameters,
      schedule
    });
  }

  /**
   * Update a scheduled macro task
   */
  static async updateMacroTask(id: string, updates: Partial<MacroTask>): Promise<MacroTask> {
    return apiService.put<MacroTask>(this.ENDPOINTS.TASK_BY_ID(id), updates);
  }

  /**
   * Cancel a scheduled macro task
   */
  static async cancelMacroTask(id: string): Promise<void> {
    return apiService.post<void>(this.ENDPOINTS.TASK_CANCEL(id));
  }

  /**
   * Delete a scheduled macro task
   */
  static async deleteMacroTask(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.TASK_BY_ID(id));
  }

  /**
   * Get macro execution records
   */
  static async getMacroRecords(filter?: MacroFilter): Promise<MacroRecord[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.types) params.append('types', filter.types.join(','));
      if (filter.search) params.append('search', filter.search);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.RECORDS}?${queryString}` : this.ENDPOINTS.RECORDS;
    
    return apiService.get<MacroRecord[]>(endpoint);
  }

  /**
   * Get macro execution statistics
   */
  static async getMacroStats(): Promise<MacroStats> {
    return apiService.get<MacroStats>(this.ENDPOINTS.STATS);
  }
}
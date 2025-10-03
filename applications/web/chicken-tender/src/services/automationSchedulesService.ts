import { apiService } from './api';
import type { 
  Schedule, 
  ScheduleExecution, 
  ScheduleStats,
  ScheduleFilter,
  ScheduleSortOptions
} from '../types/automationSchedules';

/**
 * Service for managing automation schedules
 */
export class AutomationSchedulesService {
  private static readonly ENDPOINTS = {
    SCHEDULES: '/automation/schedules',
    SCHEDULE_BY_ID: (id: string) => `/automation/schedules/${id}`,
    SCHEDULE_EXECUTE: (id: string) => `/automation/schedules/${id}/execute`,
    SCHEDULE_TOGGLE: (id: string) => `/automation/schedules/${id}/toggle`,
    SCHEDULE_VALIDATE: '/automation/schedules/validate',
    SCHEDULE_DUPLICATE: (id: string) => `/automation/schedules/${id}/duplicate`,
    EXECUTIONS: '/automation/schedule-executions',
    EXECUTION_BY_ID: (id: string) => `/automation/schedule-executions/${id}`,
    STATS: '/automation/schedules/stats',
    EXPORT: '/automation/schedules/export',
    IMPORT: '/automation/schedules/import',
  };

  /**
   * Get all schedules with optional filtering and sorting
   */
  static async getSchedules(filter?: ScheduleFilter, sort?: ScheduleSortOptions): Promise<Schedule[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.types) params.append('types', filter.types.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
    }
    
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.SCHEDULES}?${queryString}` : this.ENDPOINTS.SCHEDULES;
    
    return apiService.get<Schedule[]>(endpoint);
  }

  /**
   * Get a specific schedule by ID
   */
  static async getScheduleById(id: string): Promise<Schedule> {
    return apiService.get<Schedule>(this.ENDPOINTS.SCHEDULE_BY_ID(id));
  }

  /**
   * Create a new schedule
   */
  static async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    return apiService.post<Schedule>(this.ENDPOINTS.SCHEDULES, schedule);
  }

  /**
   * Update an existing schedule
   */
  static async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    return apiService.put<Schedule>(this.ENDPOINTS.SCHEDULE_BY_ID(id), updates);
  }

  /**
   * Delete a schedule
   */
  static async deleteSchedule(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.SCHEDULE_BY_ID(id));
  }

  /**
   * Toggle schedule status (active/inactive)
   */
  static async toggleSchedule(id: string): Promise<Schedule> {
    return apiService.post<Schedule>(this.ENDPOINTS.SCHEDULE_TOGGLE(id));
  }

  /**
   * Execute a schedule manually
   */
  static async executeSchedule(id: string): Promise<ScheduleExecution> {
    return apiService.post<ScheduleExecution>(this.ENDPOINTS.SCHEDULE_EXECUTE(id));
  }

  /**
   * Validate a schedule configuration
   */
  static async validateSchedule(schedule: Partial<Schedule>): Promise<{
    isValid: boolean;
    errors: { field: string; message: string }[];
  }> {
    return apiService.post<any>(this.ENDPOINTS.SCHEDULE_VALIDATE, schedule);
  }

  /**
   * Duplicate an existing schedule
   */
  static async duplicateSchedule(id: string, name?: string): Promise<Schedule> {
    return apiService.post<Schedule>(this.ENDPOINTS.SCHEDULE_DUPLICATE(id), { name });
  }

  /**
   * Get schedule executions
   */
  static async getScheduleExecutions(scheduleId?: string, limit?: number): Promise<ScheduleExecution[]> {
    const params = new URLSearchParams();
    if (scheduleId) params.append('scheduleId', scheduleId);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.EXECUTIONS}?${queryString}` : this.ENDPOINTS.EXECUTIONS;
    
    return apiService.get<ScheduleExecution[]>(endpoint);
  }

  /**
   * Get a specific execution by ID
   */
  static async getExecutionById(id: string): Promise<ScheduleExecution> {
    return apiService.get<ScheduleExecution>(this.ENDPOINTS.EXECUTION_BY_ID(id));
  }

  /**
   * Get schedule statistics
   */
  static async getScheduleStats(): Promise<ScheduleStats> {
    return apiService.get<ScheduleStats>(this.ENDPOINTS.STATS);
  }

  /**
   * Export schedules
   */
  static async exportSchedules(scheduleIds?: string[]): Promise<Blob> {
    const params = scheduleIds ? `?ids=${scheduleIds.join(',')}` : '';
    const response = await fetch(`${this.ENDPOINTS.EXPORT}${params}`);
    return response.blob();
  }

  /**
   * Import schedules
   */
  static async importSchedules(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(this.ENDPOINTS.IMPORT, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
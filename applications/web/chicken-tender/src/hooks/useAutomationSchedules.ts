import { useState, useEffect } from 'react';
import { AutomationSchedulesService } from '../services/automationSchedulesService';
import { AutomationSchedulesUtils } from '../utils/automationSchedulesUtils';
import type { 
  Schedule, 
  ScheduleExecution, 
  ScheduleStats,
  ScheduleFilter,
  ScheduleSortOptions
} from '../types/automationSchedules';

/**
 * Custom hook for managing automation schedules
 */
export function useAutomationSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [executions, setExecutions] = useState<ScheduleExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async (filter?: ScheduleFilter, sort?: ScheduleSortOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AutomationSchedulesService.getSchedules(filter, sort);
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.warn('AutomationSchedulesService.getSchedules returned non-array data:', data);
        setSchedules([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      setSchedules([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AutomationSchedulesService.getScheduleStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch schedule stats:', err);
    }
  };

  const fetchExecutions = async (scheduleId?: string, limit?: number) => {
    try {
      const data = await AutomationSchedulesService.getScheduleExecutions(scheduleId, limit);
      // Ensure executions is always an array
      if (Array.isArray(data)) {
        setExecutions(data);
      } else {
        console.warn('AutomationSchedulesService.getScheduleExecutions returned non-array data:', data);
        setExecutions([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedule executions:', err);
      setExecutions([]); // Set to empty array on error
    }
  };

  const createSchedule = async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newSchedule = await AutomationSchedulesService.createSchedule(schedule);
      setSchedules(prev => [newSchedule, ...prev]);
      await fetchStats(); // Refresh stats
      return newSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
      throw err;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      const updatedSchedule = await AutomationSchedulesService.updateSchedule(id, updates);
      setSchedules(prev => prev.map(schedule => schedule.id === id ? updatedSchedule : schedule));
      await fetchStats(); // Refresh stats
      return updatedSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      throw err;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await AutomationSchedulesService.deleteSchedule(id);
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      await fetchStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
      throw err;
    }
  };

  const toggleSchedule = async (id: string) => {
    try {
      const updatedSchedule = await AutomationSchedulesService.toggleSchedule(id);
      setSchedules(prev => prev.map(schedule => schedule.id === id ? updatedSchedule : schedule));
      await fetchStats(); // Refresh stats
      return updatedSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
      throw err;
    }
  };

  const executeSchedule = async (id: string) => {
    try {
      const execution = await AutomationSchedulesService.executeSchedule(id);
      setExecutions(prev => [execution, ...prev]);
      await fetchStats(); // Refresh stats
      return execution;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute schedule');
      throw err;
    }
  };

  const validateSchedule = async (schedule: Partial<Schedule>) => {
    try {
      return await AutomationSchedulesService.validateSchedule(schedule);
    } catch (err) {
      // Fallback to client-side validation
      return AutomationSchedulesUtils.validateSchedule(schedule);
    }
  };

  const duplicateSchedule = async (id: string, name?: string) => {
    try {
      const duplicatedSchedule = await AutomationSchedulesService.duplicateSchedule(id, name);
      setSchedules(prev => [duplicatedSchedule, ...prev]);
      await fetchStats(); // Refresh stats
      return duplicatedSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate schedule');
      throw err;
    }
  };

  const exportSchedules = async (scheduleIds?: string[]) => {
    try {
      const blob = await AutomationSchedulesService.exportSchedules(scheduleIds);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-schedules-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export schedules');
      throw err;
    }
  };

  const importSchedules = async (file: File) => {
    try {
      const result = await AutomationSchedulesService.importSchedules(file);
      await fetchSchedules(); // Refresh schedules list
      await fetchStats(); // Refresh stats
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import schedules');
      throw err;
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchStats();
    fetchExecutions();
  }, []);

  return {
    // State
    schedules,
    stats,
    executions,
    loading,
    error,
    
    // Fetch functions
    fetchSchedules,
    fetchStats,
    fetchExecutions,
    
    // CRUD operations
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    executeSchedule,
    duplicateSchedule,
    
    // Validation
    validateSchedule,
    
    // Import/Export
    exportSchedules,
    importSchedules,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchSchedules(),
        fetchStats(),
        fetchExecutions()
      ]);
    }
  };
}
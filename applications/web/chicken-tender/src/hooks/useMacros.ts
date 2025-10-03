import { useState, useEffect } from 'react';
import { MacroService } from '../services/macroService';
import { MacroUtils } from '../utils/macroUtils';
import type { 
  MacroFunction, 
  MacroTask, 
  MacroRecord, 
  MacroStats,
  MacroFilter,
  MacroValidationResult
} from '../types/macros';

/**
 * Custom hook for managing macro functions and tasks
 */
export function useMacros() {
  const [macros, setMacros] = useState<MacroFunction[]>([]);
  const [tasks, setTasks] = useState<MacroTask[]>([]);
  const [records, setRecords] = useState<MacroRecord[]>([]);
  const [stats, setStats] = useState<MacroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMacros = async (filter?: MacroFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await MacroService.getMacroFunctions(filter);
      setMacros(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch macro functions');
      setMacros([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (filter?: MacroFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await MacroService.getMacroTasks(filter);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch macro tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (filter?: MacroFilter) => {
    try {
      const data = await MacroService.getMacroRecords(filter);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch macro records:', err);
      setRecords([]);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await MacroService.getMacroStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch macro stats:', err);
    }
  };

  const executeMacro = async (macroId: string, parameters: Record<string, any>): Promise<MacroRecord> => {
    try {
      setLoading(true);
      setError(null);
      const result = await MacroService.executeMacro(macroId, parameters);
      
      // Update records list with new execution
      setRecords(prev => [result, ...prev]);
      
      // Refresh stats
      fetchStats();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute macro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateMacroParameters = async (macroId: string, parameters: Record<string, any>): Promise<MacroValidationResult> => {
    try {
      return await MacroService.validateMacroParameters(macroId, parameters);
    } catch (err) {
      // Fallback to client-side validation
      const macro = macros.find(m => m.id === macroId);
      if (macro && macro.parameters) {
        return MacroUtils.validateMacroParameters(parameters, macro.parameters);
      }
      
      throw err;
    }
  };

  const createTask = async (macroId: string, parameters: Record<string, any>, schedule?: MacroTask['schedule']): Promise<MacroTask> => {
    try {
      setLoading(true);
      setError(null);
      const task = await MacroService.createMacroTask(macroId, parameters, schedule);
      
      // Update tasks list with new task
      setTasks(prev => [task, ...prev]);
      
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<MacroTask>): Promise<MacroTask> => {
    try {
      setLoading(true);
      setError(null);
      const updatedTask = await MacroService.updateMacroTask(taskId, updates);
      
      // Update tasks list
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelTask = async (taskId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await MacroService.cancelMacroTask(taskId);
      
      // Update task status in list
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'idle' as const } 
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await MacroService.deleteMacroTask(taskId);
      
      // Remove task from list
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMacros();
    fetchTasks();
    fetchRecords();
    fetchStats();
  }, []);

  return {
    // State
    macros,
    tasks,
    records,
    stats,
    loading,
    error,
    
    // Fetch functions
    fetchMacros,
    fetchTasks,
    fetchRecords,
    fetchStats,
    
    // Action functions
    executeMacro,
    validateMacroParameters,
    createTask,
    updateTask,
    cancelTask,
    deleteTask,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchMacros(),
        fetchTasks(),
        fetchRecords(),
        fetchStats()
      ]);
    }
  };
}
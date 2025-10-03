import { useState, useEffect } from 'react';
import { FlockProductionService } from '../services/flockProductionService';
import type { 
  ProductionRecord, 
  ProductionStats, 
  ProductionGoal, 
  ProductionAlert,
  ProductionFilter,
  ProductionSortOptions,
  EggProduction,
  ProductionMetrics,
  ProductionForecast
} from '../types/flockProduction';

/**
 * Custom hook for managing flock production data
 */
export function useFlockProduction() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [goals, setGoals] = useState<ProductionGoal[]>([]);
  const [alerts, setAlerts] = useState<ProductionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductionRecords = async (filter?: ProductionFilter, sort?: ProductionSortOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlockProductionService.getProductionRecords(filter, sort);
      // Ensure data is always an array to prevent undefined errors
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch production records');
      // Set empty array on error to prevent undefined errors
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionStats = async () => {
    try {
      const data = await FlockProductionService.getProductionStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch production stats:', err);
    }
  };

  const fetchProductionGoals = async (chickenId?: string) => {
    try {
      const data = await FlockProductionService.getProductionGoals(chickenId);
      // Ensure data is always an array
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch production goals:', err);
      setGoals([]);
    }
  };

  const fetchProductionAlerts = async (chickenId?: string) => {
    try {
      const data = await FlockProductionService.getProductionAlerts(chickenId);
      // Ensure data is always an array
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch production alerts:', err);
      setAlerts([]);
    }
  };

  const createProductionRecord = async (record: Omit<ProductionRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await FlockProductionService.createProductionRecord(record);
      setRecords(prev => [newRecord, ...prev]);
      await fetchProductionStats(); // Refresh stats
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create production record');
      throw err;
    }
  };

  const updateProductionRecord = async (id: string, updates: Partial<ProductionRecord>) => {
    try {
      const updatedRecord = await FlockProductionService.updateProductionRecord(id, updates);
      setRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));
      await fetchProductionStats(); // Refresh stats
      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production record');
      throw err;
    }
  };

  const deleteProductionRecord = async (id: string) => {
    try {
      await FlockProductionService.deleteProductionRecord(id);
      setRecords(prev => prev.filter(record => record.id !== id));
      await fetchProductionStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete production record');
      throw err;
    }
  };

  const recordEggProduction = async (production: Omit<EggProduction, 'id'>) => {
    try {
      const newProduction = await FlockProductionService.recordEggProduction(production);
      // Create a production record for each egg
      await createProductionRecord({
        chickenId: production.chickenId,
        chickenName: '', // This should be populated
        date: production.date,
        type: 'eggs',
        quantity: production.eggsLaid,
        quality: 'A', // Default quality
        weight: production.totalWeight,
        notes: `Average weight: ${production.averageWeight}g`,
        collectedBy: 'System',
        location: 'Main Coop',
        timeOfDay: 'morning'
      });
      return newProduction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record egg production');
      throw err;
    }
  };

  const createProductionGoal = async (goal: Omit<ProductionGoal, 'id' | 'createdAt'>) => {
    try {
      const newGoal = await FlockProductionService.createProductionGoal(goal);
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create production goal');
      throw err;
    }
  };

  const updateProductionGoal = async (id: string, updates: Partial<ProductionGoal>) => {
    try {
      const updatedGoal = await FlockProductionService.updateProductionGoal(id, updates);
      setGoals(prev => prev.map(goal => goal.id === id ? updatedGoal : goal));
      return updatedGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production goal');
      throw err;
    }
  };

  const markProductionAlertAsRead = async (alertId: string) => {
    try {
      await FlockProductionService.markProductionAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read');
      throw err;
    }
  };

  const getProductionMetrics = async (chickenId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    try {
      return await FlockProductionService.getProductionMetrics(chickenId, period);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch production metrics');
      throw err;
    }
  };

  const getProductionForecast = async (chickenId: string, days: number = 30) => {
    try {
      return await FlockProductionService.getProductionForecast(chickenId, days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch production forecast');
      throw err;
    }
  };

  const getChickenProductionProfile = async (chickenId: string) => {
    try {
      return await FlockProductionService.getChickenProductionProfile(chickenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chicken production profile');
      throw err;
    }
  };

  const exportProductionRecords = async (chickenIds?: string[]) => {
    try {
      const blob = await FlockProductionService.exportProductionRecords(chickenIds);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production-records-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export production records');
      throw err;
    }
  };

  const importProductionRecords = async (file: File) => {
    try {
      const result = await FlockProductionService.importProductionRecords(file);
      await fetchProductionRecords(); // Refresh records
      await fetchProductionStats(); // Refresh stats
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import production records');
      throw err;
    }
  };

  useEffect(() => {
    fetchProductionRecords();
    fetchProductionStats();
    fetchProductionGoals();
    fetchProductionAlerts();
  }, []);

  return {
    // State
    records,
    stats,
    goals,
    alerts,
    loading,
    error,
    
    // Fetch functions
    fetchProductionRecords,
    fetchProductionStats,
    fetchProductionGoals,
    fetchProductionAlerts,
    
    // CRUD operations
    createProductionRecord,
    updateProductionRecord,
    deleteProductionRecord,
    recordEggProduction,
    createProductionGoal,
    updateProductionGoal,
    markProductionAlertAsRead,
    
    // Other functions
    getProductionMetrics,
    getProductionForecast,
    getChickenProductionProfile,
    exportProductionRecords,
    importProductionRecords,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchProductionRecords(),
        fetchProductionStats(),
        fetchProductionGoals(),
        fetchProductionAlerts()
      ]);
    }
  };
}
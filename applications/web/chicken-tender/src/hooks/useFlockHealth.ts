import { useState, useEffect } from 'react';
import { FlockHealthService } from '../services/flockHealthService';
import type { 
  HealthRecord, 
  HealthStats, 
  HealthAlert, 
  HealthMetrics,
  HealthFilter,
  HealthSortOptions,
  Vaccination,
  Treatment
} from '../types/flockHealth';

/**
 * Custom hook for managing flock health data
 */
export function useFlockHealth() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthRecords = async (filter?: HealthFilter, sort?: HealthSortOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlockHealthService.getHealthRecords(filter, sort);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health records');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthStats = async () => {
    try {
      const data = await FlockHealthService.getHealthStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch health stats:', err);
    }
  };

  const fetchHealthAlerts = async (chickenId?: string) => {
    try {
      const data = await FlockHealthService.getHealthAlerts(chickenId);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch health alerts:', err);
    }
  };

  const fetchHealthMetrics = async (chickenId: string, dateRange?: { start: string; end: string }) => {
    try {
      const data = await FlockHealthService.getHealthMetrics(chickenId, dateRange);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
    }
  };

  const createHealthRecord = async (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRecord = await FlockHealthService.createHealthRecord(record);
      setRecords(prev => [newRecord, ...prev]);
      await fetchHealthStats(); // Refresh stats
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create health record');
      throw err;
    }
  };

  const updateHealthRecord = async (id: string, updates: Partial<HealthRecord>) => {
    try {
      const updatedRecord = await FlockHealthService.updateHealthRecord(id, updates);
      setRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));
      await fetchHealthStats(); // Refresh stats
      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update health record');
      throw err;
    }
  };

  const deleteHealthRecord = async (id: string) => {
    try {
      await FlockHealthService.deleteHealthRecord(id);
      setRecords(prev => prev.filter(record => record.id !== id));
      await fetchHealthStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete health record');
      throw err;
    }
  };

  const recordHealthMetrics = async (metrics: Omit<HealthMetrics, 'date'>) => {
    try {
      const newMetrics = await FlockHealthService.recordHealthMetrics(metrics);
      setMetrics(prev => [newMetrics, ...prev]);
      return newMetrics;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record health metrics');
      throw err;
    }
  };

  const recordVaccination = async (vaccination: Omit<Vaccination, 'id'>) => {
    try {
      const newVaccination = await FlockHealthService.recordVaccination(vaccination);
      // Create a health record for the vaccination
      await createHealthRecord({
        chickenId: vaccination.name, // This should be chickenId
        chickenName: '', // This should be populated
        recordType: 'vaccination',
        date: vaccination.administrationDate,
        veterinarian: vaccination.veterinarian,
        description: `Vaccination: ${vaccination.name}`,
        severity: 'low',
        status: 'resolved',
        followUpRequired: !!vaccination.nextDueDate,
        followUpDate: vaccination.nextDueDate,
        notes: `Batch: ${vaccination.batchNumber}, Location: ${vaccination.location}`
      });
      return newVaccination;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record vaccination');
      throw err;
    }
  };

  const recordTreatment = async (treatment: Omit<Treatment, 'id'>) => {
    try {
      const newTreatment = await FlockHealthService.recordTreatment(treatment);
      // Create a health record for the treatment
      await createHealthRecord({
        chickenId: '', // This should be populated
        chickenName: '', // This should be populated
        recordType: 'treatment',
        date: treatment.startDate,
        description: `Treatment: ${treatment.name}`,
        treatment: newTreatment,
        severity: 'medium',
        status: treatment.status === 'completed' ? 'resolved' : 'ongoing',
        followUpRequired: treatment.status !== 'completed',
        followUpDate: treatment.endDate,
        notes: `Type: ${treatment.type}, Administered by: ${treatment.administeredBy}`
      });
      return newTreatment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record treatment');
      throw err;
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await FlockHealthService.markAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read');
      throw err;
    }
  };

  const getChickenHealthProfile = async (chickenId: string) => {
    try {
      return await FlockHealthService.getChickenHealthProfile(chickenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chicken health profile');
      throw err;
    }
  };

  const exportHealthRecords = async (chickenIds?: string[]) => {
    try {
      const blob = await FlockHealthService.exportHealthRecords(chickenIds);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-records-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export health records');
      throw err;
    }
  };

  const importHealthRecords = async (file: File) => {
    try {
      const result = await FlockHealthService.importHealthRecords(file);
      await fetchHealthRecords(); // Refresh records
      await fetchHealthStats(); // Refresh stats
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import health records');
      throw err;
    }
  };

  useEffect(() => {
    fetchHealthRecords();
    fetchHealthStats();
    fetchHealthAlerts();
  }, []);

  return {
    // State
    records,
    stats,
    alerts,
    metrics,
    loading,
    error,
    
    // Fetch functions
    fetchHealthRecords,
    fetchHealthStats,
    fetchHealthAlerts,
    fetchHealthMetrics,
    
    // CRUD operations
    createHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    recordHealthMetrics,
    recordVaccination,
    recordTreatment,
    markAlertAsRead,
    
    // Other functions
    getChickenHealthProfile,
    exportHealthRecords,
    importHealthRecords,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchHealthRecords(),
        fetchHealthStats(),
        fetchHealthAlerts()
      ]);
    }
  };
}
import { apiService } from './api';
import type { 
  HealthRecord, 
  HealthMetrics, 
  HealthAlert, 
  HealthStats,
  HealthFilter,
  HealthSortOptions,
  Vaccination,
  Treatment
} from '../types/flockHealth';

/**
 * Service for managing flock health records
 */
export class FlockHealthService {
  private static readonly ENDPOINTS = {
    HEALTH_RECORDS: '/flock/health/records',
    HEALTH_RECORD_BY_ID: (id: string) => `/flock/health/records/${id}`,
    HEALTH_METRICS: '/flock/health/metrics',
    HEALTH_ALERTS: '/flock/health/alerts',
    HEALTH_STATS: '/flock/health/stats',
    VACCINATIONS: '/flock/health/vaccinations',
    TREATMENTS: '/flock/health/treatments',
    CHICKEN_HEALTH: (chickenId: string) => `/flock/health/chicken/${chickenId}`,
    HEALTH_EXPORT: '/flock/health/export',
    HEALTH_IMPORT: '/flock/health/import',
  };

  /**
   * Get all health records with optional filtering and sorting
   */
  static async getHealthRecords(filter?: HealthFilter, sort?: HealthSortOptions): Promise<HealthRecord[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.chickenIds) params.append('chickenIds', filter.chickenIds.join(','));
      if (filter.recordTypes) params.append('recordTypes', filter.recordTypes.join(','));
      if (filter.severity) params.append('severity', filter.severity.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.veterinarian) params.append('veterinarian', filter.veterinarian);
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
    const endpoint = queryString ? `${this.ENDPOINTS.HEALTH_RECORDS}?${queryString}` : this.ENDPOINTS.HEALTH_RECORDS;
    
    return apiService.get<HealthRecord[]>(endpoint);
  }

  /**
   * Get health record by ID
   */
  static async getHealthRecordById(id: string): Promise<HealthRecord> {
    return apiService.get<HealthRecord>(this.ENDPOINTS.HEALTH_RECORD_BY_ID(id));
  }

  /**
   * Create new health record
   */
  static async createHealthRecord(record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
    return apiService.post<HealthRecord>(this.ENDPOINTS.HEALTH_RECORDS, record);
  }

  /**
   * Update health record
   */
  static async updateHealthRecord(id: string, record: Partial<HealthRecord>): Promise<HealthRecord> {
    return apiService.put<HealthRecord>(this.ENDPOINTS.HEALTH_RECORD_BY_ID(id), record);
  }

  /**
   * Delete health record
   */
  static async deleteHealthRecord(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.HEALTH_RECORD_BY_ID(id));
  }

  /**
   * Get health metrics for a chicken
   */
  static async getHealthMetrics(chickenId: string, dateRange?: { start: string; end: string }): Promise<HealthMetrics[]> {
    const params = new URLSearchParams({ chickenId });
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }
    
    return apiService.get<HealthMetrics[]>(`${this.ENDPOINTS.HEALTH_METRICS}?${params.toString()}`);
  }

  /**
   * Record health metrics
   */
  static async recordHealthMetrics(metrics: Omit<HealthMetrics, 'date'>): Promise<HealthMetrics> {
    return apiService.post<HealthMetrics>(this.ENDPOINTS.HEALTH_METRICS, {
      ...metrics,
      date: new Date().toISOString()
    });
  }

  /**
   * Get health alerts
   */
  static async getHealthAlerts(chickenId?: string): Promise<HealthAlert[]> {
    const params = chickenId ? `?chickenId=${chickenId}` : '';
    return apiService.get<HealthAlert[]>(`${this.ENDPOINTS.HEALTH_ALERTS}${params}`);
  }

  /**
   * Mark health alert as read
   */
  static async markAlertAsRead(alertId: string): Promise<void> {
    return apiService.put<void>(`${this.ENDPOINTS.HEALTH_ALERTS}/${alertId}/read`);
  }

  /**
   * Get health statistics
   */
  static async getHealthStats(): Promise<HealthStats> {
    return apiService.get<HealthStats>(this.ENDPOINTS.HEALTH_STATS);
  }

  /**
   * Get vaccinations for a chicken
   */
  static async getVaccinations(chickenId: string): Promise<Vaccination[]> {
    return apiService.get<Vaccination[]>(`${this.ENDPOINTS.VACCINATIONS}?chickenId=${chickenId}`);
  }

  /**
   * Record vaccination
   */
  static async recordVaccination(vaccination: Omit<Vaccination, 'id'>): Promise<Vaccination> {
    return apiService.post<Vaccination>(this.ENDPOINTS.VACCINATIONS, vaccination);
  }

  /**
   * Get treatments for a chicken
   */
  static async getTreatments(chickenId: string): Promise<Treatment[]> {
    return apiService.get<Treatment[]>(`${this.ENDPOINTS.TREATMENTS}?chickenId=${chickenId}`);
  }

  /**
   * Record treatment
   */
  static async recordTreatment(treatment: Omit<Treatment, 'id'>): Promise<Treatment> {
    return apiService.post<Treatment>(this.ENDPOINTS.TREATMENTS, treatment);
  }

  /**
   * Get complete health profile for a chicken
   */
  static async getChickenHealthProfile(chickenId: string): Promise<{
    records: HealthRecord[];
    metrics: HealthMetrics[];
    vaccinations: Vaccination[];
    treatments: Treatment[];
    alerts: HealthAlert[];
  }> {
    return apiService.get<any>(this.ENDPOINTS.CHICKEN_HEALTH(chickenId));
  }

  /**
   * Export health records
   */
  static async exportHealthRecords(chickenIds?: string[]): Promise<Blob> {
    const params = chickenIds ? `?chickenIds=${chickenIds.join(',')}` : '';
    const response = await fetch(`${this.ENDPOINTS.HEALTH_EXPORT}${params}`);
    return response.blob();
  }

  /**
   * Import health records
   */
  static async importHealthRecords(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(this.ENDPOINTS.HEALTH_IMPORT, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
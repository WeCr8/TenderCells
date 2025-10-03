import { apiService } from './api';
import type { 
  ProductionRecord, 
  EggProduction, 
  ProductionMetrics, 
  ProductionGoal,
  ProductionAlert,
  ProductionStats,
  ProductionFilter,
  ProductionSortOptions,
  ProductionForecast
} from '../types/flockProduction';

/**
 * Service for managing flock production records
 */
export class FlockProductionService {
  private static readonly ENDPOINTS = {
    PRODUCTION_RECORDS: '/flock/production/records',
    PRODUCTION_RECORD_BY_ID: (id: string) => `/flock/production/records/${id}`,
    EGG_PRODUCTION: '/flock/production/eggs',
    PRODUCTION_METRICS: '/flock/production/metrics',
    PRODUCTION_GOALS: '/flock/production/goals',
    PRODUCTION_ALERTS: '/flock/production/alerts',
    PRODUCTION_STATS: '/flock/production/stats',
    PRODUCTION_FORECAST: '/flock/production/forecast',
    CHICKEN_PRODUCTION: (chickenId: string) => `/flock/production/chicken/${chickenId}`,
    PRODUCTION_EXPORT: '/flock/production/export',
    PRODUCTION_IMPORT: '/flock/production/import',
  };

  /**
   * Get all production records with optional filtering and sorting
   */
  static async getProductionRecords(filter?: ProductionFilter, sort?: ProductionSortOptions): Promise<ProductionRecord[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.chickenIds) params.append('chickenIds', filter.chickenIds.join(','));
      if (filter.productionType) params.append('productionType', filter.productionType.join(','));
      if (filter.quality) params.append('quality', filter.quality.join(','));
      if (filter.size) params.append('size', filter.size.join(','));
      if (filter.location) params.append('location', filter.location.join(','));
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
    const endpoint = queryString ? `${this.ENDPOINTS.PRODUCTION_RECORDS}?${queryString}` : this.ENDPOINTS.PRODUCTION_RECORDS;
    
    return apiService.get<ProductionRecord[]>(endpoint);
  }

  /**
   * Get production record by ID
   */
  static async getProductionRecordById(id: string): Promise<ProductionRecord> {
    return apiService.get<ProductionRecord>(this.ENDPOINTS.PRODUCTION_RECORD_BY_ID(id));
  }

  /**
   * Create new production record
   */
  static async createProductionRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): Promise<ProductionRecord> {
    return apiService.post<ProductionRecord>(this.ENDPOINTS.PRODUCTION_RECORDS, record);
  }

  /**
   * Update production record
   */
  static async updateProductionRecord(id: string, record: Partial<ProductionRecord>): Promise<ProductionRecord> {
    return apiService.put<ProductionRecord>(this.ENDPOINTS.PRODUCTION_RECORD_BY_ID(id), record);
  }

  /**
   * Delete production record
   */
  static async deleteProductionRecord(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.PRODUCTION_RECORD_BY_ID(id));
  }

  /**
   * Get egg production data
   */
  static async getEggProduction(chickenId?: string, dateRange?: { start: string; end: string }): Promise<EggProduction[]> {
    const params = new URLSearchParams();
    if (chickenId) params.append('chickenId', chickenId);
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }
    
    return apiService.get<EggProduction[]>(`${this.ENDPOINTS.EGG_PRODUCTION}?${params.toString()}`);
  }

  /**
   * Record egg production
   */
  static async recordEggProduction(production: Omit<EggProduction, 'id'>): Promise<EggProduction> {
    return apiService.post<EggProduction>(this.ENDPOINTS.EGG_PRODUCTION, production);
  }

  /**
   * Get production metrics
   */
  static async getProductionMetrics(chickenId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<ProductionMetrics> {
    return apiService.get<ProductionMetrics>(`${this.ENDPOINTS.PRODUCTION_METRICS}?chickenId=${chickenId}&period=${period}`);
  }

  /**
   * Get production goals
   */
  static async getProductionGoals(chickenId?: string): Promise<ProductionGoal[]> {
    const params = chickenId ? `?chickenId=${chickenId}` : '';
    return apiService.get<ProductionGoal[]>(`${this.ENDPOINTS.PRODUCTION_GOALS}${params}`);
  }

  /**
   * Create production goal
   */
  static async createProductionGoal(goal: Omit<ProductionGoal, 'id' | 'createdAt'>): Promise<ProductionGoal> {
    return apiService.post<ProductionGoal>(this.ENDPOINTS.PRODUCTION_GOALS, goal);
  }

  /**
   * Update production goal
   */
  static async updateProductionGoal(id: string, goal: Partial<ProductionGoal>): Promise<ProductionGoal> {
    return apiService.put<ProductionGoal>(`${this.ENDPOINTS.PRODUCTION_GOALS}/${id}`, goal);
  }

  /**
   * Get production alerts
   */
  static async getProductionAlerts(chickenId?: string): Promise<ProductionAlert[]> {
    const params = chickenId ? `?chickenId=${chickenId}` : '';
    return apiService.get<ProductionAlert[]>(`${this.ENDPOINTS.PRODUCTION_ALERTS}${params}`);
  }

  /**
   * Mark production alert as read
   */
  static async markProductionAlertAsRead(alertId: string): Promise<void> {
    return apiService.put<void>(`${this.ENDPOINTS.PRODUCTION_ALERTS}/${alertId}/read`);
  }

  /**
   * Get production statistics
   */
  static async getProductionStats(): Promise<ProductionStats> {
    return apiService.get<ProductionStats>(this.ENDPOINTS.PRODUCTION_STATS);
  }

  /**
   * Get production forecast
   */
  static async getProductionForecast(chickenId: string, days: number = 30): Promise<ProductionForecast[]> {
    return apiService.get<ProductionForecast[]>(`${this.ENDPOINTS.PRODUCTION_FORECAST}?chickenId=${chickenId}&days=${days}`);
  }

  /**
   * Get complete production profile for a chicken
   */
  static async getChickenProductionProfile(chickenId: string): Promise<{
    records: ProductionRecord[];
    eggProduction: EggProduction[];
    metrics: ProductionMetrics[];
    goals: ProductionGoal[];
    alerts: ProductionAlert[];
    forecast: ProductionForecast[];
  }> {
    return apiService.get<any>(this.ENDPOINTS.CHICKEN_PRODUCTION(chickenId));
  }

  /**
   * Export production records
   */
  static async exportProductionRecords(chickenIds?: string[]): Promise<Blob> {
    const params = chickenIds ? `?chickenIds=${chickenIds.join(',')}` : '';
    const response = await fetch(`${this.ENDPOINTS.PRODUCTION_EXPORT}${params}`);
    return response.blob();
  }

  /**
   * Import production records
   */
  static async importProductionRecords(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(this.ENDPOINTS.PRODUCTION_IMPORT, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
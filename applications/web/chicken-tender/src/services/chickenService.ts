import { apiService } from './api';
import type { Chicken, ChickenStatus } from '../types/chicken';

/**
 * Service for managing chicken-related API calls
 */
export class ChickenService {
  private static readonly ENDPOINTS = {
    CHICKENS: '/chickens',
    CHICKEN_BY_ID: (id: string) => `/chickens/${id}`,
    CHICKEN_STATUS: (id: string) => `/chickens/${id}/status`,
    CHICKEN_HEALTH: (id: string) => `/chickens/${id}/health`,
  };

  /**
   * Get all chickens in the flock
   */
  static async getAllChickens(): Promise<Chicken[]> {
    return apiService.get<Chicken[]>(this.ENDPOINTS.CHICKENS);
  }

  /**
   * Get a specific chicken by ID
   */
  static async getChickenById(id: string): Promise<Chicken> {
    return apiService.get<Chicken>(this.ENDPOINTS.CHICKEN_BY_ID(id));
  }

  /**
   * Update chicken status
   */
  static async updateChickenStatus(id: string, status: ChickenStatus): Promise<Chicken> {
    return apiService.put<Chicken>(this.ENDPOINTS.CHICKEN_STATUS(id), { status });
  }

  /**
   * Update chicken health data
   */
  static async updateChickenHealth(id: string, healthData: Partial<Chicken>): Promise<Chicken> {
    return apiService.put<Chicken>(this.ENDPOINTS.CHICKEN_HEALTH(id), healthData);
  }

  /**
   * Add a new chicken to the flock
   */
  static async addChicken(chickenData: Omit<Chicken, 'id'>): Promise<Chicken> {
    return apiService.post<Chicken>(this.ENDPOINTS.CHICKENS, chickenData);
  }

  /**
   * Remove a chicken from the flock
   */
  static async removeChicken(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.CHICKEN_BY_ID(id));
  }
}
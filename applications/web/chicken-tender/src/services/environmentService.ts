import { apiService } from './api';
import type { EnvironmentData, EnvironmentControls } from '../types/environment';

/**
 * Service for managing coop environment data and controls
 */
export class EnvironmentService {
  private static readonly ENDPOINTS = {
    ENVIRONMENT: '/environment',
    CONTROLS: '/environment/controls',
    TEMPERATURE: '/environment/temperature',
    HUMIDITY: '/environment/humidity',
    LIGHTING: '/environment/lighting',
    VENTILATION: '/environment/ventilation',
    DOOR: '/environment/door',
  };

  /**
   * Get current environment readings
   */
  static async getEnvironmentData(): Promise<EnvironmentData> {
    return apiService.get<EnvironmentData>(this.ENDPOINTS.ENVIRONMENT);
  }

  /**
   * Get current control states
   */
  static async getControls(): Promise<EnvironmentControls> {
    return apiService.get<EnvironmentControls>(this.ENDPOINTS.CONTROLS);
  }

  /**
   * Update lighting controls
   */
  static async updateLighting(enabled: boolean): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.LIGHTING, { enabled });
  }

  /**
   * Update ventilation controls
   */
  static async updateVentilation(enabled: boolean): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.VENTILATION, { enabled });
  }

  /**
   * Update coop door controls
   */
  static async updateDoor(open: boolean): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.DOOR, { open });
  }

  /**
   * Set temperature target
   */
  static async setTemperatureTarget(target: number): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.TEMPERATURE, { target });
  }

  /**
   * Emergency override - turn off all systems
   */
  static async emergencyOverride(): Promise<void> {
    return apiService.post<void>('/environment/emergency-override');
  }
}
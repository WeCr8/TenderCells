import { apiService } from './api';
import type { Alert, AlertType } from '../types/alert';

/**
 * Service for managing alerts and notifications
 */
export class AlertService {
  private static readonly ENDPOINTS = {
    ALERTS: '/alerts',
    ALERT_BY_ID: (id: string) => `/alerts/${id}`,
    MARK_READ: (id: string) => `/alerts/${id}/read`,
    DISMISS: (id: string) => `/alerts/${id}/dismiss`,
  };

  /**
   * Get all active alerts
   */
  static async getAlerts(): Promise<Alert[]> {
    return apiService.get<Alert[]>(this.ENDPOINTS.ALERTS);
  }

  /**
   * Get alerts by type
   */
  static async getAlertsByType(type: AlertType): Promise<Alert[]> {
    return apiService.get<Alert[]>(`${this.ENDPOINTS.ALERTS}?type=${type}`);
  }

  /**
   * Mark alert as read
   */
  static async markAsRead(id: string): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.MARK_READ(id));
  }

  /**
   * Dismiss an alert
   */
  static async dismissAlert(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.DISMISS(id));
  }

  /**
   * Create a new alert
   */
  static async createAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    return apiService.post<Alert>(this.ENDPOINTS.ALERTS, alertData);
  }
}
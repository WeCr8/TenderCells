/**
 * Type definitions for alerts and notifications
 */

export type AlertType = 'warning' | 'info' | 'success' | 'error' | 'critical';

export type AlertCategory = 
  | 'chicken_health' 
  | 'chicken_missing' 
  | 'environment' 
  | 'system' 
  | 'security' 
  | 'maintenance';

export interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isDismissed: boolean;
  actionRequired: boolean;
  actionLabel?: string;
  actionUrl?: string;
  relatedEntityId?: string; // chicken ID, sensor ID, etc.
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
  byType: Record<AlertType, number>;
  byCategory: Record<AlertCategory, number>;
}
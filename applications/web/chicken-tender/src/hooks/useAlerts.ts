import { useState, useEffect } from 'react';
import { AlertService } from '../services/alertService';
import type { Alert, AlertSummary, AlertType } from '../types/alert';

/**
 * Custom hook for managing alerts and notifications
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AlertService.getAlerts();
      setAlerts(data);
      
      // Calculate summary
      const summaryData: AlertSummary = {
        total: data.length,
        unread: data.filter(a => !a.isRead).length,
        critical: data.filter(a => a.severity === 'critical').length,
        byType: data.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {} as Record<AlertType, number>),
        byCategory: data.reduce((acc, alert) => {
          acc[alert.category] = (acc[alert.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await AlertService.markAsRead(id);
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === id ? { ...alert, isRead: true } : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read');
      throw err;
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      await AlertService.dismissAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
      throw err;
    }
  };

  const createAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    try {
      const newAlert = await AlertService.createAlert(alertData);
      setAlerts(prev => [newAlert, ...prev]);
      return newAlert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
      throw err;
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up polling for new alerts
    const interval = setInterval(fetchAlerts, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    summary,
    loading,
    error,
    refetch: fetchAlerts,
    markAsRead,
    dismissAlert,
    createAlert
  };
}
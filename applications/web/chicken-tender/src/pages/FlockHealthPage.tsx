import React from 'react';
import FlockHealthDashboard from '../components/flock/health/FlockHealthDashboard';
import { useFlockHealth } from '../hooks/useFlockHealth';
import type { HealthRecord, HealthAlert } from '../types/flockHealth';

export default function FlockHealthPage() {
  const { 
    records, 
    stats, 
    alerts, 
    metrics,
    loading, 
    createHealthRecord,
    updateHealthRecord,
    markAlertAsRead,
    refreshAll
  } = useFlockHealth();

  const handleAddRecord = () => {
    // Navigate to record creation form or open modal
    console.log('Add health record');
  };

  const handleRecordClick = (record: HealthRecord) => {
    // Navigate to record details or open modal
    console.log('View health record:', record);
  };

  const handleAlertClick = (alert: HealthAlert) => {
    // Mark alert as read and handle navigation
    markAlertAsRead(alert.id);
    console.log('Alert clicked:', alert);
  };

  return (
    <FlockHealthDashboard
      stats={stats || {
        totalRecords: 0,
        activeIssues: 0,
        resolvedIssues: 0,
        vaccinationsThisMonth: 0,
        treatmentsInProgress: 0,
        averageHealthScore: 0,
        healthTrend: 'stable',
        lastUpdated: new Date().toISOString()
      }}
      records={records}
      alerts={alerts}
      metrics={metrics}
      loading={loading}
      onAddRecord={handleAddRecord}
      onRecordClick={handleRecordClick}
      onAlertClick={handleAlertClick}
    />
  );
}
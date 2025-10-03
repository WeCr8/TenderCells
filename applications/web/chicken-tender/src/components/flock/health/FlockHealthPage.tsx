import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FlockHealthDashboard from './FlockHealthDashboard';
import AddHealthRecordButton from './AddHealthRecordButton';
import { useFlockHealth } from '../../../hooks/useFlockHealth';
import type { HealthRecord, HealthAlert } from '../../../types/flockHealth';

export default function FlockHealthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    records, 
    stats, 
    alerts, 
    metrics,
    loading, 
    refreshAll
  } = useFlockHealth();

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-record') {
      // This would open the add health record modal
      // For now, we'll just clear the URL parameter
      navigate('/flock/health', { replace: true });
    }
  }, [location, navigate]);

  const handleAddRecord = () => {
    // This would be handled by the AddHealthRecordButton component
  };

  const handleRecordClick = (record: HealthRecord) => {
    // Navigate to record details or open modal
    console.log('View health record:', record);
  };

  const handleAlertClick = (alert: HealthAlert) => {
    // Mark alert as read and handle navigation
    console.log('Alert clicked:', alert);
  };

  return (
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flock Health Records</h1>
          <p className="text-gray-600">Monitor and manage health records for your flock</p>
        </div>
        <AddHealthRecordButton onSuccess={refreshAll} />
      </div>
      
      <FlockHealthDashboard
        stats={stats || {
          totalRecords: records.length,
          activeIssues: records.filter(r => r.status === 'active').length,
          resolvedIssues: records.filter(r => r.status === 'resolved').length,
          vaccinationsThisMonth: records.filter(r => r.recordType === 'vaccination' && new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          treatmentsInProgress: records.filter(r => r.recordType === 'treatment' && r.status === 'ongoing').length,
          averageHealthScore: 85,
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
    </>
  );
}
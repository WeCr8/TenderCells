import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FlockProductionDashboard from './FlockProductionDashboard';
import AddProductionRecordButton from './AddProductionRecordButton';
import AddProductionGoalButton from './AddProductionGoalButton';
import { useFlockProduction } from '../../../hooks/useFlockProduction';
import type { ProductionRecord, ProductionGoal } from '../../../types/flockProduction';

export default function FlockProductionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    records, 
    stats, 
    goals,
    alerts,
    loading, 
    refreshAll
  } = useFlockProduction();

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-record' || action === 'add-goal') {
      // This would open the appropriate modal
      // For now, we'll just clear the URL parameter
      navigate('/flock/production', { replace: true });
    }
  }, [location, navigate]);

  const handleRecordClick = (record: ProductionRecord) => {
    // Navigate to record details or open modal
    console.log('View production record:', record);
  };

  const handleGoalClick = (goal: ProductionGoal) => {
    // Navigate to goal details or open modal
    console.log('View production goal:', goal);
  };

  return (
    <>
      {/* Custom header with add buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-600">Track and analyze flock production performance</p>
        </div>
        <div className="flex space-x-3">
          <AddProductionGoalButton onSuccess={refreshAll} />
          <AddProductionRecordButton onSuccess={refreshAll} />
        </div>
      </div>
      
      <FlockProductionDashboard
        stats={stats || {
          totalEggsToday: records.filter(r => r.date === new Date().toISOString().split('T')[0]).reduce((sum, r) => sum + r.quantity, 0),
          totalEggsThisWeek: records.filter(r => new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum, r) => sum + r.quantity, 0),
          totalEggsThisMonth: records.filter(r => new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).reduce((sum, r) => sum + r.quantity, 0),
          averageDailyProduction: records.length > 0 ? records.reduce((sum, r) => sum + r.quantity, 0) / 30 : 0,
          productionRate: 75,
          qualityDistribution: { AA: 30, A: 45, B: 20, C: 5, reject: 0 },
          topProducers: [],
          productionTrend: 'stable',
          lastUpdated: new Date().toISOString()
        }}
        records={records}
        goals={goals}
        alerts={alerts}
        loading={loading}
        onRecordClick={handleRecordClick}
        onGoalClick={handleGoalClick}
      />
    </>
  );
}
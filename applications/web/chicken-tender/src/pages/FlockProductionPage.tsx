import React from 'react';
import FlockProductionDashboard from '../components/flock/production/FlockProductionDashboard';
import { useFlockProduction } from '../hooks/useFlockProduction';
import type { ProductionRecord, ProductionGoal } from '../types/flockProduction';

export default function FlockProductionPage() {
  const { 
    records, 
    stats, 
    goals,
    alerts,
    loading, 
    createProductionRecord,
    updateProductionRecord,
    createProductionGoal,
    markProductionAlertAsRead,
    refreshAll
  } = useFlockProduction();

  const handleAddRecord = () => {
    // Navigate to record creation form or open modal
    console.log('Add production record');
  };

  const handleAddGoal = () => {
    // Navigate to goal creation form or open modal
    console.log('Add production goal');
  };

  const handleRecordClick = (record: ProductionRecord) => {
    // Navigate to record details or open modal
    console.log('View production record:', record);
  };

  const handleGoalClick = (goal: ProductionGoal) => {
    // Navigate to goal details or open modal
    console.log('View production goal:', goal);
  };

  return (
    <FlockProductionDashboard
      stats={stats || {
        totalEggsToday: 0,
        totalEggsThisWeek: 0,
        totalEggsThisMonth: 0,
        averageDailyProduction: 0,
        productionRate: 0,
        qualityDistribution: { AA: 0, A: 0, B: 0, C: 0, reject: 0 },
        topProducers: [],
        productionTrend: 'stable',
        lastUpdated: new Date().toISOString()
      }}
      records={records}
      goals={goals}
      alerts={alerts}
      loading={loading}
      onAddRecord={handleAddRecord}
      onAddGoal={handleAddGoal}
      onRecordClick={handleRecordClick}
      onGoalClick={handleGoalClick}
    />
  );
}
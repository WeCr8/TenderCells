import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SchedulesDashboard from './schedules/SchedulesDashboard';
import AddScheduleButton from './AddScheduleButton';
import { useAutomationSchedules } from '../../hooks/useAutomationSchedules';
import type { Schedule } from '../../types/automationSchedules';

export default function AutomationSchedulesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    schedules, 
    stats, 
    executions,
    loading, 
    toggleSchedule,
    executeSchedule,
    refreshAll
  } = useAutomationSchedules();

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-schedule') {
      // This would open the add schedule modal
      // For now, we'll just clear the URL parameter
      navigate('/automation/schedules', { replace: true });
    }
  }, [location, navigate]);

  const handleToggleSchedule = (scheduleId: string) => {
    toggleSchedule(scheduleId);
  };

  const handleExecuteSchedule = (scheduleId: string) => {
    executeSchedule(scheduleId);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    // Navigate to schedule edit form or open modal
    console.log('Edit schedule:', schedule);
  };

  const handleViewSchedule = (schedule: Schedule) => {
    console.log('View schedule:', schedule);
  };

  return (
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600">Manage and monitor your automation schedules</p>
        </div>
        <AddScheduleButton onSuccess={refreshAll} />
      </div>
      
      <SchedulesDashboard
        schedules={schedules}
        stats={stats || {
          totalSchedules: schedules.length,
          activeSchedules: schedules.filter(s => s.status === 'active').length,
          pausedSchedules: schedules.filter(s => s.status === 'paused').length,
          completedSchedules: schedules.filter(s => s.status === 'completed').length,
          errorSchedules: schedules.filter(s => s.status === 'error').length,
          executionsToday: 0,
          executionsThisWeek: 0,
          successRate: 0,
          upcomingExecutions: [],
          lastUpdated: new Date().toISOString()
        }}
        executions={executions}
        loading={loading}
        onToggleSchedule={handleToggleSchedule}
        onExecuteSchedule={handleExecuteSchedule}
        onEditSchedule={handleEditSchedule}
        onViewSchedule={handleViewSchedule}
        onRefresh={refreshAll}
      />
    </>
  );
}
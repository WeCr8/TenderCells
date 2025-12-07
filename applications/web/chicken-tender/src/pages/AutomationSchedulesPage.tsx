import React, { useState } from 'react';
import SchedulesDashboard from '../components/automation/schedules/SchedulesDashboard';
import { useAutomationSchedules } from '../hooks/useAutomationSchedules';
import type { Schedule } from '../types/automationSchedules';

export default function AutomationSchedulesPage() {
  const { 
    schedules, 
    stats, 
    executions,
    loading, 
    toggleSchedule,
    executeSchedule,
    refreshAll
  } = useAutomationSchedules();

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const handleAddSchedule = () => {
    // Navigate to schedule creation form or open modal
    console.log('Add schedule');
  };

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
    setSelectedSchedule(schedule);
    console.log('View schedule:', schedule);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <SchedulesDashboard
        schedules={schedules}
        stats={stats || {
          totalSchedules: 0,
          activeSchedules: 0,
          pausedSchedules: 0,
          completedSchedules: 0,
          errorSchedules: 0,
          executionsToday: 0,
          executionsThisWeek: 0,
          successRate: 0,
          upcomingExecutions: [],
          lastUpdated: new Date().toISOString()
        }}
        executions={executions}
        loading={loading}
        onAddSchedule={handleAddSchedule}
        onRefresh={refreshAll}
        onToggleSchedule={handleToggleSchedule}
        onExecuteSchedule={handleExecuteSchedule}
        onEditSchedule={handleEditSchedule}
        onViewSchedule={handleViewSchedule}
      />
    </div>
  );
}
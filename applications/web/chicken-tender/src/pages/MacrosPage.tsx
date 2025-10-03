import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MacroDashboard from '../components/macros/MacroDashboard';
import { useMacros } from '../hooks/useMacros';
import { predefinedMacros } from '../components/macros/AddRecordMacro';
import { predefinedConfigMacros } from '../components/macros/ConfigurationMacro';

export default function MacrosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    macros: apiMacros, 
    tasks, 
    records, 
    stats,
    loading,
    executeMacro,
    createTask,
    updateTask,
    cancelTask,
    deleteTask,
    refreshAll
  } = useMacros();

  // Combine API macros with predefined macros - ensure apiMacros is always an array
  const macros = [...(Array.isArray(apiMacros) ? apiMacros : []), ...predefinedMacros, ...predefinedConfigMacros];

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    if (tab) {
      // This would switch to the specified tab
      // For now, we'll just clear the URL parameter
      navigate('/macros', { replace: true });
    }
  }, [location, navigate]);

  const handleExecuteMacro = async (macroId: string, parameters: Record<string, any>) => {
    try {
      await executeMacro(macroId, parameters);
    } catch (error) {
      console.error('Failed to execute macro:', error);
      // Handle error (e.g., show notification)
    }
  };

  const handleScheduleMacro = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    try {
      await createTask(macroId, parameters, schedule);
    } catch (error) {
      console.error('Failed to schedule macro:', error);
      // Handle error
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await executeMacro(task.macroId, task.parameters);
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      // Handle error
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
    } catch (error) {
      console.error('Failed to cancel task:', error);
      // Handle error
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Handle error
    }
  };

  return (
    <MacroDashboard
      macros={macros}
      tasks={tasks || []}
      records={records || []}
      stats={stats || {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        mostUsedMacros: [],
        recentExecutions: []
      }}
      onExecuteMacro={handleExecuteMacro}
      onScheduleMacro={handleScheduleMacro}
      onExecuteTask={handleExecuteTask}
      onCancelTask={handleCancelTask}
      onDeleteTask={handleDeleteTask}
      onRefresh={refreshAll}
      loading={loading}
    />
  );
}
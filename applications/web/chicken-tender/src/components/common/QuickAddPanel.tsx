import React, { useState } from 'react';
import { Egg, Stethoscope, Zap, FileText, Target, Calendar, Cpu, Droplets, Lightbulb } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useNavigate } from 'react-router-dom';
import { useMacros } from '../../hooks/useMacros';
import AddFunctionModal from './AddFunctionModal';
import type { MacroFunction } from '../../types/macros';
import { predefinedMacros } from '../macros/AddRecordMacro';

interface QuickAddPanelProps {
  className?: string;
}

export default function QuickAddPanel({ className = '' }: QuickAddPanelProps) {
  const navigate = useNavigate();
  const { executeMacro, createTask } = useMacros();
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Define quick actions
  const quickActions = [
    {
      id: 'add-chicken',
      label: 'Add Chicken',
      icon: <Egg className="w-4 h-4" />,
      onClick: () => navigate('/flock?action=add-chicken')
    },
    {
      id: 'add-health-record',
      label: 'Health Record',
      icon: <Stethoscope className="w-4 h-4" />,
      onClick: () => navigate('/flock/health?action=add-record')
    },
    {
      id: 'add-production',
      label: 'Record Eggs',
      icon: <Egg className="w-4 h-4" />,
      onClick: () => navigate('/flock/production?action=add-record')
    },
    {
      id: 'feeding-task',
      label: 'Record Feeding',
      icon: <Zap className="w-4 h-4" />,
      onClick: () => handleQuickFunction('feeding-task')
    },
    {
      id: 'water-refill',
      label: 'Water Refill',
      icon: <Droplets className="w-4 h-4" />,
      onClick: () => handleQuickFunction('water-refill')
    },
    {
      id: 'toggle-lights',
      label: 'Toggle Lights',
      icon: <Lightbulb className="w-4 h-4" />,
      onClick: () => handleQuickFunction('environment-config')
    }
  ];

  // Function to handle quick function execution
  const handleQuickFunction = (macroId: string) => {
    const macro = predefinedMacros.find(m => m.id === macroId);
    if (macro) {
      setSelectedMacro(macro);
      setIsModalOpen(true);
    } else {
      executeQuickTask(macroId);
    }
  };

  // Function to execute a quick task with default parameters
  const executeQuickTask = async (taskId: string) => {
    if (isExecuting) return;
    
    try {
      setIsExecuting(true);
      // For simplicity, we're executing with default parameters
      await executeMacro(taskId, {});
      alert('Task executed successfully!');
    } catch (error) {
      console.error('Error executing task:', error);
      alert('Failed to execute task. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMacro(null);
  };

  const handleExecuteMacro = async (macroId: string, parameters: Record<string, any>) => {
    setIsExecuting(true);
    try {
      await executeMacro(macroId, parameters);
      alert('Function executed successfully!');
    } catch (error) {
      console.error('Failed to execute function:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleScheduleMacro = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    setIsExecuting(true);
    try {
      await createTask(macroId, parameters, schedule);
      alert('Function scheduled successfully!');
    } catch (error) {
      console.error('Failed to schedule function:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map(action => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
              className="justify-start"
              disabled={isExecuting}
            >
              {action.label}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/macros')}
            className="w-full text-farm-600 hover:text-farm-700"
          >
            View All Functions
          </Button>
        </div>
      </div>

      {/* Function Execution Modal */}
      <AddFunctionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        macro={selectedMacro}
        onExecute={handleExecuteMacro}
        onSchedule={handleScheduleMacro}
      />
    </>
  );
}
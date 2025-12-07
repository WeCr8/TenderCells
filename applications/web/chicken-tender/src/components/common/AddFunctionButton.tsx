import React, { useState } from 'react';
import { Plus, Egg, Stethoscope, Zap, FileText, Target, Calendar, Cpu, Droplets, Lightbulb } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useNavigate } from 'react-router-dom';
import { useMacros } from '../../hooks/useMacros';
import AddFunctionModal from './AddFunctionModal';
import FunctionSelector from './FunctionSelector';
import type { MacroFunction } from '../../types/macros';

interface AddFunctionButtonProps {
  className?: string;
}

export default function AddFunctionButton({ className = '' }: AddFunctionButtonProps) {
  const navigate = useNavigate();
  const { macros, executeMacro, createTask } = useMacros();
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Define common functions that can be added
  const quickActions = [
    {
      id: 'add-chicken',
      label: 'Add Chicken',
      icon: <Egg className="w-4 h-4" />,
      onClick: () => navigate('/app/flock?action=add-chicken')
    },
    {
      id: 'add-health-record',
      label: 'Add Health Record',
      icon: <Stethoscope className="w-4 h-4" />,
      onClick: () => navigate('/app/flock/health?action=add-record')
    },
    {
      id: 'add-production-record',
      label: 'Add Production Record',
      icon: <Egg className="w-4 h-4" />,
      onClick: () => navigate('/app/flock/production?action=add-record')
    },
    {
      id: 'add-rule',
      label: 'Add Automation Rule',
      icon: <Zap className="w-4 h-4" />,
      onClick: () => navigate('/app/automation?action=add-rule')
    },
    {
      id: 'add-schedule',
      label: 'Add Schedule',
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => navigate('/app/automation/schedules?action=add-schedule')
    },
    {
      id: 'add-device',
      label: 'Add Device',
      icon: <Cpu className="w-4 h-4" />,
      onClick: () => navigate('/app/automation/devices?action=add-device')
    },
    {
      id: 'create-report',
      label: 'Create Report',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => navigate('/app/analytics/reports?action=create-report')
    },
    {
      id: 'add-goal',
      label: 'Add Production Goal',
      icon: <Target className="w-4 h-4" />,
      onClick: () => navigate('/app/flock/production?action=add-goal')
    },
    {
      id: 'view-all-functions',
      label: 'View All Functions',
      icon: <Zap className="w-4 h-4" />,
      onClick: () => navigate('/app/macros')
    }
  ];

  const handleOpenSelector = () => {
    setSelectorOpen(true);
  };

  const handleCloseSelector = () => {
    setSelectorOpen(false);
  };

  const handleSelectMacro = (macro: MacroFunction) => {
    setSelectedMacro(macro);
    setSelectorOpen(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMacro(null);
  };

  const handleExecuteMacro = async (macroId: string, parameters: Record<string, any>) => {
    setIsExecuting(true);
    try {
      await executeMacro(macroId, parameters);
    } catch (error) {
      console.error('Failed to execute macro:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleScheduleMacro = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    setIsExecuting(true);
    try {
      await createTask(macroId, parameters, schedule);
    } catch (error) {
      console.error('Failed to schedule macro:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  // Function to execute a quick macro
  const executeQuickMacro = async (macroId: string) => {
    if (isExecuting) return;
    
    try {
      setIsExecuting(true);
      const macro = macros.find(m => m.id === macroId);
      if (!macro) throw new Error('Macro not found');
      
      // For simplicity, we're executing with default parameters
      // In a real app, you might want to prompt for parameters
      const defaultParams: Record<string, any> = {};
      macro.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          defaultParams[param.id] = param.defaultValue;
        }
      });
      
      await executeMacro(macroId, defaultParams);
      
      // Show success notification
      alert(`${macro.name} executed successfully!`);
    } catch (error) {
      console.error('Error executing macro:', error);
      alert('Failed to execute function. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={handleOpenSelector}
        className={className}
        disabled={isExecuting}
      >
        {isExecuting ? 'Executing...' : 'Add'}
      </Button>

      {/* Function Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-farm-100 rounded-lg">
                  <Zap className="w-5 h-5 text-farm-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Select Function</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="w-5 h-5" />}
                onClick={handleCloseSelector}
              />
            </div>
            
            {/* Quick Actions */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {quickActions.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    icon={action.icon}
                    onClick={() => {
                      action.onClick();
                      handleCloseSelector();
                    }}
                    className="justify-start"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* All Functions */}
            <div className="p-6">
              <FunctionSelector
                macros={macros}
                onSelectMacro={handleSelectMacro}
              />
            </div>
          </div>
        </div>
      )}

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
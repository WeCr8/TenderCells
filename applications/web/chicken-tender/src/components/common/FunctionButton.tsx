import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddFunctionModal from './AddFunctionModal';
import FunctionSelector from './FunctionSelector';
import { useMacros } from '../../hooks/useMacros';
import type { MacroFunction } from '../../types/macros';

interface FunctionButtonProps {
  label?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  macroId?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function FunctionButton({
  label = 'Add Function',
  icon = <Plus className="w-4 h-4" />,
  variant = 'primary',
  size = 'md',
  macroId,
  onSuccess,
  className = ''
}: FunctionButtonProps) {
  const { macros, executeMacro, createTask, validateMacroParameters } = useMacros();
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);

  // If macroId is provided, find the macro
  const directMacro = macroId ? macros.find(m => m.id === macroId) : null;

  const handleOpenSelector = () => {
    // If macroId is provided, open the modal directly
    if (directMacro) {
      setSelectedMacro(directMacro);
      setModalOpen(true);
    } else {
      setSelectorOpen(true);
    }
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
    try {
      await executeMacro(macroId, parameters);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to execute macro:', error);
      throw error;
    }
  };

  const handleScheduleMacro = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    try {
      await createTask(macroId, parameters, schedule);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to schedule macro:', error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        onClick={handleOpenSelector}
        className={className}
      >
        {label}
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
        validateParameters={(macroId, params) => validateMacroParameters(macroId, params)}
      />
    </>
  );
}
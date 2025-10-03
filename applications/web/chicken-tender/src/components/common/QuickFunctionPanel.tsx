import React, { useState } from 'react';
import { Zap, Plus, Calendar, History } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddFunctionModal from './AddFunctionModal';
import { useMacros } from '../../hooks/useMacros';
import type { MacroFunction } from '../../types/macros';

interface QuickFunctionPanelProps {
  title?: string;
  maxItems?: number;
  showCategories?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export default function QuickFunctionPanel({
  title = 'Quick Functions',
  maxItems = 6,
  showCategories = true,
  onViewAll,
  className = ''
}: QuickFunctionPanelProps) {
  const { macros, executeMacro, createTask } = useMacros();
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get the most commonly used or featured macros
  const featuredMacros = macros
    .filter(macro => macro.tags.includes('featured') || macro.tags.includes('quick'))
    .slice(0, maxItems);

  // If we don't have enough featured macros, add some regular ones
  const displayMacros = featuredMacros.length >= maxItems
    ? featuredMacros
    : [...featuredMacros, ...macros.filter(macro => 
        !featuredMacros.some(fm => fm.id === macro.id)
      ).slice(0, maxItems - featuredMacros.length)];

  // Group macros by category if needed
  const groupedMacros: Record<string, MacroFunction[]> = {};
  
  if (showCategories) {
    displayMacros.forEach(macro => {
      if (!groupedMacros[macro.category]) {
        groupedMacros[macro.category] = [];
      }
      groupedMacros[macro.category].push(macro);
    });
  }

  const handleExecute = (macro: MacroFunction) => {
    setSelectedMacro(macro);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMacro(null);
  };

  const handleExecuteSubmit = async (macroId: string, parameters: Record<string, any>) => {
    try {
      await executeMacro(macroId, parameters);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to execute macro:', error);
      throw error;
    }
  };

  const handleScheduleSubmit = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    try {
      await createTask(macroId, parameters, schedule);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to schedule macro:', error);
      throw error;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
          >
            View All
          </Button>
        )}
      </div>

      {displayMacros.length === 0 ? (
        <div className="text-center py-6">
          <Zap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No functions available</p>
        </div>
      ) : showCategories ? (
        <div className="space-y-4">
          {Object.entries(groupedMacros).map(([category, macros]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {macros.map(macro => (
                  <Button
                    key={macro.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecute(macro)}
                    className="justify-start"
                  >
                    {macro.icon ? (
                      <span className="mr-2">{macro.icon}</span>
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {macro.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {displayMacros.map(macro => (
            <Button
              key={macro.id}
              variant="outline"
              size="sm"
              onClick={() => handleExecute(macro)}
              className="justify-start"
            >
              {macro.icon ? (
                <span className="mr-2">{macro.icon}</span>
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {macro.name}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<Calendar className="w-4 h-4" />}
          onClick={() => window.location.href = '/macros?tab=tasks'}
          className="text-farm-600 hover:text-farm-700"
        >
          Scheduled Tasks
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<History className="w-4 h-4" />}
          onClick={() => window.location.href = '/macros?tab=history'}
          className="text-farm-600 hover:text-farm-700"
        >
          History
        </Button>
      </div>

      {/* Function Execution Modal */}
      <AddFunctionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        macro={selectedMacro}
        onExecute={handleExecuteSubmit}
        onSchedule={handleScheduleSubmit}
      />
    </div>
  );
}
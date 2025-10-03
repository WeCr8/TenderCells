import React, { useState } from 'react';
import { Search, Filter, Plus, Zap } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import MacroCard from './MacroCard';
import MacroExecuteForm from './MacroExecuteForm';
import type { MacroFunction, MacroFilter } from '../../types/macros';

interface MacroListProps {
  macros: MacroFunction[];
  onExecuteMacro: (macroId: string, parameters: Record<string, any>) => Promise<void>;
  onScheduleMacro: (macroId: string, parameters: Record<string, any>, schedule: any) => Promise<void>;
  onFilterChange?: (filter: MacroFilter) => void;
  loading?: boolean;
  className?: string;
}

export default function MacroList({
  macros,
  onExecuteMacro,
  onScheduleMacro,
  onFilterChange,
  loading = false,
  className = ''
}: MacroListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (onFilterChange) {
      onFilterChange({ search: term });
    }
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
    if (onFilterChange) {
      onFilterChange({
        types: type ? [type as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  const handleExecute = (macro: MacroFunction) => {
    setSelectedMacro(macro);
    setIsExecuteModalOpen(true);
  };

  const handleSchedule = (macro: MacroFunction) => {
    setSelectedMacro(macro);
    setIsExecuteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsExecuteModalOpen(false);
    setSelectedMacro(null);
  };

  const handleExecuteSubmit = async (parameters: Record<string, any>) => {
    if (!selectedMacro) return;
    await onExecuteMacro(selectedMacro.id, parameters);
    handleCloseModal();
  };

  const handleScheduleSubmit = async (parameters: Record<string, any>, schedule: any) => {
    if (!selectedMacro) return;
    await onScheduleMacro(selectedMacro.id, parameters, schedule);
    handleCloseModal();
  };

  // Get unique macro types
  const macroTypes = Array.from(new Set(macros.map(macro => macro.type)));

  // Filter macros based on search and type
  const filteredMacros = macros.filter(macro => {
    const matchesSearch = searchTerm === '' || 
      macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === null || macro.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search macros..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={selectedType || ''}
            onChange={(e) => handleTypeFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {macroTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        
        <Button
          variant="outline"
          icon={<Filter className="w-4 h-4" />}
          size="sm"
        >
          More Filters
        </Button>
      </div>

      {/* Macro Grid */}
      {filteredMacros.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No macros found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType
              ? 'Try adjusting your search or filters'
              : 'No macros are available for this section'
            }
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Create Custom Macro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMacros.map((macro) => (
            <MacroCard
              key={macro.id}
              macro={macro}
              onExecute={() => handleExecute(macro)}
              onSchedule={() => handleSchedule(macro)}
            />
          ))}
        </div>
      )}

      {/* Execute Modal */}
      {isExecuteModalOpen && selectedMacro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <MacroExecuteForm
              macro={selectedMacro}
              onExecute={handleExecuteSubmit}
              onSchedule={handleScheduleSubmit}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
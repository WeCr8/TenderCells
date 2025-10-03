import React, { useState } from 'react';
import { Search, Filter, Plus, Zap, Calendar, History } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddFunctionModal from './AddFunctionModal';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroFunction, MacroTask, MacroRecord, MacroFilter } from '../../types/macros';

interface FunctionListProps {
  macros: MacroFunction[];
  tasks: MacroTask[];
  records: MacroRecord[];
  onExecuteMacro: (macroId: string, parameters: Record<string, any>) => Promise<void>;
  onScheduleMacro: (macroId: string, parameters: Record<string, any>, schedule: any) => Promise<void>;
  onFilterChange?: (filter: MacroFilter) => void;
  onCreateMacro?: () => void;
  loading?: boolean;
  className?: string;
}

export default function FunctionList({
  macros,
  tasks,
  records,
  onExecuteMacro,
  onScheduleMacro,
  onFilterChange,
  onCreateMacro,
  loading = false,
  className = ''
}: FunctionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'functions' | 'scheduled' | 'history'>('functions');
  const [selectedMacro, setSelectedMacro] = useState<MacroFunction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMacro(null);
  };

  const handleExecuteSubmit = async (macroId: string, parameters: Record<string, any>) => {
    await onExecuteMacro(macroId, parameters);
    handleCloseModal();
  };

  const handleScheduleSubmit = async (macroId: string, parameters: Record<string, any>, schedule: any) => {
    await onScheduleMacro(macroId, parameters, schedule);
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

  // Group macros by category
  const groupedMacros: Record<string, MacroFunction[]> = {};
  
  filteredMacros.forEach(macro => {
    if (!groupedMacros[macro.category]) {
      groupedMacros[macro.category] = [];
    }
    groupedMacros[macro.category].push(macro);
  });

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    return searchTerm === '' || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter records based on search
  const filteredRecords = records.filter(record => {
    return searchTerm === '' || 
      record.name.toLowerCase().includes(searchTerm.toLowerCase());
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
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'functions'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Available Functions</span>
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scheduled'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scheduled Tasks</span>
            {tasks.filter(t => t.status === 'running').length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {tasks.filter(t => t.status === 'running').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-farm-500 text-farm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Execution History</span>
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          {activeTab === 'functions' && (
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
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            More Filters
          </Button>
          
          {activeTab === 'functions' && onCreateMacro && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateMacro}
            >
              Create Function
            </Button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'functions' && (
        <div className="space-y-8">
          {Object.keys(groupedMacros).length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No functions found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'No functions are available'
                }
              </p>
              {onCreateMacro && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onCreateMacro}
                >
                  Create Function
                </Button>
              )}
            </div>
          ) : (
            Object.entries(groupedMacros).map(([category, categoryMacros]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryMacros.map(macro => {
                    const typeColors = MacroUtils.getMacroTypeColor(macro.type);
                    
                    return (
                      <div
                        key={macro.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-farm-300 hover:shadow-sm cursor-pointer transition-all"
                        onClick={() => handleExecute(macro)}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${typeColors.bg}`}>
                            {macro.icon ? (
                              <span className="text-lg">{macro.icon}</span>
                            ) : (
                              <Zap className={`w-4 h-4 ${typeColors.text}`} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{macro.name}</h4>
                            <p className="text-xs text-gray-500">{macro.type}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{macro.description}</p>
                        {macro.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {macro.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {macro.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{macro.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No scheduled tasks found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Schedule a function to automate your farm tasks'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => {
                const statusColors = MacroUtils.getMacroStatusColor(task.status);
                
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-farm-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {task.schedule?.nextExecution 
                          ? `Next: ${new Date(task.schedule.nextExecution).toLocaleString()}`
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                      >
                        Run Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No execution history found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Execute a function to see its history here'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map(record => {
                const statusColors = {
                  success: 'bg-emerald-100 text-emerald-800',
                  partial: 'bg-amber-100 text-amber-800',
                  failed: 'bg-red-100 text-red-800'
                };
                
                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-farm-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{record.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[record.status]}`}>
                        {record.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{record.type}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Duration: {MacroUtils.formatExecutionTime(record.duration)}</span>
                      <span>{new Date(record.executedAt).toLocaleString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      fullWidth
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
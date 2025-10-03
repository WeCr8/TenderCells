import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import MacroTaskCard from './MacroTaskCard';
import type { MacroTask, MacroFilter } from '../../types/macros';

interface MacroTaskListProps {
  tasks: MacroTask[];
  onExecuteTask: (taskId: string) => Promise<void>;
  onCancelTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditTask?: (task: MacroTask) => void;
  onFilterChange?: (filter: MacroFilter) => void;
  loading?: boolean;
  className?: string;
}

export default function MacroTaskList({
  tasks,
  onExecuteTask,
  onCancelTask,
  onDeleteTask,
  onEditTask,
  onFilterChange,
  loading = false,
  className = ''
}: MacroTaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (onFilterChange) {
      onFilterChange({ search: term });
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    if (onFilterChange) {
      onFilterChange({
        status: status ? [status as any] : undefined,
        search: searchTerm || undefined
      });
    }
  };

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === null || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group tasks by next execution date
  const groupedTasks: Record<string, MacroTask[]> = {};
  
  filteredTasks.forEach(task => {
    let group = 'No Schedule';
    
    if (task.schedule?.nextExecution) {
      const nextExecution = new Date(task.schedule.nextExecution);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      if (nextExecution < tomorrow) {
        group = 'Today';
      } else if (nextExecution < new Date(tomorrow.getTime() + 86400000)) {
        group = 'Tomorrow';
      } else if (nextExecution < nextWeek) {
        group = 'This Week';
      } else {
        group = 'Later';
      }
    }
    
    if (!groupedTasks[group]) {
      groupedTasks[group] = [];
    }
    
    groupedTasks[group].push(task);
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
              placeholder="Search scheduled tasks..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={statusFilter || ''}
            onChange={(e) => handleStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
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

      {/* Task Groups */}
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No scheduled tasks found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Schedule a macro to automate your farm tasks'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {['Today', 'Tomorrow', 'This Week', 'Later', 'No Schedule'].map(group => {
            if (!groupedTasks[group] || groupedTasks[group].length === 0) return null;
            
            return (
              <div key={group}>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">{group}</h3>
                  <span className="text-sm text-gray-500">({groupedTasks[group].length})</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedTasks[group].map((task) => (
                    <MacroTaskCard
                      key={task.id}
                      task={task}
                      onExecute={() => onExecuteTask(task.id)}
                      onCancel={() => onCancelTask(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                      onEdit={() => onEditTask?.(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
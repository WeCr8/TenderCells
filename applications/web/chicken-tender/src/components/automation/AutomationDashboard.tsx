import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Filter,
  Search,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AutomationStatsCard from './AutomationStatsCard';
import AutomationRuleCard from './AutomationRuleCard';
import type { AutomationStats, AutomationRule } from '../../types/automation';

interface AutomationDashboardProps {
  stats: AutomationStats;
  rules: AutomationRule[];
  loading?: boolean;
  onAddRule?: () => void;
  onRuleClick?: (rule: AutomationRule) => void;
  onToggleRule?: (ruleId: string, enabled: boolean) => void;
}

export default function AutomationDashboard({
  stats,
  rules,
  loading = false,
  onAddRule,
  onRuleClick,
  onToggleRule
}: AutomationDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter;
    const matchesType = typeFilter === 'all' || rule.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Center</h1>
          <p className="text-gray-600">Manage automated tasks and schedules for your farm</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<Settings className="w-4 h-4" />}
            size="sm"
          >
            Settings
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddRule}
          >
            Add Rule
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AutomationStatsCard
          title="Total Rules"
          value={stats.totalRules}
          icon={Zap}
          status="good"
        />
        <AutomationStatsCard
          title="Active Rules"
          value={stats.activeRules}
          icon={Play}
          trend={{ value: 2, label: "this week" }}
          status="good"
        />
        <AutomationStatsCard
          title="Success Rate"
          value={`${Math.round(stats.successRate)}%`}
          icon={CheckCircle}
          status={stats.successRate >= 95 ? "good" : stats.successRate >= 85 ? "warning" : "danger"}
        />
        <AutomationStatsCard
          title="Upcoming Tasks"
          value={stats.upcomingTasks}
          icon={Clock}
          status="good"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search automation rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="feeding">Feeding</option>
            <option value="lighting">Lighting</option>
            <option value="temperature">Temperature</option>
            <option value="door">Door Control</option>
            <option value="cleaning">Cleaning</option>
            <option value="health_check">Health Check</option>
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

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRules.map((rule) => (
          <AutomationRuleCard
            key={rule.id}
            rule={rule}
            onClick={() => onRuleClick?.(rule)}
            onToggle={(enabled) => onToggleRule?.(rule.id, enabled)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRules.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No automation rules found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first automation rule'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onAddRule}
            >
              Create First Rule
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
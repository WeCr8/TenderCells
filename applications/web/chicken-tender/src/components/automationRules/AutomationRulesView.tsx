import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Play,
  Pause,
  Settings,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AutomationRuleCard from './AutomationRuleCard';
import AutomationRulePreview from './AutomationRulePreview';
import RuleStatsOverview from './RuleStatsOverview';
import RuleFilterPanel from './RuleFilterPanel';
import { AutomationRulesService } from '../../services/automationRulesService';
import { AutomationRulesUtils } from '../../utils/automationRulesUtils';
import type { 
  AutomationRule, 
  AutomationStats, 
  RuleFilter, 
  RuleSortOptions,
  RuleCategory,
  RuleStatus 
} from '../../types/automationRules';

interface AutomationRulesViewProps {
  onCreateRule?: () => void;
  onEditRule?: (rule: AutomationRule) => void;
  onViewRule?: (rule: AutomationRule) => void;
  className?: string;
}

export default function AutomationRulesView({
  onCreateRule,
  onEditRule,
  onViewRule,
  className = ''
}: AutomationRulesViewProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<RuleFilter>({});
  const [sortOptions, setSortOptions] = useState<RuleSortOptions>({
    field: 'name',
    direction: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadRules();
    loadStats();
  }, [activeFilters, sortOptions]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter = {
        ...activeFilters,
        search: searchTerm || undefined
      };
      
      const rulesData = await AutomationRulesService.getRules(filter, sortOptions);
      setRules(rulesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AutomationRulesService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadRules();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (filters: RuleFilter) => {
    setActiveFilters(filters);
  };

  const handleSortChange = (sort: RuleSortOptions) => {
    setSortOptions(sort);
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const updatedRule = await AutomationRulesService.toggleRule(ruleId);
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? updatedRule : rule
      ));
      loadStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    try {
      await AutomationRulesService.executeRule(ruleId);
      loadStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to execute rule:', err);
    }
  };

  const handleDuplicateRule = async (ruleId: string) => {
    try {
      const duplicatedRule = await AutomationRulesService.duplicateRule(ruleId);
      setRules(prev => [duplicatedRule, ...prev]);
      loadStats();
    } catch (err) {
      console.error('Failed to duplicate rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await AutomationRulesService.deleteRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      if (selectedRule?.id === ruleId) {
        setSelectedRule(null);
      }
      loadStats();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleExportRules = async () => {
    try {
      const selectedRuleIds = rules.map(rule => rule.id);
      const blob = await AutomationRulesService.exportRules(selectedRuleIds);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-rules-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export rules:', err);
    }
  };

  const handleImportRules = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await AutomationRulesService.importRules(file);
      if (result.errors.length > 0) {
        alert(`Import completed with errors:\n${result.errors.join('\n')}`);
      } else {
        alert(`Successfully imported ${result.imported} rules`);
      }
      loadRules();
      loadStats();
    } catch (err) {
      console.error('Failed to import rules:', err);
    }
  };

  const getStatusIcon = (status: RuleStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-amber-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredRules = rules.filter(rule => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.category.toLowerCase().includes(searchLower) ||
        rule.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (loading && rules.length === 0) {
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600">Create and manage automated tasks for your farm</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImportRules}
            className="hidden"
            id="import-rules"
          />
          <Button
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => document.getElementById('import-rules')?.click()}
          >
            Import
          </Button>
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportRules}
          >
            Export
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreateRule}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <RuleStatsOverview 
          stats={stats}
          onRefresh={loadStats}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-gray-100' : ''}
          >
            Filters
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortOptions({ 
                field: field as RuleSortOptions['field'], 
                direction: direction as 'asc' | 'desc' 
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent text-sm"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="category-asc">Category A-Z</option>
            <option value="lastExecuted-desc">Recently Executed</option>
            <option value="executionCount-desc">Most Executed</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>

          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-current rounded-sm"></div>
                ))}
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <div className="w-4 h-4 space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-0.5 bg-current rounded"></div>
                ))}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <RuleFilterPanel
          filters={activeFilters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error loading rules</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRules}
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Rules Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || Object.keys(activeFilters).length > 0 
                  ? 'No rules match your criteria'
                  : 'No automation rules yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || Object.keys(activeFilters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create your first automation rule to get started'
                }
              </p>
              {!searchTerm && Object.keys(activeFilters).length === 0 && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onCreateRule}
                >
                  Create First Rule
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredRules.map((rule) => (
                <AutomationRuleCard
                  key={rule.id}
                  rule={rule}
                  viewMode={viewMode}
                  onToggle={() => handleToggleRule(rule.id)}
                  onExecute={() => handleExecuteRule(rule.id)}
                  onEdit={() => onEditRule?.(rule)}
                  onView={() => {
                    setSelectedRule(rule);
                    onViewRule?.(rule);
                  }}
                  onDuplicate={() => handleDuplicateRule(rule.id)}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rule Preview Sidebar */}
        <div className="lg:col-span-1">
          {selectedRule ? (
            <AutomationRulePreview
              rule={selectedRule}
              onClose={() => setSelectedRule(null)}
              onEdit={() => onEditRule?.(selectedRule)}
              onExecute={() => handleExecuteRule(selectedRule.id)}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a rule to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
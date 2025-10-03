import { useState, useEffect } from 'react';
import { AutomationRulesService } from '../services/automationRulesService';
import { AutomationRulesUtils } from '../utils/automationRulesUtils';
import type { 
  AutomationRule, 
  AutomationStats, 
  RuleExecution,
  RuleFilter,
  RuleSortOptions,
  RuleValidationResult
} from '../types/automationRules';

/**
 * Custom hook for managing automation rules
 */
export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [executions, setExecutions] = useState<RuleExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async (filter?: RuleFilter, sort?: RuleSortOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AutomationRulesService.getRules(filter, sort);
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AutomationRulesService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchExecutions = async (ruleId?: string, limit?: number) => {
    try {
      const data = await AutomationRulesService.getExecutions(ruleId, limit);
      setExecutions(data);
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    }
  };

  const createRule = async (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => {
    try {
      const newRule = await AutomationRulesService.createRule(rule);
      setRules(prev => [newRule, ...prev]);
      await fetchStats(); // Refresh stats
      return newRule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
      throw err;
    }
  };

  const updateRule = async (id: string, updates: Partial<AutomationRule>) => {
    try {
      const updatedRule = await AutomationRulesService.updateRule(id, updates);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      await fetchStats(); // Refresh stats
      return updatedRule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
      throw err;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await AutomationRulesService.deleteRule(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
      await fetchStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      throw err;
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const updatedRule = await AutomationRulesService.toggleRule(id);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      await fetchStats(); // Refresh stats
      return updatedRule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule');
      throw err;
    }
  };

  const executeRule = async (id: string) => {
    try {
      const execution = await AutomationRulesService.executeRule(id);
      setExecutions(prev => [execution, ...prev]);
      await fetchStats(); // Refresh stats
      return execution;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rule');
      throw err;
    }
  };

  const duplicateRule = async (id: string, name?: string) => {
    try {
      const duplicatedRule = await AutomationRulesService.duplicateRule(id, name);
      setRules(prev => [duplicatedRule, ...prev]);
      await fetchStats(); // Refresh stats
      return duplicatedRule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate rule');
      throw err;
    }
  };

  const validateRule = async (rule: Partial<AutomationRule>): Promise<RuleValidationResult> => {
    try {
      return await AutomationRulesService.validateRule(rule);
    } catch (err) {
      // Fallback to client-side validation
      return AutomationRulesUtils.validateRule(rule);
    }
  };

  const exportRules = async (ruleIds?: string[]) => {
    try {
      const blob = await AutomationRulesService.exportRules(ruleIds);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-rules-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export rules');
      throw err;
    }
  };

  const importRules = async (file: File) => {
    try {
      const result = await AutomationRulesService.importRules(file);
      await fetchRules(); // Refresh rules list
      await fetchStats(); // Refresh stats
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import rules');
      throw err;
    }
  };

  useEffect(() => {
    fetchRules();
    fetchStats();
    fetchExecutions();
  }, []);

  return {
    // State
    rules,
    stats,
    executions,
    loading,
    error,
    
    // Actions
    fetchRules,
    fetchStats,
    fetchExecutions,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    executeRule,
    duplicateRule,
    validateRule,
    exportRules,
    importRules,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([fetchRules(), fetchStats(), fetchExecutions()]);
    }
  };
}
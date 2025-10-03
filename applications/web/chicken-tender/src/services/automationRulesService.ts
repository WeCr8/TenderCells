import { apiService } from './api';
import type { 
  AutomationRule, 
  RuleExecution, 
  RuleTemplate, 
  AutomationStats,
  RuleFilter,
  RuleSortOptions,
  RuleValidationResult
} from '../types/automationRules';

/**
 * Service for managing automation rules
 */
export class AutomationRulesService {
  private static readonly ENDPOINTS = {
    RULES: '/automation/rules',
    RULE_BY_ID: (id: string) => `/automation/rules/${id}`,
    RULE_EXECUTE: (id: string) => `/automation/rules/${id}/execute`,
    RULE_TOGGLE: (id: string) => `/automation/rules/${id}/toggle`,
    RULE_VALIDATE: '/automation/rules/validate',
    RULE_DUPLICATE: (id: string) => `/automation/rules/${id}/duplicate`,
    EXECUTIONS: '/automation/executions',
    EXECUTION_BY_ID: (id: string) => `/automation/executions/${id}`,
    TEMPLATES: '/automation/templates',
    TEMPLATE_BY_ID: (id: string) => `/automation/templates/${id}`,
    STATS: '/automation/stats',
    EXPORT: '/automation/export',
    IMPORT: '/automation/import',
  };

  /**
   * Get all automation rules with optional filtering and sorting
   */
  static async getRules(filter?: RuleFilter, sort?: RuleSortOptions): Promise<AutomationRule[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.category) params.append('category', filter.category.join(','));
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.author) params.append('author', filter.author);
      if (filter.search) params.append('search', filter.search);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
    }
    
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.RULES}?${queryString}` : this.ENDPOINTS.RULES;
    
    return apiService.get<AutomationRule[]>(endpoint);
  }

  /**
   * Get a specific automation rule by ID
   */
  static async getRuleById(id: string): Promise<AutomationRule> {
    return apiService.get<AutomationRule>(this.ENDPOINTS.RULE_BY_ID(id));
  }

  /**
   * Create a new automation rule
   */
  static async createRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>): Promise<AutomationRule> {
    return apiService.post<AutomationRule>(this.ENDPOINTS.RULES, rule);
  }

  /**
   * Update an existing automation rule
   */
  static async updateRule(id: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    return apiService.put<AutomationRule>(this.ENDPOINTS.RULE_BY_ID(id), rule);
  }

  /**
   * Delete an automation rule
   */
  static async deleteRule(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.RULE_BY_ID(id));
  }

  /**
   * Toggle rule status (active/inactive)
   */
  static async toggleRule(id: string): Promise<AutomationRule> {
    return apiService.post<AutomationRule>(this.ENDPOINTS.RULE_TOGGLE(id));
  }

  /**
   * Execute a rule manually
   */
  static async executeRule(id: string): Promise<RuleExecution> {
    return apiService.post<RuleExecution>(this.ENDPOINTS.RULE_EXECUTE(id));
  }

  /**
   * Validate a rule configuration
   */
  static async validateRule(rule: Partial<AutomationRule>): Promise<RuleValidationResult> {
    return apiService.post<RuleValidationResult>(this.ENDPOINTS.RULE_VALIDATE, rule);
  }

  /**
   * Duplicate an existing rule
   */
  static async duplicateRule(id: string, name?: string): Promise<AutomationRule> {
    return apiService.post<AutomationRule>(this.ENDPOINTS.RULE_DUPLICATE(id), { name });
  }

  /**
   * Get rule executions with optional filtering
   */
  static async getExecutions(ruleId?: string, limit?: number): Promise<RuleExecution[]> {
    const params = new URLSearchParams();
    if (ruleId) params.append('ruleId', ruleId);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.EXECUTIONS}?${queryString}` : this.ENDPOINTS.EXECUTIONS;
    
    return apiService.get<RuleExecution[]>(endpoint);
  }

  /**
   * Get a specific execution by ID
   */
  static async getExecutionById(id: string): Promise<RuleExecution> {
    return apiService.get<RuleExecution>(this.ENDPOINTS.EXECUTION_BY_ID(id));
  }

  /**
   * Get rule templates
   */
  static async getTemplates(category?: string): Promise<RuleTemplate[]> {
    const params = category ? `?category=${category}` : '';
    return apiService.get<RuleTemplate[]>(`${this.ENDPOINTS.TEMPLATES}${params}`);
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplateById(id: string): Promise<RuleTemplate> {
    return apiService.get<RuleTemplate>(this.ENDPOINTS.TEMPLATE_BY_ID(id));
  }

  /**
   * Create rule from template
   */
  static async createFromTemplate(templateId: string, variables: Record<string, any>): Promise<AutomationRule> {
    return apiService.post<AutomationRule>(`${this.ENDPOINTS.TEMPLATE_BY_ID(templateId)}/create`, { variables });
  }

  /**
   * Get automation statistics
   */
  static async getStats(): Promise<AutomationStats> {
    return apiService.get<AutomationStats>(this.ENDPOINTS.STATS);
  }

  /**
   * Export rules
   */
  static async exportRules(ruleIds?: string[]): Promise<Blob> {
    const params = ruleIds ? `?ids=${ruleIds.join(',')}` : '';
    const response = await fetch(`${this.ENDPOINTS.EXPORT}${params}`);
    return response.blob();
  }

  /**
   * Import rules
   */
  static async importRules(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(this.ENDPOINTS.IMPORT, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
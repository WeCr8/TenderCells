import type { 
  AutomationRule, 
  RuleValidationResult, 
  ValidationError, 
  ValidationWarning,
  TriggerCondition,
  AutomationAction,
  AutomationTrigger,
  RuleExecution
} from '../types/automationRules';

/**
 * Utility functions for automation rules
 */
export class AutomationRulesUtils {
  /**
   * Validate a complete automation rule
   */
  static validateRule(rule: Partial<AutomationRule>): RuleValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic validation
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Rule name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!rule.description || rule.description.trim().length === 0) {
      warnings.push({
        field: 'description',
        message: 'Rule description is recommended for better maintainability',
        suggestion: 'Add a clear description of what this rule does'
      });
    }

    if (!rule.category) {
      errors.push({
        field: 'category',
        message: 'Rule category is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Triggers validation
    if (!rule.triggers || rule.triggers.length === 0) {
      errors.push({
        field: 'triggers',
        message: 'At least one trigger is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      rule.triggers.forEach((trigger, index) => {
        const triggerErrors = this.validateTrigger(trigger);
        triggerErrors.forEach(error => {
          errors.push({
            ...error,
            field: `triggers[${index}].${error.field}`
          });
        });
      });
    }

    // Actions validation
    if (!rule.actions || rule.actions.length === 0) {
      errors.push({
        field: 'actions',
        message: 'At least one action is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      rule.actions.forEach((action, index) => {
        const actionErrors = this.validateAction(action);
        actionErrors.forEach(error => {
          errors.push({
            ...error,
            field: `actions[${index}].${error.field}`
          });
        });
      });
    }

    // Schedule validation
    if (rule.schedule) {
      const scheduleErrors = this.validateSchedule(rule.schedule);
      scheduleErrors.forEach(error => {
        errors.push({
          ...error,
          field: `schedule.${error.field}`
        });
      });
    }

    // Performance warnings
    if (rule.actions && rule.actions.length > 10) {
      warnings.push({
        field: 'actions',
        message: 'Large number of actions may impact performance',
        suggestion: 'Consider splitting into multiple rules'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a trigger configuration
   */
  static validateTrigger(trigger: AutomationTrigger): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!trigger.name || trigger.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Trigger name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!trigger.type) {
      errors.push({
        field: 'type',
        message: 'Trigger type is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!trigger.conditions || trigger.conditions.length === 0) {
      errors.push({
        field: 'conditions',
        message: 'At least one condition is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      trigger.conditions.forEach((condition, index) => {
        const conditionErrors = this.validateCondition(condition);
        conditionErrors.forEach(error => {
          errors.push({
            ...error,
            field: `conditions[${index}].${error.field}`
          });
        });
      });
    }

    return errors;
  }

  /**
   * Validate an action configuration
   */
  static validateAction(action: AutomationAction): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!action.name || action.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Action name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!action.type) {
      errors.push({
        field: 'type',
        message: 'Action type is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Type-specific validation
    switch (action.type) {
      case 'device_control':
        if (!action.device) {
          errors.push({
            field: 'device',
            message: 'Device is required for device control actions',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
      case 'webhook':
        if (!action.parameters?.url) {
          errors.push({
            field: 'parameters.url',
            message: 'URL is required for webhook actions',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
      case 'notification':
        if (!action.parameters?.message) {
          errors.push({
            field: 'parameters.message',
            message: 'Message is required for notification actions',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
    }

    // Delay validation
    if (action.delay && (action.delay < 0 || action.delay > 3600)) {
      errors.push({
        field: 'delay',
        message: 'Delay must be between 0 and 3600 seconds',
        code: 'INVALID_RANGE'
      });
    }

    return errors;
  }

  /**
   * Validate a condition configuration
   */
  static validateCondition(condition: TriggerCondition): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!condition.parameter || condition.parameter.trim().length === 0) {
      errors.push({
        field: 'parameter',
        message: 'Parameter is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!condition.operator) {
      errors.push({
        field: 'operator',
        message: 'Operator is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push({
        field: 'value',
        message: 'Value is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Operator-specific validation
    if (condition.operator === 'between' && !Array.isArray(condition.value)) {
      errors.push({
        field: 'value',
        message: 'Between operator requires an array of two values',
        code: 'INVALID_FORMAT'
      });
    }

    return errors;
  }

  /**
   * Validate a schedule configuration
   */
  static validateSchedule(schedule: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!schedule.type) {
      errors.push({
        field: 'type',
        message: 'Schedule type is required',
        code: 'REQUIRED_FIELD'
      });
    }

    switch (schedule.type) {
      case 'daily':
        if (!schedule.time) {
          errors.push({
            field: 'time',
            message: 'Time is required for daily schedules',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
      case 'weekly':
        if (!schedule.days || schedule.days.length === 0) {
          errors.push({
            field: 'days',
            message: 'Days are required for weekly schedules',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
      case 'cron':
        if (!schedule.cronExpression) {
          errors.push({
            field: 'cronExpression',
            message: 'Cron expression is required for cron schedules',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Generate a human-readable description of a rule
   */
  static generateRuleDescription(rule: AutomationRule): string {
    const triggerDescriptions = rule.triggers.map(trigger => {
      const conditionDescriptions = trigger.conditions.map(condition => {
        return `${condition.parameter} ${condition.operator} ${condition.value}${condition.unit ? ` ${condition.unit}` : ''}`;
      });
      return `${trigger.name}: ${conditionDescriptions.join(` ${trigger.logicOperator || 'AND'} `)}`;
    });

    const actionDescriptions = rule.actions.map(action => {
      return `${action.name}${action.device ? ` on ${action.device}` : ''}`;
    });

    let description = `When ${triggerDescriptions.join(' OR ')}, then ${actionDescriptions.join(', ')}`;

    if (rule.schedule) {
      description += ` (scheduled: ${this.formatSchedule(rule.schedule)})`;
    }

    return description;
  }

  /**
   * Format schedule for display
   */
  static formatSchedule(schedule: any): string {
    switch (schedule.type) {
      case 'daily':
        return `daily at ${schedule.time}`;
      case 'weekly':
        return `weekly on ${schedule.days.join(', ')} at ${schedule.time}`;
      case 'monthly':
        return `monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      case 'interval':
        return `every ${schedule.interval} minutes`;
      case 'cron':
        return `cron: ${schedule.cronExpression}`;
      default:
        return 'custom schedule';
    }
  }

  /**
   * Calculate rule execution statistics
   */
  static calculateExecutionStats(executions: RuleExecution[]) {
    const total = executions.length;
    const successful = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const running = executions.filter(e => e.status === 'running').length;

    const successRate = total > 0 ? (successful / total) * 100 : 0;
    const averageExecutionTime = total > 0 
      ? executions.reduce((sum, e) => sum + e.executionTime, 0) / total 
      : 0;

    const recentExecutions = executions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);

    return {
      total,
      successful,
      failed,
      running,
      successRate,
      averageExecutionTime,
      recentExecutions
    };
  }

  /**
   * Generate next execution time for a scheduled rule
   */
  static calculateNextExecution(schedule: any, timezone: string = 'UTC'): Date | null {
    if (!schedule || !schedule.enabled) return null;

    const now = new Date();

    switch (schedule.type) {
      case 'daily':
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const nextDaily = new Date(now);
        nextDaily.setHours(hours, minutes, 0, 0);
        
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        
        return nextDaily;

      case 'weekly':
        // Implementation for weekly schedules
        // This would need more complex logic for day-of-week calculations
        return null;

      case 'interval':
        const nextInterval = new Date(now.getTime() + schedule.interval * 60 * 1000);
        return nextInterval;

      default:
        return null;
    }
  }

  /**
   * Check if a rule should be executed based on its conditions
   */
  static shouldExecuteRule(rule: AutomationRule, sensorData: Record<string, any>): boolean {
    if (rule.status !== 'active') return false;

    return rule.triggers.some(trigger => {
      if (!trigger.enabled) return false;

      const conditionResults = trigger.conditions.map(condition => {
        return this.evaluateCondition(condition, sensorData);
      });

      const logicOperator = trigger.logicOperator || 'AND';
      return logicOperator === 'AND' 
        ? conditionResults.every(result => result)
        : conditionResults.some(result => result);
    });
  }

  /**
   * Evaluate a single condition against sensor data
   */
  static evaluateCondition(condition: TriggerCondition, sensorData: Record<string, any>): boolean {
    const sensorValue = sensorData[condition.parameter];
    if (sensorValue === undefined) return false;

    switch (condition.operator) {
      case 'equals':
        return sensorValue === condition.value;
      case 'not_equals':
        return sensorValue !== condition.value;
      case 'greater_than':
        return sensorValue > condition.value;
      case 'less_than':
        return sensorValue < condition.value;
      case 'between':
        return Array.isArray(condition.value) && 
               sensorValue >= condition.value[0] && 
               sensorValue <= condition.value[1];
      case 'contains':
        return String(sensorValue).includes(String(condition.value));
      case 'in_range':
        const threshold = condition.threshold || 0;
        return Math.abs(sensorValue - condition.value) <= threshold;
      default:
        return false;
    }
  }

  /**
   * Export rules to JSON format
   */
  static exportRulesToJSON(rules: AutomationRule[]): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      rules: rules.map(rule => ({
        ...rule,
        // Remove runtime metadata for cleaner export
        metadata: {
          ...rule.metadata,
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
          averageExecutionTime: 0
        }
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import rules from JSON format
   */
  static importRulesFromJSON(jsonString: string): { rules: AutomationRule[]; errors: string[] } {
    const errors: string[] = [];
    let rules: AutomationRule[] = [];

    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.rules || !Array.isArray(importData.rules)) {
        errors.push('Invalid format: rules array not found');
        return { rules, errors };
      }

      rules = importData.rules.map((rule: any, index: number) => {
        const validation = this.validateRule(rule);
        if (!validation.isValid) {
          errors.push(`Rule ${index + 1}: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        return {
          ...rule,
          id: `imported_${Date.now()}_${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'inactive' as const, // Import as inactive for safety
        };
      });

    } catch (error) {
      errors.push('Invalid JSON format');
    }

    return { rules, errors };
  }
}
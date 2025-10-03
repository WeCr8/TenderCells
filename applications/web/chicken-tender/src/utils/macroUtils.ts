import type { 
  MacroFunction, 
  MacroParameter, 
  MacroValidationResult,
  MacroTask,
  MacroRecord
} from '../types/macros';

/**
 * Utility functions for macro operations
 */
export class MacroUtils {
  /**
   * Validate macro parameters against their definitions
   */
  static validateMacroParameters(
    parameters: Record<string, any>,
    parameterDefinitions: MacroParameter[]
  ): MacroValidationResult {
    const errors: { field: string; message: string }[] = [];

    // Check for required parameters
    parameterDefinitions.forEach(param => {
      if (param.required && (parameters[param.id] === undefined || parameters[param.id] === null || parameters[param.id] === '')) {
        errors.push({
          field: param.id,
          message: `${param.name} is required`
        });
      }
    });

    // Validate parameter values
    Object.entries(parameters).forEach(([key, value]) => {
      const paramDef = parameterDefinitions.find(p => p.id === key);
      if (!paramDef) return; // Skip parameters not in the definition

      // Type validation
      if (paramDef.type === 'number' && typeof value !== 'number') {
        errors.push({
          field: key,
          message: `${paramDef.name} must be a number`
        });
      } else if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({
          field: key,
          message: `${paramDef.name} must be a boolean`
        });
      } else if (paramDef.type === 'date' && !(value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value))))) {
        errors.push({
          field: key,
          message: `${paramDef.name} must be a valid date`
        });
      }

      // Range validation for numbers
      if (paramDef.type === 'number' && typeof value === 'number' && paramDef.validation) {
        if (paramDef.validation.min !== undefined && value < paramDef.validation.min) {
          errors.push({
            field: key,
            message: `${paramDef.name} must be at least ${paramDef.validation.min}`
          });
        }
        if (paramDef.validation.max !== undefined && value > paramDef.validation.max) {
          errors.push({
            field: key,
            message: `${paramDef.name} must be at most ${paramDef.validation.max}`
          });
        }
      }

      // Pattern validation for strings
      if (paramDef.type === 'string' && typeof value === 'string' && paramDef.validation?.pattern) {
        const regex = new RegExp(paramDef.validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: key,
            message: `${paramDef.name} has an invalid format`
          });
        }
      }

      // Options validation for select/multiselect
      if ((paramDef.type === 'select' || paramDef.type === 'multiselect') && paramDef.options) {
        const validValues = paramDef.options.map(opt => opt.value);
        if (Array.isArray(value)) {
          // Multiselect
          if (value.some(v => !validValues.includes(v))) {
            errors.push({
              field: key,
              message: `${paramDef.name} contains invalid options`
            });
          }
        } else {
          // Select
          if (!validValues.includes(value)) {
            errors.push({
              field: key,
              message: `${paramDef.name} is not a valid option`
            });
          }
        }
      }

      // Entity validation
      if (paramDef.type === 'entity' && paramDef.validation?.entityType) {
        // This would typically involve checking if the entity exists in the system
        // For now, we'll just check if it's a non-empty string or a valid ID format
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push({
            field: key,
            message: `${paramDef.name} must be a valid ${paramDef.validation.entityType} ID`
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format macro execution time
   */
  static formatExecutionTime(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format next execution time
   */
  static formatNextExecution(task: MacroTask): string {
    if (!task.schedule?.nextExecution) return 'Not scheduled';
    
    const nextExecution = new Date(task.schedule.nextExecution);
    const now = new Date();
    const diffMs = nextExecution.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) {
      return `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    return nextExecution.toLocaleDateString();
  }

  /**
   * Format macro schedule for display
   */
  static formatMacroSchedule(schedule?: MacroTask['schedule']): string {
    if (!schedule) return 'One-time execution';
    
    switch (schedule.type) {
      case 'once':
        return schedule.nextExecution 
          ? `Once on ${new Date(schedule.nextExecution).toLocaleDateString()} at ${new Date(schedule.nextExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'One-time execution';
      
      case 'daily':
        return schedule.time 
          ? `Daily at ${schedule.time}`
          : 'Daily';
      
      case 'weekly':
        if (!schedule.days || schedule.days.length === 0) return 'Weekly';
        return `Weekly on ${schedule.days.join(', ')}${schedule.time ? ` at ${schedule.time}` : ''}`;
      
      case 'monthly':
        if (!schedule.dates || schedule.dates.length === 0) return 'Monthly';
        return `Monthly on day${schedule.dates.length > 1 ? 's' : ''} ${schedule.dates.join(', ')}${schedule.time ? ` at ${schedule.time}` : ''}`;
      
      case 'custom':
        return 'Custom schedule';
      
      default:
        return 'Unknown schedule';
    }
  }

  /**
   * Get color for macro type
   */
  static getMacroTypeColor(type: string): { bg: string; text: string; border: string } {
    const colors = {
      record: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      task: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
      },
      configuration: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      },
      flock: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      chicken: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      },
      feeding: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200'
      },
      maintenance: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      }
    };

    return colors[type as keyof typeof colors] || colors.task;
  }

  /**
   * Get color for macro status
   */
  static getMacroStatusColor(status: string): { bg: string; text: string; border: string } {
    const colors = {
      idle: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      },
      running: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      completed: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      failed: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      }
    };

    return colors[status as keyof typeof colors] || colors.idle;
  }

  /**
   * Generate a human-readable description of a macro execution
   */
  static generateMacroDescription(macro: MacroFunction, parameters: Record<string, any>): string {
    let description = macro.name;
    
    // Add key parameters to the description
    const paramDescriptions: string[] = [];
    macro.parameters.forEach(param => {
      if (parameters[param.id] !== undefined && parameters[param.id] !== null) {
        let valueDisplay: string;
        
        if (param.type === 'date' && parameters[param.id]) {
          valueDisplay = new Date(parameters[param.id]).toLocaleDateString();
        } else if (param.type === 'select' && param.options) {
          const option = param.options.find(opt => opt.value === parameters[param.id]);
          valueDisplay = option ? option.label : String(parameters[param.id]);
        } else if (param.type === 'multiselect' && Array.isArray(parameters[param.id]) && param.options) {
          valueDisplay = parameters[param.id]
            .map((val: any) => {
              const option = param.options?.find(opt => opt.value === val);
              return option ? option.label : String(val);
            })
            .join(', ');
        } else if (param.type === 'boolean') {
          valueDisplay = parameters[param.id] ? 'Yes' : 'No';
        } else {
          valueDisplay = String(parameters[param.id]);
        }
        
        paramDescriptions.push(`${param.name}: ${valueDisplay}`);
      }
    });
    
    if (paramDescriptions.length > 0) {
      description += ` (${paramDescriptions.join(', ')})`;
    }
    
    return description;
  }
}
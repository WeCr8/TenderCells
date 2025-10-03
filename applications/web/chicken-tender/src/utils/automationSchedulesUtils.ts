import type { 
  Schedule, 
  ScheduleExecution, 
  ScheduleType,
  ScheduleStatus,
  ScheduleTime,
  ScheduleAction
} from '../types/automationSchedules';

/**
 * Utility functions for automation schedules
 */
export class AutomationSchedulesUtils {
  /**
   * Format schedule time for display
   */
  static formatScheduleTime(time?: ScheduleTime): string {
    if (!time) return 'Not set';
    
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    const second = time.second ? `:${time.second.toString().padStart(2, '0')}` : '';
    
    return `${hour}:${minute}${second}`;
  }

  /**
   * Format schedule for display
   */
  static formatSchedule(schedule: Schedule): string {
    switch (schedule.type) {
      case 'daily':
        return `Daily at ${this.formatScheduleTime(schedule.time)}`;
      
      case 'weekly':
        if (!schedule.days || schedule.days.length === 0) return 'Weekly (no days set)';
        return `Weekly on ${this.formatDaysList(schedule.days)} at ${this.formatScheduleTime(schedule.time)}`;
      
      case 'monthly':
        if (!schedule.dates || schedule.dates.length === 0) return 'Monthly (no dates set)';
        return `Monthly on ${this.formatDatesList(schedule.dates)} at ${this.formatScheduleTime(schedule.time)}`;
      
      case 'interval':
        if (!schedule.interval) return 'Interval (not set)';
        return this.formatInterval(schedule.interval);
      
      case 'cron':
        return `Cron: ${schedule.cronExpression || 'Not set'}`;
      
      case 'sunrise_sunset':
        return `${schedule.sunEvent === 'sunrise' ? 'Sunrise' : 'Sunset'}${
          schedule.sunOffset ? (schedule.sunOffset > 0 ? ` + ${schedule.sunOffset}m` : ` - ${Math.abs(schedule.sunOffset)}m`) : ''
        }`;
      
      case 'custom':
        return 'Custom schedule';
      
      default:
        return 'Unknown schedule type';
    }
  }

  /**
   * Calculate next execution time
   */
  static calculateNextExecution(schedule: Schedule): Date | null {
    if (schedule.status !== 'active') return null;

    const now = new Date();
    
    switch (schedule.type) {
      case 'daily':
        return this.calculateNextDaily(schedule, now);
      
      case 'weekly':
        return this.calculateNextWeekly(schedule, now);
      
      case 'monthly':
        return this.calculateNextMonthly(schedule, now);
      
      case 'interval':
        return this.calculateNextInterval(schedule, now);
      
      case 'cron':
        // Cron calculation would require a cron parser library
        return null;
      
      case 'sunrise_sunset':
        return this.calculateNextSunEvent(schedule, now);
      
      default:
        return null;
    }
  }

  /**
   * Format execution time
   */
  static formatExecutionTime(execution: ScheduleExecution): string {
    if (!execution.endTime) return 'In progress';
    
    const startTime = new Date(execution.startTime).getTime();
    const endTime = new Date(execution.endTime).getTime();
    const durationMs = endTime - startTime;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  }

  /**
   * Format relative time
   */
  static formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = targetDate.getTime() - now.getTime();
    
    // Past
    if (diffMs < 0) {
      const absDiffMs = Math.abs(diffMs);
      if (absDiffMs < 60000) return 'Just now';
      if (absDiffMs < 3600000) return `${Math.floor(absDiffMs / 60000)}m ago`;
      if (absDiffMs < 86400000) return `${Math.floor(absDiffMs / 3600000)}h ago`;
      if (absDiffMs < 604800000) return `${Math.floor(absDiffMs / 86400000)}d ago`;
      return targetDate.toLocaleDateString();
    }
    
    // Future
    if (diffMs < 60000) return 'In less than a minute';
    if (diffMs < 3600000) return `In ${Math.floor(diffMs / 60000)}m`;
    if (diffMs < 86400000) return `In ${Math.floor(diffMs / 3600000)}h`;
    if (diffMs < 604800000) return `In ${Math.floor(diffMs / 86400000)}d`;
    return targetDate.toLocaleDateString();
  }

  /**
   * Get schedule status color
   */
  static getScheduleStatusColor(status: ScheduleStatus): {
    textColor: string;
    bgColor: string;
    borderColor: string;
  } {
    const statusColors = {
      active: {
        textColor: 'text-emerald-800',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200'
      },
      inactive: {
        textColor: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      },
      paused: {
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200'
      },
      completed: {
        textColor: 'text-blue-800',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
      },
      error: {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      }
    };

    return statusColors[status] || statusColors.inactive;
  }

  /**
   * Get schedule priority color
   */
  static getSchedulePriorityColor(priority: string): string {
    const priorityColors = {
      low: 'text-blue-600',
      normal: 'text-green-600',
      high: 'text-amber-600',
      critical: 'text-red-600'
    };

    return priorityColors[priority as keyof typeof priorityColors] || 'text-gray-600';
  }

  /**
   * Validate schedule configuration
   */
  static validateSchedule(schedule: Partial<Schedule>): {
    isValid: boolean;
    errors: { field: string; message: string }[];
  } {
    const errors: { field: string; message: string }[] = [];

    // Basic validation
    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Schedule name is required' });
    }

    if (!schedule.type) {
      errors.push({ field: 'type', message: 'Schedule type is required' });
    }

    // Type-specific validation
    if (schedule.type) {
      switch (schedule.type) {
        case 'daily':
          if (!schedule.time) {
            errors.push({ field: 'time', message: 'Time is required for daily schedules' });
          }
          break;
          
        case 'weekly':
          if (!schedule.days || schedule.days.length === 0) {
            errors.push({ field: 'days', message: 'At least one day is required for weekly schedules' });
          }
          if (!schedule.time) {
            errors.push({ field: 'time', message: 'Time is required for weekly schedules' });
          }
          break;
          
        case 'monthly':
          if (!schedule.dates || schedule.dates.length === 0) {
            errors.push({ field: 'dates', message: 'At least one date is required for monthly schedules' });
          }
          if (!schedule.time) {
            errors.push({ field: 'time', message: 'Time is required for monthly schedules' });
          }
          break;
          
        case 'interval':
          if (!schedule.interval) {
            errors.push({ field: 'interval', message: 'Interval is required for interval schedules' });
          } else if (schedule.interval < 1) {
            errors.push({ field: 'interval', message: 'Interval must be at least 1 minute' });
          }
          break;
          
        case 'cron':
          if (!schedule.cronExpression) {
            errors.push({ field: 'cronExpression', message: 'Cron expression is required for cron schedules' });
          }
          break;
          
        case 'sunrise_sunset':
          if (!schedule.sunEvent) {
            errors.push({ field: 'sunEvent', message: 'Sun event (sunrise/sunset) is required' });
          }
          if (!schedule.location) {
            errors.push({ field: 'location', message: 'Location is required for sunrise/sunset schedules' });
          }
          break;
      }
    }

    // Actions validation
    if (!schedule.actions || schedule.actions.length === 0) {
      errors.push({ field: 'actions', message: 'At least one action is required' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private helper methods
  private static formatDaysList(days: string[]): string {
    if (days.length === 7) return 'every day';
    if (days.length === 0) return 'no days';
    
    // Format days in a readable way
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  }

  private static formatDatesList(dates: number[]): string {
    if (dates.length === 0) return 'no dates';
    
    // Format with proper ordinals
    return dates.map(date => {
      const suffix = this.getOrdinalSuffix(date);
      return `${date}${suffix}`;
    }).join(', ');
  }

  private static getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  private static formatInterval(minutes: number): string {
    if (minutes < 60) return `Every ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes === 60) return 'Every hour';
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `Every ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `Every ${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  private static calculateNextDaily(schedule: Schedule, now: Date): Date | null {
    if (!schedule.time) return null;
    
    const next = new Date(now);
    next.setHours(schedule.time.hour, schedule.time.minute, schedule.time.second || 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return this.checkDateRange(schedule, next);
  }

  private static calculateNextWeekly(schedule: Schedule, now: Date): Date | null {
    if (!schedule.time || !schedule.days || schedule.days.length === 0) return null;
    
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    
    const currentDay = now.getDay();
    const scheduleDays = schedule.days.map(day => dayMap[day.toLowerCase()]).sort((a, b) => a - b);
    
    // Find the next day that's in the schedule
    let nextDay = scheduleDays.find(day => day > currentDay);
    if (nextDay === undefined) {
      nextDay = scheduleDays[0]; // Wrap around to the first day next week
    }
    
    const daysToAdd = (nextDay - currentDay + 7) % 7;
    const next = new Date(now);
    next.setDate(next.getDate() + daysToAdd);
    next.setHours(schedule.time.hour, schedule.time.minute, schedule.time.second || 0, 0);
    
    if (daysToAdd === 0 && next <= now) {
      next.setDate(next.getDate() + 7);
    }
    
    return this.checkDateRange(schedule, next);
  }

  private static calculateNextMonthly(schedule: Schedule, now: Date): Date | null {
    if (!schedule.time || !schedule.dates || schedule.dates.length === 0) return null;
    
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Sort dates in ascending order
    const scheduleDates = [...schedule.dates].sort((a, b) => a - b);
    
    // Find the next date in the current month
    let nextDate = scheduleDates.find(date => date > currentDate);
    let nextMonth = currentMonth;
    let nextYear = currentYear;
    
    if (nextDate === undefined) {
      nextDate = scheduleDates[0]; // Move to the first date of next month
      nextMonth = (currentMonth + 1) % 12;
      if (nextMonth === 0) nextYear++; // Increment year if we wrap to January
    }
    
    const next = new Date(nextYear, nextMonth, nextDate);
    next.setHours(schedule.time.hour, schedule.time.minute, schedule.time.second || 0, 0);
    
    // Check if the date is valid (e.g., February 30th doesn't exist)
    if (next.getDate() !== nextDate) {
      // If invalid, move to the next month
      return this.calculateNextMonthly({
        ...schedule,
        dates: scheduleDates
      }, new Date(nextYear, nextMonth + 1, 1));
    }
    
    return this.checkDateRange(schedule, next);
  }

  private static calculateNextInterval(schedule: Schedule, now: Date): Date | null {
    if (!schedule.interval) return null;
    
    let next: Date;
    
    if (schedule.lastExecution) {
      // Calculate from last execution
      next = new Date(schedule.lastExecution);
      next.setMinutes(next.getMinutes() + schedule.interval);
    } else {
      // If no previous execution, start from now
      next = new Date(now);
      next.setMinutes(next.getMinutes() + schedule.interval);
    }
    
    return this.checkDateRange(schedule, next);
  }

  private static calculateNextSunEvent(schedule: Schedule, now: Date): Date | null {
    if (!schedule.sunEvent || !schedule.location) return null;
    
    // This is a simplified calculation - in a real app, you'd use a library
    // like suncalc to calculate actual sunrise/sunset times based on location
    
    // For this example, we'll use fixed times:
    // Sunrise at 6:00 AM, Sunset at 6:00 PM
    const next = new Date(now);
    
    if (schedule.sunEvent === 'sunrise') {
      next.setHours(6, 0, 0, 0);
    } else {
      next.setHours(18, 0, 0, 0);
    }
    
    // Apply offset if specified
    if (schedule.sunOffset) {
      next.setMinutes(next.getMinutes() + schedule.sunOffset);
    }
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return this.checkDateRange(schedule, next);
  }

  private static checkDateRange(schedule: Schedule, date: Date): Date | null {
    // Check if the calculated date is within the schedule's date range
    if (schedule.startDate && new Date(schedule.startDate) > date) {
      return new Date(schedule.startDate);
    }
    
    if (schedule.endDate && new Date(schedule.endDate) < date) {
      return null; // Schedule has ended
    }
    
    return date;
  }
}
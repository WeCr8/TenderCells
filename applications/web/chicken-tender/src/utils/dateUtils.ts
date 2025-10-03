/**
 * Utility functions for date and time operations
 */

export class DateUtils {
  /**
   * Format a date string to a human-readable format
   */
  static formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return dateObj.toLocaleDateString();
    }
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  static getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    return this.formatDate(dateObj);
  }

  /**
   * Check if a date is today
   */
  static isToday(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is within the last N days
   */
  static isWithinDays(date: string | Date, days: number): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffInDays <= days;
  }

  /**
   * Get start and end of day for a given date
   */
  static getDayBounds(date: string | Date): { start: Date; end: Date } {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
}
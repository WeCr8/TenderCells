/**
 * Utility functions for formatting data
 */

export class FormatUtils {
  /**
   * Format temperature with unit
   */
  static formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'fahrenheit'): string {
    const symbol = unit === 'celsius' ? '°C' : '°F';
    return `${Math.round(temp)}${symbol}`;
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Format number with commas
   */
  static formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Format health score with color class
   */
  static formatHealthScore(score: number): { text: string; colorClass: string } {
    let colorClass = '';
    let text = `${score}%`;

    if (score >= 90) {
      colorClass = 'text-emerald-600';
    } else if (score >= 70) {
      colorClass = 'text-amber-600';
    } else {
      colorClass = 'text-red-600';
    }

    return { text, colorClass };
  }

  /**
   * Format chicken status with appropriate styling
   */
  static formatChickenStatus(status: string): { text: string; colorClass: string; bgClass: string } {
    const statusMap = {
      active: {
        text: 'Active',
        colorClass: 'text-emerald-800',
        bgClass: 'bg-emerald-100 border-emerald-200'
      },
      resting: {
        text: 'Resting',
        colorClass: 'text-amber-800',
        bgClass: 'bg-amber-100 border-amber-200'
      },
      missing: {
        text: 'Missing',
        colorClass: 'text-red-800',
        bgClass: 'bg-red-100 border-red-200'
      },
      sick: {
        text: 'Sick',
        colorClass: 'text-orange-800',
        bgClass: 'bg-orange-100 border-orange-200'
      }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
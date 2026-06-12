/**
 * Logger - Main Export
 * 
 * Full-featured logger with storage and export capabilities.
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('Message', { context });
 * 
 * For minimal imports, use:
 *   import { CoreLogger } from '@/utils/logger/core';
 *   import { LogLevel } from '@/utils/logger/types';
 */

import { CoreLogger } from './core';
import { createStorage } from './storage';
import { createExporter } from './exporter';
import { createDefaultConfig } from './config';
import { filterLogsByLevel, searchLogs, filterLogsByTimeRange } from './utils';
import { LogLevel, type LogEntry, type LoggerConfig } from './types';

class Logger extends CoreLogger {
  private storage?: ReturnType<typeof createStorage>;
  private exporter = createExporter('json');
  private enableStorage: boolean;

  constructor(config?: Partial<LoggerConfig>) {
    const fullConfig = { ...createDefaultConfig(), ...config };
    super(fullConfig.level);
    
    this.maxLogs = fullConfig.maxLogs;
    this.enableConsole = fullConfig.enableConsole;
    this.enableStorage = fullConfig.enableStorage;

    if (this.enableStorage) {
      this.storage = createStorage({ storageKey: fullConfig.storageKey });
      this.loadLogsFromStorage();
    }

    // Log initialization
    this.info('Logger initialized', { 
      level: LogLevel[this.level], 
      enableStorage: this.enableStorage 
    });
  }

  protected addLog(entry: LogEntry): void {
    super.addLog(entry);

    // Persist to storage if enabled
    if (this.enableStorage && this.storage) {
      this.saveLogsToStorage();
    }
  }

  private saveLogsToStorage(): void {
    if (this.storage) {
      this.storage.save(this.getInternalLogs());
    }
  }

  private loadLogsFromStorage(): void {
    if (this.storage) {
      const stored = this.storage.load();
      if (stored.length > 0) {
        // Add to existing logs, but respect maxLogs limit
        const existing = this.getInternalLogs();
        const combined = [...existing, ...stored];
        const limited = combined.slice(-this.maxLogs);
        // Replace internal logs (we need to access protected member)
        (this as any).logs = limited;
      }
    }
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return this.exporter.export(this.getInternalLogs());
  }

  /**
   * Download logs as a file
   */
  downloadLogs(filename?: string, format: 'json' | 'csv' = 'json'): void {
    const exporter = format === 'csv' ? createExporter('csv') : this.exporter;
    exporter.download(this.getInternalLogs(), filename);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    super.clear();
    if (this.storage) {
      this.storage.clear();
    }
  }

  /**
   * Enable/disable storage persistence
   */
  setStorageEnabled(enabled: boolean): void {
    this.enableStorage = enabled;
    if (enabled) {
      if (!this.storage) {
        const config = createDefaultConfig();
        this.storage = createStorage({ storageKey: config.storageKey });
      }
      this.saveLogsToStorage();
    }
  }

  /**
   * Search logs by query
   */
  search(query: string): LogEntry[] {
    return searchLogs(this.getInternalLogs(), query);
  }

  /**
   * Filter logs by time range
   */
  filterByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return filterLogsByTimeRange(this.getInternalLogs(), startTime, endTime);
  }

  /**
   * Get logs by level (alias for getLogs with level parameter)
   */
  getLogsByLevel(level: string): LogEntry[] {
    return filterLogsByLevel(this.getInternalLogs(), level);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types and classes for modular usage
export { CoreLogger } from './core';
export { LogLevel, type LogEntry, type LoggerConfig } from './types';
export { createStorage } from './storage';
export { createExporter, JSONLoggerExporter, CSVLoggerExporter } from './exporter';
export { 
  sanitizeContext, 
  extractErrorInfo, 
  getSessionId, 
  formatLogEntry,
  filterLogsByLevel,
  searchLogs,
  filterLogsByTimeRange,
} from './utils';
export { createDefaultConfig, createConfig, getLogLevelFromEnv } from './config';
export { useLogger, useComponentLogger } from './hooks';

// Make logger available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).tendercellsLogger = logger;
}



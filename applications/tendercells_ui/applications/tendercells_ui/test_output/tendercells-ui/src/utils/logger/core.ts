/**
 * Core Logger
 * 
 * Core logging functionality without storage or export features.
 * Use this for minimal logging needs.
 */

import { LogLevel as LogLevelEnum, type LogEntry, type LogLevel as LogLevelType } from './types';
import { sanitizeContext, extractErrorInfo, getSessionId } from './utils';

export class CoreLogger {
  protected level: LogLevelType;
  protected logs: LogEntry[] = [];
  protected maxLogs: number = 1000;
  protected enableConsole: boolean = true;

  constructor(level: LogLevelType = LogLevelEnum.INFO) {
    this.level = level;
  }

  protected createLogEntry(
    level: string,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitizeContext(context),
    };

    // Add stack trace for errors
    if (level === 'ERROR' && context?.error instanceof Error) {
      const errorInfo = extractErrorInfo(context.error);
      entry.stack = errorInfo.stack;
      // Remove error object from context to avoid circular references
      if (entry.context) {
        const { error, ...rest } = entry.context;
        entry.context = { 
          ...rest, 
          errorMessage: errorInfo.errorMessage, 
          errorName: errorInfo.errorName 
        };
      }
    }

    // Try to get session info
    const sessionId = getSessionId();
    if (sessionId) entry.sessionId = sessionId;

    return entry;
  }

  protected addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  protected shouldLog(level: LogLevelType): boolean {
    return this.level <= level;
  }

  protected getInternalLogs(): LogEntry[] {
    return this.logs;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevelEnum.DEBUG)) {
      const entry = this.createLogEntry('DEBUG', message, context);
      this.addLog(entry);
      if (this.enableConsole) {
        console.debug(`[DEBUG] ${message}`, context || '');
      }
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevelEnum.INFO)) {
      const entry = this.createLogEntry('INFO', message, context);
      this.addLog(entry);
      if (this.enableConsole) {
        console.info(`[INFO] ${message}`, context || '');
      }
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevelEnum.WARN)) {
      const entry = this.createLogEntry('WARN', message, context);
      this.addLog(entry);
      if (this.enableConsole) {
        console.warn(`[WARN] ${message}`, context || '');
      }
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevelEnum.ERROR)) {
      const entry = this.createLogEntry('ERROR', message, context);
      this.addLog(entry);
      if (this.enableConsole) {
        console.error(`[ERROR] ${message}`, context || '');
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
      }
    }
  }

  success(message: string, context?: Record<string, any>): void {
    // Success is treated as INFO level but with a success indicator
    if (this.shouldLog(LogLevelEnum.INFO)) {
      const entry = this.createLogEntry('SUCCESS', message, context);
      this.addLog(entry);
      if (this.enableConsole) {
        console.info(`[SUCCESS] ${message}`, context || '');
      }
    }
  }

  /**
   * Get all logs or logs filtered by level
   */
  getLogs(level?: string): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level.toUpperCase());
    }
    return [...this.logs];
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get error logs only
   */
  getErrors(): LogEntry[] {
    return this.logs.filter(log => log.level === 'ERROR');
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevelType): void {
    this.level = level;
    this.info('Log level changed', { newLevel: LogLevelEnum[level] });
  }

  /**
   * Enable/disable console logging
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

}





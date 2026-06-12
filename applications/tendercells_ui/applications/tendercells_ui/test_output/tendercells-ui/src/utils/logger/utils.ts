/**
 * Logger Utilities
 * 
 * Helper functions for sanitizing, formatting, and processing log data.
 */

import type { LogEntry } from './types';

/**
 * Sanitize context data to prevent circular references and limit depth
 */
export function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;

  const seen = new WeakSet();
  const sanitize = (obj: any, depth: number = 0): any => {
    if (depth > 5) return '[Max Depth]';
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';
    
    if (Array.isArray(obj)) {
      seen.add(obj);
      return obj.map(item => sanitize(item, depth + 1));
    }
    
    seen.add(obj);
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        sanitized[key] = sanitize(value, depth + 1);
      } catch (e) {
        sanitized[key] = '[Error serializing]';
      }
    }
    return sanitized;
  };

  return sanitize(context);
}

/**
 * Extract error information from Error object
 */
export function extractErrorInfo(error: Error): { errorMessage: string; errorName: string; stack?: string } {
  return {
    errorMessage: error.message,
    errorName: error.name,
    stack: error.stack,
  };
}

/**
 * Get session ID from sessionStorage
 */
export function getSessionId(): string | undefined {
  try {
    return sessionStorage.getItem('tendercells_session_id') || undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Format log entry for display
 */
export function formatLogEntry(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toLocaleString();
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${timestamp}] [${entry.level}] ${entry.message}${contextStr}`;
}

/**
 * Filter logs by level
 */
export function filterLogsByLevel(logs: LogEntry[], level: string): LogEntry[] {
  return logs.filter(log => log.level === level.toUpperCase());
}

/**
 * Filter logs by time range
 */
export function filterLogsByTimeRange(
  logs: LogEntry[],
  startTime: Date,
  endTime: Date
): LogEntry[] {
  return logs.filter(log => {
    const logTime = new Date(log.timestamp);
    return logTime >= startTime && logTime <= endTime;
  });
}

/**
 * Search logs by message or context
 */
export function searchLogs(logs: LogEntry[], query: string): LogEntry[] {
  const lowerQuery = query.toLowerCase();
  return logs.filter(log => {
    if (log.message.toLowerCase().includes(lowerQuery)) return true;
    if (log.context) {
      const contextStr = JSON.stringify(log.context).toLowerCase();
      if (contextStr.includes(lowerQuery)) return true;
    }
    return false;
  });
}





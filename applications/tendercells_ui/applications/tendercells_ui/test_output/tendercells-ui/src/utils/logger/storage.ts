/**
 * Logger Storage
 * 
 * Handles persistent storage of logs in localStorage.
 */

import type { LogEntry, LoggerStorage, LoggerConfig } from './types';

export class LocalStorageLoggerStorage implements LoggerStorage {
  private storageKey: string;
  private maxStoredLogs: number;

  constructor(config: Pick<LoggerConfig, 'storageKey'>, maxStoredLogs: number = 500) {
    this.storageKey = config.storageKey;
    this.maxStoredLogs = maxStoredLogs;
  }

  save(logs: LogEntry[]): void {
    try {
      // Only save last N logs to prevent storage quota issues
      const logsToSave = logs.slice(-this.maxStoredLogs);
      localStorage.setItem(this.storageKey, JSON.stringify(logsToSave));
    } catch (e) {
      // Ignore storage errors (e.g., quota exceeded)
      console.warn('Failed to save logs to storage:', e);
    }
  }

  load(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load logs from storage:', e);
    }
    return [];
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Create a storage instance
 */
export function createStorage(config: Pick<LoggerConfig, 'storageKey'>, maxLogs?: number): LoggerStorage {
  return new LocalStorageLoggerStorage(config, maxLogs);
}





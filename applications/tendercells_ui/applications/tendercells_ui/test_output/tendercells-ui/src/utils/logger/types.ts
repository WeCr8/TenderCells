/**
 * Logger Types
 * 
 * Core type definitions for the logger utility.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  maxLogs: number;
  enableConsole: boolean;
  enableStorage: boolean;
  storageKey: string;
}

export interface LoggerStorage {
  save(logs: LogEntry[]): void;
  load(): LogEntry[];
  clear(): void;
}

export interface LoggerExporter {
  export(logs: LogEntry[]): string;
  download(logs: LogEntry[], filename?: string): void;
}





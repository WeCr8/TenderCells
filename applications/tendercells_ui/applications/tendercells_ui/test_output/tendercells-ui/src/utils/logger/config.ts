/**
 * Logger Configuration
 * 
 * Configuration utilities for setting up the logger.
 */

import { LogLevel, type LoggerConfig } from './types';

/**
 * Get log level from environment variable
 */
export function getLogLevelFromEnv(): LogLevel {
  const envLevel = import.meta.env.VITE_LOG_LEVEL;
  if (envLevel) {
    const level = LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel];
    if (level !== undefined) {
      return level;
    }
  }
  // Default to DEBUG in development, INFO in production
  return import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
}

/**
 * Get storage enabled from environment variable
 */
export function getStorageEnabledFromEnv(): boolean {
  return import.meta.env.VITE_ENABLE_LOG_STORAGE === 'true';
}

/**
 * Create default logger configuration
 */
export function createDefaultConfig(): LoggerConfig {
  return {
    level: getLogLevelFromEnv(),
    maxLogs: 1000,
    enableConsole: true,
    enableStorage: getStorageEnabledFromEnv(),
    storageKey: 'tendercells_logs',
  };
}

/**
 * Create custom logger configuration
 */
export function createConfig(overrides: Partial<LoggerConfig>): LoggerConfig {
  return {
    ...createDefaultConfig(),
    ...overrides,
  };
}



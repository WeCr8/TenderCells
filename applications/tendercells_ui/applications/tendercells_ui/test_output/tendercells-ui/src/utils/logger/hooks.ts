/**
 * Logger React Hooks
 * 
 * React hooks for easy logger access in any component.
 * Provides convenient hooks that can be used in parent or child components.
 */

import { useCallback } from 'react';
import { logger } from './index';
import type { LogEntry } from './types';

/**
 * Hook to access the logger instance
 * Can be used in any component (parent or child)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { logInfo, logError, logDebug } = useLogger();
 *   
 *   const handleClick = () => {
 *     logInfo('Button clicked', { buttonId: 'submit' });
 *   };
 *   
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useLogger() {
  const logDebug = useCallback((message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  }, []);

  const logInfo = useCallback((message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  }, []);

  const logWarn = useCallback((message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  }, []);

  const logError = useCallback((message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  }, []);

  const logSuccess = useCallback((message: string, context?: Record<string, any>) => {
    logger.success(message, context);
  }, []);

  const getLogs = useCallback((level?: string): LogEntry[] => {
    return logger.getLogs(level);
  }, []);

  const getRecentLogs = useCallback((count?: number): LogEntry[] => {
    return logger.getRecentLogs(count);
  }, []);

  const getErrors = useCallback((): LogEntry[] => {
    return logger.getErrors();
  }, []);

  const clearLogs = useCallback(() => {
    logger.clear();
  }, []);

  const exportLogs = useCallback((): string => {
    return logger.exportLogs();
  }, []);

  const downloadLogs = useCallback((filename?: string, format?: 'json' | 'csv') => {
    logger.downloadLogs(filename, format);
  }, []);

  const searchLogs = useCallback((query: string): LogEntry[] => {
    return logger.search(query);
  }, []);

  const filterLogsByTime = useCallback((startTime: Date, endTime: Date): LogEntry[] => {
    return logger.filterByTimeRange(startTime, endTime);
  }, []);

  return {
    // Direct logger access (for advanced usage)
    logger,
    
    // Convenience logging methods
    logDebug,
    logInfo,
    logWarn,
    logError,
    logSuccess,
    
    // Log retrieval methods
    getLogs,
    getRecentLogs,
    getErrors,
    
    // Log management methods
    clearLogs,
    exportLogs,
    downloadLogs,
    searchLogs,
    filterLogsByTime,
  };
}

/**
 * Hook for component-specific logging with automatic context
 * Automatically includes component name and props in log context
 * 
 * @example
 * ```tsx
 * function MyComponent({ userId }: { userId: string }) {
 *   const { log } = useComponentLogger('MyComponent', { userId });
 *   
 *   useEffect(() => {
 *     log.info('Component mounted');
 *     // Logs: "Component mounted" with context: { component: 'MyComponent', userId: '123' }
 *   }, []);
 * }
 * ```
 */
export function useComponentLogger(
  componentName: string,
  componentContext?: Record<string, any>
) {
  const createContext = useCallback((additionalContext?: Record<string, any>) => {
    return {
      component: componentName,
      ...componentContext,
      ...additionalContext,
    };
  }, [componentName, componentContext]);

  const log = {
    debug: useCallback((message: string, context?: Record<string, any>) => {
      logger.debug(message, createContext(context));
    }, [createContext]),
    
    info: useCallback((message: string, context?: Record<string, any>) => {
      logger.info(message, createContext(context));
    }, [createContext]),
    
    warn: useCallback((message: string, context?: Record<string, any>) => {
      logger.warn(message, createContext(context));
    }, [createContext]),
    
    error: useCallback((message: string, context?: Record<string, any>) => {
      logger.error(message, createContext(context));
    }, [createContext]),
    
    success: useCallback((message: string, context?: Record<string, any>) => {
      logger.success(message, createContext(context));
    }, [createContext]),
  };

  return { log, logger };
}





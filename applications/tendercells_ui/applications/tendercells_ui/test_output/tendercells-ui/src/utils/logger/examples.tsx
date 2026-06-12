/**
 * Logger Usage Examples - Reference Implementation
 * 
 * This file demonstrates how to use the logger in various component scenarios.
 * Copy and adapt these patterns to your components.
 */

import React, { useEffect, useState } from 'react';
import { logger, useLogger, useComponentLogger } from '@/utils/logger';

// ========================================
// Example 1: Direct Import (Any Component)
// ========================================
export function ExampleDirectImport() {
  const handleClick = () => {
    // Works in any component, any nesting level
    logger.info('Button clicked', { buttonId: 'submit' });
  };

  return <button onClick={handleClick}>Direct Import Example</button>;
}

// ========================================
// Example 2: Using useLogger Hook (React Components)
// ========================================
export function ExampleUseLoggerHook() {
  const { logInfo, logError, logDebug } = useLogger();

  const handleAction = async () => {
    logDebug('Action started', { timestamp: Date.now() });
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      logInfo('Action completed successfully');
    } catch (error) {
      logError('Action failed', { error });
    }
  };

  return <button onClick={handleAction}>Hook Example</button>;
}

// ========================================
// Example 3: Component-Specific Logger
// ========================================
export function ExampleComponentLogger({ userId }: { userId: string }) {
  // Automatically includes component name and props in all logs
  const { log } = useComponentLogger('ExampleComponentLogger', { userId });

  useEffect(() => {
    log.info('Component mounted');
    // Logs: { component: 'ExampleComponentLogger', userId: '123' }
    
    return () => {
      log.info('Component unmounting');
    };
  }, []);

  const handleEvent = () => {
    log.info('Event occurred', { eventType: 'click' });
    // Logs include: { component: 'ExampleComponentLogger', userId: '123', eventType: 'click' }
  };

  return <div onClick={handleEvent}>Component Logger Example</div>;
}

// ========================================
// Example 4: Parent Component
// ========================================
export function ParentComponent() {
  const { logInfo } = useLogger();

  useEffect(() => {
    logInfo('Parent component rendered');
  }, []);

  return (
    <div>
      <h1>Parent</h1>
      <ChildComponent />
    </div>
  );
}

// ========================================
// Example 5: Child Component
// ========================================
function ChildComponent() {
  const { logInfo } = useLogger();

  useEffect(() => {
    logInfo('Child component rendered');
  }, []);

  return <div>Child</div>;
}

// ========================================
// Example 6: Deeply Nested Component
// ========================================
export function DeeplyNestedComponent() {
  // Works from any nesting level - use path alias for consistency
  const { logInfo } = useLogger();

  return (
    <div>
      <div>
        <div>
          <div>
            <button onClick={() => logInfo('Deep button clicked')}>
              Deep Component
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Example 7: Page Component
// ========================================
export function ExamplePage() {
  const { log } = useComponentLogger('ExamplePage');

  useEffect(() => {
    log.info('Page loaded');
  }, []);

  return <div>Page Content</div>;
}

// ========================================
// Example 8: Error Boundary with Logger
// ========================================
export class ErrorBoundaryWithLogger extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logger works in class components too
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}

// ========================================
// Example 9: Custom Hook with Logger
// ========================================
export function useCustomHookWithLogger() {
  const { logInfo, logError } = useLogger();
  const [data, setData] = useState(null);

  useEffect(() => {
    logInfo('Custom hook executing');
    fetch('/api/data')
      .then(res => {
        logInfo('Data fetched successfully');
        setData(res);
      })
      .catch(err => {
        logError('Failed to fetch data', { error: err });
      });
  }, []);

  return data;
}

// ========================================
// Example 10: Log Retrieval in Component
// ========================================
export function LogViewerComponent() {
  const { getLogs, getErrors, getRecentLogs, exportLogs, downloadLogs } = useLogger();
  const [logs, setLogs] = useState<any[]>([]);

  const handleViewLogs = () => {
    const allLogs = getLogs();
    setLogs(allLogs);
  };

  const handleViewErrors = () => {
    const errors = getErrors();
    setLogs(errors);
  };

  const handleExport = () => {
    const json = exportLogs();
    console.log(json);
  };

  const handleDownload = () => {
    downloadLogs('my-logs.json');
  };

  return (
    <div>
      <button onClick={handleViewLogs}>View All Logs</button>
      <button onClick={handleViewErrors}>View Errors</button>
      <button onClick={handleExport}>Export JSON</button>
      <button onClick={handleDownload}>Download Logs</button>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}





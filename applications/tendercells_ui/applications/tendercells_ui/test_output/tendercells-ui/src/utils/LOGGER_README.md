# Logger Utility Documentation

## Overview

The logger utility provides structured logging capabilities for the TenderCells application. It helps developers debug issues across frontend, backend, and integration points.

## Features

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, SUCCESS
- **Structured Context**: Attach additional data to log entries
- **Persistent Storage**: Optionally save logs to localStorage
- **Error Tracking**: Automatic stack trace capture for errors
- **Log Export**: Download logs as JSON files
- **Circular Reference Handling**: Safely logs objects with circular references
- **Session Tracking**: Automatically tracks session IDs

## Usage

### Basic Logging

```typescript
import { logger } from '@/utils/logger';

// Debug logs (only in development)
logger.debug('Processing request', { requestId: 'abc123' });

// Info logs
logger.info('User logged in', { userId: 'user123' });

// Success logs
logger.success('Product registered', { productId: 'prod123' });

// Warnings
logger.warn('Rate limit approaching', { current: 90, limit: 100 });

// Errors
logger.error('Failed to fetch data', { error: err, endpoint: '/api/products' });
```

### Environment Configuration

Set these environment variables in `.env`:

```bash
# Log level (DEBUG, INFO, WARN, ERROR, NONE)
VITE_LOG_LEVEL=DEBUG

# Enable persistent log storage (true/false)
VITE_ENABLE_LOG_STORAGE=true
```

### Retrieving Logs

```typescript
// Get all logs
const allLogs = logger.getLogs();

// Get logs by level
const errorLogs = logger.getLogs('ERROR');

// Get recent logs
const recent = logger.getRecentLogs(50);

// Get only errors
const errors = logger.getErrors();
```

### Exporting Logs

```typescript
// Export as JSON string
const jsonLogs = logger.exportLogs();

// Download as file
logger.downloadLogs('my-logs.json');
```

### Browser Console Access

The logger is also available globally in the browser console:

```javascript
// Access logger from browser console
window.tendercellsLogger.getLogs();
window.tendercellsLogger.getErrors();
window.tendercellsLogger.downloadLogs();
window.tendercellsLogger.clear();
```

## Log Entry Structure

```typescript
interface LogEntry {
  timestamp: string;        // ISO timestamp
  level: string;            // DEBUG, INFO, WARN, ERROR, SUCCESS
  message: string;          // Log message
  context?: Record<string, any>;  // Additional context data
  stack?: string;           // Stack trace for errors
  sessionId?: string;       // Session identifier
}
```

## Best Practices

1. **Use Appropriate Log Levels**:
   - `DEBUG`: Detailed information for debugging
   - `INFO`: General informational messages
   - `WARN`: Warning messages for potential issues
   - `ERROR`: Error messages for failures
   - `SUCCESS`: Successful operations

2. **Include Context**:
   ```typescript
   // Good
   logger.error('Failed to save product', { 
     productId: '123', 
     error: err,
     userId: user.id 
   });
   
   // Bad
   logger.error('Failed to save product');
   ```

3. **Sanitize Sensitive Data**:
   - Never log passwords, tokens, or PII
   - The logger automatically handles circular references
   - Consider what you include in context

4. **Performance**:
   - Debug logs are automatically disabled in production
   - Storage is optional and can be disabled
   - Logs are automatically trimmed to prevent memory issues

## Integration with Error Tracking

The logger can be integrated with external error tracking services:

```typescript
// Example: Send errors to error tracking service
logger.error('Critical error', { error: err });
const errors = logger.getErrors();
// Send to Sentry, LogRocket, etc.
```

## Storage Limits

- Maximum in-memory logs: 1000 entries
- Maximum stored logs: 500 entries
- Old logs are automatically trimmed

## Troubleshooting

### Logs Not Appearing

1. Check log level configuration
2. Verify console is not filtered
3. Check if storage is enabled (for persistent logs)

### Storage Issues

If localStorage quota is exceeded, storage is automatically disabled. Check browser console for warnings.

### Performance Issues

If experiencing performance issues:
1. Reduce log level to WARN or ERROR
2. Disable storage: `logger.setStorageEnabled(false)`
3. Clear old logs: `logger.clear()`

## API Reference

### Methods

- `logger.debug(message, context?)` - Debug level log
- `logger.info(message, context?)` - Info level log
- `logger.warn(message, context?)` - Warning log
- `logger.error(message, context?)` - Error log
- `logger.success(message, context?)` - Success log
- `logger.getLogs(level?)` - Get all logs or filtered by level
- `logger.getRecentLogs(count?)` - Get recent logs
- `logger.getErrors()` - Get error logs only
- `logger.clear()` - Clear all logs
- `logger.exportLogs()` - Export as JSON string
- `logger.downloadLogs(filename?)` - Download as file
- `logger.setLevel(level)` - Set log level dynamically
- `logger.setConsoleEnabled(enabled)` - Enable/disable console output
- `logger.setStorageEnabled(enabled)` - Enable/disable storage





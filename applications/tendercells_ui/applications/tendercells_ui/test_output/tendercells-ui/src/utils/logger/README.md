# Logger Utility Documentation

## Overview

The logger utility is now modular, allowing you to import only the functionality you need. This provides better tree-shaking, smaller bundle sizes, and more flexibility.

## Module Structure

The logger is split into the following modules:

- **`types.ts`** - Type definitions and enums
- **`core.ts`** - Core logging functionality (minimal, no storage/export)
- **`storage.ts`** - Persistent storage capabilities
- **`exporter.ts`** - Log export and download functionality
- **`utils.ts`** - Utility functions for log processing
- **`config.ts`** - Configuration utilities
- **`index.ts`** - Full-featured logger (combines all modules)

## Usage Patterns

### Full-Featured Logger (Default)

Import the complete logger with all features:

```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', { userId: '123' });
logger.error('Failed to fetch data', { error: err });
logger.downloadLogs('my-logs.json');
```

### Minimal Logger (Core Only)

For minimal bundle size, import only the core logger:

```typescript
import { CoreLogger, LogLevel } from '@/utils/logger/core';
import type { LogEntry } from '@/utils/logger/types';

const minimalLogger = new CoreLogger(LogLevel.INFO);
minimalLogger.info('Message', { context });
```

### Custom Logger with Storage Only

Create a logger with storage but without export features:

```typescript
import { CoreLogger } from '@/utils/logger/core';
import { createStorage } from '@/utils/logger/storage';
import { LogLevel } from '@/utils/logger/types';

class StorageLogger extends CoreLogger {
  private storage = createStorage({ storageKey: 'my_logs' });
  
  protected addLog(entry: LogEntry): void {
    super.addLog(entry);
    this.storage.save(this.getInternalLogs());
  }
}

const storageLogger = new StorageLogger(LogLevel.INFO);
```

### Import Specific Utilities

Import only the utilities you need:

```typescript
import { sanitizeContext, formatLogEntry, searchLogs } from '@/utils/logger/utils';
import { createExporter } from '@/utils/logger/exporter';
import { createDefaultConfig } from '@/utils/logger/config';

// Use utilities independently
const sanitized = sanitizeContext({ user: userObject });
const formatted = formatLogEntry(logEntry);
const exporter = createExporter('csv');
```

### Import Types Only

For type checking without runtime code:

```typescript
import type { LogEntry, LoggerConfig } from '@/utils/logger/types';
import { LogLevel } from '@/utils/logger/types';

function processLog(entry: LogEntry): void {
  if (entry.level === LogLevel[LogLevel.ERROR]) {
    // Handle error
  }
}
```

## Available Imports

### From `@/utils/logger` (index.ts)

```typescript
import {
  logger,                    // Singleton instance (full-featured)
  CoreLogger,                // Core logger class
  LogLevel,                  // Log level enum
  LogEntry,                  // Log entry type
  LoggerConfig,              // Config type
  createStorage,             // Storage factory
  createExporter,            // Exporter factory
  JSONLoggerExporter,        // JSON exporter class
  CSVLoggerExporter,         // CSV exporter class
  sanitizeContext,           // Context sanitizer
  extractErrorInfo,          // Error extractor
  getSessionId,              // Session ID getter
  formatLogEntry,            // Log formatter
  filterLogsByLevel,         // Level filter
  searchLogs,                // Log search
  filterLogsByTimeRange,     // Time range filter
  createDefaultConfig,       // Default config factory
  createConfig,              // Custom config factory
  getLogLevelFromEnv,        // Env config getter
} from '@/utils/logger';
```

### From `@/utils/logger/types`

```typescript
import { LogLevel, type LogEntry, type LoggerConfig } from '@/utils/logger/types';
```

### From `@/utils/logger/core`

```typescript
import { CoreLogger } from '@/utils/logger/core';
import { LogLevel } from '@/utils/logger/types';
```

### From `@/utils/logger/storage`

```typescript
import { createStorage, LocalStorageLoggerStorage } from '@/utils/logger/storage';
```

### From `@/utils/logger/exporter`

```typescript
import { 
  createExporter, 
  JSONLoggerExporter, 
  CSVLoggerExporter 
} from '@/utils/logger/exporter';
```

### From `@/utils/logger/utils`

```typescript
import {
  sanitizeContext,
  extractErrorInfo,
  getSessionId,
  formatLogEntry,
  filterLogsByLevel,
  searchLogs,
  filterLogsByTimeRange,
} from '@/utils/logger/utils';
```

### From `@/utils/logger/config`

```typescript
import {
  createDefaultConfig,
  createConfig,
  getLogLevelFromEnv,
  getStorageEnabledFromEnv,
} from '@/utils/logger/config';
```

## Examples

### Example 1: Minimal Production Logger

```typescript
import { CoreLogger, LogLevel } from '@/utils/logger/core';

// Create a production logger with minimal features
const prodLogger = new CoreLogger(LogLevel.WARN);
prodLogger.setConsoleEnabled(true);

prodLogger.error('Critical error', { error: err });
// Only logs WARN and ERROR levels
```

### Example 2: Development Logger with Storage

```typescript
import { CoreLogger, LogLevel } from '@/utils/logger/core';
import { createStorage } from '@/utils/logger/storage';

class DevLogger extends CoreLogger {
  private storage = createStorage({ storageKey: 'dev_logs' });
  
  constructor() {
    super(LogLevel.DEBUG);
    const stored = this.storage.load();
    if (stored.length > 0) {
      (this as any).logs = stored;
    }
  }
  
  protected addLog(entry: LogEntry): void {
    super.addLog(entry);
    this.storage.save(this.getInternalLogs());
  }
  
  clear(): void {
    super.clear();
    this.storage.clear();
  }
}

const devLogger = new DevLogger();
```

### Example 3: Custom Exporter Usage

```typescript
import { logger } from '@/utils/logger';
import { CSVLoggerExporter } from '@/utils/logger/exporter';

// Export as CSV
const csvExporter = new CSVLoggerExporter();
const csv = csvExporter.export(logger.getLogs());
csvExporter.download(logger.getLogs(), 'logs.csv');
```

### Example 4: Using Utilities Independently

```typescript
import { searchLogs, filterLogsByTimeRange } from '@/utils/logger/utils';
import { logger } from '@/utils/logger';

// Search logs
const errorLogs = searchLogs(logger.getLogs(), 'authentication failed');

// Filter by time
const todayLogs = filterLogsByTimeRange(
  logger.getLogs(),
  new Date('2024-01-01'),
  new Date('2024-01-02')
);
```

## Benefits of Modular Design

1. **Smaller Bundle Size**: Import only what you need
2. **Better Tree-Shaking**: Unused code is eliminated
3. **Flexibility**: Mix and match features as needed
4. **Testing**: Easier to test individual components
5. **Customization**: Create custom logger implementations

## Migration Guide

If you're currently using the old monolithic logger:

```typescript
// Old way (still works)
import { logger } from '@/utils/logger';
logger.info('Message');

// New modular way (same result, but more flexible)
import { logger } from '@/utils/logger';
logger.info('Message');

// Or for minimal bundle:
import { CoreLogger, LogLevel } from '@/utils/logger/core';
const myLogger = new CoreLogger(LogLevel.INFO);
myLogger.info('Message');
```

## Browser Console Access

The full logger is still available globally:

```javascript
// In browser console
window.tendercellsLogger.getLogs();
window.tendercellsLogger.downloadLogs();
window.tendercellsLogger.clear();
```

## Environment Configuration

Set these environment variables in `.env`:

```bash
# Log level (DEBUG, INFO, WARN, ERROR, NONE)
VITE_LOG_LEVEL=DEBUG

# Enable persistent log storage (true/false)
VITE_ENABLE_LOG_STORAGE=true
```

## Usage in Any Component (Parent or Child)

The logger can be imported and used from **any component** regardless of nesting level:

### From Parent Components

```typescript
import { useLogger } from '@/utils/logger';

function Dashboard() {
  const { logInfo } = useLogger();
  logInfo('Dashboard rendered');
  return <ChildComponent />;
}
```

### From Child Components

```typescript
import { useLogger } from '@/utils/logger';

function ChildComponent() {
  const { logInfo } = useLogger();
  logInfo('Child rendered');
  return <div>Child</div>;
}
```

### From Deeply Nested Components

```typescript
// Works from any nesting level
import { logger } from '@/utils/logger'; // Path alias works everywhere
// OR
import { logger } from '../../../../utils/logger'; // Relative path also works

function DeeplyNested() {
  logger.info('Deep component');
  return <div>Deep</div>;
}
```

### Import Path Options

All of these work from any location:

1. **Path alias (recommended)**: `import { logger } from '@/utils/logger';`
2. **Relative path**: `import { logger } from '../../utils/logger';`
3. **Direct import**: `import { logger } from 'utils/logger';` (if configured)

The `@/` alias is configured in `vite.config.ts` and `tsconfig.json` to work from any file location.

See `USAGE_EXAMPLES.md` for more detailed examples.





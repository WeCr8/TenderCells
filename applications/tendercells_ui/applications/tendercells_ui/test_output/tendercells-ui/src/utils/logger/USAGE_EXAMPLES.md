# Logger Usage Examples

## Quick Start

The logger can be used in **any component** (parent or child) using multiple import patterns.

## Import Patterns

### Pattern 1: Direct Import (Anywhere)

```typescript
// Works from any file location
import { logger } from '@/utils/logger';
import { logger } from '../../utils/logger'; // Relative path also works
import { logger } from '../../../utils/logger'; // From nested components

// Usage
logger.info('Message', { context });
```

### Pattern 2: Using React Hook (Recommended for Components)

```typescript
// In any React component
import { useLogger } from '@/utils/logger';

function MyComponent() {
  const { logInfo, logError, logDebug } = useLogger();
  
  const handleAction = () => {
    logInfo('Action performed', { actionType: 'click' });
  };
  
  return <div onClick={handleAction}>Click me</div>;
}
```

### Pattern 3: Component-Specific Logger

```typescript
// Automatically includes component name in context
import { useComponentLogger } from '@/utils/logger';

function UserProfile({ userId }: { userId: string }) {
  const { log } = useComponentLogger('UserProfile', { userId });
  
  useEffect(() => {
    log.info('Profile loaded');
    // Logs include: { component: 'UserProfile', userId: '123' }
  }, []);
  
  return <div>Profile</div>;
}
```

### Pattern 4: Minimal Import (Tree-Shaking)

```typescript
// Import only what you need
import { CoreLogger, LogLevel } from '@/utils/logger/core';
import { createStorage } from '@/utils/logger/storage';
```

## Usage in Different Component Types

### Parent Component

```typescript
import { useLogger } from '@/utils/logger';

function DashboardLayout() {
  const { logInfo, logError } = useLogger();
  
  useEffect(() => {
    logInfo('Dashboard mounted');
  }, []);
  
  return <div>Dashboard</div>;
}
```

### Child Component

```typescript
import { useLogger } from '@/utils/logger';

function TelemetryPanel() {
  const { logInfo } = useLogger();
  
  const handleDataUpdate = () => {
    logInfo('Telemetry data updated');
  };
  
  return <div>Telemetry</div>;
}
```

### Deeply Nested Component

```typescript
// Works from any nesting level
import { logger } from '@/utils/logger'; // Path alias works
// OR
import { logger } from '../../../../utils/logger'; // Relative path works

function DeeplyNestedComponent() {
  logger.info('Deep component rendered');
  return <div>Deep</div>;
}
```

### Page Component

```typescript
import { useComponentLogger } from '@/utils/logger';

function AccountPage() {
  const { log } = useComponentLogger('AccountPage');
  
  useEffect(() => {
    log.info('Page loaded');
  }, []);
  
  return <div>Account Page</div>;
}
```

### Utility/Service File

```typescript
// In non-React files (services, utils, etc.)
import { logger } from '@/utils/logger';

export async function fetchData() {
  logger.debug('Fetching data');
  try {
    const data = await api.get('/data');
    logger.success('Data fetched', { count: data.length });
    return data;
  } catch (error) {
    logger.error('Failed to fetch data', { error });
    throw error;
  }
}
```

## Import Path Options

All of these work from any location:

```typescript
// 1. Path alias (recommended) - works from anywhere
import { logger } from '@/utils/logger';

// 2. Relative path from component
import { logger } from '../../utils/logger';        // 2 levels up
import { logger } from '../../../utils/logger';     // 3 levels up
import { logger } from '../../../../utils/logger';  // 4 levels up

// 3. Absolute import (if configured)
import { logger } from 'utils/logger';
```

## Common Use Cases

### Error Logging in Try-Catch

```typescript
import { useLogger } from '@/utils/logger';

function MyComponent() {
  const { logError, logInfo } = useLogger();
  
  const handleSubmit = async () => {
    try {
      await submitForm();
      logInfo('Form submitted successfully');
    } catch (error) {
      logError('Form submission failed', { error, formData });
    }
  };
}
```

### Performance Logging

```typescript
import { useLogger } from '@/utils/logger';

function ExpensiveComponent() {
  const { logDebug } = useLogger();
  
  useEffect(() => {
    const startTime = performance.now();
    // ... expensive operation
    const duration = performance.now() - startTime;
    logDebug('Operation completed', { duration: `${duration}ms` });
  }, []);
}
```

### User Action Tracking

```typescript
import { useComponentLogger } from '@/utils/logger';

function ProductCard({ product }: { product: Product }) {
  const { log } = useComponentLogger('ProductCard', { productId: product.id });
  
  const handleClick = () => {
    log.info('Product card clicked');
  };
  
  return <div onClick={handleClick}>{product.name}</div>;
}
```

### API Call Logging

```typescript
import { logger } from '@/utils/logger';

export async function apiCall(endpoint: string, data: any) {
  logger.debug('API call initiated', { endpoint, data });
  
  try {
    const response = await fetch(endpoint, { body: JSON.stringify(data) });
    logger.success('API call succeeded', { endpoint, status: response.status });
    return response;
  } catch (error) {
    logger.error('API call failed', { endpoint, error });
    throw error;
  }
}
```

## Tips

1. **Use hooks in React components** - `useLogger()` provides memoized callbacks
2. **Use direct import in utilities** - `logger` works in non-React files
3. **Use component logger for automatic context** - Easier debugging
4. **Path alias (`@/`)** works from anywhere once configured
5. **Relative paths** also work but require counting directory levels





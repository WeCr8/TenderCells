# Development Guide

## Local Development Setup

### Initial Setup

1. **Run the setup script**:
   ```powershell
   .\setup-dev.ps1
   ```

   Or manually:
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

### Development Workflow

#### 1. Making Changes

- Edit files in `src/`
- Vite will automatically reload the browser
- Hot Module Replacement (HMR) updates without full page reload

#### 2. Running Tests

**Watch Mode** (recommended):
```bash
npm test
```

**Run Once**:
```bash
npm test -- --run
```

**Specific Test File**:
```bash
npm test -- --run src/__tests__/integration/hardware/wifi.test.ts
```

#### 3. Checking Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Service Integration

### WiFi Service

In development, the WiFi service uses mocks automatically:

```typescript
import { wifiService } from '@/services/wifiService';

// This will use window.wifiService (mocked in tests)
const networks = await wifiService.scanNetworks();
```

### MQTT Service

MQTT service also uses mocks in development:

```typescript
import { mqttService } from '@/services/mqttService';

const client = await mqttService.connect('mqtt://localhost:1883');
```

### Using Services in Components

Services are automatically available via `window` object when `setupHardwareMocks()` is called (done automatically in tests).

## Testing

### Test Structure

```
src/__tests__/
├── integration/        # Integration tests
│   ├── hardware/       # Hardware service tests
│   ├── ui/             # UI + service integration
│   └── setup-wizard/   # Setup flow tests
└── unit/               # Unit tests
    ├── components/     # Component tests
    └── services/        # Service tests
```

### Writing Tests

**Unit Test Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**Integration Test Example**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupHardwareMocks, resetHardwareMocks } from '@/tests/mocks/hardware';
import { wifiService } from '@/services/wifiService';

describe('WiFi Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
  });

  it('scans networks', async () => {
    const networks = await wifiService.scanNetworks();
    expect(networks.length).toBeGreaterThan(0);
  });
});
```

## Debugging

### Browser DevTools

- **React DevTools**: Install browser extension
- **Network Tab**: Monitor API calls
- **Console**: Check for errors and logs

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Test Debugging

```bash
# Run tests with debug output
npm test -- --run --reporter=verbose

# Run specific test with debugging
npm test -- --run src/__tests__/integration/hardware/wifi.test.ts --reporter=verbose
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### Test Failures

```bash
# Clear test cache
npm test -- --clearCache

# Run with more details
npm test -- --run --reporter=verbose
```

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── products/       # Product-specific components
│   └── ...
├── hooks/              # Custom React hooks
│   └── useProducts.ts  # Product management hook
├── pages/              # Page components
├── services/           # Service layer
│   ├── wifiService.ts  # WiFi service
│   ├── mqttService.ts  # MQTT service
│   └── productsService.ts
├── tests/              # Test utilities
│   ├── mocks/          # Mock implementations
│   └── fixtures/       # Test data
└── utils/              # Utility functions
```

## Code Style

### TypeScript

- Use strict mode (enabled in `tsconfig.json`)
- Prefer interfaces over types for object shapes
- Use `@/` alias for imports from `src/`

### React

- Use functional components with hooks
- Prefer named exports
- Use TypeScript for props

### Testing

- One test file per component/service
- Use descriptive test names
- Test both success and error cases
- Use mocks for external dependencies

## Building

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview  # Preview production build
```

## Next Steps

1. ✅ Set up environment: `.env` file
2. ✅ Install dependencies: `npm install`
3. ✅ Start dev server: `npm run dev`
4. ✅ Run tests: `npm test`
5. 🚀 Start coding!

For more details, see:
- [README.md](./README.md) - General overview
- [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) - Service integration details





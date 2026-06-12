# TenderCells UI - Local Development Setup

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: For version control

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd applications/tendercells_ui/applications/tendercells_ui/test_output/tendercells-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
VITE_API_BASE_URL=http://localhost:5173/api
VITE_SIM_MODE=true

# Backend
API_PORT=4000

# 3D Model Storage
VITE_MODEL_STORAGE_URL=http://localhost:5173/models
MAX_MODEL_FILE_SIZE=50MB

# Firebase (if using)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Development Scripts

### Core Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Testing Commands

- `npm test` - Run all tests in watch mode
- `npm test -- --run` - Run all tests once
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Generate test coverage report
- `npm run test:all` - Run all tests (unit + integration + e2e)

### E2E Testing

- `npm run test:e2e` - Run Cypress tests headlessly
- `npm run test:e2e:open` - Open Cypress test runner

## Project Structure

```
tendercells-ui/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── integration/    # Integration tests
│   │   └── unit/           # Unit tests
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # Service layer (WiFi, MQTT, etc.)
│   ├── tests/              # Test utilities and mocks
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── cypress/                # E2E tests
├── public/                 # Static assets
└── dist/                   # Production build output
```

## Services & Connections

### WiFi Service

The WiFi service provides network scanning and connection functionality:

```typescript
import { wifiService } from '@/services/wifiService';

// Scan for networks
const networks = await wifiService.scanNetworks();

// Connect to network
const result = await wifiService.connectToNetwork('Network-Name', 'password');
```

**In Development**: Uses mock service via `window.wifiService`

### MQTT Service

The MQTT service handles device communication:

```typescript
import { mqttService } from '@/services/mqttService';

// Connect to broker
const client = await mqttService.connect('mqtt://localhost:1883');

// Subscribe to topics
await mqttService.subscribe(client, 'tendercells/devices/+/status');

// Publish messages
await mqttService.publish(client, 'topic', JSON.stringify(data), { qos: 1 });
```

**In Development**: Uses mock service via `window.mqttService`

## Testing Setup

### Running Tests

All tests use Vitest and React Testing Library:

```bash
# Watch mode (recommended during development)
npm test

# Run once
npm test -- --run

# Specific test file
npm test -- --run src/__tests__/integration/hardware/wifi.test.ts
```

### Test Structure

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component + service interactions
- **E2E Tests**: Test full user flows with Cypress

### Mock Services

Hardware services are automatically mocked in tests via `setupHardwareMocks()`. This ensures:
- Tests run without actual hardware
- Predictable test behavior
- Fast test execution

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Run Tests in Watch Mode

In a separate terminal:

```bash
npm test
```

### 3. Make Changes

- Edit files in `src/`
- Hot reload will automatically refresh the browser
- Tests will re-run on file changes

### 4. Check Linting

```bash
npm run lint
```

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Test Failures

```bash
# Clear test cache
npm test -- --clearCache

# Run with verbose output
npm test -- --run --reporter=verbose
```

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

### Formatting

Consider adding Prettier:

```bash
npm install --save-dev prettier
```

## Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

The production build will be in the `dist/` directory.

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Material-UI Documentation](https://mui.com/)

## Getting Help

- Check the [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for service integration details
- Review test files in `src/__tests__/` for usage examples
- Check component documentation in code comments

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Set up environment: `cp .env.example .env`
3. ✅ Start dev server: `npm run dev`
4. ✅ Run tests: `npm test`
5. 🚀 Start developing!





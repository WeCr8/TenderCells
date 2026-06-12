# Test Execution Guide

## ✅ Setup Complete

The test suite has been fully configured and is ready to run. The dev server is running in the background.

## Running Tests

### Option 1: Run All Tests
```bash
cd applications/TenderCells_UI/applications/tendercells_ui/test_output/tendercells-ui
npm test
```

### Option 2: Run Specific Test Suites

#### Unit Tests Only
```bash
npm run test:unit
```

#### Integration Tests Only
```bash
npm run test:integration
```

#### E2E Tests Only (requires dev server)
```bash
npm run test:e2e
```

#### All Test Suites
```bash
npm run test:all
```

#### With Coverage Report
```bash
npm run test:coverage
```

### Option 3: Interactive Test UI
```bash
npm run test:ui
```

This opens Vitest's interactive UI where you can:
- See all tests
- Run specific tests
- Watch for changes
- See test results in real-time

### Option 4: E2E Tests (Interactive)
```bash
npm run test:e2e:open
```

This opens Cypress Test Runner where you can:
- See all E2E tests
- Run tests interactively
- Watch tests execute in browser
- Debug test failures

## Test Files Location

### Unit Tests
- `src/__tests__/unit/components/` - Component tests
- `src/__tests__/unit/services/` - Service tests

### Integration Tests
- `src/__tests__/integration/firebase/` - Firebase tests
- `src/__tests__/integration/hardware/` - Hardware tests
- `src/__tests__/integration/cnc/` - CNC/GRBL tests
- `src/__tests__/integration/maps/` - Google Maps tests
- `src/__tests__/integration/setup-wizard/` - Setup wizard tests

### E2E Tests
- `cypress/e2e/` - All Cypress E2E tests

## Expected Test Results

When you run the tests, you should see:

1. **Unit Tests**: ~20+ test cases covering:
   - ProductRegistrationModal component
   - ConnectionSetupWizard component
   - MainLayout component
   - Dashboard components
   - ProductsService

2. **Integration Tests**: ~30+ test cases covering:
   - Firebase (Firestore, Auth, Storage)
   - Hardware (BLE, WiFi, MQTT, WebSocket)
   - CNC/GRBL coordinate systems
   - Google Maps integration
   - Setup wizard device connection

3. **E2E Tests**: ~15+ test cases covering:
   - Product registration flow
   - Firebase authentication
   - Dashboard navigation
   - CNC coordinates
   - Setup wizard flow
   - Connectivity tests

## Troubleshooting

### Tests Not Running
1. Ensure dependencies are installed: `npm install`
2. Check that dev server is running for E2E tests: `npm run dev`
3. Verify test files exist in `src/__tests__/` directory

### Import Errors
- All imports use path aliases (`@/`) configured in `vitest.config.ts`
- Ensure `tsconfig.json` has path mappings configured

### Mock Errors
- Mocks are in `src/tests/mocks/`
- Ensure `src/tests/setup.ts` is loaded (configured in `vitest.config.ts`)

### E2E Test Failures
- Ensure dev server is running on `http://localhost:5173`
- Check Cypress config in `cypress.config.ts`
- Some tests may need `data-testid` attributes added to components

## Test Coverage

After running `npm run test:coverage`, you'll get:
- Coverage report in terminal
- HTML coverage report in `coverage/` directory
- Coverage for:
  - Components
  - Services
  - Hooks
  - Utilities

## Next Steps

1. **Run the tests** using one of the commands above
2. **Review test results** - Fix any failing tests
3. **Add missing test cases** for any uncovered functionality
4. **Update mocks** if component APIs change
5. **Add data-testid attributes** to components for E2E tests

## Quick Test Commands Reference

```bash
# Quick test run
npm test

# Watch mode (re-runs on file changes)
npm test -- --watch

# Single test file
npx vitest run src/__tests__/unit/components/ProductRegistrationModal.test.tsx

# With UI
npm run test:ui

# Coverage
npm run test:coverage

# E2E interactive
npm run test:e2e:open
```

## Status

✅ Dependencies installed
✅ Dev server running (background)
✅ Test configuration complete
✅ All test files created
✅ Mock services ready
✅ Test fixtures available

**Ready to run tests!** 🚀






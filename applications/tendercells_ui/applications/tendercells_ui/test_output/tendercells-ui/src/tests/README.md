# Testing Guide

This directory contains the comprehensive test suite for TenderCells UI.

## Test Structure

- `__tests__/unit/` - Unit tests for components, services, hooks, and utilities
- `__tests__/integration/` - Integration tests for Firebase, hardware, CNC, and Maps
- `fixtures/` - Test data and fixtures
- `mocks/` - Mock services for external dependencies
- `utils/` - Test utilities and helpers

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e          # Headless
npm run test:e2e:open     # Interactive
```

### All Tests
```bash
npm run test:all
```

### Coverage
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:
- ✅ Component rendering and interactions
- ✅ Service API calls and data handling
- ✅ Firebase integration (Auth, Firestore, Storage)
- ✅ Hardware connectivity (BLE, WiFi, MQTT, WebSocket)
- ✅ CNC/GRBL coordinate systems
- ✅ Google Maps integration
- ✅ Setup Wizard and device connection flows
- ✅ End-to-end user flows

## Setup Wizard Tests

The setup wizard tests ensure developers and users can successfully connect devices:

### Unit Tests
- `ConnectionSetupWizard.test.tsx` - Tests all wizard steps:
  - Network selection (SSID, security type)
  - Credentials entry (password validation)
  - Pairing process (connection, success, error handling)
  - Verification and completion

### Integration Tests
- `device-connection.test.ts` - Tests device connection integration:
  - WiFi network scanning and connection
  - BLE device pairing
  - MQTT communication setup
  - Complete setup flow from start to finish
  - Error handling and retry logic
  - Device verification after connection

### E2E Tests
- `setup-wizard.cy.ts` - End-to-end tests for:
  - Complete device connection flow
  - WiFi network selection from scan results
  - Open network handling (no password)
  - Connection failure and retry
  - Field validation at each step
  - BLE device pairing during setup
  - Device status verification after setup

## Mock Services

All external services are mocked for testing:
- Firebase (Auth, Firestore, Storage)
- Web Bluetooth API
- MQTT clients
- WebSocket connections
- GRBL/CNC devices
- Google Maps API

## Writing New Tests

1. **Unit Tests**: Test individual components/services in isolation
2. **Integration Tests**: Test service interactions with mocked dependencies
3. **E2E Tests**: Test complete user flows in Cypress

Use the provided fixtures and mocks to ensure consistent test data.


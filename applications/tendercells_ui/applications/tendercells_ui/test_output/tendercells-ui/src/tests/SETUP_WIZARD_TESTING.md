# Setup Wizard Testing Guide

This guide explains how to use and run the setup wizard tests to ensure device connection functionality works for both developers and end users.

## Overview

The Setup Wizard is a multi-step process that guides users through connecting TenderCells devices to their network. The test suite ensures:

1. **Developers** can verify device connection logic works correctly
2. **Users** can successfully connect devices through the wizard interface
3. All connection methods (WiFi, BLE, MQTT) are properly tested

## Test Structure

### Unit Tests (`ConnectionSetupWizard.test.tsx`)

Tests the wizard component in isolation:

```bash
npm run test:unit -- ConnectionSetupWizard
```

**What it tests:**
- ✅ All 4 wizard steps render correctly
- ✅ Network step: SSID input and security type selection
- ✅ Credentials step: Password validation (required for secured networks, disabled for open)
- ✅ Pairing step: Connection process, success/error states, retry functionality
- ✅ Verification step: Completion message and callback execution
- ✅ Navigation: Back button, form reset on close

### Integration Tests (`device-connection.test.ts`)

Tests device connection with mocked hardware services:

```bash
npm run test:integration -- device-connection
```

**What it tests:**
- ✅ WiFi network scanning
- ✅ WiFi connection (secured and open networks)
- ✅ BLE device scanning and pairing
- ✅ MQTT broker connection and communication
- ✅ Complete setup flow from start to finish
- ✅ Error handling and retry logic
- ✅ Device verification after connection

### E2E Tests (`setup-wizard.cy.ts`)

Tests the complete user flow in a browser:

```bash
npm run test:e2e:open
# Then select setup-wizard.cy.ts
```

**What it tests:**
- ✅ Complete device connection flow from UI
- ✅ WiFi network selection from scan results
- ✅ Open network handling (no password required)
- ✅ Connection failure and retry from UI
- ✅ Field validation at each step
- ✅ BLE device pairing during setup
- ✅ Device status verification after setup

## Running Tests

### Run All Setup Wizard Tests

```bash
# Unit tests
npm run test:unit -- ConnectionSetupWizard

# Integration tests
npm run test:integration -- device-connection

# E2E tests
npm run test:e2e -- --spec "cypress/e2e/setup-wizard.cy.ts"
```

### Run Specific Test Suites

```bash
# Only unit tests
npm run test:unit

# Only integration tests
npm run test:integration

# Only E2E tests
npm run test:e2e
```

## Test Scenarios Covered

### 1. Successful Connection Flow

**Scenario:** User successfully connects a device through all wizard steps

**Steps:**
1. Enter WiFi SSID
2. Select security type
3. Enter password (if required)
4. Wait for pairing
5. Verify connection

**Expected:** Device shows as connected after completion

### 2. Open Network Connection

**Scenario:** User connects to an open WiFi network (no password)

**Steps:**
1. Enter SSID
2. Select "None (Open)" security
3. Password field should be disabled
4. Proceed to pairing

**Expected:** Connection succeeds without password

### 3. Connection Failure and Retry

**Scenario:** Connection fails, user retries

**Steps:**
1. Complete network and credentials
2. Connection fails
3. Click "Try Again"
4. Returns to credentials step
5. Retry connection

**Expected:** User can retry without restarting wizard

### 4. Field Validation

**Scenario:** User tries to proceed without required fields

**Steps:**
1. Try to proceed without SSID → Button disabled
2. Enter SSID, proceed
3. Try to proceed without password (for secured network) → Button disabled
4. Enter password, proceed

**Expected:** Next button only enabled when required fields are filled

### 5. BLE Device Pairing

**Scenario:** User pairs BLE device during setup

**Steps:**
1. Complete WiFi setup
2. In pairing step, scan for BLE devices
3. Select device from list
4. Verify pairing success

**Expected:** BLE device paired and ready for communication

## Mock Services

The tests use mocked hardware services to simulate device connections:

### WiFi Service Mock
- `scanNetworks()` - Returns list of available networks
- `connectToNetwork(ssid, password)` - Simulates connection

### BLE Service Mock
- `scanDevices()` - Returns list of BLE devices
- `connectDevice(deviceId)` - Simulates BLE pairing

### MQTT Service Mock
- `connect(brokerUrl)` - Simulates MQTT connection
- `subscribe(topic)` - Simulates topic subscription
- `publish(topic, message)` - Simulates message publishing

## Adding New Tests

### Adding a Unit Test

```typescript
it('should test new wizard feature', () => {
  render(<ConnectionSetupWizard {...props} />);
  // Your test assertions
});
```

### Adding an Integration Test

```typescript
it('should test new device connection scenario', async () => {
  // Setup mocks
  // Execute connection flow
  // Verify results
});
```

### Adding an E2E Test

```typescript
it('should test new user flow', () => {
  cy.visit('/');
  // Navigate through wizard
  // Verify UI interactions
});
```

## Troubleshooting

### Tests Failing Due to Timeouts

If tests timeout, increase timeout values:
- Unit/Integration: Use `waitFor` with `timeout` option
- E2E: Use `cy.get(selector, { timeout: 10000 })`

### Mock Services Not Working

Ensure mocks are properly set up in `beforeEach`:
```typescript
beforeEach(() => {
  resetHardwareMocks();
  setupHardwareMocks();
});
```

### E2E Tests Not Finding Elements

Add `data-testid` attributes to components:
```tsx
<Button data-testid="wizard-next-button">Next</Button>
```

## Best Practices

1. **Always test error cases** - Connection failures, invalid inputs, etc.
2. **Test all wizard steps** - Don't skip steps in tests
3. **Use meaningful test names** - Describe what the test verifies
4. **Mock external services** - Don't rely on real hardware in tests
5. **Test user flows** - E2E tests should mirror real user behavior

## Continuous Integration

All setup wizard tests run automatically in CI:

```yaml
# Example CI configuration
- name: Run Setup Wizard Tests
  run: |
    npm run test:unit -- ConnectionSetupWizard
    npm run test:integration -- device-connection
    npm run test:e2e -- --spec "cypress/e2e/setup-wizard.cy.ts"
```

## Support

For questions or issues with setup wizard tests:
1. Check test output for specific error messages
2. Review mock service implementations
3. Verify test data fixtures are correct
4. Consult the main test README for general testing guidance






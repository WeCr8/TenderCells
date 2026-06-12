# Integration Testing Guide

## Overview

This document describes how UI components, services, and hardware connections work together in the TenderCells application.

## Architecture

```
UI Components
    ↓
Services (WiFi, MQTT, BLE, WebSocket)
    ↓
Hardware Mocks (for testing)
    ↓
Test Fixtures
```

## Services

### WiFi Service (`src/services/wifiService.ts`)

Provides WiFi network scanning and connection functionality:

```typescript
import { wifiService } from '@/services/wifiService';

// Scan for networks
const networks = await wifiService.scanNetworks();

// Connect to network
const result = await wifiService.connectToNetwork('Network-Name', 'password');

// Get current network
const current = await wifiService.getCurrentNetwork();

// Disconnect
await wifiService.disconnect();
```

### MQTT Service (`src/services/mqttService.ts`)

Provides MQTT broker communication for device messaging:

```typescript
import { mqttService } from '@/services/mqttService';

// Connect to broker
const client = await mqttService.connect('mqtt://localhost:1883');

// Subscribe to topics
await mqttService.subscribe(client, 'tendercells/devices/+/status');

// Publish messages
await mqttService.publish(client, 'topic', JSON.stringify(data), { qos: 1 });

// Disconnect
await mqttService.disconnect(client);
```

## Testing Setup

### Hardware Mocks

All hardware services are mocked in `src/tests/mocks/hardware.ts`:

- `mockWiFiService` - WiFi network operations
- `mockMQTTService` - MQTT broker communication
- `mockBLEService` - Bluetooth Low Energy operations
- `mockWebSocketService` - WebSocket connections

### Test Fixtures

Test data is provided in `src/tests/fixtures/`:

- `devices.ts` - WiFi networks, BLE devices, MQTT messages
- `products.ts` - Product data for testing

### Setup Function

Call `setupHardwareMocks()` in your test `beforeEach` to make services available:

```typescript
import { setupHardwareMocks, resetHardwareMocks } from '@/tests/mocks/hardware';

beforeEach(() => {
  resetHardwareMocks();
  setupHardwareMocks(); // Makes services available via window object
});
```

## Integration Test Examples

### WiFi Connection Flow

```typescript
// 1. Scan networks
const networks = await wifiService.scanNetworks();

// 2. Connect to network
const result = await wifiService.connectToNetwork(networks[0].ssid, 'password');

// 3. Create network config
const networkConfig = {
  ssid: result.ssid,
  password: 'password',
  securityType: networks[0].security,
  connected: true,
  ipAddress: result.ipAddress,
};

// 4. Connect product
await ProductsService.connectProduct(productId, { network_config: networkConfig });
```

### MQTT Device Communication

```typescript
// 1. Connect to MQTT broker
const client = await mqttService.connect('mqtt://localhost:1883');

// 2. Subscribe to device topics
await mqttService.subscribe(client, `tendercells/devices/${deviceId}/status`);
await mqttService.subscribe(client, `tendercells/devices/${deviceId}/telemetry`);

// 3. Send command
await mqttService.publish(
  client,
  `tendercells/devices/${deviceId}/commands`,
  JSON.stringify({ action: 'get_status' }),
  { qos: 1 }
);

// 4. Receive response (handled by message handler)
client.on('message', (topic, payload) => {
  const data = JSON.parse(payload);
  // Handle device response
});
```

### Complete Setup Flow

```typescript
// Full device setup: WiFi -> MQTT -> Product Registration

// Step 1: WiFi Connection
const networks = await wifiService.scanNetworks();
const wifiResult = await wifiService.connectToNetwork(networks[0].ssid, 'password');

// Step 2: MQTT Connection
const mqttClient = await mqttService.connect('mqtt://localhost:1883');
await mqttService.subscribe(mqttClient, `tendercells/devices/${deviceId}/status`);

// Step 3: Product Connection
const networkConfig = {
  ssid: wifiResult.ssid,
  password: 'password',
  securityType: networks[0].security,
  connected: true,
  ipAddress: wifiResult.ipAddress,
};
await ProductsService.connectProduct(productId, { network_config: networkConfig });

// Step 4: Verify Connection
await mqttService.publish(
  mqttClient,
  `tendercells/devices/${deviceId}/status`,
  JSON.stringify({ status: 'online' }),
  { qos: 1 }
);
```

## Test Files

### Integration Tests

- `src/__tests__/integration/hardware/wifi.test.ts` - WiFi service tests
- `src/__tests__/integration/hardware/mqtt.test.ts` - MQTT service tests
- `src/__tests__/integration/hardware/ble.test.ts` - BLE service tests
- `src/__tests__/integration/hardware/websocket.test.ts` - WebSocket tests
- `src/__tests__/integration/setup-wizard/device-connection.test.ts` - Setup wizard flow
- `src/__tests__/integration/ui/ConnectionSetupWizard.integration.test.tsx` - UI integration
- `src/__tests__/integration/ui/MQTTConnection.integration.test.tsx` - MQTT UI integration
- `src/__tests__/integration/ui/FullConnectionFlow.integration.test.tsx` - Complete flow

### Unit Tests

- `src/__tests__/unit/components/` - Component unit tests
- `src/__tests__/unit/services/` - Service unit tests

## Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit

# Run specific test file
npm test -- --run src/__tests__/integration/hardware/wifi.test.ts
```

## Error Handling

All services handle errors gracefully:

- **WiFi**: Connection timeouts, wrong passwords, weak signals
- **MQTT**: Connection failures, publish errors, subscription failures
- **BLE**: Device not found, connection failures
- **WebSocket**: Connection drops, reconnection logic

## Best Practices

1. **Always reset mocks** in `beforeEach`:
   ```typescript
   beforeEach(() => {
     resetHardwareMocks();
     setupHardwareMocks();
   });
   ```

2. **Use service interfaces** instead of direct mock access in components

3. **Test error scenarios** as well as success cases

4. **Verify service calls** in integration tests:
   ```typescript
   expect(mockWiFiService.connectToNetwork).toHaveBeenCalledWith('Network', 'password');
   ```

5. **Test complete flows** end-to-end, not just individual pieces

## Status

✅ All integration tests passing
✅ UI components work with services
✅ Services work with hardware mocks
✅ Error handling tested
✅ Real-world scenarios covered

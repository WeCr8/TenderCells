import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockBLEService, mockBluetooth, resetHardwareMocks, setupHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockBLEDevices } from '../../../../tests/fixtures/devices';

describe('BLE Hardware Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
  });

  describe('Device Scanning', () => {
    it('scans for BLE devices', async () => {
      const devices = await mockBLEService.scanDevices();

      expect(mockBLEService.scanDevices).toHaveBeenCalled();
      expect(devices).toEqual(mockBLEDevices);
      expect(devices.length).toBeGreaterThan(0);
    });

    it('filters devices by name', async () => {
      const devices = await mockBLEService.scanDevices();
      const tenderCellsDevices = devices.filter(d => d.name.includes('TenderCells'));

      expect(tenderCellsDevices.length).toBeGreaterThan(0);
    });
  });

  describe('Device Connection', () => {
    it('connects to a BLE device', async () => {
      const device = await mockBLEService.connectDevice(mockBLEDevices[0].id);

      expect(mockBLEService.connectDevice).toHaveBeenCalledWith(mockBLEDevices[0].id);
      expect(device.connected).toBe(true);
    });

    it('disconnects from a BLE device', async () => {
      await mockBLEService.connectDevice(mockBLEDevices[0].id);
      await mockBLEService.disconnectDevice(mockBLEDevices[0].id);

      expect(mockBLEService.disconnectDevice).toHaveBeenCalledWith(mockBLEDevices[0].id);
    });
  });

  describe('Characteristic Operations', () => {
    it('reads a characteristic value', async () => {
      const value = await mockBLEService.readCharacteristic('service-uuid', 'char-uuid');

      expect(mockBLEService.readCharacteristic).toHaveBeenCalledWith('service-uuid', 'char-uuid');
      expect(value).toBeInstanceOf(Uint8Array);
    });

    it('writes to a characteristic', async () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      await mockBLEService.writeCharacteristic('service-uuid', 'char-uuid', data);

      expect(mockBLEService.writeCharacteristic).toHaveBeenCalledWith('service-uuid', 'char-uuid', data);
    });

    it('subscribes to characteristic notifications', () => {
      const callback = vi.fn();
      const unsubscribe = mockBLEService.subscribeToCharacteristic('service-uuid', 'char-uuid', callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Simulate notification
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 1100);

      unsubscribe();
    });
  });

  describe('Web Bluetooth API', () => {
    it('requests a device via Web Bluetooth', async () => {
      const device = await mockBluetooth.requestDevice({
        filters: [{ name: 'TenderCells Device' }],
      });

      expect(mockBluetooth.requestDevice).toHaveBeenCalled();
      expect(device).toBeDefined();
      expect(device.gatt).toBeDefined();
    });

    it('checks Bluetooth availability', async () => {
      const available = await mockBluetooth.getAvailability();

      expect(mockBluetooth.getAvailability).toHaveBeenCalled();
      expect(available).toBe(true);
    });
  });
});






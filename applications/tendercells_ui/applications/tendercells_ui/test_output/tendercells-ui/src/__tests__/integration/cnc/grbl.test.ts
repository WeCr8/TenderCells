import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockGRBLService, resetCNCMocks, setMockStatus, getMockStatus } from '../../../../tests/mocks/cnc';
import { mockMachineStatuses, mockGRBLCommands, mockCoordinateSystems } from '../../../../tests/fixtures/coordinates';
import type { CoordinateSystem, Position } from '../../../../tests/fixtures/coordinates';

describe('CNC/GRBL Integration', () => {
  beforeEach(() => {
    resetCNCMocks();
  });

  describe('Connection Management', () => {
    it('connects to GRBL device', async () => {
      const port = await mockGRBLService.connect('/dev/ttyUSB0');

      expect(mockGRBLService.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
      expect(port.isOpen).toBe(true);
    });

    it('disconnects from GRBL device', async () => {
      await mockGRBLService.connect('/dev/ttyUSB0');
      await mockGRBLService.disconnect();

      expect(mockGRBLService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Coordinate System Management', () => {
    it('sets coordinate system to G54', async () => {
      await mockGRBLService.setCoordinateSystem('G54');

      expect(mockGRBLService.setCoordinateSystem).toHaveBeenCalledWith('G54');
      const status = getMockStatus();
      expect(status.coordinateSystem).toBe('G54');
    });

    it('switches between coordinate systems', async () => {
      for (const system of mockCoordinateSystems) {
        await mockGRBLService.setCoordinateSystem(system);
        const status = getMockStatus();
        expect(status.coordinateSystem).toBe(system);
      }
    });
  });

  describe('Position Tracking', () => {
    it('gets current machine status', async () => {
      const status = await mockGRBLService.getStatus();

      expect(mockGRBLService.getStatus).toHaveBeenCalled();
      expect(status).toBeDefined();
      expect(status.position.work).toBeDefined();
      expect(status.position.machine).toBeDefined();
    });

    it('tracks X, Y, Z positions', async () => {
      const status = await mockGRBLService.getStatus();

      expect(status.position.work.x).toBeDefined();
      expect(status.position.work.y).toBeDefined();
      expect(status.position.work.z).toBeDefined();
      expect(typeof status.position.work.x).toBe('number');
      expect(typeof status.position.work.y).toBe('number');
      expect(typeof status.position.work.z).toBe('number');
    });

    it('distinguishes between work and machine coordinates', async () => {
      const status = await mockGRBLService.getStatus();

      expect(status.position.work).toBeDefined();
      expect(status.position.machine).toBeDefined();
    });
  });

  describe('Movement Commands', () => {
    it('moves to specified position', async () => {
      const targetPosition: Position = { x: 100, y: 100, z: 50 };
      await mockGRBLService.moveTo(targetPosition.x, targetPosition.y, targetPosition.z);

      expect(mockGRBLService.moveTo).toHaveBeenCalledWith(100, 100, 50);
      const status = getMockStatus();
      expect(status.position.work.x).toBe(100);
      expect(status.position.work.y).toBe(100);
      expect(status.position.work.z).toBe(50);
    });

    it('moves only X axis', async () => {
      await mockGRBLService.moveTo(50);

      const status = getMockStatus();
      expect(status.position.work.x).toBe(50);
    });

    it('sends G-code commands', async () => {
      const command = mockGRBLCommands.move(100, 100, 50);
      await mockGRBLService.sendCommand(command);

      expect(mockGRBLService.sendCommand).toHaveBeenCalledWith(command);
    });
  });

  describe('Homing Sequence', () => {
    it('executes homing sequence', async () => {
      await mockGRBLService.home();

      expect(mockGRBLService.home).toHaveBeenCalled();
      const status = getMockStatus();
      expect(status.position.work.x).toBe(0);
      expect(status.position.work.y).toBe(0);
      expect(status.position.work.z).toBe(0);
      expect(status.state).toBe('Idle');
    });
  });

  describe('Device Control', () => {
    it('unlocks the device', async () => {
      await mockGRBLService.unlock();

      expect(mockGRBLService.unlock).toHaveBeenCalled();
    });

    it('resets the device', async () => {
      await mockGRBLService.reset();

      expect(mockGRBLService.reset).toHaveBeenCalled();
    });

    it('sets feed rate', async () => {
      const feedRate = 1000;
      await mockGRBLService.setFeedRate(feedRate);

      expect(mockGRBLService.setFeedRate).toHaveBeenCalledWith(feedRate);
      const status = getMockStatus();
      expect(status.feedRate).toBe(feedRate);
    });

    it('gets device settings', async () => {
      const settings = await mockGRBLService.getSettings();

      expect(mockGRBLService.getSettings).toHaveBeenCalled();
      expect(settings).toBeDefined();
      expect(Array.isArray(settings)).toBe(true);
    });
  });

  describe('Status Subscriptions', () => {
    it('subscribes to status updates', () => {
      const callback = vi.fn();
      const unsubscribe = mockGRBLService.subscribeToStatus(callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Wait for status update
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 150);

      unsubscribe();
    });
  });
});






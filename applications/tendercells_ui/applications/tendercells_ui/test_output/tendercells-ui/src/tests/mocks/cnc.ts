import { vi } from 'vitest';
import type { MachineStatus, CoordinateSystem, Position } from '../fixtures/coordinates';
import { mockMachineStatuses, mockGRBLCommands, mockGRBLResponses } from '../fixtures/coordinates';

// Mock Serial Port
export const mockSerialPort = {
  isOpen: false,
  path: '/dev/ttyUSB0',
  baudRate: 115200,
  open: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue(undefined),
  read: vi.fn().mockResolvedValue(null),
  on: vi.fn(),
  off: vi.fn(),
};

// Mock GRBL Service
let currentStatus: MachineStatus = mockMachineStatuses[0];
let currentCoordinateSystem: CoordinateSystem = 'G54';

export const mockGRBLService = {
  connect: vi.fn().mockImplementation((port: string) => {
    mockSerialPort.isOpen = true;
    mockSerialPort.path = port;
    return Promise.resolve(mockSerialPort);
  }),
  disconnect: vi.fn().mockImplementation(() => {
    mockSerialPort.isOpen = false;
    return Promise.resolve();
  }),
  sendCommand: vi.fn().mockImplementation((command: string) => {
    // Simulate command processing
    if (command === '?') {
      return Promise.resolve(mockGRBLResponses.status);
    }
    if (command.startsWith('$')) {
      return Promise.resolve(mockGRBLResponses.ok);
    }
    if (command.startsWith('G0') || command.startsWith('G1')) {
      // Parse movement command and update position
      const xMatch = command.match(/X([\d.]+)/);
      const yMatch = command.match(/Y([\d.]+)/);
      const zMatch = command.match(/Z([\d.]+)/);
      if (xMatch || yMatch || zMatch) {
        currentStatus.position.work = {
          x: xMatch ? parseFloat(xMatch[1]) : currentStatus.position.work.x,
          y: yMatch ? parseFloat(yMatch[1]) : currentStatus.position.work.y,
          z: zMatch ? parseFloat(zMatch[1]) : currentStatus.position.work.z,
        };
        currentStatus.position.machine = { ...currentStatus.position.work };
      }
      return Promise.resolve(mockGRBLResponses.ok);
    }
    return Promise.resolve(mockGRBLResponses.ok);
  }),
  getStatus: vi.fn().mockResolvedValue(currentStatus),
  setCoordinateSystem: vi.fn().mockImplementation((system: CoordinateSystem) => {
    currentCoordinateSystem = system;
    currentStatus.coordinateSystem = system;
    return Promise.resolve();
  }),
  home: vi.fn().mockImplementation(() => {
    currentStatus.position.work = { x: 0, y: 0, z: 0 };
    currentStatus.position.machine = { x: 0, y: 0, z: 0 };
    currentStatus.state = 'Idle';
    return Promise.resolve(mockGRBLResponses.ok);
  }),
  unlock: vi.fn().mockResolvedValue(mockGRBLResponses.ok),
  reset: vi.fn().mockResolvedValue(mockGRBLResponses.ok),
  getSettings: vi.fn().mockResolvedValue(mockGRBLResponses.settings),
  moveTo: vi.fn().mockImplementation((x?: number, y?: number, z?: number) => {
    currentStatus.position.work = {
      x: x ?? currentStatus.position.work.x,
      y: y ?? currentStatus.position.work.y,
      z: z ?? currentStatus.position.work.z,
    };
    currentStatus.position.machine = { ...currentStatus.position.work };
    return Promise.resolve(mockGRBLResponses.ok);
  }),
  setFeedRate: vi.fn().mockImplementation((rate: number) => {
    currentStatus.feedRate = rate;
    return Promise.resolve(mockGRBLResponses.ok);
  }),
  subscribeToStatus: vi.fn().mockImplementation((callback: (status: MachineStatus) => void) => {
    const interval = setInterval(() => {
      callback({ ...currentStatus });
    }, 100);
    return () => clearInterval(interval);
  }),
};

// Helper to set mock status
export const setMockStatus = (status: MachineStatus) => {
  currentStatus = status;
};

// Helper to get current status
export const getMockStatus = (): MachineStatus => ({ ...currentStatus });

// Helper to reset mocks
export const resetCNCMocks = () => {
  currentStatus = mockMachineStatuses[0];
  currentCoordinateSystem = 'G54';
  mockSerialPort.isOpen = false;
  vi.clearAllMocks();
};






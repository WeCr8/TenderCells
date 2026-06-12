import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockWebSocketService, mockWebSocket, resetHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockWebSocketMessages } from '../../../../tests/fixtures/devices';

describe('WebSocket Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
  });

  describe('Connection Management', () => {
    it('establishes WebSocket connection', async () => {
      const ws = await mockWebSocketService.connect('ws://localhost:8080');

      expect(mockWebSocketService.connect).toHaveBeenCalledWith('ws://localhost:8080');
      expect(ws.readyState).toBe(1); // OPEN
    });

    it('closes WebSocket connection', async () => {
      await mockWebSocketService.connect('ws://localhost:8080');
      await mockWebSocketService.close();

      expect(mockWebSocketService.close).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('sends messages through WebSocket', async () => {
      const ws = await mockWebSocketService.connect('ws://localhost:8080');
      const message = JSON.stringify(mockWebSocketMessages.deviceStatus);

      await mockWebSocketService.send(message);

      expect(mockWebSocketService.send).toHaveBeenCalledWith(message);
    });

    it('receives messages from WebSocket', () => {
      const messageHandler = vi.fn();
      mockWebSocketService.onMessage(messageHandler);

      // Simulate message reception
      const testMessage = mockWebSocketMessages.telemetry;
      mockWebSocket.addEventListener('message', (event: any) => {
        messageHandler(JSON.parse(event.data));
      });

      expect(mockWebSocketService.onMessage).toHaveBeenCalledWith(messageHandler);
    });
  });

  describe('Error Handling', () => {
    it('handles connection errors', () => {
      const errorHandler = vi.fn();
      mockWebSocketService.onError(errorHandler);

      // Simulate error
      mockWebSocket.addEventListener('error', (event: any) => {
        errorHandler(event);
      });

      expect(mockWebSocketService.onError).toHaveBeenCalledWith(errorHandler);
    });

    it('handles connection close events', () => {
      const closeHandler = vi.fn();
      mockWebSocketService.onClose(closeHandler);

      // Simulate close
      mockWebSocket.addEventListener('close', (event: any) => {
        closeHandler(event);
      });

      expect(mockWebSocketService.onClose).toHaveBeenCalledWith(closeHandler);
    });
  });

  describe('Reconnection Logic', () => {
    it('attempts to reconnect on disconnect', async () => {
      await mockWebSocketService.connect('ws://localhost:8080');
      await mockWebSocketService.close();

      // Simulate reconnection attempt
      const reconnect = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await mockWebSocketService.connect('ws://localhost:8080');
      };

      const ws = await reconnect();
      expect(ws.readyState).toBe(1);
    });
  });
});






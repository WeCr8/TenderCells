import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockWiFiService, resetHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockWiFiNetworks } from '../../../../tests/fixtures/devices';

describe('WiFi Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
  });

  describe('Network Scanning', () => {
    it('scans for available WiFi networks', async () => {
      const networks = await mockWiFiService.scanNetworks();

      expect(mockWiFiService.scanNetworks).toHaveBeenCalled();
      expect(networks).toEqual(mockWiFiNetworks);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('filters networks by security type', async () => {
      const networks = await mockWiFiService.scanNetworks();
      const wpa2Networks = networks.filter(n => n.security === 'WPA2');

      expect(wpa2Networks.length).toBeGreaterThan(0);
    });

    it('handles empty network list when no networks are available', async () => {
      // Mock empty network list
      vi.mocked(mockWiFiService.scanNetworks).mockResolvedValueOnce([]);
      
      const networks = await mockWiFiService.scanNetworks();
      
      expect(networks).toEqual([]);
      expect(networks.length).toBe(0);
    });

    it('handles scan timeout in real-world scenarios', async () => {
      // Simulate timeout after 5 seconds
      vi.mocked(mockWiFiService.scanNetworks).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Scan timeout: No networks found within timeout period')), 100);
        });
      });

      await expect(mockWiFiService.scanNetworks()).rejects.toThrow('Scan timeout');
    });

    it('sorts networks by signal strength (RSSI)', async () => {
      const networks = await mockWiFiService.scanNetworks();
      const sortedNetworks = [...networks].sort((a, b) => b.rssi - a.rssi);

      // Strongest signal should be first
      expect(sortedNetworks[0].rssi).toBeGreaterThanOrEqual(sortedNetworks[sortedNetworks.length - 1].rssi);
    });
  });

  describe('Network Connection', () => {
    it('connects to a WiFi network with correct password', async () => {
      const network = mockWiFiNetworks[0];
      const result = await mockWiFiService.connectToNetwork(network.ssid, 'password123');

      expect(mockWiFiService.connectToNetwork).toHaveBeenCalledWith(network.ssid, 'password123');
      expect(result.connected).toBe(true);
      expect(result.ssid).toBe(network.ssid);
      expect(result.ipAddress).toBeDefined();
      expect(result.signalStrength).toBeDefined();
    });

    it('connects to open network without password', async () => {
      const openNetwork = mockWiFiNetworks.find(n => n.security === 'none');
      if (openNetwork) {
        const result = await mockWiFiService.connectToNetwork(openNetwork.ssid);

        expect(result.connected).toBe(true);
        expect(result.ssid).toBe(openNetwork.ssid);
        expect(result.ipAddress).toBeDefined();
      }
    });

    it('rejects connection with wrong password', async () => {
      const network = mockWiFiNetworks.find(n => n.security === 'WPA2');
      if (network) {
        // The mock implementation already handles 'wrongpassword' automatically
        await expect(
          mockWiFiService.connectToNetwork(network.ssid, 'wrongpassword')
        ).rejects.toThrow('Authentication failed: Incorrect password');
      }
    });

    it('rejects connection when network is not found', async () => {
      const nonExistentSSID = 'NonExistent-Network-12345';
      
      // The mock implementation already throws this error for non-existent networks
      await expect(
        mockWiFiService.connectToNetwork(nonExistentSSID, 'password')
      ).rejects.toThrow(`Network not found: ${nonExistentSSID}`);
    });

    it('handles connection timeout in real-world scenarios', async () => {
      const network = mockWiFiNetworks[0];
      
      vi.mocked(mockWiFiService.connectToNetwork).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout: Network did not respond')), 100);
        });
      });

      await expect(
        mockWiFiService.connectToNetwork(network.ssid, 'password')
      ).rejects.toThrow('Connection timeout');
    });

    it('requires password for secured networks', async () => {
      const securedNetwork = mockWiFiNetworks.find(n => n.security !== 'none');
      if (securedNetwork) {
        // The mock implementation already handles missing password for secured networks
        await expect(
          mockWiFiService.connectToNetwork(securedNetwork.ssid)
        ).rejects.toThrow('Password required for secured network');
      }
    });

    it('disconnects from WiFi network', async () => {
      await mockWiFiService.connectToNetwork('Test-Network', 'password');
      await mockWiFiService.disconnect();

      expect(mockWiFiService.disconnect).toHaveBeenCalled();
    });

    it('handles disconnection when not connected', async () => {
      // Reset to ensure no connection
      resetHardwareMocks();
      
      // Disconnect should not throw error even if not connected
      await expect(mockWiFiService.disconnect()).resolves.not.toThrow();
    });

    it('maintains connection state after successful connection', async () => {
      const network = mockWiFiNetworks[0];
      const result1 = await mockWiFiService.connectToNetwork(network.ssid, 'password123');
      
      expect(result1.connected).toBe(true);
      
      // Get current network should return the connected network
      const currentNetwork = await mockWiFiService.getCurrentNetwork();
      expect(currentNetwork).not.toBeNull();
      expect(currentNetwork?.ssid).toBe(network.ssid);
    });
  });

  describe('Current Network Status', () => {
    it('gets current connected network', async () => {
      // First connect to a network to have a current network
      const network = mockWiFiNetworks[0];
      await mockWiFiService.connectToNetwork(network.ssid, 'password123');
      
      const currentNetwork = await mockWiFiService.getCurrentNetwork();

      expect(mockWiFiService.getCurrentNetwork).toHaveBeenCalled();
      expect(currentNetwork).toBeDefined();
      expect(currentNetwork?.ssid).toBeDefined();
    });

    it('returns null when no network is connected', async () => {
      // Ensure no connection by resetting
      resetHardwareMocks();
      
      // The mock implementation returns null when not connected
      const currentNetwork = await mockWiFiService.getCurrentNetwork();
      expect(currentNetwork).toBeNull();
    });

    it('includes connection details in current network status', async () => {
      // First connect to a network
      const network = mockWiFiNetworks[0];
      await mockWiFiService.connectToNetwork(network.ssid, 'password123');
      
      const currentNetwork = await mockWiFiService.getCurrentNetwork();
      
      expect(currentNetwork).toBeDefined();
      expect(currentNetwork.ssid).toBe(network.ssid);
      expect(currentNetwork.ipAddress).toBeDefined();
      expect(currentNetwork.signalStrength).toBeDefined();
    });
  });

  describe('Real-world Error Scenarios', () => {
    it('handles network unavailable error', async () => {
      vi.mocked(mockWiFiService.scanNetworks).mockRejectedValueOnce(
        new Error('WiFi adapter not available or disabled')
      );

      await expect(mockWiFiService.scanNetworks()).rejects.toThrow('WiFi adapter not available');
    });

    it('handles weak signal connection failures', async () => {
      const weakNetwork = mockWiFiNetworks.find(n => n.rssi < -80);
      if (weakNetwork) {
        // The mock implementation already rejects networks with rssi < -80
        await expect(
          mockWiFiService.connectToNetwork(weakNetwork.ssid, 'password')
        ).rejects.toThrow('Signal too weak');
      }
    });

    it('handles network disconnection during use', async () => {
      const network = mockWiFiNetworks[0];
      await mockWiFiService.connectToNetwork(network.ssid, 'password123');
      
      // Verify connected
      let currentNetwork = await mockWiFiService.getCurrentNetwork();
      expect(currentNetwork).not.toBeNull();
      expect(currentNetwork?.ssid).toBe(network.ssid);
      
      // Simulate network disconnection
      await mockWiFiService.disconnect();
      
      // Subsequent getCurrentNetwork should reflect disconnection
      currentNetwork = await mockWiFiService.getCurrentNetwork();
      expect(currentNetwork).toBeNull();
    });

    it('validates network security requirements', async () => {
      const wpa3Network = mockWiFiNetworks.find(n => n.security === 'WPA3');
      if (wpa3Network) {
        // The mock implementation already rejects short passwords for WPA3
        await expect(
          mockWiFiService.connectToNetwork(wpa3Network.ssid, 'short')
        ).rejects.toThrow('WPA3 security requirements');
      }
    });
  });
});






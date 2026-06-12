/**
 * WiFi Service for scanning and connecting to networks
 * This service provides a clean interface for components to interact with WiFi functionality
 */

import type { WiFiNetwork } from '../tests/fixtures/devices';

export interface WiFiConnectionResult {
  ssid: string;
  connected: boolean;
  ipAddress?: string;
  signalStrength?: number;
}

export interface WiFiService {
  scanNetworks(): Promise<WiFiNetwork[]>;
  connectToNetwork(ssid: string, password?: string): Promise<WiFiConnectionResult>;
  disconnect(): Promise<void>;
  getCurrentNetwork(): Promise<WiFiNetwork | null>;
}

// In a real implementation, this would use platform-specific APIs
// For now, we'll use a mockable interface
class WiFiServiceImpl implements WiFiService {
  private currentConnection: WiFiConnectionResult | null = null;

  async scanNetworks(): Promise<WiFiNetwork[]> {
    // In production, this would call the actual WiFi scanning API
    // For now, we'll throw an error to indicate it needs to be implemented
    // Components should use the mock in tests
    if (typeof window !== 'undefined' && (window as any).wifiService) {
      return (window as any).wifiService.scanNetworks();
    }
    throw new Error('WiFi service not available. Use mockWiFiService in tests.');
  }

  async connectToNetwork(ssid: string, password?: string): Promise<WiFiConnectionResult> {
    if (typeof window !== 'undefined' && (window as any).wifiService) {
      const result = await (window as any).wifiService.connectToNetwork(ssid, password);
      this.currentConnection = result;
      return result;
    }
    throw new Error('WiFi service not available. Use mockWiFiService in tests.');
  }

  async disconnect(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).wifiService) {
      await (window as any).wifiService.disconnect();
      this.currentConnection = null;
    }
  }

  async getCurrentNetwork(): Promise<WiFiNetwork | null> {
    if (typeof window !== 'undefined' && (window as any).wifiService) {
      return (window as any).wifiService.getCurrentNetwork();
    }
    return null;
  }
}

export const wifiService: WiFiService = new WiFiServiceImpl();

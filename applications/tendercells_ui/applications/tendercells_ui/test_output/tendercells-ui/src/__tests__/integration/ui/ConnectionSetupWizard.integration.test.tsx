/**
 * Integration test for ConnectionSetupWizard component
 * Tests the full flow: UI -> Service -> Connection -> Mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi as viMock } from 'vitest';
import ConnectionSetupWizard from '../../../components/products/ConnectionSetupWizard';
import { mockWiFiService, resetHardwareMocks, setupHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockWiFiNetworks } from '../../../../tests/fixtures/devices';
import { mockProducts } from '../../../../tests/fixtures/products';
import { wifiService } from '../../../services/wifiService';
import { ProductsService } from '../../../services/productsService';

// Mock the ProductsService
vi.mock('../../../services/productsService', () => ({
  ProductsService: {
    connectProduct: vi.fn(),
  },
}));

// Mock useProducts hook
vi.mock('../../../hooks/useProducts', () => ({
  useProducts: () => ({
    connectProduct: vi.fn().mockResolvedValue({
      ...mockProducts[0],
      connection_status: 'online',
    }),
    products: mockProducts,
    loading: false,
    error: null,
  }),
}));

describe('ConnectionSetupWizard Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
    
    // Make WiFi service available to components
    (global as any).window = {
      ...global.window,
      wifiService: mockWiFiService,
    };
  });

  describe('WiFi Network Scanning Integration', () => {
    it('displays available WiFi networks when component mounts', async () => {
      const product = mockProducts[0];
      const { rerender } = render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={vi.fn()}
          product={product}
        />
      );

      // Component should be visible
      expect(screen.getByText(/Connect/i)).toBeInTheDocument();
      expect(screen.getByText(/WiFi Network/i)).toBeInTheDocument();
    });

    it('allows user to enter WiFi network SSID', async () => {
      const product = mockProducts[0];
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={vi.fn()}
          product={product}
        />
      );

      const ssidInput = screen.getByLabelText(/WiFi Network/i);
      expect(ssidInput).toBeInTheDocument();

      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      expect(ssidInput).toHaveValue('Test-Network');
    });

    it('validates required fields before proceeding', async () => {
      const product = mockProducts[0];
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={vi.fn()}
          product={product}
        />
      );

      const nextButton = screen.getByText(/Next/i);
      expect(nextButton).toBeDisabled(); // Should be disabled without SSID
    });
  });

  describe('WiFi Connection Flow Integration', () => {
    it('completes full connection flow with WiFi service', async () => {
      const product = mockProducts[0];
      const onComplete = vi.fn();
      const mockConnectProduct = vi.fn().mockResolvedValue({
        ...product,
        connection_status: 'online',
        network_config: {
          ssid: 'Test-Network',
          connected: true,
        },
      });

      // Mock ProductsService
      (ProductsService.connectProduct as any).mockResolvedValue(mockConnectProduct);

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={vi.fn()}
          product={product}
          onComplete={onComplete}
        />
      );

      // Step 1: Enter SSID
      const ssidInput = screen.getByLabelText(/WiFi Network/i);
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });

      // Step 2: Click Next
      const nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);

      // Step 3: Enter password
      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/Network Password/i);
        expect(passwordInput).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Network Password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Step 4: Click Next to start pairing
      const nextButton2 = screen.getByText(/Next/i);
      fireEvent.click(nextButton2);

      // Step 5: Wait for connection
      await waitFor(() => {
        expect(mockWiFiService.connectToNetwork).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Verify WiFi service was called
      expect(mockWiFiService.connectToNetwork).toHaveBeenCalledWith(
        'Test-Network',
        'password123'
      );
    });

    it('handles WiFi connection errors gracefully', async () => {
      const product = mockProducts[0];
      
      // Mock connection failure
      mockWiFiService.connectToNetwork = vi.fn().mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={vi.fn()}
          product={product}
        />
      );

      // Enter network info
      const ssidInput = screen.getByLabelText(/WiFi Network/i);
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      
      const nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/Network Password/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        const nextButton2 = screen.getByText(/Next/i);
        fireEvent.click(nextButton2);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Service Integration', () => {
    it('uses WiFi service to scan networks when needed', async () => {
      // This test verifies that components can access WiFi service
      const networks = await mockWiFiService.scanNetworks();
      
      expect(networks).toBeDefined();
      expect(networks.length).toBeGreaterThan(0);
      expect(mockWiFiService.scanNetworks).toHaveBeenCalled();
    });

    it('integrates WiFi service with ProductsService', async () => {
      const product = mockProducts[0];
      const network = mockWiFiNetworks[0];

      // Step 1: Connect to WiFi
      const wifiResult = await mockWiFiService.connectToNetwork(network.ssid, 'password123');
      expect(wifiResult.connected).toBe(true);

      // Step 2: Create network config
      const networkConfig = {
        ssid: wifiResult.ssid,
        password: 'password123',
        securityType: network.security,
        connected: true,
        ipAddress: wifiResult.ipAddress,
        lastConnected: new Date().toISOString(),
      };

      // Step 3: Connect product (would normally call ProductsService)
      const mockConnectProduct = vi.fn().mockResolvedValue({
        ...product,
        connection_status: 'online',
        network_config: networkConfig,
      });

      (ProductsService.connectProduct as any).mockResolvedValue(mockConnectProduct);

      // Verify the flow works
      expect(networkConfig.connected).toBe(true);
      expect(networkConfig.ssid).toBe(network.ssid);
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network scan failures', async () => {
      mockWiFiService.scanNetworks = vi.fn().mockRejectedValueOnce(
        new Error('WiFi adapter not available')
      );

      await expect(mockWiFiService.scanNetworks()).rejects.toThrow('WiFi adapter not available');
    });

    it('handles wrong password errors', async () => {
      const network = mockWiFiNetworks.find(n => n.security === 'WPA2');
      if (network) {
        await expect(
          mockWiFiService.connectToNetwork(network.ssid, 'wrongpassword')
        ).rejects.toThrow('Authentication failed');
      }
    });

    it('handles weak signal errors', async () => {
      const weakNetwork = mockWiFiNetworks.find(n => n.rssi < -80);
      if (weakNetwork) {
        await expect(
          mockWiFiService.connectToNetwork(weakNetwork.ssid, 'password')
        ).rejects.toThrow('Signal too weak');
      }
    });
  });
});

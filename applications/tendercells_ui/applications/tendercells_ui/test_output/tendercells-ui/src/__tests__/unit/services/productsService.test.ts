import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from '@/services/productsService';
import type { Product, RegisterProductData, UpdateProductData, ProductFilter } from '@/types/products';
import { mockProducts, mockRegisterProductData } from '@/tests/fixtures/products';

// Mock fetch globally
global.fetch = vi.fn();

describe('ProductsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerProduct', () => {
    it('registers a new product successfully', async () => {
      const mockProduct: Product = {
        ...mockProducts[0],
        id: 'new-product-id',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await ProductsService.registerProduct(mockRegisterProductData[0]);

      expect(global.fetch).toHaveBeenCalledWith(
        '/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockRegisterProductData[0]),
        })
      );
      expect(result).toEqual(mockProduct);
    });

    it('handles registration errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(ProductsService.registerProduct(mockRegisterProductData[0])).rejects.toThrow(
        'HTTP error! status: 400'
      );
    });
  });

  describe('getUserProducts', () => {
    it('fetches all products without filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await ProductsService.getUserProducts();

      expect(global.fetch).toHaveBeenCalledWith('/products', expect.any(Object));
      expect(result).toEqual(mockProducts);
    });

    it('fetches products with filters', async () => {
      const filter: ProductFilter = {
        product_type: ['hardware_unit'],
        status: ['connected'],
        search: 'test',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProducts[0]],
      });

      const result = await ProductsService.getUserProducts(filter);

      expect(global.fetch).toHaveBeenCalledWith(
        '/products?product_type=hardware_unit&status=connected&search=test',
        expect.any(Object)
      );
      expect(result).toEqual([mockProducts[0]]);
    });
  });

  describe('getProduct', () => {
    it('fetches a specific product by ID', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts[0],
      });

      const result = await ProductsService.getProduct('prod-1');

      expect(global.fetch).toHaveBeenCalledWith('/products/prod-1', expect.any(Object));
      expect(result).toEqual(mockProducts[0]);
    });
  });

  describe('updateProduct', () => {
    it('updates a product successfully', async () => {
      const updateData: UpdateProductData = {
        product_name: 'Updated Product Name',
        location: 'Updated Location',
      };

      const updatedProduct: Product = {
        ...mockProducts[0],
        ...updateData,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProduct,
      });

      const result = await ProductsService.updateProduct('prod-1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/prod-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('deleteProduct', () => {
    it('deletes a product successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      await ProductsService.deleteProduct('prod-1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/prod-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('validateRegistrationCode', () => {
    it('validates a serial number', async () => {
      const validationResult = {
        valid: true,
        productInfo: { model: 'CT-2024' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => validationResult,
      });

      const result = await ProductsService.validateRegistrationCode('SN-123456', 'serial_number');

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'SN-123456', method: 'serial_number' }),
        })
      );
      expect(result).toEqual(validationResult);
    });

    it('handles invalid registration code', async () => {
      const validationResult = {
        valid: false,
        error: 'Invalid code',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => validationResult,
      });

      const result = await ProductsService.validateRegistrationCode('INVALID', 'serial_number');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid code');
    });
  });

  describe('connectProduct', () => {
    it('connects a product successfully', async () => {
      const connectData = {
        network_config: {
          ssid: 'Test-Network',
          password: 'password123',
        },
      };

      const connectedProduct: Product = {
        ...mockProducts[0],
        connection_status: 'online',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => connectedProduct,
      });

      const result = await ProductsService.connectProduct('prod-1', connectData);

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/prod-1/connect',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(connectData),
        })
      );
      expect(result).toEqual(connectedProduct);
    });
  });

  describe('disconnectProduct', () => {
    it('disconnects a product successfully', async () => {
      const disconnectedProduct: Product = {
        ...mockProducts[0],
        connection_status: 'offline',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => disconnectedProduct,
      });

      const result = await ProductsService.disconnectProduct('prod-1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/prod-1/disconnect',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );
      expect(result).toEqual(disconnectedProduct);
    });
  });

  describe('getProductStats', () => {
    it('fetches product statistics', async () => {
      const stats = {
        totalProducts: 3,
        hardwareUnits: 2,
        automationDevices: 1,
        connectedProducts: 1,
        disconnectedProducts: 1,
        setupRequired: 1,
        onlineProducts: 1,
        offlineProducts: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => stats,
      });

      const result = await ProductsService.getProductStats();

      expect(global.fetch).toHaveBeenCalledWith('/products/stats', expect.any(Object));
      expect(result).toEqual(stats);
    });
  });

  describe('linkDeviceToProduct', () => {
    it('links a device to a product', async () => {
      const linkedProduct: Product = {
        ...mockProducts[0],
        device_id: 'device-123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => linkedProduct,
      });

      const result = await ProductsService.linkDeviceToProduct('prod-1', 'device-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/products/prod-1/link-device',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ deviceId: 'device-123' }),
        })
      );
      expect(result).toEqual(linkedProduct);
    });
  });
});


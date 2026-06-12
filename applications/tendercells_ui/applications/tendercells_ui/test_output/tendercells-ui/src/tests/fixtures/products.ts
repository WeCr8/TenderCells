import type { Product, RegisterProductData, ProductType, ProductStatus, ConnectionStatus } from '../../types/products';

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    user_id: 'user-1',
    product_type: 'hardware_unit',
    product_name: 'Chicken Tender Unit 1',
    model: 'CT-2024',
    serial_number: 'SN-123456789',
    status: 'connected',
    connection_status: 'online',
    device_id: 'device-1',
    network_config: {
      ssid: 'TenderCells-Network',
      ipAddress: '192.168.1.100',
      macAddress: '00:11:22:33:44:55',
      signalStrength: 85,
      connected: true,
    },
    location: 'Main Coop',
    metadata: {
      purchaseDate: '2024-01-15',
      warrantyExpiry: '2025-01-15',
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 'prod-2',
    user_id: 'user-1',
    product_type: 'automation_device',
    product_name: 'Automation Controller',
    model: 'AC-2024',
    serial_number: 'SN-987654321',
    activation_code: 'ACT-ABC123',
    status: 'registered',
    connection_status: 'offline',
    network_config: {},
    location: 'Run A',
    metadata: {},
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-01T09:00:00Z',
  },
  {
    id: 'prod-3',
    user_id: 'user-1',
    product_type: 'hardware_unit',
    product_name: 'Duck Dock Monitor',
    model: 'DD-2024',
    serial_number: 'SN-555666777',
    qr_code: 'QR-CODE-12345',
    status: 'setup_required',
    connection_status: 'error',
    network_config: {
      ssid: 'Test-Network',
      connected: false,
    },
    location: 'Pond Area',
    metadata: {},
    created_at: '2024-03-10T12:00:00Z',
    updated_at: '2024-03-10T12:00:00Z',
  },
];

export const mockRegisterProductData: RegisterProductData[] = [
  {
    product_type: 'hardware_unit',
    product_name: 'Test Hardware Unit',
    model: 'TEST-2024',
    serial_number: 'SN-TEST-001',
    location: 'Test Location',
  },
  {
    product_type: 'automation_device',
    product_name: 'Test Automation Device',
    qr_code: 'QR-TEST-001',
    location: 'Test Location 2',
  },
  {
    product_type: 'hardware_unit',
    product_name: 'Test Activation Device',
    activation_code: 'ACT-TEST-001',
    location: 'Test Location 3',
  },
];

export const mockSerialNumbers = {
  valid: ['SN-123456789', 'SN-987654321', 'SN-555666777', 'SN-111222333'],
  invalid: ['', 'SN-', '123456789', 'SN-TOO-LONG-STRING-HERE'],
};

export const mockQRCodes = {
  valid: ['QR-CODE-12345', 'QR-TEST-001', 'QR-ABC123XYZ'],
  invalid: ['', 'QR-', 'INVALID-QR'],
};

export const mockActivationCodes = {
  valid: ['ACT-ABC123', 'ACT-TEST-001', 'ACT-XYZ789'],
  invalid: ['', 'ACT-', 'INVALID-ACT'],
};

export const mockProductTypes: ProductType[] = ['hardware_unit', 'automation_device'];

export const mockProductStatuses: ProductStatus[] = ['registered', 'connected', 'disconnected', 'setup_required'];

export const mockConnectionStatuses: ConnectionStatus[] = ['offline', 'connecting', 'online', 'error'];






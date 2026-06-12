import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/utils/testHelpers';
import ProductRegistrationModal from '@/components/products/ProductRegistrationModal';
import type { RegisterProductData } from '@/types/products';

// Mock QRCodeScanner
vi.mock('@/components/products/QRCodeScanner', () => ({
  default: ({ isOpen, onScan, onClose }: any) => (
    isOpen ? (
      <div data-testid="qr-scanner">
        <button onClick={() => onScan('QR-TEST-123')}>Mock Scan</button>
        <button onClick={onClose}>Close Scanner</button>
      </div>
    ) : null
  ),
}));

describe('ProductRegistrationModal', () => {
  const mockOnClose = vi.fn();
  const mockOnRegister = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    expect(screen.getByText('Register New Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ProductRegistrationModal
        isOpen={false}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    expect(screen.queryByText('Register New Product')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
      expect(screen.getByText('Location is required')).toBeInTheDocument();
      expect(screen.getByText('Serial number is required')).toBeInTheDocument();
    });

    expect(mockOnRegister).not.toHaveBeenCalled();
  });

  it('submits form with serial number', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Test Location' } });
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'SN-123456' } });

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith({
        product_type: 'hardware_unit',
        product_name: 'Test Product',
        model: undefined,
        location: 'Test Location',
        serial_number: 'SN-123456',
        qr_code: undefined,
        activation_code: undefined,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('switches to QR code tab', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const qrTab = screen.getByText('QR Code');
    fireEvent.click(qrTab);

    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByLabelText('QR Code')).toBeInTheDocument();
  });

  it('opens QR scanner and handles scan', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const qrTab = screen.getByText('QR Code');
    fireEvent.click(qrTab);

    const scanButton = screen.getByText('Scan QR Code');
    fireEvent.click(scanButton);

    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();

    const mockScanButton = screen.getByText('Mock Scan');
    fireEvent.click(mockScanButton);

    await waitFor(() => {
      expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
      expect(screen.getByLabelText('QR Code')).toHaveValue('QR-TEST-123');
    });
  });

  it('switches to activation code tab', () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const activationTab = screen.getByText('Activation Code');
    fireEvent.click(activationTab);

    expect(screen.getByLabelText('Activation Code')).toBeInTheDocument();
  });

  it('submits form with QR code', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Test Location' } });

    const qrTab = screen.getByText('QR Code');
    fireEvent.click(qrTab);

    fireEvent.change(screen.getByLabelText('QR Code'), { target: { value: 'QR-123456' } });

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith({
        product_type: 'hardware_unit',
        product_name: 'Test Product',
        model: undefined,
        location: 'Test Location',
        serial_number: undefined,
        qr_code: 'QR-123456',
        activation_code: undefined,
      });
    });
  });

  it('submits form with activation code', async () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Test Location' } });

    const activationTab = screen.getByText('Activation Code');
    fireEvent.click(activationTab);

    fireEvent.change(screen.getByLabelText('Activation Code'), { target: { value: 'ACT-123456' } });

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith({
        product_type: 'hardware_unit',
        product_name: 'Test Product',
        model: undefined,
        location: 'Test Location',
        serial_number: undefined,
        qr_code: undefined,
        activation_code: 'ACT-123456',
      });
    });
  });

  it('changes product type', () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const productTypeSelect = screen.getByLabelText('Product Type');
    fireEvent.mouseDown(productTypeSelect);

    const automationOption = screen.getByText('Automation Device');
    fireEvent.click(automationOption);

    expect(productTypeSelect).toHaveTextContent('Automation Device');
  });

  it('handles registration error', async () => {
    const errorMessage = 'Registration failed';
    mockOnRegister.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Test Location' } });
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'SN-123456' } });

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes modal on cancel', () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal on close icon click', () => {
    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    let resolveRegister: (value: any) => void;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });
    mockOnRegister.mockReturnValueOnce(registerPromise);

    render(
      <ProductRegistrationModal
        isOpen={true}
        onClose={mockOnClose}
        onRegister={mockOnRegister}
      />
    );

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Test Location' } });
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'SN-123456' } });

    const submitButton = screen.getByText('Register Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Registering...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    resolveRegister!(undefined);
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});


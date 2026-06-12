import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/utils/testHelpers';
import ConnectionSetupWizard from '@/components/products/ConnectionSetupWizard';
import { mockProducts } from '@/tests/fixtures/products';

// Mock useProducts hook
const mockConnectProduct = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    connectProduct: mockConnectProduct,
  }),
}));

describe('ConnectionSetupWizard', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();
  const product = mockProducts[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <ConnectionSetupWizard
        isOpen={true}
        onClose={mockOnClose}
        product={product}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(`Connect ${product.product_name}`)).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ConnectionSetupWizard
        isOpen={false}
        onClose={mockOnClose}
        product={product}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText(`Connect ${product.product_name}`)).not.toBeInTheDocument();
  });

  it('displays all wizard steps', () => {
    render(
      <ConnectionSetupWizard
        isOpen={true}
        onClose={mockOnClose}
        product={product}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Credentials')).toBeInTheDocument();
    expect(screen.getByText('Pairing')).toBeInTheDocument();
    expect(screen.getByText('Verification')).toBeInTheDocument();
  });

  describe('Step 1: Network', () => {
    it('requires SSID to proceed', () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('allows proceeding when SSID is entered', () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('allows selecting security type', () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      const securitySelect = screen.getByLabelText('Security Type');
      fireEvent.mouseDown(securitySelect);

      expect(screen.getByText('WPA3')).toBeInTheDocument();
      fireEvent.click(screen.getByText('WPA3'));

      expect(securitySelect).toHaveTextContent('WPA3');
    });
  });

  describe('Step 2: Credentials', () => {
    it('requires password for secured networks', async () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Enter SSID and proceed to credentials step
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText('Network Password')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('allows proceeding without password for open networks', async () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Enter SSID
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Open-Network' } });

      // Select "None" security
      const securitySelect = screen.getByLabelText('Security Type');
      fireEvent.mouseDown(securitySelect);
      fireEvent.click(screen.getByText('None (Open)'));

      // Proceed to credentials
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        expect(passwordInput).toBeDisabled();
      });

      // Should be able to proceed without password
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('displays the network name being connected to', async () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'My-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/Connecting to:.*My-Network/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Pairing', () => {
    it('starts pairing process when entering pairing step', async () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete network and credentials steps
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByText('Connecting to device...')).toBeInTheDocument();
      });

      expect(mockConnectProduct).toHaveBeenCalled();
    });

    it('shows success message when connection succeeds', async () => {
      mockConnectProduct.mockResolvedValueOnce(undefined);

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete steps
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Connection successful!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows error message when connection fails', async () => {
      const errorMessage = 'Connection timeout';
      mockConnectProduct.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete steps
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('allows retrying after connection failure', async () => {
      mockConnectProduct
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete steps and trigger failure
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Wait for error and retry
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      // Should go back to credentials step
      await waitFor(() => {
        expect(screen.getByLabelText('Network Password')).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Verification', () => {
    it('shows completion message', async () => {
      mockConnectProduct.mockResolvedValueOnce(undefined);

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete all steps
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Wait for verification step
      await waitFor(() => {
        expect(screen.getByText('Setup Complete!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('calls onComplete when done', async () => {
      mockConnectProduct.mockResolvedValueOnce(undefined);

      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Complete all steps
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Network Password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      fireEvent.click(screen.getByText('Next'));

      // Wait for verification and click done
      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Done'));

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('allows going back from credentials step', async () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      // Go to credentials step
      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText('Network Password')).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByText('Back'));

      // Should be back at network step
      expect(screen.getByLabelText('WiFi Network (SSID)')).toBeInTheDocument();
    });

    it('resets form when closed', () => {
      render(
        <ConnectionSetupWizard
          isOpen={true}
          onClose={mockOnClose}
          product={product}
          onComplete={mockOnComplete}
        />
      );

      const ssidInput = screen.getByLabelText('WiFi Network (SSID)');
      fireEvent.change(ssidInput, { target: { value: 'Test-Network' } });

      // Close wizard
      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});


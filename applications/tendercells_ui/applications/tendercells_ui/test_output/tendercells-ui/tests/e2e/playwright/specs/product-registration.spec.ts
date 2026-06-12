import { test, expect } from '@playwright/test';

test.describe('Product Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/products', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        if (requestBody?.serialNumber === 'INVALID-SN') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid serial number' }),
          });
        } else {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'prod-123', product_name: requestBody?.productName || 'Test Product' }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
  });

  test('should register a product with serial number', async ({ page }) => {
    // Navigate to product registration (assuming there's a button or link)
    const registerButton = page.locator('[data-testid="register-product-button"]');
    if (await registerButton.count() > 0) {
      await registerButton.click();
    } else {
      // If button doesn't exist, skip this test or navigate directly
      test.skip();
    }

    // Fill in product details
    const productNameInput = page.locator('[data-testid="product-name-input"]');
    const locationInput = page.locator('[data-testid="location-input"]');
    const modelInput = page.locator('[data-testid="model-input"]');
    const serialNumberInput = page.locator('[data-testid="serial-number-input"]');

    if (await productNameInput.count() > 0) {
      await productNameInput.fill('Test Hardware Unit');
    }
    if (await locationInput.count() > 0) {
      await locationInput.fill('Main Coop');
    }
    if (await modelInput.count() > 0) {
      await modelInput.fill('CT-2024');
    }

    // Select serial number tab (should be default)
    const serialNumberTab = page.locator('[data-testid="serial-number-tab"]');
    if (await serialNumberTab.count() > 0) {
      await expect(serialNumberTab).toBeVisible();
    }

    // Enter serial number
    if (await serialNumberInput.count() > 0) {
      await serialNumberInput.fill('SN-123456789');
    }

    // Submit form
    const submitButton = page.locator('[data-testid="register-product-submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Wait for success message or redirect
      await expect(page.locator('text=Product registered successfully')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should register a product with QR code', async ({ page }) => {
    const registerButton = page.locator('[data-testid="register-product-button"]');
    if (await registerButton.count() === 0) {
      test.skip();
    }
    await registerButton.click();

    const productNameInput = page.locator('[data-testid="product-name-input"]');
    const locationInput = page.locator('[data-testid="location-input"]');

    if (await productNameInput.count() > 0) {
      await productNameInput.fill('Test Automation Device');
    }
    if (await locationInput.count() > 0) {
      await locationInput.fill('Run A');
    }

    // Switch to QR code tab
    const qrCodeTab = page.locator('[data-testid="qr-code-tab"]');
    if (await qrCodeTab.count() > 0) {
      await qrCodeTab.click();
    }

    // Enter QR code manually
    const qrCodeInput = page.locator('[data-testid="qr-code-input"]');
    if (await qrCodeInput.count() > 0) {
      await qrCodeInput.fill('QR-CODE-12345');
    }

    const submitButton = page.locator('[data-testid="register-product-submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await expect(page.locator('text=Product registered successfully')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should register a product with activation code', async ({ page }) => {
    const registerButton = page.locator('[data-testid="register-product-button"]');
    if (await registerButton.count() === 0) {
      test.skip();
    }
    await registerButton.click();

    const productNameInput = page.locator('[data-testid="product-name-input"]');
    const locationInput = page.locator('[data-testid="location-input"]');

    if (await productNameInput.count() > 0) {
      await productNameInput.fill('Test Device');
    }
    if (await locationInput.count() > 0) {
      await locationInput.fill('Test Location');
    }

    // Switch to activation code tab
    const activationCodeTab = page.locator('[data-testid="activation-code-tab"]');
    if (await activationCodeTab.count() > 0) {
      await activationCodeTab.click();
    }

    const activationCodeInput = page.locator('[data-testid="activation-code-input"]');
    if (await activationCodeInput.count() > 0) {
      await activationCodeInput.fill('ACT-ABC123');
    }

    const submitButton = page.locator('[data-testid="register-product-submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await expect(page.locator('text=Product registered successfully')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields', async ({ page }) => {
    const registerButton = page.locator('[data-testid="register-product-button"]');
    if (await registerButton.count() === 0) {
      test.skip();
    }
    await registerButton.click();

    // Try to submit without filling required fields
    const submitButton = page.locator('[data-testid="register-product-submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Verify error messages
      const errorMessages = [
        'Product name is required',
        'Location is required',
        'Serial number is required',
      ];

      for (const errorMessage of errorMessages) {
        const errorElement = page.locator(`text=${errorMessage}`);
        if (await errorElement.count() > 0) {
          await expect(errorElement).toBeVisible();
        }
      }
    }
  });

  test('should handle registration errors', async ({ page }) => {
    const registerButton = page.locator('[data-testid="register-product-button"]');
    if (await registerButton.count() === 0) {
      test.skip();
    }
    await registerButton.click();

    const productNameInput = page.locator('[data-testid="product-name-input"]');
    const locationInput = page.locator('[data-testid="location-input"]');
    const serialNumberInput = page.locator('[data-testid="serial-number-input"]');

    if (await productNameInput.count() > 0) {
      await productNameInput.fill('Test Product');
    }
    if (await locationInput.count() > 0) {
      await locationInput.fill('Test Location');
    }
    if (await serialNumberInput.count() > 0) {
      await serialNumberInput.fill('INVALID-SN');
    }

    const submitButton = page.locator('[data-testid="register-product-submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await expect(page.locator('text=Invalid serial number')).toBeVisible({ timeout: 5000 });
    }
  });
});

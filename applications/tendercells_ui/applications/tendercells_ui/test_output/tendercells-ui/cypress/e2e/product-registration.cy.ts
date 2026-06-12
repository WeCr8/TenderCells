describe('Product Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    // Mock API responses
    cy.intercept('POST', '/products', { statusCode: 201, body: { id: 'prod-123', product_name: 'Test Product' } }).as('registerProduct');
  });

  it('should register a product with serial number', () => {
    // Navigate to product registration (assuming there's a button or link)
    cy.get('[data-testid="register-product-button"]').click();

    // Fill in product details
    cy.get('[data-testid="product-name-input"]').type('Test Hardware Unit');
    cy.get('[data-testid="location-input"]').type('Main Coop');
    cy.get('[data-testid="model-input"]').type('CT-2024');

    // Select serial number tab (should be default)
    cy.get('[data-testid="serial-number-tab"]').should('be.visible');

    // Enter serial number
    cy.get('[data-testid="serial-number-input"]').type('SN-123456789');

    // Submit form
    cy.get('[data-testid="register-product-submit"]').click();

    // Wait for API call
    cy.wait('@registerProduct');

    // Verify success message or redirect
    cy.contains('Product registered successfully').should('be.visible');
  });

  it('should register a product with QR code', () => {
    cy.get('[data-testid="register-product-button"]').click();

    cy.get('[data-testid="product-name-input"]').type('Test Automation Device');
    cy.get('[data-testid="location-input"]').type('Run A');

    // Switch to QR code tab
    cy.get('[data-testid="qr-code-tab"]').click();

    // Enter QR code manually
    cy.get('[data-testid="qr-code-input"]').type('QR-CODE-12345');

    cy.get('[data-testid="register-product-submit"]').click();
    cy.wait('@registerProduct');

    cy.contains('Product registered successfully').should('be.visible');
  });

  it('should register a product with activation code', () => {
    cy.get('[data-testid="register-product-button"]').click();

    cy.get('[data-testid="product-name-input"]').type('Test Device');
    cy.get('[data-testid="location-input"]').type('Test Location');

    // Switch to activation code tab
    cy.get('[data-testid="activation-code-tab"]').click();

    cy.get('[data-testid="activation-code-input"]').type('ACT-ABC123');

    cy.get('[data-testid="register-product-submit"]').click();
    cy.wait('@registerProduct');

    cy.contains('Product registered successfully').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="register-product-button"]').click();

    // Try to submit without filling required fields
    cy.get('[data-testid="register-product-submit"]').click();

    // Verify error messages
    cy.contains('Product name is required').should('be.visible');
    cy.contains('Location is required').should('be.visible');
    cy.contains('Serial number is required').should('be.visible');
  });

  it('should handle registration errors', () => {
    cy.intercept('POST', '/products', { statusCode: 400, body: { error: 'Invalid serial number' } }).as('registerProductError');

    cy.get('[data-testid="register-product-button"]').click();

    cy.get('[data-testid="product-name-input"]').type('Test Product');
    cy.get('[data-testid="location-input"]').type('Test Location');
    cy.get('[data-testid="serial-number-input"]').type('INVALID-SN');

    cy.get('[data-testid="register-product-submit"]').click();
    cy.wait('@registerProductError');

    cy.contains('Invalid serial number').should('be.visible');
  });
});






describe('Setup Wizard - Device Connection Flow', () => {
  beforeEach(() => {
    // Mock hardware services
    cy.window().then((win) => {
      (win as any).wifiService = {
        scanNetworks: cy.stub().resolves([
          { ssid: 'TenderCells-Network', security: 'WPA2', rssi: -30 },
          { ssid: 'Test-Network', security: 'WPA3', rssi: -50 },
          { ssid: 'Open-Network', security: 'none', rssi: -70 },
        ]),
        connectToNetwork: cy.stub().resolves({
          ssid: 'TenderCells-Network',
          connected: true,
          ipAddress: '192.168.1.100',
        }),
      };

      (win as any).bleService = {
        scanDevices: cy.stub().resolves([
          { id: 'ble-1', name: 'TenderCells Device 1', address: 'AA:BB:CC:DD:EE:01' },
        ]),
        connectDevice: cy.stub().resolves({ connected: true }),
      };

      (win as any).mqttService = {
        connect: cy.stub().resolves({ connected: true }),
        subscribe: cy.stub().resolves(),
        publish: cy.stub().resolves(),
      };
    });

    cy.visit('/');
  });

  it('should complete full device connection setup flow', () => {
    // Navigate to products page (assuming there's a way to get there)
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();

    // Find a product that needs setup
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').or('[data-testid="connect-button"]').click();
    });

    // Step 1: Network Selection
    cy.get('[data-testid="wizard-step-network"]').should('be.visible');
    cy.get('[data-testid="wifi-ssid-input"]').type('TenderCells-Network');
    cy.get('[data-testid="security-type-select"]').click();
    cy.contains('WPA2').click();
    cy.get('[data-testid="wizard-next-button"]').click();

    // Step 2: Credentials
    cy.get('[data-testid="wizard-step-credentials"]').should('be.visible');
    cy.get('[data-testid="wifi-password-input"]').type('password123');
    cy.get('[data-testid="wizard-next-button"]').click();

    // Step 3: Pairing
    cy.get('[data-testid="wizard-step-pairing"]').should('be.visible');
    cy.get('[data-testid="connecting-status"]').should('be.visible');
    
    // Wait for connection to complete
    cy.get('[data-testid="connection-success"]', { timeout: 5000 }).should('be.visible');

    // Step 4: Verification
    cy.get('[data-testid="wizard-step-verification"]').should('be.visible');
    cy.get('[data-testid="setup-complete"]').should('be.visible');
    cy.get('[data-testid="wizard-done-button"]').click();

    // Verify product is now connected
    cy.get('[data-testid="product-status"]').should('contain', 'connected');
  });

  it('should allow selecting WiFi network from scan results', () => {
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Click scan networks button
    cy.get('[data-testid="scan-networks-button"]').click();

    // Wait for networks to appear
    cy.get('[data-testid="wifi-network-list"]').should('be.visible');
    cy.get('[data-testid="wifi-network-item"]').should('have.length.greaterThan', 0);

    // Select a network
    cy.get('[data-testid="wifi-network-item"]').first().click();

    // Verify SSID is filled
    cy.get('[data-testid="wifi-ssid-input"]').should('have.value', 'TenderCells-Network');
  });

  it('should handle open networks without password', () => {
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Select open network
    cy.get('[data-testid="wifi-ssid-input"]').type('Open-Network');
    cy.get('[data-testid="security-type-select"]').click();
    cy.contains('None (Open)').click();

    // Password field should be disabled
    cy.get('[data-testid="wifi-password-input"]').should('be.disabled');

    // Should be able to proceed
    cy.get('[data-testid="wizard-next-button"]').click();
    cy.get('[data-testid="wizard-next-button"]').should('not.be.disabled');
  });

  it('should show error and allow retry on connection failure', () => {
    // Mock connection failure
    cy.window().then((win) => {
      (win as any).wifiService.connectToNetwork = cy.stub().rejects(new Error('Connection timeout'));
    });

    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Complete network and credentials
    cy.get('[data-testid="wifi-ssid-input"]').type('Test-Network');
    cy.get('[data-testid="wizard-next-button"]').click();
    cy.get('[data-testid="wifi-password-input"]').type('password123');
    cy.get('[data-testid="wizard-next-button"]').click();

    // Wait for error
    cy.get('[data-testid="connection-error"]', { timeout: 5000 }).should('be.visible');
    cy.contains('Connection Failed').should('be.visible');

    // Retry connection
    cy.get('[data-testid="try-again-button"]').click();

    // Should go back to credentials step
    cy.get('[data-testid="wizard-step-credentials"]').should('be.visible');
  });

  it('should validate required fields at each step', () => {
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Try to proceed without SSID
    cy.get('[data-testid="wizard-next-button"]').should('be.disabled');

    // Enter SSID but try to proceed without password
    cy.get('[data-testid="wifi-ssid-input"]').type('Test-Network');
    cy.get('[data-testid="wizard-next-button"]').click();
    cy.get('[data-testid="wifi-password-input"]').should('be.visible');

    // Try to proceed without password (for secured network)
    cy.get('[data-testid="wizard-next-button"]').should('be.disabled');
  });

  it('should allow BLE device pairing during setup', () => {
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Complete WiFi setup
    cy.get('[data-testid="wifi-ssid-input"]').type('Test-Network');
    cy.get('[data-testid="wizard-next-button"]').click();
    cy.get('[data-testid="wifi-password-input"]').type('password123');
    cy.get('[data-testid="wizard-next-button"]').click();

    // In pairing step, scan for BLE devices
    cy.get('[data-testid="scan-ble-button"]').click();
    cy.get('[data-testid="ble-device-list"]').should('be.visible');
    cy.get('[data-testid="ble-device-item"]').first().click();

    // Verify pairing
    cy.get('[data-testid="device-paired"]').should('be.visible');
  });

  it('should verify device connection after setup', () => {
    cy.get('[data-testid="products-page"]').or('[data-testid="products-link"]').click();
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="setup-button"]').click();
    });

    // Complete setup flow
    cy.get('[data-testid="wifi-ssid-input"]').type('TenderCells-Network');
    cy.get('[data-testid="wizard-next-button"]').click();
    cy.get('[data-testid="wifi-password-input"]').type('password123');
    cy.get('[data-testid="wizard-next-button"]').click();

    // Wait for connection
    cy.get('[data-testid="connection-success"]', { timeout: 5000 }).should('be.visible');

    // Complete verification
    cy.get('[data-testid="wizard-step-verification"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="wizard-done-button"]').click();

    // Verify device status updated
    cy.get('[data-testid="product-connection-status"]').should('contain', 'online');
  });
});






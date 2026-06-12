// connectivity.cy.ts
describe('Connectivity Page', () => {
  beforeEach(() => {
    cy.visit('/connectivity');
    
    // Mock Web Bluetooth API
    cy.window().then((win) => {
      (win as any).navigator = {
        ...win.navigator,
        bluetooth: {
          requestDevice: cy.stub().resolves({
            id: 'ble-device-1',
            name: 'TenderCells Device',
            gatt: {
              connect: cy.stub().resolves({ connected: true }),
            },
          }),
        },
      };
    });
  });

  it('should display connectivity settings', () => {
    cy.get('[data-testid="connectivity-settings"]').should('be.visible');
  });

  it('should scan for BLE devices', () => {
    cy.get('[data-testid="scan-ble-button"]').click();
    cy.get('[data-testid="ble-device-list"]').should('be.visible');
    cy.get('[data-testid="ble-device-item"]').should('have.length.greaterThan', 0);
  });

  it('should pair a BLE device', () => {
    cy.get('[data-testid="scan-ble-button"]').click();
    cy.get('[data-testid="ble-device-item"]').first().click();
    cy.get('[data-testid="pair-device-button"]').click();
    cy.get('[data-testid="pairing-success"]').should('be.visible');
  });

  it('should scan for WiFi networks', () => {
    cy.get('[data-testid="wifi-tab"]').click();
    cy.get('[data-testid="scan-wifi-button"]').click();
    cy.get('[data-testid="wifi-network-list"]').should('be.visible');
  });

  it('should connect to WiFi network', () => {
    cy.get('[data-testid="wifi-tab"]').click();
    cy.get('[data-testid="scan-wifi-button"]').click();
    cy.get('[data-testid="wifi-network-item"]').first().click();
    cy.get('[data-testid="wifi-password-input"]').type('password123');
    cy.get('[data-testid="connect-wifi-button"]').click();
    cy.get('[data-testid="wifi-connected"]').should('be.visible');
  });

  it('should display MQTT connection status', () => {
    cy.get('[data-testid="mqtt-tab"]').click();
    cy.get('[data-testid="mqtt-status"]').should('be.visible');
  });

  it('should connect to MQTT broker', () => {
    cy.get('[data-testid="mqtt-tab"]').click();
    cy.get('[data-testid="mqtt-broker-input"]').type('mqtt://localhost:1883');
    cy.get('[data-testid="mqtt-connect-button"]').click();
    cy.get('[data-testid="mqtt-connected"]').should('be.visible');
  });
});

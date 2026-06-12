// mqtt-hardware-control.cy.ts
// E2E tests for MQTT hardware control via express-api
// Tests the flow: UI → API :3001 → MQTT → hardware

describe('MQTT Hardware Control', () => {
  beforeEach(() => {
    // Intercept API calls to express-api
    cy.intercept('GET', 'http://localhost:3001/health').as('apiHealth');
    cy.intercept('GET', 'http://localhost:3001/api/mqtt/devices/ct_001/telemetry').as('getTelemetry');
    cy.intercept('POST', 'http://localhost:3001/api/mqtt/devices/ct_001/door').as('doorCommand');
    cy.intercept('POST', 'http://localhost:3001/api/mqtt/devices/ct_001/feed').as('feedCommand');
    cy.intercept('POST', 'http://localhost:3001/api/mqtt/devices/ct_001/clean').as('cleanCommand');
    cy.intercept('POST', 'http://localhost:3001/api/mqtt/devices/ct_001/estop').as('estopCommand');

    cy.visit('/chicken-tender');
  });

  it('should load Chicken Tender dashboard', () => {
    cy.contains('Chicken Tender Dashboard').should('be.visible');
  });

  it('should have device ID field', () => {
    cy.get('input[value="ct_001"]').should('exist');
  });

  it('should fetch telemetry from API on load', () => {
    cy.wait('@getTelemetry', { timeout: 10000 }).then((interception) => {
      // API call made, may return 404 if MQTT broker down
      expect(interception.response?.statusCode).to.be.oneOf([200, 404]);
    });
  });

  it('should display Quick Actions buttons', () => {
    cy.contains('button', '🚪 Door Open').should('be.visible');
    cy.contains('button', '🚪 Door Close').should('be.visible');
    cy.contains('button', '🍽️ Feed').should('be.visible');
    cy.contains('button', '🧹 Clean').should('be.visible');
    cy.contains('button', '⛔ ESTOP').should('be.visible');
  });

  it('should open door with confirmation', () => {
    cy.contains('button', '🚪 Door Open').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Confirm').click();

    cy.wait('@doorCommand', { timeout: 5000 }).then((interception) => {
      expect(interception.request.method).to.equal('POST');
      expect(interception.request.body).to.include({ state: 'open' });
    });
  });

  it('should close door with confirmation', () => {
    cy.contains('button', '🚪 Door Close').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Confirm').click();

    cy.wait('@doorCommand', { timeout: 5000 }).then((interception) => {
      expect(interception.request.body).to.include({ state: 'close' });
    });
  });

  it('should dispense feed with confirmation', () => {
    cy.contains('button', '🍽️ Feed').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Confirm').click();

    cy.wait('@feedCommand', { timeout: 5000 }).then((interception) => {
      expect(interception.request.body.amount).to.equal(100);
    });
  });

  it('should start cleaning with confirmation', () => {
    cy.contains('button', '🧹 Clean').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Confirm').click();

    cy.wait('@cleanCommand', { timeout: 5000 }).then((interception) => {
      expect(interception.request.body).to.include({ action: 'start' });
    });
  });

  it('should emergency stop with confirmation', () => {
    cy.contains('button', '⛔ ESTOP').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Confirm').click();

    cy.wait('@estopCommand', { timeout: 5000 }).then((interception) => {
      expect(interception.request.method).to.equal('POST');
    });
  });

  it('should allow changing device ID', () => {
    cy.get('input[value="ct_001"]').clear().type('ct_002');
    cy.get('input[value="ct_002"]').should('exist');
  });

  it('should cancel action on cancel button', () => {
    cy.contains('button', '🚪 Door Open').click();
    cy.contains('Confirm Action').should('be.visible');
    cy.contains('button', 'Cancel').click();

    cy.get('[role="dialog"]').should('not.exist');
    cy.wait(500); // Ensure command not sent
    cy.get('@doorCommand.all').should('have.length', 0);
  });

  it('should handle API errors gracefully', () => {
    cy.intercept('POST', 'http://localhost:3001/api/mqtt/devices/ct_001/door', {
      statusCode: 503,
      body: { error: 'MQTT not connected' },
    });

    cy.contains('button', '🚪 Door Open').click();
    cy.contains('button', 'Confirm').click();

    // Should show error alert
    cy.contains('MQTT not connected').should('be.visible');
  });
});

// connectivity.cy.ts
describe('Connectivity Page', () => {
  beforeEach(() => {
    cy.visit('/connectivity');
  });

  it('should display connectivity settings', () => {
    cy.get('[data-testid="connectivity-settings"]').should('be.visible');
  });

  it('should allow device pairing', () => {
    cy.get('[data-testid="pair-device-button"]').click();
    cy.get('[data-testid="pairing-success"]').should('be.visible');
  });
});

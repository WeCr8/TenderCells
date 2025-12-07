// settings.cy.ts
describe('Settings Page', () => {
  beforeEach(() => {
    cy.visit('/settings');
  });

  it('should display settings page', () => {
    cy.get('[data-testid="settings-page"]').should('be.visible');
  });

  it('should allow saving settings', () => {
    cy.get('[data-testid="save-settings-button"]').click();
    cy.get('[data-testid="settings-saved"]').should('be.visible');
  });
});

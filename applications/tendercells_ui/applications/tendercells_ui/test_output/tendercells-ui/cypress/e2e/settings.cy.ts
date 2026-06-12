// settings.cy.ts
describe('Settings Page', () => {
  beforeEach(() => {
    cy.visit('/settings');
    
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('settings', JSON.stringify({ theme: 'dark', notifications: true }));
    });
  });

  it('should display settings page', () => {
    cy.get('[data-testid="settings-page"]').should('be.visible');
  });

  it('should load saved settings', () => {
    cy.get('[data-testid="theme-select"]').should('have.value', 'dark');
    cy.get('[data-testid="notifications-toggle"]').should('be.checked');
  });

  it('should allow saving settings', () => {
    cy.get('[data-testid="theme-select"]').select('light');
    cy.get('[data-testid="notifications-toggle"]').uncheck();
    cy.get('[data-testid="save-settings-button"]').click();
    cy.get('[data-testid="settings-saved"]').should('be.visible');
  });

  it('should persist settings to localStorage', () => {
    cy.get('[data-testid="theme-select"]').select('light');
    cy.get('[data-testid="save-settings-button"]').click();
    
    // Reload page
    cy.reload();
    
    // Verify settings persisted
    cy.get('[data-testid="theme-select"]').should('have.value', 'light');
  });

  it('should reset settings to defaults', () => {
    cy.get('[data-testid="reset-settings-button"]').click();
    cy.get('[data-testid="confirm-reset-button"]').click();
    cy.get('[data-testid="settings-reset"]').should('be.visible');
  });
});

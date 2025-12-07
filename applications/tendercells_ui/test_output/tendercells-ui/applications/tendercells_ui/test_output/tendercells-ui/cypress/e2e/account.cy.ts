// account.cy.ts
describe('Account Page', () => {
  beforeEach(() => {
    cy.visit('/account');
  });

  it('should display account page', () => {
    cy.get('[data-testid="account-page"]').should('be.visible');
  });

  it('should allow updating account', () => {
    cy.get('[data-testid="update-account-button"]').click();
    cy.get('[data-testid="account-updated"]').should('be.visible');
  });
});

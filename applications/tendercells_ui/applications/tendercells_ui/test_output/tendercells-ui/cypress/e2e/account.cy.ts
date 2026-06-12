// account.cy.ts
describe('Account Page', () => {
  beforeEach(() => {
    // Mock Firebase auth
    cy.window().then((win) => {
      (win as any).firebase = {
        auth: () => ({
          currentUser: { uid: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
          onAuthStateChanged: (callback: any) => {
            callback({ uid: 'test-user-id', email: 'test@example.com' });
            return () => {};
          },
        }),
      };
    });
    
    cy.visit('/account');
  });

  it('should display account page', () => {
    cy.get('[data-testid="account-page"]').should('be.visible');
  });

  it('should display user information', () => {
    cy.get('[data-testid="user-email"]').should('contain', 'test@example.com');
    cy.get('[data-testid="user-name"]').should('be.visible');
  });

  it('should allow updating account information', () => {
    cy.get('[data-testid="update-account-button"]').click();
    cy.get('[data-testid="account-name-input"]').clear().type('Updated Name');
    cy.get('[data-testid="save-account-button"]').click();
    cy.get('[data-testid="account-updated"]').should('be.visible');
  });

  it('should handle Firebase auth integration', () => {
    // Verify user is authenticated
    cy.get('[data-testid="user-email"]').should('be.visible');
    
    // Test password change
    cy.get('[data-testid="change-password-button"]').click();
    cy.get('[data-testid="current-password-input"]').type('oldpassword');
    cy.get('[data-testid="new-password-input"]').type('newpassword123');
    cy.get('[data-testid="confirm-password-input"]').type('newpassword123');
    cy.get('[data-testid="update-password-button"]').click();
    cy.contains('Password updated').should('be.visible');
  });
});

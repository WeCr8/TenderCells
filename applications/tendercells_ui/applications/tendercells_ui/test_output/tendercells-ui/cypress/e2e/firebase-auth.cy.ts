describe('Firebase Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should sign in with email and password', () => {
    // Mock Firebase auth
    cy.window().then((win) => {
      (win as any).firebase = {
        auth: () => ({
          signInWithEmailAndPassword: cy.stub().resolves({
            user: { uid: 'test-user-id', email: 'test@example.com' },
          }),
        }),
      };
    });

    // Navigate to login (if there's a login page/button)
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="sign-in-button"]').click();

    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
    cy.contains('test@example.com').should('be.visible');
  });

  it('should create a new user account', () => {
    cy.window().then((win) => {
      (win as any).firebase = {
        auth: () => ({
          createUserWithEmailAndPassword: cy.stub().resolves({
            user: { uid: 'new-user-id', email: 'newuser@example.com' },
          }),
        }),
      };
    });

    cy.get('[data-testid="sign-up-button"]').click();

    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirm-password-input"]').type('password123');
    cy.get('[data-testid="create-account-button"]').click();

    cy.contains('Account created successfully').should('be.visible');
  });

  it('should persist session after page reload', () => {
    // Login first
    cy.window().then((win) => {
      (win as any).firebase = {
        auth: () => ({
          currentUser: { uid: 'test-user-id', email: 'test@example.com' },
          onAuthStateChanged: (callback: any) => {
            callback({ uid: 'test-user-id', email: 'test@example.com' });
            return () => {};
          },
        }),
      };
    });

    cy.reload();

    // Verify user is still logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should sign out user', () => {
    cy.window().then((win) => {
      (win as any).firebase = {
        auth: () => ({
          currentUser: { uid: 'test-user-id', email: 'test@example.com' },
          signOut: cy.stub().resolves(),
        }),
      };
    });

    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="sign-out-button"]').click();

    // Verify user is signed out
    cy.get('[data-testid="login-button"]').should('be.visible');
  });
});






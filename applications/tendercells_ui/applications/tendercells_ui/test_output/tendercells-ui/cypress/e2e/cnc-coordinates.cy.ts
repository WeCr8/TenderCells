describe('CNC Coordinate System Flow', () => {
  beforeEach(() => {
    cy.visit('/chicken-tender');
    // Mock CNC/GRBL connection
    cy.window().then((win) => {
      (win as any).grblService = {
        connect: cy.stub().resolves({ isOpen: true }),
        getStatus: cy.stub().resolves({
          state: 'Idle',
          position: { work: { x: 0, y: 0, z: 0 }, machine: { x: 0, y: 0, z: 0 } },
          coordinateSystem: 'G54',
        }),
        setCoordinateSystem: cy.stub().resolves(),
        moveTo: cy.stub().resolves(),
      };
    });
  });

  it('should connect to CNC device', () => {
    cy.get('[data-testid="cnc-connect-button"]').click();
    cy.get('[data-testid="cnc-connected"]').should('be.visible');
  });

  it('should select coordinate system G54-G59', () => {
    const coordinateSystems = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];

    coordinateSystems.forEach((system) => {
      cy.get('[data-testid="coordinate-system-select"]').click();
      cy.contains(system).click();
      cy.get('[data-testid="current-coordinate-system"]').should('contain', system);
    });
  });

  it('should display current X, Y, Z positions', () => {
    cy.get('[data-testid="cnc-connect-button"]').click();
    
    cy.get('[data-testid="position-x"]').should('be.visible');
    cy.get('[data-testid="position-y"]').should('be.visible');
    cy.get('[data-testid="position-z"]').should('be.visible');
    
    // Verify positions are numeric
    cy.get('[data-testid="position-x"]').invoke('text').should('match', /-?\d+\.?\d*/);
  });

  it('should send movement commands', () => {
    cy.get('[data-testid="cnc-connect-button"]').click();
    
    cy.get('[data-testid="move-x-input"]').type('100');
    cy.get('[data-testid="move-y-input"]').type('100');
    cy.get('[data-testid="move-z-input"]').type('50');
    cy.get('[data-testid="move-button"]').click();
    
    // Verify command was sent
    cy.get('[data-testid="command-sent"]').should('be.visible');
  });

  it('should execute homing sequence', () => {
    cy.get('[data-testid="cnc-connect-button"]').click();
    cy.get('[data-testid="home-button"]').click();
    
    // Verify homing completed
    cy.get('[data-testid="homing-complete"]').should('be.visible');
    cy.get('[data-testid="position-x"]').should('contain', '0');
    cy.get('[data-testid="position-y"]').should('contain', '0');
    cy.get('[data-testid="position-z"]').should('contain', '0');
  });

  it('should update position in real-time', () => {
    cy.get('[data-testid="cnc-connect-button"]').click();
    
    // Initial position
    cy.get('[data-testid="position-x"]').should('contain', '0');
    
    // Simulate position update
    cy.window().then((win) => {
      (win as any).grblService.getStatus = cy.stub().resolves({
        state: 'Run',
        position: { work: { x: 100, y: 100, z: 50 }, machine: { x: 100, y: 100, z: 50 } },
        coordinateSystem: 'G54',
      });
    });
    
    // Trigger status update
    cy.get('[data-testid="refresh-status-button"]').click();
    
    // Verify position updated
    cy.get('[data-testid="position-x"]').should('contain', '100');
  });
});






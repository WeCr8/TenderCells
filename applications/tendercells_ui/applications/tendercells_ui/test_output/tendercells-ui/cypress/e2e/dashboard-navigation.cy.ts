describe('Product Dashboard Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  const dashboards = [
    { name: 'Chicken Tender', path: '/chicken-tender' },
    { name: 'Roaming Roost', path: '/roaming-roost' },
    { name: 'Duck Dock', path: '/duck-dock' },
    { name: 'Goat Guardian', path: '/goat-guardian' },
    { name: 'Bunny Burrow', path: '/bunny-burrow' },
    { name: 'Turkey Tower', path: '/turkey-tower' },
    { name: 'Predator Monitor', path: '/predator-monitor' },
    { name: 'Rail System Modules', path: '/rail-system-modules' },
    { name: 'TenderCells Cloud', path: '/tender-cells-cloud' },
    { name: 'Pigeon Palace', path: '/pigeon-palace' },
  ];

  dashboards.forEach(({ name, path }) => {
    it(`should navigate to ${name} dashboard`, () => {
      cy.visit(path);
      cy.url().should('include', path);
      
      // Verify dashboard loads (check for common elements)
      cy.get('body').should('be.visible');
      
      // Check if dashboard title or content is present
      // This will depend on actual implementation
      cy.get('main').should('exist');
    });
  });

  it('should persist navigation state', () => {
    cy.visit('/chicken-tender');
    cy.get('[data-testid="side-menu"]').should('exist');
    
    // Navigate to another dashboard
    cy.visit('/duck-dock');
    cy.url().should('include', '/duck-dock');
    
    // Verify navigation menu still exists
    cy.get('[data-testid="side-menu"]').should('exist');
  });

  it('should handle navigation errors gracefully', () => {
    cy.visit('/nonexistent-dashboard');
    
    // Should show 404 or error page
    cy.contains('404').or('Not Found').or('Page not found').should('exist');
  });
});






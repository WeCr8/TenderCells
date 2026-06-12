import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

  for (const { name, path } of dashboards) {
    test(`should navigate to ${name} dashboard`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace(/-/g, '\\-')));
      
      // Verify dashboard loads (check for common elements)
      await expect(page.locator('body')).toBeVisible();
      
      // Check if main content area exists
      await expect(page.locator('main')).toBeVisible();
    });
  }

  test('should redirect root path to chicken-tender', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*chicken-tender/);
  });

  test('should persist navigation state', async ({ page }) => {
    await page.goto('/chicken-tender');
    
    // Check if side menu exists
    const sideMenu = page.locator('[data-testid="side-menu"]');
    if (await sideMenu.count() > 0) {
      await expect(sideMenu).toBeVisible();
    }
    
    // Navigate to another dashboard
    await page.goto('/duck-dock');
    await expect(page).toHaveURL(/.*duck-dock/);
    
    // Verify navigation menu still exists
    if (await sideMenu.count() > 0) {
      await expect(sideMenu).toBeVisible();
    }
  });

  test('should handle navigation errors gracefully', async ({ page }) => {
    await page.goto('/nonexistent-dashboard');
    
    // Should show 404 or error page, or redirect to default
    // The app might redirect to chicken-tender or show an error
    const bodyText = await page.locator('body').textContent();
    const hasError = bodyText?.includes('404') || 
                     bodyText?.includes('Not Found') || 
                     bodyText?.includes('Page not found');
    
    // If no explicit error, check if redirected to default
    if (!hasError) {
      await expect(page).toHaveURL(/.*chicken-tender/);
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to account page', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/.*account/);
    await expect(page.locator('body')).toBeVisible();
  });
});

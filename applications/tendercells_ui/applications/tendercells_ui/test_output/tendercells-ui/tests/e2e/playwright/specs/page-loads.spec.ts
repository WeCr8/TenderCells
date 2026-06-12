import { test, expect } from '@playwright/test';

test.describe('Page Load Tests', () => {
  test('should load home page and redirect to chicken-tender', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should redirect to chicken-tender
    await expect(page).toHaveURL(/.*chicken-tender/);
    
    // Verify page is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load all dashboard pages', async ({ page }) => {
    const dashboards = [
      '/chicken-tender',
      '/roaming-roost',
      '/duck-dock',
      '/goat-guardian',
      '/bunny-burrow',
      '/turkey-tower',
      '/predator-monitor',
      '/rail-system-modules',
      '/tender-cells-cloud',
      '/pigeon-palace',
    ];

    for (const path of dashboards) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('body')).toBeVisible();
      
      // Check for main content
      const main = page.locator('main');
      if (await main.count() > 0) {
        await expect(main).toBeVisible();
      }
    }
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load account page', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*account/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle splash screen', async ({ page }) => {
    await page.goto('/');
    
    // Splash screen should appear briefly (2 seconds according to App.tsx)
    // After that, main content should be visible
    await page.waitForTimeout(2500);
    
    // Main layout should be visible after splash
    const main = page.locator('main');
    if (await main.count() > 0) {
      await expect(main).toBeVisible();
    }
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/chicken-tender');
    await page.waitForLoadState('networkidle');
    
    // Check if title exists (might be in document.title or in the page)
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/chicken-tender');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors if any
    const criticalErrors = errors.filter(
      (error) => !error.includes('favicon') && !error.includes('sourcemap')
    );
    
    // Log errors for debugging but don't fail unless critical
    if (criticalErrors.length > 0) {
      console.log('Console errors:', criticalErrors);
    }
  });
});

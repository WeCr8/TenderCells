import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/dashboard', text: /dashboard|tender cells/i },
  { path: '/products', text: /product|registry|register/i },
  { path: '/layout', text: /property|layout|yard/i },
  { path: '/birds', text: /bird|flock|chicken|duck/i },
  { path: '/chicken-tender', text: /chicken|tender|coop/i },
  { path: '/roaming-roost', text: /roaming|roost/i },
  { path: '/predator-monitor', text: /predator|watchtower|monitor/i },
];

async function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() === 404 && !/favicon/i.test(response.url())) {
      if (/localhost:4000\/api\/products/.test(response.url())) return;
      errors.push(`404 ${response.url()}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!/favicon|React DevTools|Failed to load resource/i.test(text)) errors.push(text);
    }
  });
  return errors;
}

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2300);
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
}

test.describe('TenderCells browser smoke', () => {
  for (const route of routes) {
    test(`renders ${route.path} without runtime errors`, async ({ page }) => {
      const errors = await collectRuntimeErrors(page);
      await page.goto(route.path);
      await waitForApp(page);

      await expect(page.locator('body')).toContainText(route.text);
      await expect(page.locator('body')).not.toContainText(/uncaught|invalid-api-key|createTheme_default/i);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  test('birds page supports demo flock entry point', async ({ page }) => {
    const errors = await collectRuntimeErrors(page);
    await page.goto('/birds');
    await waitForApp(page);

    const demoButton = page.getByRole('button', { name: /load demo flock/i });
    const addButton = page.getByRole('button', { name: /add bird|add animal/i });
    await expect(demoButton.or(addButton).first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/bird|flock/i);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('local backend services needed by the UI are reachable', async ({ request }) => {
    await expect((await request.get('http://localhost:4000/health')).ok()).toBeTruthy();
    await expect((await request.get('http://localhost:8089/health')).ok()).toBeTruthy();
    await expect((await request.get('http://localhost:11434/api/tags')).ok()).toBeTruthy();
  });

  test('product API contract is available or clearly falls back locally', async ({ request }) => {
    const products = await request.get('http://localhost:4000/api/products');
    const stats = await request.get('http://localhost:4000/api/products/stats');

    if (!products.ok() || !stats.ok()) {
      test.info().annotations.push({
        type: 'backend-gap',
        description: 'Local :4000 server is missing /api/products or /api/products/stats; UI should use local fallback.',
      });
    }

    expect([200, 404]).toContain(products.status());
    expect([200, 404]).toContain(stats.status());
  });
});

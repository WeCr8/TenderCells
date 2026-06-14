import { expect, test } from '@playwright/test';

test('live public demo is reachable and renders without obvious runtime failures', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon|React DevTools/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !/favicon/i.test(response.url())) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('https://tendercells.com/app/demo', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
  await expect(page.locator('body')).toContainText(/tendercells|demo|dashboard|flock|animal|farm/i, {
    timeout: 20_000,
  });
  await expect(page.locator('body')).not.toContainText(/cannot access .* before initialization|invalid-api-key|page not found/i);

  expect(errors, errors.join('\n')).toEqual([]);
});

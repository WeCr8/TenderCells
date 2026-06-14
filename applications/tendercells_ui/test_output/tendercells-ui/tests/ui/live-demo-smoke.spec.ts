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

test('live public demo exposes LLM-readable static context', async ({ request }) => {
  const shell = await request.get('https://tendercells.com/app/demo');
  expect(shell.ok()).toBe(true);
  const shellText = await shell.text();
  expect(shellText).toContain('TenderCells Public Demo');
  expect(shellText).toContain('demo-manifest.json');
  expect(shellText).toContain('SoftwareApplication');

  const manifest = await request.get('https://tendercells.com/app/demo-manifest.json');
  expect(manifest.ok()).toBe(true);
  expect(manifest.headers()['content-type']).toMatch(/application\/json|text\/plain/);
  const manifestJson = await manifest.json();
  expect(manifestJson.canonical_url).toBe('https://tendercells.com/app/demo');
  expect(manifestJson.access.requires_login).toBe(false);
  expect(manifestJson.demo_use_cases.length).toBeGreaterThan(2);

  const description = await request.get('https://tendercells.com/app/demo-description.html');
  expect(description.ok()).toBe(true);
  expect(description.headers()['content-type']).toMatch(/text\/html/);
  const descriptionText = await description.text();
  expect(descriptionText).toContain('TenderCells Public Demo Static Description');
});

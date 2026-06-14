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

test('live app natural demo routes render real content instead of blank shells', async ({ page }) => {
  const routes = [
    { path: '/app/eggs', text: /egg map|nest|coop/i },
    { path: '/app/sensors', text: /sensors|temperature|ammonia|coop/i },
    { path: '/app/flock-roster', text: /flock roster|total animals|sample animals/i },
    { path: '/app/tender-ai', text: /tenderai|sensor readings|flock/i },
    { path: '/app/tender-ai-chat', text: /tenderai|sensor readings|flock/i },
    { path: '/app/schedules', text: /schedules|routines|automate/i },
  ];

  for (const route of routes) {
    await page.goto(`https://tendercells.com${route.path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
    await expect(page.locator('body')).toContainText(route.text, { timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText(/api server unavailable on :4000|page not found/i);
  }
});

test('live products page redacts stale local owner data', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'tendercells_dev_products',
      JSON.stringify([
        {
          id: 'garage-chicken-tender-001',
          user_id: 'private-owner@example.test',
          product_type: 'hardware_unit',
          product_name: 'Garage Chicken Tender 001',
          model: 'Chicken Tender Coop - Garage Dev Build',
          serial_number: 'TC-CT-GARAGE-9999',
          activation_code: 'TC-GARAGE-001',
          status: 'setup_required',
          connection_status: 'offline',
          location: 'Garage Electronics Bench',
          metadata: {
            owner_email: 'private-owner@example.test',
            source: 'garage-dev-seed',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]),
    );
  });

  await page.goto('https://tendercells.com/app/products', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
  await expect(page.locator('body')).toContainText('Product & Device Registry', { timeout: 20_000 });
  await expect(page.locator('body')).toContainText('Private local owner');
  await expect(page.locator('body')).toContainText('TC-CT-DEMO-0001');
  await expect(page.locator('body')).not.toContainText(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  await expect(page.locator('body')).not.toContainText(/private-owner@example\.test|TC-CT-GARAGE-9999|First\s+garage\s+build/i);
});

test('live demo explainer shell is useful to non-JS crawlers', async ({ request }) => {
  const response = await request.get('https://tendercells.com/demo');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('TenderCells Public Demo and Site Index');
  expect(html).toContain('Public demo explainer');
  expect(html).toContain('https://tendercells.com/app/demo-manifest.json');
  expect(html).toContain('Chicken Tender');
  expect(html).toContain('WatchTower AI');
  expect(html).toContain('Roaming Roost');
});

test('live marketing site exposes Google policy and consent pages', async ({ page, request }) => {
  await page.goto('https://tendercells.com/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Tender Cells');
  expect(await page.locator('img[src*="chicken-tender-concept"]').count()).toBeGreaterThan(0);
  await expect(page.locator('body')).toContainText('WatchTower AI');
  await expect(page.locator('body')).not.toContainText(/order now|free shipping/i);

  await page.goto('https://tendercells.com/our-story', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/future builders|young engineers|companies/i);

  await page.goto('https://tendercells.com/cookie-policy', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Cookie Policy');
  await expect(page.locator('body')).toContainText('Google AdSense');
  await expect(page.locator('body')).toContainText('Change Cookie Choice');

  await page.goto('https://tendercells.com/advertising-disclosure', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Advertising Disclosure');
  await expect(page.locator('body')).toContainText('Invalid traffic');

  const sitemap = await request.get('https://tendercells.com/sitemap.xml');
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('https://tendercells.com/cookie-policy');
  expect(sitemapText).toContain('https://tendercells.com/apps');
  expect(sitemapText).toContain('https://tendercells.com/our-story');
});

test('live sitemap URLs are crawlable', async ({ request }) => {
  const sitemap = await request.get('https://tendercells.com/sitemap.xml');
  expect(sitemap.ok()).toBe(true);

  const sitemapText = await sitemap.text();
  const urls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length).toBeGreaterThan(30);

  const failures: string[] = [];
  for (const url of urls) {
    const response = await request.get(url);
    if (response.status() >= 400) {
      failures.push(`${response.status()} ${url}`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

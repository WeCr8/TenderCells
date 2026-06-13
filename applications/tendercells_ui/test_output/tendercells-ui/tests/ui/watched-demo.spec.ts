import { expect, test, type Page } from '@playwright/test';

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

async function clickIfVisible(page: Page, name: RegExp) {
  const button = page.getByRole('button', { name }).first();
  if (await button.isVisible()) {
    await button.click();
    await page.waitForTimeout(600);
  }
}

test.describe.serial('watched TenderCells garage demo', () => {
  test('loads demo flock, configures coop hardware, and checks camera plus egg simulation', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await collectRuntimeErrors(page);

    await page.goto('/birds');
    await waitForApp(page);
    await expect(page.locator('body')).toContainText(/bird|flock|chicken/i);
    await clickIfVisible(page, /load chicken tender demo/i);
    await clickIfVisible(page, /load demo flock/i);
    await expect(page.locator('body')).toContainText(/henrietta|dotty|goldie|bluebell|add animal/i);
    await page.screenshot({ path: 'test-results/watched-demo/01-birds-demo-flock.png', fullPage: true });

    await page.goto('/chicken-tender?section=coop');
    await waitForApp(page);
    await expect(page.locator('body')).toContainText(/chicken tender dashboard|coop settings/i);
    await expect(page.locator('body')).toContainText(/internal temp|humidity|occupancy/i);

    await page.getByRole('button', { name: /show cameras/i }).click();
    await expect(page.locator('body')).toContainText(/coop camera view|main feed|roost|nest box/i);
    await page.getByRole('button', { name: /roost/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /nest box/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/watched-demo/02-coop-camera-view.png', fullPage: true });
    await page.getByRole('button', { name: /show cad/i }).click();
    await expect(page.locator('body')).toContainText(/coop cad view/i);

    await page.goto('/chicken-tender?section=doors');
    await waitForApp(page);
    await expect(page.locator('body')).toContainText(/doors & latches|pop door|latch/i);
    await page.getByRole('main').getByRole('button', { name: /^add device$/i }).click();
    await expect(page.getByRole('dialog')).toContainText(/add doors & latches device/i);
    await page.getByLabel(/device name/i).fill('Garage test latch');
    await page.getByRole('button', { name: /^add device$/i }).last().click();
    await expect(page.locator('body')).toContainText(/garage test latch/i);
    await page.screenshot({ path: 'test-results/watched-demo/03-door-device-added.png', fullPage: true });

    await page.goto('/chicken-tender?section=eggs');
    await waitForApp(page);
    await expect(page.locator('body')).toContainText(/egg map|nest sensor|egg scale|nest camera/i);
    await expect(page.locator('body')).toContainText(/reset count|mark collected|scan nests/i);

    await page.goto('/chicken-eye');
    await waitForApp(page);
    await clickIfVisible(page, /load demo flock/i);
    await expect(page.locator('body')).toContainText(/chickeneye|ai vision|cam 1|cam 2|cam 3/i);
    await page.getByText(/cam 2/i).click();
    await page.getByRole('tab', { name: /eggs/i }).click();
    await expect(page.locator('body')).toContainText(/ready to collect|collected today|nest box|egg detected|monitoring/i);
    await clickIfVisible(page, /^collect$/i);
    await page.screenshot({ path: 'test-results/watched-demo/04-chickeneye-eggs.png', fullPage: true });

    await expect(page.locator('body')).not.toContainText(/uncaught|invalid-api-key|createTheme_default/i);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

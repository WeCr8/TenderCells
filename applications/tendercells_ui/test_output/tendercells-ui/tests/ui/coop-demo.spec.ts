import { expect, test, type Page } from '@playwright/test';

// /demo/coop: Chicken Tender coop 3D + DoorCell V1.4 slide door (simulated).
// Screenshots go to test-results/coop-demo/ (gitignored) unless COOP_DEMO_SHOTS is set.
const SHOTS = process.env.COOP_DEMO_SHOTS || 'test-results/coop-demo';
const TIERS = ['base', 'starter', 'plus', 'pro'] as const;

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|React DevTools/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

async function openCoop(page: Page, query: string, tier: string) {
  await page.goto(`/demo/coop?${query}`);
  // GLBs are 3-6 MB; software WebGL in CI is slow.
  await expect(page.getByTestId('coop-demo-canvas')).toHaveAttribute('data-loaded-tier', tier, { timeout: 90_000 });
  await page.waitForTimeout(1200);
}

test.describe('coop demo', () => {
  test.setTimeout(180_000);

  for (const tier of TIERS) {
    test(`renders the ${tier} tier`, async ({ page }) => {
      const errors = trackErrors(page);
      await openCoop(page, `tier=${tier}`, tier);
      await expect(page.getByTestId('coop-door-status')).toHaveAttribute('data-status', 'Closed');
      await page.screenshot({ path: `${SHOTS}/tier_${tier}.png` });
      expect(errors).toEqual([]);
    });
  }

  test('door closed / half / open at Plus', async ({ page }) => {
    const errors = trackErrors(page);
    for (const [door, status] of [[0, 'Closed'], [140, 'Partly open'], [280, 'Open']] as const) {
      await openCoop(page, `tier=plus&view=door&door=${door}`, 'plus');
      const s = page.getByTestId('coop-door-status');
      await expect(s).toHaveAttribute('data-status', status);
      await expect(s).toHaveAttribute('data-travel', door.toFixed(1));
      await page.screenshot({ path: `${SHOTS}/door_${door}.png` });
    }
    expect(errors).toEqual([]);
  });

  test('Open button animates and E-STOP freezes the door', async ({ page }) => {
    await openCoop(page, 'tier=plus&view=door', 'plus');
    await page.getByTestId('coop-door-toggle').click();
    await expect(page.getByTestId('coop-door-status')).toHaveAttribute('data-status', 'Opening');
    await page.waitForTimeout(800);
    await page.getByTestId('coop-estop').click();
    const s = page.getByTestId('coop-door-status');
    await expect(s).toHaveAttribute('data-status', 'E-STOP');
    const frozen = await s.getAttribute('data-travel');
    await page.waitForTimeout(1500);
    await expect(s).toHaveAttribute('data-travel', frozen ?? '');
    await expect(page.getByTestId('coop-estop-banner')).toContainText('Simulated');
    await expect(page.getByTestId('coop-door-toggle')).toBeDisabled();
  });

  test('mixed flock stands in the run (hens view)', async ({ page }) => {
    const errors = trackErrors(page);
    await openCoop(page, 'tier=plus&view=flock', 'plus');
    await expect(page.getByTestId('coop-years')).toHaveAttribute('data-hens', '4');
    await page.screenshot({ path: `${SHOTS}/flock_run.png` });
    // Remove the Leghorn: the panel and the 3D view drop to 3 hens.
    await page.getByRole('checkbox', { name: 'White Leghorn in the flock' }).click();
    await expect(page.getByTestId('coop-years')).toHaveAttribute('data-hens', '3');
    await expect(page.getByTestId('hen-leghorn')).toHaveAttribute('data-on', '0');
    await page.screenshot({ path: `${SHOTS}/flock_run_no_leghorn.png` });
    expect(errors).toEqual([]);
  });

  test('years simulator: seasons, estimate label, playback and coop light', async ({ page }) => {
    const errors = trackErrors(page);
    // Week 44 of year 1 from a March 1 move-in is late December: winter.
    await openCoop(page, 'tier=plus&years=3&week=43', 'plus');
    const panel = page.getByTestId('coop-years');
    await expect(panel).toHaveAttribute('data-season', 'Winter');
    await expect(page.getByTestId('coop-years-estimate')).toBeVisible();
    await expect(page.getByTestId('coop-years-per-year')).toContainText('Year 3');
    const darkEggs = Number(await panel.getAttribute('data-eggs-week'));
    await page.getByTestId('coop-demo-canvas').screenshot({ path: `${SHOTS}/years_winter_scene.png` });
    await panel.screenshot({ path: `${SHOTS}/years_winter_panel.png` });

    await page.getByTestId('coop-light').locator('input').check();
    await expect.poll(async () => Number(await panel.getAttribute('data-eggs-week'))).toBeGreaterThan(darkEggs);

    // Summer of year 2 (week 70): different season, sunnier scene.
    await openCoop(page, 'tier=plus&years=3&week=70&view=flock', 'plus');
    await expect(panel).toHaveAttribute('data-season', 'Summer');
    await page.getByTestId('coop-demo-canvas').screenshot({ path: `${SHOTS}/years_summer_scene.png` });
    await panel.screenshot({ path: `${SHOTS}/years_summer_panel.png` });

    await page.getByTestId('coop-years-play').click();
    await expect.poll(async () => Number(await panel.getAttribute('data-week')), { timeout: 5000 }).toBeGreaterThan(72);
    await page.getByTestId('coop-years-play').click(); // pause
    const paused = await panel.getAttribute('data-week');
    await page.waitForTimeout(600);
    await expect(panel).toHaveAttribute('data-week', paused ?? '');
    await expect(page.getByTestId('coop-years-reminders')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('base tier does chores by hand', async ({ page }) => {
    await openCoop(page, 'tier=base&week=10', 'base');
    await expect(page.getByTestId('coop-years')).toContainText('By hand');
  });
});

test('demo front door links to the coop demos', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Coop through the years', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Coop in 3D', { exact: true })).toBeVisible();
});

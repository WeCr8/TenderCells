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
});

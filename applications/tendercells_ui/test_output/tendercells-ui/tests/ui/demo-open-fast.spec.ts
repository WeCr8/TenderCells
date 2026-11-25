import { expect, test, type Locator, type Page } from '@playwright/test';

// The demo must open fast from a phone and a desktop:
//  - /demo shows a big "See the coop in 3D" button above the fold (while seeding and when ready),
//  - the Property Twin swaps the drawn coop for the showcase GLB (starter, loaded after first paint),
//  - /demo/coop starts on the ~3.4 MB Starter file on phones and Plus on desktop,
//  - the marketing header has a visible "Try the demo" button (set TENDERCELLS_SITE_URL to check it,
//    e.g. http://localhost:5180 for `npm run dev` in ../website).
const SITE = process.env.TENDERCELLS_SITE_URL;
const SHOTS = process.env.DEMO_FAST_SHOTS || 'test-results/demo-open-fast';

const SIZES = [
  { name: 'phone', viewport: { width: 390, height: 844 }, coopTier: 'starter' },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, coopTier: 'plus' },
] as const;

async function expectAboveFold(page: Page, el: Locator) {
  await expect(el).toBeVisible();
  const box = await el.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box, 'button has a box').not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vh);
}

for (const size of SIZES) {
  test.describe(`demo opens fast (${size.name} ${size.viewport.width}x${size.viewport.height})`, () => {
    test.use({ viewport: size.viewport });
    test.setTimeout(150_000);

    test('coop button is above the fold and opens the coop', async ({ page }) => {
      const showcase = page.waitForRequest(/CT_COOP_A_showcase_starter\.glb/, { timeout: 60_000 });
      await page.goto('/demo');
      const btn = page.getByTestId('demo-open-coop');
      await expectAboveFold(page, btn);
      await expect(page.getByTestId('enter-the-farm')).toBeVisible({ timeout: 30_000 });
      await expectAboveFold(page, btn);
      // The yard twin fetches the showcase coop instead of only drawing a box.
      await showcase;
      await page.screenshot({ path: `${SHOTS}/demo_${size.name}.png` });
      await btn.click();
      await expect(page).toHaveURL(/\/demo\/coop$/);
      await expect(page.getByTestId('coop-demo-canvas')).toHaveAttribute('data-loaded-tier', size.coopTier, { timeout: 90_000 });
    });

    test('marketing header shows Try the demo', async ({ page }) => {
      test.skip(!SITE, 'set TENDERCELLS_SITE_URL to check the marketing site');
      await page.goto(SITE!);
      const link = page.getByTestId('header-try-demo');
      await expectAboveFold(page, link);
      await expect(link).toHaveText('Try the demo');
      await expect(link).toHaveAttribute('href', '/app/demo');
    });
  });
}

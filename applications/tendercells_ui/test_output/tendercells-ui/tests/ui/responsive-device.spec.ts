import { expect, test } from '@playwright/test';

const appRoutes = ['/animals', '/layout', '/analytics', '/diagnostics'];

for (const path of appRoutes) {
  test(`${path} has no page-level horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('camera dashboard exposes touch-sized view controls and truthful status', async ({ page }) => {
  await page.route('https://camera.test/stream**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64') });
  });
  await page.addInitScript(() => {
    localStorage.setItem('tendercells_dev_products:demo', JSON.stringify([{
      id: 'cam-test', user_id: 'local', product_type: 'automation_device', product_name: 'School Camera',
      model: 'ESP32-S3 Camera', device_id: 'cam-test-device', status: 'connected', connection_status: 'online',
      registration_method: 'activation_code', registered_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      metadata: {
        product_family: 'camera-kit', controller_board: 'Seeed XIAO ESP32-S3 Sense', camera_module: 'OV2640',
        power_source: 'USB-C 5V', camera_stream_url: 'https://camera.test/stream',
        hardware_capabilities: ['camera', 'microphone', 'gpio'], enabled_capabilities: ['camera'],
      },
    }]));
  });
  await page.goto('/product/cam-test');
  for (const name of ['Refresh camera stream', 'Rotate camera clockwise', 'Flip camera horizontally', 'Flip camera vertically']) {
    const button = page.getByRole('button', { name });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByText('SECURE')).toBeVisible();
  await expect(page.getByText('USB-C 5V', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('No temperature sensor registered')).toBeVisible();
});

test('young-builder flasher keeps projects and install action reachable', async ({ page }) => {
  await page.goto('http://127.0.0.1:5176/flash/index.html');
  await expect(page.getByText('Build with an adult.')).toBeVisible();
  await expect(page.getByText('Watering node')).toBeVisible();
  await expect(page.getByText('Feeding node')).toBeVisible();
  await expect(page.getByText('Motorized RC vehicle')).toBeVisible();
  const install = page.locator('.btn-fallback');
  await expect(install).toBeVisible();
  const box = await install.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

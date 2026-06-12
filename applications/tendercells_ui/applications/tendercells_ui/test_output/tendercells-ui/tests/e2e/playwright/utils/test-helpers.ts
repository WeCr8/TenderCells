import { Page, expect } from '@playwright/test';

/**
 * Wait for element to be visible with optional timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string | RegExp,
  method: string = 'GET',
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(url, async (route) => {
    if (route.request().method() === method) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Fill form field if it exists
 */
export async function fillIfExists(
  page: Page,
  selector: string,
  value: string
): Promise<boolean> {
  const element = page.locator(selector);
  if (await element.count() > 0) {
    await element.fill(value);
    return true;
  }
  return false;
}

/**
 * Click element if it exists
 */
export async function clickIfExists(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      await element.click({ timeout });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get text content if element exists
 */
export async function getTextIfExists(
  page: Page,
  selector: string
): Promise<string | null> {
  const element = page.locator(selector);
  if (await element.count() > 0) {
    return await element.textContent();
  }
  return null;
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Dashboard paths for testing
 */
export const DASHBOARD_PATHS = [
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
] as const;

/**
 * Dashboard names for testing
 */
export const DASHBOARD_NAMES = [
  'Chicken Tender',
  'Roaming Roost',
  'Duck Dock',
  'Goat Guardian',
  'Bunny Burrow',
  'Turkey Tower',
  'Predator Monitor',
  'Rail System Modules',
  'TenderCells Cloud',
  'Pigeon Palace',
] as const;

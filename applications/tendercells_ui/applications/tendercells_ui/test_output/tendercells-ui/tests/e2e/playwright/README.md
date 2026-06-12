# Playwright E2E Tests

This directory contains end-to-end tests for the TenderCells UI application using Playwright.

## Test Structure

```
tests/e2e/playwright/
├── specs/              # Test specification files
│   ├── dashboard-navigation.spec.ts
│   ├── product-registration.spec.ts
│   └── page-loads.spec.ts
├── utils/              # Test utilities and helpers
│   └── test-helpers.ts
└── README.md           # This file
```

## Running Tests

### Run all Playwright tests
```bash
npm run test:playwright
```

### Run tests in UI mode (interactive)
```bash
npm run test:playwright:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:playwright:headed
```

### Run tests in debug mode
```bash
npm run test:playwright:debug
```

### Run specific test file
```bash
npx playwright test tests/e2e/playwright/specs/dashboard-navigation.spec.ts
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report
```bash
npm run test:playwright:report
```

## Test Files

### dashboard-navigation.spec.ts
Tests for navigation between different dashboard pages:
- Navigation to all product dashboards
- Root path redirect
- Navigation state persistence
- Error handling for invalid routes
- Settings and account page navigation

### product-registration.spec.ts
Tests for product registration functionality:
- Registration with serial number
- Registration with QR code
- Registration with activation code
- Form validation
- Error handling

### page-loads.spec.ts
Basic page load and rendering tests:
- Home page redirect
- All dashboard pages load correctly
- Settings and account pages load
- Splash screen handling
- Console error detection

## Configuration

The Playwright configuration is in `playwright.config.ts` at the project root. Key settings:

- **Test Directory**: `./tests/e2e/playwright/specs`
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, Tablet
- **Web Server**: Automatically starts dev server before tests
- **Timeouts**: 30s test timeout, 5s expect timeout

## Test Utilities

The `utils/test-helpers.ts` file provides helper functions:

- `waitForElement()` - Wait for element to be visible
- `elementExists()` - Check if element exists
- `waitForApiResponse()` - Wait for API response
- `mockApiResponse()` - Mock API responses
- `fillIfExists()` - Fill form field if it exists
- `clickIfExists()` - Click element if it exists
- `getTextIfExists()` - Get text content if element exists
- `waitForNavigation()` - Wait for navigation to complete

## Writing New Tests

1. Create a new `.spec.ts` file in the `specs/` directory
2. Import test utilities from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Use `test.beforeEach()` for setup
5. Use `test()` for individual test cases
6. Use `expect()` for assertions

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    await page.click('[data-testid="my-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting with them
3. **Use page.waitForLoadState()** to ensure pages are fully loaded
4. **Mock API responses** when testing features that depend on external services
5. **Use test.skip()** for tests that depend on features not yet implemented
6. **Group related tests** using `test.describe()`
7. **Clean up** in `test.afterEach()` if needed

## CI/CD Integration

Tests are configured to:
- Run in parallel by default (except on CI)
- Retry failed tests on CI (2 retries)
- Generate HTML reports
- Generate JSON reports for CI integration
- Capture screenshots on failure
- Record videos on failure
- Capture traces on retry

## Troubleshooting

### Tests fail with "page.goto: net::ERR_CONNECTION_REFUSED"
- Make sure the dev server is running or Playwright will start it automatically
- Check that the base URL in `playwright.config.ts` matches your dev server port

### Tests are flaky
- Increase timeouts if needed
- Use `page.waitForLoadState('networkidle')` to wait for network activity to complete
- Use `page.waitForSelector()` instead of `page.locator().click()` directly

### Browser not found
- Run `npx playwright install` to install browsers
- Run `npx playwright install chromium` for specific browser

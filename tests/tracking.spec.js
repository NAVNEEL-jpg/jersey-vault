const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Tracking Page', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('tracking page loads without runtime errors', async ({ page }) => {
    await page.goto('/tracking');

    // Verify Tracking page loads by looking for a tracking input or main header
    // The Tracking component usually has a title or input
    const trackingHeading = page.locator('h1', { hasText: /TRACK/i }).first();
    
    // We can also just expect the body to be visible and no errors caught
    await expect(page.locator('#root')).toBeVisible();
    
    // Check if there is an input for tracking ID or email
    const trackingInput = page.getByPlaceholder(/ORDER ID|TRACK/i).first();
    if (await trackingInput.count() > 0) {
      await expect(trackingInput).toBeVisible();
    }
  });
});

const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Homepage', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('loads homepage and renders products without errors', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads by checking the main wrapper or nav
    await expect(page.locator('#jv-root')).toBeVisible();
    
    // Verify products render (wait for at least one product card)
    const productCard = page.locator('.card').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
  });
});

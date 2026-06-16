const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Featured Category', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('featured tab exists, is clickable, and shows products', async ({ page }) => {
    await page.goto('/');

    // Wait for the main UI to load
    await page.locator('.filter-btn').first().waitFor({ state: 'visible' });

    // The actual DOM element for the featured category trigger
    const featuredTab = page.locator('.wc26-video-wrap').first();
    
    await expect(featuredTab).toBeVisible();
    await featuredTab.click({ force: true });

    // Verify products appear
    const productCard = page.locator('.card').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });

    // Verify "No Results Found" does not appear
    await expect(page.getByText('No Results Found', { exact: false })).not.toBeVisible();
  });
});

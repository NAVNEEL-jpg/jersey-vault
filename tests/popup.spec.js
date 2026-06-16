const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Announcement Popup', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
    
    // Clear sessionStorage to ensure popup appears
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('popup appears, Shop Now works and redirects to featured', async ({ page }) => {
    await page.goto('/');

    // Wait for popup to appear
    const popupImage = page.locator('img[alt="SHOP WORLD CUP KITS NOW"]');
    await expect(popupImage).toBeVisible({ timeout: 10000 });

    // Verify Shop Now click works and redirects
    await popupImage.click();

    // Verify popup closes (it shouldn't be visible anymore)
    await expect(popupImage).not.toBeVisible();

    // Verify redirect to featured
    await expect(page).toHaveURL(/\/\?featured=true/);

    // Verify featured section activates correctly using stable class selector
    const featuredTab = page.locator('.filter-btn.wc26-btn').first();
    await expect(featuredTab).toHaveClass(/active/);
  });

  test('popup close button works', async ({ page }) => {
    await page.goto('/');

    // Wait for popup to appear
    const popupImage = page.locator('img[alt="SHOP WORLD CUP KITS NOW"]');
    await expect(popupImage).toBeVisible({ timeout: 10000 });

    // Verify close button works
    const closeBtn = page.getByRole('button', { name: '✕' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify popup closes
    await expect(popupImage).not.toBeVisible();
  });
});

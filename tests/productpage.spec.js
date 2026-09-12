const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Dedicated Jersey Product Page', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('loads standalone product page with sizes, reviews, and "YOU MAY ALSO LIKE" relatable jerseys', async ({ page }) => {
    // Navigate directly to a dedicated product page
    await page.goto('/product/real-madrid-26-27-third-kit-jersey');

    // Verify product title is visible
    const title = page.getByRole('heading', { name: 'Real Madrid 26/27 Third Kit Jersey', exact: true });
    await expect(title).toBeVisible({ timeout: 15000 });

    // Verify size buttons are visible
    const sizeButtons = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL")');
    await expect(sizeButtons.first()).toBeVisible();

    // Verify Size Chart button works
    const sizeChartBtn = page.locator('button:has-text("SIZE CHART")');
    await expect(sizeChartBtn).toBeVisible();
    await sizeChartBtn.click();

    // Verify size chart modal opens with measurements
    await expect(page.locator('text=CHEST (FAN VERSION)')).toBeVisible();
    // Close size chart modal
    await page.locator('.pdp-modal-close').click();

    // Verify Customer Reviews section is present
    const reviewsHeading = page.locator('text=CUSTOMER REVIEWS').first();
    await expect(reviewsHeading).toBeVisible();

    // Verify "YOU MAY ALSO LIKE" section is present below reviews
    const youMayAlsoLike = page.locator('text=YOU MAY ALSO LIKE');
    await expect(youMayAlsoLike).toBeVisible();

    // Verify relatable jerseys are displayed in the recommendations grid
    const relatableCards = page.locator('.pdp-relatable-grid .pdp-card');
    await expect(relatableCards.first()).toBeVisible();
    const cardCount = await relatableCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify clicking a relatable jersey navigates to that product's page
    await relatableCards.first().click();
    await expect(page).toHaveURL(/\/product\//);

    // Verify Add to Cart works
    const addToCartBtn = page.locator('button:has-text("ADD TO CART")');
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Verify Cart Drawer opens with the item
    const cartDrawer = page.locator('.cart-panel');
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer.locator('text=PROCEED TO CHECKOUT')).toBeVisible();
  });
});

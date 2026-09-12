const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Team Page Jersey Modal', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('opens team page, clicks jersey, and verifies size selection and reviews section', async ({ page }) => {
    await page.goto('/teams/real-madrid');

    // Wait for team products to render
    const jerseyCard = page.locator('.tp-card').first();
    await expect(jerseyCard).toBeVisible({ timeout: 15000 });

    // Click on SELECT SIZE button to open the modal
    const selectSizeBtn = jerseyCard.locator('.tp-add-btn');
    await selectSizeBtn.click();

    // Verify modal appears
    const modal = page.locator('.tp-modal');
    await expect(modal).toBeVisible();

    // Verify size selection buttons exist and are clickable
    const sizeButtons = modal.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL"), button:has-text("XXL")');
    await expect(sizeButtons.first()).toBeVisible();

    // Verify SIZE CHART button exists and opens size chart modal
    const sizeChartBtn = modal.locator('button:has-text("SIZE CHART")');
    await expect(sizeChartBtn).toBeVisible();
    await sizeChartBtn.click();

    // Check size chart table is visible
    const sizeChartModal = page.locator('text=CHEST (FAN VERSION)');
    await expect(sizeChartModal).toBeVisible();

    // Close size chart modal
    const closeBtn = page.locator('.tp-modal-close').last();
    await closeBtn.click();

    // Verify Reviews section exists in modal
    const reviewsHeader = modal.locator('text=CUSTOMER REVIEWS').first();
    await expect(reviewsHeader).toBeVisible();

    // Verify "WRITE A REVIEW" button exists
    const writeReviewBtn = modal.locator('button:has-text("WRITE A REVIEW")');
    await expect(writeReviewBtn).toBeVisible();
    await writeReviewBtn.click();

    // Verify review form appears with POST REVIEW button and inputs
    const postReviewBtn = modal.locator('button:has-text("POST REVIEW")');
    await expect(postReviewBtn).toBeVisible();

    const nameInput = modal.locator('input[placeholder*="Rahul S"]');
    await expect(nameInput).toBeVisible();
  });
});

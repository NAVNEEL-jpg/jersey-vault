const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Authentication Flows (UI Only)', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('auth page loads and allows switching between modes without crashing', async ({ page }) => {
    await page.goto('/auth');

    // Verify Login page loads
    await expect(page.getByRole('heading', { name: /WELCOME BACK/i })).toBeVisible();

    // Switch to Signup
    const signupTab = page.locator('button.auth-tab', { hasText: 'SIGN UP' });
    await expect(signupTab).toBeVisible();
    await signupTab.click();

    // Verify Signup page loads
    await expect(page.getByRole('heading', { name: /CREATE ACCOUNT/i })).toBeVisible();

    // Switch back to Login
    const loginTab = page.locator('button.auth-tab', { hasText: 'LOGIN' });
    await loginTab.click();
    await expect(page.getByRole('heading', { name: /WELCOME BACK/i })).toBeVisible();

    // Switch to Forgot Password
    const forgotLink = page.locator('button', { hasText: 'FORGOT PASSWORD?' });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    // Verify Forgot Password page loads
    await expect(page.getByRole('heading', { name: /FORGOT PASSWORD?/i })).toBeVisible();
  });
});

const { test, expect } = require('@playwright/test');
const { setupErrorListeners, checkErrorsAndScreenshot } = require('./setup');

test.describe('Checkout Flow', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = setupErrorListeners(page);
    
    // Inject mock cart data into sessionStorage before navigating
    await page.addInitScript(() => {
      window.sessionStorage.setItem('cart', JSON.stringify([
        { id: 'mock-1', name: 'Mock Jersey', price: 999, size: 'M', qty: 1, type: 'FAN VERSION' }
      ]));
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await checkErrorsAndScreenshot(page, testInfo, errors);
  });

  test('checkout loads and validates empty form submission', async ({ page }) => {
    await page.goto('/checkout');

    // Verify page loads by looking for the delivery details form
    await expect(page.getByText('DELIVERY DETAILS', { exact: false })).toBeVisible();

    // Click the submit/continue button to trigger validation
    const submitBtn = page.getByRole('button', { name: /CONTINUE TO PAYMENT|PLACE ORDER/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify validation errors appear
    // The previous fix added validation styling. E.g. "Name is required", "Enter valid phone"
    const validationError = page.locator('.checkout-field-error').first();
    await expect(validationError).toBeVisible();
    
    // Check specific validation texts based on form
    await expect(page.getByText(/required|valid/i).first()).toBeVisible();
  });
});

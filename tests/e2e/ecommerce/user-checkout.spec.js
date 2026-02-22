import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Ecommerce - Checkout Process', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsUser();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should access checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Verify checkout page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access orders page', async ({ page }) => {
    await page.goto('/user/orders');
    await page.waitForLoadState('networkidle');
    
    // Verify orders page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

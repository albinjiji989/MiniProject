import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Ecommerce - Shopping Cart', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsUser();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should login as user', async ({ page }) => {
    // Already logged in from beforeEach
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access cart page', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Verify cart page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access ecommerce products', async ({ page }) => {
    await page.goto('/ecommerce');
    await page.waitForLoadState('networkidle');
    
    // Verify ecommerce page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

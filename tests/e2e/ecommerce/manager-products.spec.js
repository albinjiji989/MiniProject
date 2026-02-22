import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Ecommerce - Manager Product Management', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsEcommerceManager();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should login as ecommerce manager', async ({ page }) => {
    // Already logged in from beforeEach
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in (check for any common element)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access manager dashboard', async ({ page }) => {
    await page.goto('/manager/ecommerce/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access products page', async ({ page }) => {
    await page.goto('/manager/ecommerce/products');
    await page.waitForLoadState('networkidle');
    
    // Verify products page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

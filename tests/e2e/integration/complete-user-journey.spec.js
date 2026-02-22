import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Integration - Complete User Journey', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should complete user login and navigation', async ({ page }) => {
    // Login as user
    await authHelper.loginAsUser();
    await page.waitForLoadState('networkidle');
    
    // Navigate to ecommerce
    await page.goto('/ecommerce');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Navigate to temporary care
    await page.goto('/temporary-care');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Logout
    await authHelper.logout();
  });

  test('should complete manager workflows', async ({ page }) => {
    // Login as ecommerce manager
    await authHelper.loginAsEcommerceManager();
    await page.waitForLoadState('networkidle');
    
    // Access ecommerce dashboard
    await page.goto('/manager/ecommerce/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Logout
    await authHelper.logout();
  });
});

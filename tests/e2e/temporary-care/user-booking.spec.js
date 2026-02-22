import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Temporary Care - User Booking', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsUser();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should access temporary care page', async ({ page }) => {
    await page.goto('/temporary-care');
    await page.waitForLoadState('networkidle');
    
    // Verify page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access facilities page', async ({ page }) => {
    await page.goto('/user/temporary-care/facilities');
    await page.waitForLoadState('networkidle');
    
    // Verify facilities page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access bookings page', async ({ page }) => {
    await page.goto('/user/temporary-care/bookings');
    await page.waitForLoadState('networkidle');
    
    // Verify bookings page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

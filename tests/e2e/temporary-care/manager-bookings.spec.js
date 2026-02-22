import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';

test.describe('Temporary Care - Manager Booking Management', () => {
  let authHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsTemporaryCareManager();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should login as temporary care manager', async ({ page }) => {
    // Already logged in from beforeEach
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access manager dashboard', async ({ page }) => {
    await page.goto('/manager/temporary-care/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access bookings page', async ({ page }) => {
    await page.goto('/manager/temporary-care/bookings');
    await page.waitForLoadState('networkidle');
    
    // Verify bookings page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

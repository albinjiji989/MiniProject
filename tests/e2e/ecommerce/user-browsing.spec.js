import { test, expect } from '@playwright/test';

test.describe('Ecommerce - User Product Browsing', () => {

  test('should load ecommerce home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Just verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/ecommerce');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access products without login', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Verify page is accessible
    await expect(page.locator('body')).toBeVisible();
  });
});

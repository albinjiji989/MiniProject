// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Simple Authentication Test', () => {
  test('should login as admin', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'albinjiji2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    console.log('✓ Admin login successful');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✓ Error handling works correctly');
  });
});
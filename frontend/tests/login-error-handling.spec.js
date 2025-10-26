// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login Error Handling', () => {
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that error message is displayed
    await expect(page.getByText('Login failed')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Error handling for invalid credentials works correctly');
  });

  test('should remain on login page for empty credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Submit the form without filling anything
    await page.click('form button:has-text("Sign In")');
    
    // Check that we're still on the login page
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✓ Login page remains stable with empty credentials');
  });
});
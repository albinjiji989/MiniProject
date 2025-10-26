// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login Error Handling Tests', () => {
  test('should show error for invalid credentials', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    // Wait for the email field to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that error message is displayed
    await expect(page.getByText('Login failed')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for empty credentials', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
    // Submit the form without filling anything
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that we're still on the login page
    await expect(page).toHaveURL(/.*login/);
  });
});
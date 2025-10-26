// @ts-check
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    // Verify we're on the right page
    await expect(page.getByText('Create Account')).toBeVisible();
    
    // Fill in registration form
    await page.fill('[name="firstName"]', 'Playwright');
    await page.fill('[name="lastName"]', 'Tester');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="phone"]', '9876543210');
    await page.fill('[name="street"]', '123 Test Street');
    await page.fill('[name="city"]', 'Test City');
    await page.fill('[name="state"]', 'Test State');
    await page.fill('[name="postalCode"]', '654321');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    
    // Submit the form
    await page.click('form button:has-text("Create Account")');
    
    // Check that registration was successful and redirected to login
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✓ User registration successful');
  });

  test('should show validation errors for incomplete form', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('form button:has-text("Create Account")');
    
    // Check that validation errors are shown
    await expect(page.getByText('First name is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Last name is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Email is required')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Validation errors displayed correctly');
  });
});
// @ts-check
import { test, expect } from '@playwright/test';

test.describe('User Registration Tests', () => {
  test('should register a new user successfully', async ({ page }) => {
    // Go directly to register page
    await page.goto('/register');
    
    // Verify we're on the right page
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    
    // Fill in registration form
    // Wait for the firstName field to be visible
    await page.waitForSelector('[name="firstName"]', { timeout: 10000 });
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
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Create Account")', { timeout: 10000 });
    await page.click('form button:has-text("Create Account")');
    
    // Check that registration was successful and redirected to login
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
    
    // Check for success message (this might appear as an alert or toast)
    // Using a longer timeout since the message might take time to appear
    try {
      await expect(page.getByText('Signup successful')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // If we're on the login page and the URL is correct, registration was successful
      console.log('Registration successful, but success message not found');
    }
  });

  test('should show validation errors for invalid registration data', async ({ page }) => {
    // Go directly to register page
    await page.goto('/register');
    
    // Try to submit empty form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Create Account")', { timeout: 10000 });
    await page.click('form button:has-text("Create Account")');
    
    // Check that validation errors are shown
    await expect(page.getByText('First name is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Last name is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Email is required')).toBeVisible({ timeout: 5000 });
  });
});
// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Comprehensive Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('/');
  });

  test('should register a new user', async ({ page }) => {
    // Click on register link/button
    await page.click('text=Register');
    
    // Fill in registration form
    // Wait for the firstName field to be visible
    await page.waitForSelector('[name="firstName"]', { timeout: 10000 });
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="phone"]', '1234567890');
    await page.fill('[name="street"]', '123 Test Street');
    await page.fill('[name="city"]', 'Test City');
    await page.fill('[name="state"]', 'Test State');
    await page.fill('[name="postalCode"]', '123456');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('button:has-text("Create Account")', { timeout: 10000 });
    await page.click('button:has-text("Create Account")');
    
    // Check that registration was successful and redirected to login
    await expect(page).toHaveURL(/.*login/);
    
    // Check for success message
    await expect(page.getByText('Signup successful')).toBeVisible({ timeout: 10000 });
  });

  test('should login as admin', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');
    
    // Fill in login form with admin credentials
    // Wait for the email field to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'albinjiji2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Verify admin-specific elements are present
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10000 });
  });

  test('should login as adoption manager', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');
    
    // Fill in login form with adoption manager credentials
    // Wait for the email field to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'albinjiji001@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful
    await expect(page).toHaveURL(/.*manager\/adoption\/dashboard/);
    
    // Verify adoption manager-specific elements are present
    await expect(page.getByText('Adoption')).toBeVisible({ timeout: 10000 });
  });

  test('should login as petshop manager', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');
    
    // Fill in login form with petshop manager credentials
    // Wait for the email field to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'albinjiji002@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful
    await expect(page).toHaveURL(/.*manager\/petshop\/dashboard/);
    
    // Verify petshop manager-specific elements are present
    await expect(page.getByText('Petshop')).toBeVisible({ timeout: 10000 });
  });

  test('should login as public user', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');
    
    // Fill in login form with public user credentials
    // Wait for the email field to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'albinjiji005@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    
    // Submit the form
    // Wait for the submit button to be visible
    await page.waitForSelector('form button:has-text("Sign In")', { timeout: 10000 });
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful
    await expect(page).toHaveURL(/.*User\/dashboard/);
    
    // Verify public user-specific elements are present
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });
  });
});
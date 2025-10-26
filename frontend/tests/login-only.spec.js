// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login Tests', () => {
  test('should login as admin', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
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
    await expect(page).toHaveURL(/.*admin\/dashboard/, { timeout: 10000 });
    
    // Verify admin-specific elements are present
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10000 });
  });

  test('should login as adoption manager', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
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
    await expect(page).toHaveURL(/.*manager\/adoption\/dashboard/, { timeout: 10000 });
    
    // Verify adoption manager-specific elements are present
    await expect(page.getByText('Adoption')).toBeVisible({ timeout: 10000 });
  });

  test('should login as petshop manager', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
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
    await expect(page).toHaveURL(/.*manager\/petshop\/dashboard/, { timeout: 10000 });
    
    // Verify petshop manager-specific elements are present
    await expect(page.getByText('Petshop')).toBeVisible({ timeout: 10000 });
  });

  test('should login as public user', async ({ page }) => {
    // Go directly to login page
    await page.goto('/login');
    
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
    await expect(page).toHaveURL(/.*User\/dashboard/, { timeout: 10000 });
    
    // Verify public user-specific elements are present
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });
  });
});
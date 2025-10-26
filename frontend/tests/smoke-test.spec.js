// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Pet Welfare Management System/);
    
    // Navigate to login page
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
    
    // Navigate to register page
    await page.click('text=Register');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    
    console.log('✓ Navigation between main pages works correctly');
  });

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
});
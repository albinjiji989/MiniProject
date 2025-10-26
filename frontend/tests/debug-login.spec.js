// @ts-check
import { test, expect } from '@playwright/test';

test('Debug login page elements', async ({ page }) => {
  // Go directly to login page
  await page.goto('/login');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if email field exists
  const emailField = page.locator('input[type="email"]');
  await expect(emailField).toBeVisible({ timeout: 10000 });
  
  // Check if password field exists
  const passwordField = page.locator('input[type="password"]');
  await expect(passwordField).toBeVisible({ timeout: 10000 });
  
  // Check if submit button exists (the one within the form)
  const submitButton = page.locator('form button:has-text("Sign In")');
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  
  console.log('All elements found successfully');
});
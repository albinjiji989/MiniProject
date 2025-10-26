// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Core Pages Access Test', () => {
  test('should access landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pet Welfare Management System/);
    await expect(page.getByText('PetWelfare Central')).toBeVisible();
    console.log('✓ Landing page loaded successfully');
  });

  test('should access login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✓ Login page loaded successfully');
  });

  test('should access register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.locator('[name="firstName"]')).toBeVisible();
    console.log('✓ Register page loaded successfully');
  });
});
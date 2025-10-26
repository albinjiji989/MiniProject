// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Specific Pages Test', () => {
  // Test 1: Landing Page
  test('should access landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pet Welfare Management System/);
    await expect(page.getByText('PetWelfare Central')).toBeVisible();
    console.log('✓ Landing page loaded successfully');
  });

  // Test 2: Login Page
  test('should access login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✓ Login page loaded successfully');
  });

  // Test 3: Register Page
  test('should access register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.locator('[name="firstName"]')).toBeVisible();
    console.log('✓ Register page loaded successfully');
  });

  // Test 4: Admin Dashboard
  test('should login as admin and access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'albinjiji2026@mca.ajce.in');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('form button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    console.log('✓ Admin dashboard accessed successfully');
  });

  // Test 5: Adoption Manager Dashboard
  test('should login as adoption manager and access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'albinjiji001@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    await page.click('form button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*manager\/adoption\/dashboard/);
    console.log('✓ Adoption manager dashboard accessed successfully');
  });

  // Test 6: Petshop Manager Dashboard
  test('should login as petshop manager and access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'albinjiji002@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    await page.click('form button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*manager\/petshop\/dashboard/);
    console.log('✓ Petshop manager dashboard accessed successfully');
  });

  // Test 7: Public User Dashboard
  test('should login as public user and access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'albinjiji005@gmail.com');
    await page.fill('input[type="password"]', 'Albin@123');
    await page.click('form button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*User\/dashboard/);
    console.log('✓ Public user dashboard accessed successfully');
  });
});
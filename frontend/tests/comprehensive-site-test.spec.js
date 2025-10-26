// @ts-check
import { test, expect } from '@playwright/test';

// Test credentials
const TEST_USERS = {
  admin: {
    email: 'albinjiji2026@mca.ajce.in',
    password: 'Admin@123',
    dashboard: '/admin/dashboard'
  },
  adoptionManager: {
    email: 'albinjiji001@gmail.com',
    password: 'Albin@123',
    dashboard: '/manager/adoption/dashboard'
  },
  petshopManager: {
    email: 'albinjiji002@gmail.com',
    password: 'Albin@123',
    dashboard: '/manager/petshop/dashboard'
  },
  publicUser: {
    email: 'albinjiji005@gmail.com',
    password: 'Albin@123',
    dashboard: '/User/dashboard'
  }
};

test.describe('Comprehensive Site Testing', () => {
  // Test 1: Landing Page
  test('should access landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Pet Welfare Management System/);
    
    // Check for key elements on landing page
    await expect(page.getByText('PetWelfare Central')).toBeVisible();
    await expect(page.getByText('Caring for every paw')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Landing page loaded successfully');
  });

  // Test 2: Login Page
  test('should access login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button:has-text("Sign In")')).toBeVisible();
    
    console.log('✓ Login page loaded successfully');
  });

  // Test 3: Register Page
  test('should access register page', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form elements
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.locator('[name="firstName"]')).toBeVisible();
    await expect(page.locator('[name="lastName"]')).toBeVisible();
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('form button:has-text("Create Account")')).toBeVisible();
    
    console.log('✓ Register page loaded successfully');
  });

  // Test 4: Admin Dashboard
  test('should login as admin and access dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to admin dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.admin.dashboard));
    
    // Verify admin dashboard elements
    await expect(page.getByText('Admin Portal')).toBeVisible();
    
    console.log('✓ Admin logged in and accessed dashboard successfully');
  });

  // Test 5: Adoption Manager Dashboard
  test('should login as adoption manager and access dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in adoption manager credentials
    await page.fill('input[type="email"]', TEST_USERS.adoptionManager.email);
    await page.fill('input[type="password"]', TEST_USERS.adoptionManager.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to adoption manager dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.adoptionManager.dashboard));
    
    // Verify adoption manager dashboard elements
    await expect(page.getByRole('heading', { name: 'Adoption Manager' })).toBeVisible();
    
    console.log('✓ Adoption manager logged in and accessed dashboard successfully');
  });

  // Test 6: Petshop Manager Dashboard
  test('should login as petshop manager and access dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in petshop manager credentials
    await page.fill('input[type="email"]', TEST_USERS.petshopManager.email);
    await page.fill('input[type="password"]', TEST_USERS.petshopManager.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to petshop manager dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.petshopManager.dashboard));
    
    // Verify petshop manager dashboard elements
    await expect(page.getByRole('heading', { name: 'Petshop Manager' })).toBeVisible();
    
    console.log('✓ Petshop manager logged in and accessed dashboard successfully');
  });

  // Test 7: Public User Dashboard
  test('should login as public user and access dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in public user credentials
    await page.fill('input[type="email"]', TEST_USERS.publicUser.email);
    await page.fill('input[type="password"]', TEST_USERS.publicUser.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to public user dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.publicUser.dashboard));
    
    // Verify public user dashboard elements
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    
    console.log('✓ Public user logged in and accessed dashboard successfully');
  });
});
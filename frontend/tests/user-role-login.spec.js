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

test.describe('User Role Login Tests', () => {
  test('should login as admin', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to admin dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.admin.dashboard));
    
    console.log('✓ Admin logged in successfully');
  });

  test('should login as adoption manager', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in adoption manager credentials
    await page.fill('input[type="email"]', TEST_USERS.adoptionManager.email);
    await page.fill('input[type="password"]', TEST_USERS.adoptionManager.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to adoption manager dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.adoptionManager.dashboard));
    
    console.log('✓ Adoption manager logged in successfully');
  });

  test('should login as petshop manager', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in petshop manager credentials
    await page.fill('input[type="email"]', TEST_USERS.petshopManager.email);
    await page.fill('input[type="password"]', TEST_USERS.petshopManager.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to petshop manager dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.petshopManager.dashboard));
    
    console.log('✓ Petshop manager logged in successfully');
  });

  test('should login as public user', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in public user credentials
    await page.fill('input[type="email"]', TEST_USERS.publicUser.email);
    await page.fill('input[type="password"]', TEST_USERS.publicUser.password);
    
    // Submit the form
    await page.click('form button:has-text("Sign In")');
    
    // Check that login was successful and redirected to public user dashboard
    await expect(page).toHaveURL(new RegExp(TEST_USERS.publicUser.dashboard));
    
    console.log('✓ Public user logged in successfully');
  });
});
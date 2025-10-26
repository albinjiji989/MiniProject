// @ts-check
import { test, expect } from '@playwright/test';

const users = [
  {
    name: 'admin',
    email: 'albinjiji2026@mca.ajce.in',
    password: 'Admin@123',
    dashboard: '/admin/dashboard'
  },
  {
    name: 'adoption manager',
    email: 'albinjiji001@gmail.com',
    password: 'Albin@123',
    dashboard: '/manager/adoption/dashboard'
  },
  {
    name: 'petshop manager',
    email: 'albinjiji002@gmail.com',
    password: 'Albin@123',
    dashboard: '/manager/petshop/dashboard'
  },
  {
    name: 'public user',
    email: 'albinjiji005@gmail.com',
    password: 'Albin@123',
    dashboard: '/User/dashboard'
  }
];

test.describe('All User Dashboards Test', () => {
  for (const user of users) {
    test(`should login as ${user.name} and access dashboard`, async ({ page }) => {
      // Go to login page
      await page.goto('/login');
      
      // Fill in credentials
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      // Submit form
      await page.click('form button:has-text("Sign In")');
      
      // Verify redirection to dashboard
      await expect(page).toHaveURL(new RegExp(user.dashboard));
      
      console.log(`✓ ${user.name} logged in and accessed dashboard successfully`);
    });
  }
});
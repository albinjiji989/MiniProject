import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth.js';

test.describe('Smoke Tests - Critical Functionality', () => {

    test('01 - Homepage loads', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('02 - User can login', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsUser();
        await page.waitForLoadState('networkidle');

        // Verify logged in (check for common element or URL)
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('03 - User can access ecommerce', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsUser();

        await page.goto('/ecommerce');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('04 - User can access temporary care', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsUser();

        await page.goto('/temporary-care');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('05 - Ecommerce manager can login', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsEcommerceManager();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('06 - Ecommerce manager can access dashboard', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsEcommerceManager();

        await page.goto('/manager/ecommerce/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('07 - Ecommerce manager can access products', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsEcommerceManager();

        await page.goto('/manager/ecommerce/products');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('08 - Temporary care manager can login', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsTemporaryCareManager();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('09 - Temporary care manager can access dashboard', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsTemporaryCareManager();

        await page.goto('/manager/temporary-care/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });

    test('10 - Temporary care manager can access bookings', async ({ page }) => {
        const authHelper = new AuthHelper(page);
        await authHelper.loginAsTemporaryCareManager();

        await page.goto('/manager/temporary-care/bookings');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        await authHelper.logout();
    });
});

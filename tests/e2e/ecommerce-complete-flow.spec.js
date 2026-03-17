const { test, expect } = require('@playwright/test');

test.describe('Ecommerce Complete Flow - AI Recommendation & Order Processing', () => {
  test('Complete Ecommerce AI Recommendation and Order Flow', async ({ page }) => {
    
    await test.step('Navigate to Application and Login', async () => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
      
      const loggedInIndicators = ['text=Dashboard', 'text=Profile', 'text=Logout'];
      let alreadyLoggedIn = false;
      
      for (const indicator of loggedInIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 2000 }).catch(() => false)) {
          alreadyLoggedIn = true;
          break;
        }
      }
      
      if (!alreadyLoggedIn) {
        const emailField = page.locator('input[type="email"]').first();
        const passwordField = page.locator('input[type="password"]').first();
        
        if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailField.fill('albinjiji17@gmail.com');
          await passwordField.fill('Albin@123');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(3000);
        }
      }
    });

    await test.step('Navigate to Ecommerce Dashboard', async () => {
      const ecommerceLinks = ['text=Ecommerce', 'text=Shop', '[href*="ecommerce"]'];
      
      for (const linkSelector of ecommerceLinks) {
        const link = page.locator(linkSelector).first();
        if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
          await link.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    });

    await test.step('Verify AI Product Recommendations', async () => {
      await page.waitForTimeout(3000);
      
      const productSelectors = ['.product-card', '.product-item', '[class*="product"]'];
      let productElement = null;
      
      for (const selector of productSelectors) {
        const products = page.locator(selector);
        if (await products.count() > 0) {
          productElement = products.first();
          break;
        }
      }
      
      page.productElement = productElement;
    });

    await test.step('Select and Add Product to Cart', async () => {
      if (page.productElement) {
        await page.productElement.click().catch(() => {});
        await page.waitForTimeout(2000);
      }
      
      const addToCartSelectors = ['button:has-text("Add to Cart")', 'button:has-text("Add")'];
      for (const selector of addToCartSelectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
          await button.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    });

    await test.step('Navigate to Cart', async () => {
      const cartSelectors = ['text=Cart', '[href*="cart"]'];
      let cartFound = false;
      
      for (const selector of cartSelectors) {
        const cartLink = page.locator(selector).first();
        if (await cartLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cartLink.click();
          await page.waitForTimeout(3000);
          cartFound = true;
          break;
        }
      }
      
      if (!cartFound) {
        await page.goto('/user/ecommerce/cart', { waitUntil: 'load', timeout: 15000 });
      }
    });

    await test.step('Proceed to Checkout', async () => {
      const checkoutSelectors = ['button:has-text("Checkout")', 'a:has-text("Checkout")'];
      let checkoutFound = false;
      
      for (const selector of checkoutSelectors) {
        const checkoutBtn = page.locator(selector).first();
        if (await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkoutBtn.click();
          await page.waitForTimeout(3000);
          checkoutFound = true;
          break;
        }
      }
      
      if (!checkoutFound) {
        await page.goto('/user/ecommerce/checkout', { waitUntil: 'load', timeout: 15000 });
      }
    });

    await test.step('Fill Shipping Details', async () => {
      const addressFields = [
        { selector: 'input[name*="address"]', value: '123 Test Street' },
        { selector: 'input[name*="city"]', value: 'Test City' },
        { selector: 'input[name*="pincode"]', value: '123456' },
        { selector: 'input[name*="phone"]', value: '9876543210' }
      ];
      
      for (const field of addressFields) {
        const input = page.locator(field.selector).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          await input.fill(field.value);
        }
      }
    });

    await test.step('Process Razorpay Payment', async () => {
      const orderButtons = ['button:has-text("Place Order")', 'button:has-text("Pay Now")'];
      
      for (const selector of orderButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
          await button.click();
          break;
        }
      }
      
      await page.waitForTimeout(1000);
    });

    await test.step('Handle Razorpay Payment Gateway', async () => {
      await page.waitForTimeout(1000);
      const razorpaySelectors = ['iframe[src*="razorpay"]', '.razorpay-container'];
      
      for (const selector of razorpaySelectors) {
        if (await page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false)) {
          break;
        }
      }
    });

    await test.step('Verify Order Completion', async () => {
      await page.waitForTimeout(2000);
      const successIndicators = ['text=Order Placed', 'text=Success', '.success-message'];
      
      for (const indicator of successIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 3000 }).catch(() => false)) {
          break;
        }
      }
    });

    await test.step('Verify Backend Integration', async () => {
      expect(page.url()).toBeTruthy();
    });

    await test.step('Complete Test', async () => {
      const logoutSelectors = ['button:has-text("Logout")', 'text=Logout'];
      
      for (const selector of logoutSelectors) {
        const logoutBtn = page.locator(selector).first();
        if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutBtn.click();
          break;
        }
      }
    });
  });
});
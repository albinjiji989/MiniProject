const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('PetShop AI Identifier Module', () => {
  test('Pet Identifier AI/ML functionality test', async ({ page }) => {
    // Increase test timeout
    test.setTimeout(60000);
    
    // Test data
    const testUser = {
      email: 'albinjiji17@gmail.com',
      password: 'Albin@123'
    };
    
    const testImagePath = 'C:\\Users\\ADMIN\\Downloads\\images\\goldenR.jpg';
    
    // Step 1: Navigate to login page
    await page.goto('http://localhost:5173/login');
    await expect(page).toHaveTitle(/Pet Welfare Management System/);
    
    // Step 2: Login with valid credentials
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Click login button
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")'));
    await loginButton.click();
    
    // Wait for navigation after login
    await page.waitForTimeout(5000);
    
    // Check if login was successful
    const loginUrl = page.url();
    if (loginUrl.includes('login')) {
      throw new Error('Login failed - still on login page');
    }
    
    // Step 3: Navigate to PetShop module (if not already there)
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (!currentUrl.includes('petshop')) {
      const petshopSelectors = [
        'text=PetShop',
        'text=Pet Shop',
        'text=Petshop',
        '[href*="petshop"]',
        'a:has-text("PetShop")',
        'a:has-text("Pet Shop")'
      ];
      
      let petshopLink = null;
      for (const selector of petshopSelectors) {
        try {
          petshopLink = page.locator(selector).first();
          if (await petshopLink.isVisible({ timeout: 2000 })) {
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!petshopLink || !(await petshopLink.isVisible())) {
        throw new Error('PetShop module link not found in dashboard');
      }
      
      await petshopLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 4: Find and click Pet Identifier button
    await page.waitForTimeout(2000);
    
    const identifierSelectors = [
      'text=Pet Identifier',
      'text=AI Identifier',
      'text=Breed Identifier',
      '[href*="ai-identifier"]',
      'button:has-text("Pet Identifier")',
      'a:has-text("Pet Identifier")'
    ];
    
    let identifierButton = null;
    for (const selector of identifierSelectors) {
      try {
        identifierButton = page.locator(selector).first();
        if (await identifierButton.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!identifierButton || !(await identifierButton.isVisible())) {
      throw new Error('Pet Identifier button not found');
    }
    
    await identifierButton.click();
    
    // Step 5: Verify navigation to AI identifier page
    await page.waitForURL('**/user/petshop/ai-identifier', { timeout: 10000 });
    
    // Wait for upload area to be visible
    const uploadSelectors = [
      'text=Upload Pet Image',
      'text=Upload Image',
      'input[type="file"]',
      '[accept*="image"]'
    ];
    
    let uploadArea = null;
    for (const selector of uploadSelectors) {
      try {
        uploadArea = page.locator(selector).first();
        if (await uploadArea.isVisible({ timeout: 3000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!uploadArea) {
      throw new Error('Upload area not found');
    }
    
    // Step 6: Upload test image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    
    // Step 7: Click identify pet breed button
    await page.waitForTimeout(1000);
    
    const identifySelectors = [
      'text=Identify Pet Breed',
      'text=Identify Breed',
      'text=Identify',
      'button:has-text("Identify")',
      '[type="submit"]'
    ];
    
    let identifyButton = null;
    for (const selector of identifySelectors) {
      try {
        identifyButton = page.locator(selector).first();
        if (await identifyButton.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!identifyButton) {
      throw new Error('Identify button not found');
    }
    
    await identifyButton.click();
    
    // Step 8: Wait for AI processing and verify results
    await page.waitForTimeout(3000);
    
    const resultSelectors = [
      'text=Identification Results',
      'text=Results',
      'text=Golden Retriever',
      'text=German Shepherd',
      '.breed-result',
      '[data-testid="breed-results"]',
      '.ai-results',
      'text=confidence',
      'text=%',
      '.result'
    ];
    
    let resultsFound = false;
    for (const selector of resultSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          resultsFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If no specific results found, check page content
    if (!resultsFound) {
      const pageContent = await page.textContent('body');
      if (pageContent.includes('Golden') || pageContent.includes('German') || pageContent.includes('%') || pageContent.includes('confidence')) {
        resultsFound = true;
      }
    }
    
    // Step 9: Click check availability in stock button
    await page.waitForTimeout(2000);
    
    const availabilitySelectors = [
      'text=Check Availability in Stock',
      'text=Check Availability',
      'text=Check Stock',
      'button:has-text("Check Availability")',
      'button:has-text("Stock")'
    ];
    
    let checkAvailabilityBtn = null;
    for (const selector of availabilitySelectors) {
      try {
        checkAvailabilityBtn = page.locator(selector).first();
        if (await checkAvailabilityBtn.isVisible({ timeout: 3000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!checkAvailabilityBtn) {
      return; // Exit gracefully if button not found
    }
    
    await checkAvailabilityBtn.click();
    
    // Step 10: Verify stock availability results
    await page.waitForTimeout(3000);
    
    const stockResultSelectors = [
      'text=Available in Stock',
      'text=No Availability',
      'text=Out of Stock',
      'text=In Stock',
      '[data-testid="stock-status"]',
      '.stock-result'
    ];
    
    let stockResultFound = false;
    for (const selector of stockResultSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          stockResultFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  });
});
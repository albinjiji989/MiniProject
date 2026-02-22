# Playwright E2E Testing Guide

## Overview
This directory contains end-to-end tests for the Ecommerce and Temporary Care modules using Playwright.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Playwright** installed
3. **Backend server** running on `http://localhost:5000`
4. **Frontend server** running on `http://localhost:5173`
5. **Test database** with seed data

## Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Or install specific browsers
npx playwright install chromium firefox webkit
```

## Project Structure

```
tests/
├── e2e/
│   ├── ecommerce/
│   │   ├── user-browsing.spec.js
│   │   ├── user-cart.spec.js
│   │   ├── user-checkout.spec.js
│   │   ├── user-reviews.spec.js
│   │   ├── manager-products.spec.js
│   │   ├── manager-orders.spec.js
│   │   └── manager-inventory.spec.js
│   └── temporary-care/
│       ├── user-booking.spec.js
│       ├── user-application.spec.js
│       ├── user-payment.spec.js
│       ├── manager-bookings.spec.js
│       └── manager-applications.spec.js
├── pages/
│   ├── EcommercePage.js
│   └── TemporaryCarePage.js
├── utils/
│   ├── auth.js
│   └── test-data.js
├── playwright.config.cjs
└── README.md
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/ecommerce/user-browsing.spec.js
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

### Run Tests with UI Mode
```bash
npm run test:ui
```

### Run Specific Test by Name
```bash
npx playwright test -g "should add product to cart"
```

### Run Tests in Parallel
```bash
npx playwright test --workers=4
```

### Run Tests with Specific Tag
```bash
npx playwright test --grep @smoke
```

## Test Configuration

The test configuration is in `playwright.config.cjs`. Key settings:

- **Base URL**: `http://localhost:5173`
- **Timeout**: 30 seconds
- **Retries**: 2 (in CI), 0 (locally)
- **Screenshots**: On failure
- **Videos**: On failure
- **Trace**: On first retry

### Environment Variables

Create a `.env.test` file:

```env
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=Test@123
TEST_MANAGER_EMAIL=manager@example.com
TEST_MANAGER_PASSWORD=Manager@123
```

## Test Data Setup

### Database Seeding

Before running tests, seed the database with test data:

```bash
cd backend
npm run seed:test
```

### Test Users

The tests expect these users to exist:

1. **Regular User**
   - Email: `testuser@example.com`
   - Password: `Test@123`
   - Role: `user`

2. **Ecommerce Manager**
   - Email: `ecommerce.manager@example.com`
   - Password: `Manager@123`
   - Role: `manager` with `ecommerce` module access

3. **Temporary Care Manager**
   - Email: `care.manager@example.com`
   - Password: `Manager@123`
   - Role: `manager` with `temporary-care` module access

## Writing Tests

### Basic Test Structure

```javascript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth.js';
import { EcommercePage } from '../../pages/EcommercePage.js';

test.describe('Feature Name', () => {
  let authHelper;
  let ecommercePage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    ecommercePage = new EcommercePage(page);
    await authHelper.loginAsUser();
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await ecommercePage.navigateToProducts();
    await expect(page.locator('h1')).toContainText('Products');
  });
});
```

### Using Page Objects

```javascript
// Good - Using Page Object
await ecommercePage.addToCart();

// Bad - Direct page interaction
await page.click('button:has-text("Add to Cart")');
```

### Assertions

```javascript
// Visibility
await expect(page.locator('text="Success"')).toBeVisible();

// Text content
await expect(page.locator('h1')).toContainText('Products');

// Count
const products = await page.locator('[data-testid="product-card"]').count();
expect(products).toBeGreaterThan(0);

// Attribute
await expect(page.locator('button')).toHaveAttribute('disabled', '');

// URL
await expect(page).toHaveURL(/\/products/);
```

## Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

### JSON Report

The test results are also saved in `test-results.json`.

### Screenshots and Videos

Failed test artifacts are saved in:
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`

### View Trace

```bash
npx playwright show-trace test-results/trace.zip
```

## Debugging Tests

### Debug Specific Test

```bash
npx playwright test tests/e2e/ecommerce/user-cart.spec.js --debug
```

### Pause Test Execution

```javascript
test('should do something', async ({ page }) => {
  await page.pause(); // Pauses execution
  // Rest of test
});
```

### Console Logs

```javascript
test('should do something', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  // Rest of test
});
```

### Network Logs

```javascript
test('should do something', async ({ page }) => {
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));
  // Rest of test
});
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Start Backend
      run: |
        cd backend
        npm ci
        npm start &
        sleep 10
    
    - name: Start Frontend
      run: |
        cd frontend
        npm ci
        npm run build
        npm run preview &
        sleep 5
    
    - name: Run Playwright tests
      run: npm test
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## Best Practices

### 1. Use Data Test IDs

```html
<!-- Good -->
<button data-testid="add-to-cart">Add to Cart</button>

<!-- Avoid -->
<button class="btn btn-primary">Add to Cart</button>
```

### 2. Wait for Network Idle

```javascript
await page.waitForLoadState('networkidle');
```

### 3. Use Explicit Waits

```javascript
await page.waitForSelector('[data-testid="product-card"]');
```

### 4. Avoid Hard-Coded Waits

```javascript
// Bad
await page.waitForTimeout(5000);

// Good
await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
```

### 5. Clean Up After Tests

```javascript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await authHelper.logout();
});
```

### 6. Use Test Fixtures

```javascript
test.beforeEach(async ({ page }) => {
  // Setup common test data
  await setupTestData();
});
```

### 7. Isolate Tests

Each test should be independent and not rely on other tests.

### 8. Use Meaningful Test Names

```javascript
// Good
test('should add product to cart and update cart count', async ({ page }) => {});

// Bad
test('test1', async ({ page }) => {});
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in config
- Check if backend/frontend is running
- Check network connectivity

### Authentication Issues

- Verify test user credentials
- Check if JWT token is valid
- Clear browser storage

### Element Not Found

- Use `data-testid` attributes
- Wait for element to be visible
- Check if element is in viewport

### Flaky Tests

- Add proper waits
- Use `waitForLoadState('networkidle')`
- Avoid race conditions

## Performance Testing

### Measure Page Load Time

```javascript
test('should load products page quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

## Accessibility Testing

```javascript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/products');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Visual Regression Testing

```javascript
test('should match screenshot', async ({ page }) => {
  await page.goto('/products');
  await expect(page).toHaveScreenshot('products-page.png');
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Examples](https://github.com/microsoft/playwright/tree/main/examples)

## Support

For issues or questions:
1. Check the documentation
2. Review existing tests
3. Contact the QA team
4. Create an issue in the repository

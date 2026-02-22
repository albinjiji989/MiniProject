# 🚀 Quick Start Guide - Playwright Testing

## Prerequisites Check

Before running tests, ensure:
- ✅ Node.js installed (v16+)
- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:5173`
- ✅ Test accounts exist in database

## 1️⃣ Installation (First Time Only)

```bash
# Navigate to tests directory
cd tests

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## 2️⃣ Verify Test Accounts

Make sure these accounts exist in your database:

| Role | Email | Password |
|------|-------|----------|
| User | albinjiji17@gmail.com | Albin@123 |
| Temp Care Manager | albinjiji003@gmail.com | Albin@123 |
| Ecommerce Manager | albinjiji005@gmail.com | Albin@123 |

## 3️⃣ Start Servers

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Wait for both servers to be ready before running tests.

## 4️⃣ Run Tests

### Terminal 3 - Tests

```bash
cd tests

# Run all tests
npm test

# Run specific module tests
npm run test:ecommerce
npm run test:temporary-care

# Run in headed mode (see browser)
npm run test:headed

# Run in debug mode
npm run test:debug

# Run with UI mode (interactive)
npm run test:ui
```

## 5️⃣ View Results

After tests complete:

```bash
# Open HTML report
npx playwright show-report

# View trace for failed tests
npx playwright show-trace test-results/trace.zip
```

## 📋 Test Execution Examples

### Run Single Test File
```bash
npx playwright test e2e/ecommerce/user-browsing.spec.js
```

### Run Specific Test
```bash
npx playwright test -g "should add product to cart"
```

### Run in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests in Parallel
```bash
npx playwright test --workers=4
```

### Run with Screenshots
```bash
npx playwright test --screenshot=on
```

## 🎯 Quick Test Scenarios

### Test 1: User Shopping Flow
```bash
npx playwright test e2e/ecommerce/user-cart.spec.js --headed
```
**What it tests:**
- Login as user (albinjiji17@gmail.com)
- Browse products
- Add to cart
- Update quantities
- Checkout

### Test 2: Manager Product Management
```bash
npx playwright test e2e/ecommerce/manager-products.spec.js --headed
```
**What it tests:**
- Login as ecommerce manager (albinjiji005@gmail.com)
- Create product
- Update product
- Manage inventory
- View analytics

### Test 3: Temporary Care Booking
```bash
npx playwright test e2e/temporary-care/user-booking.spec.js --headed
```
**What it tests:**
- Login as user (albinjiji17@gmail.com)
- Browse facilities
- Create booking
- Make payment
- Track booking

### Test 4: Manager Booking Management
```bash
npx playwright test e2e/temporary-care/manager-bookings.spec.js --headed
```
**What it tests:**
- Login as temp care manager (albinjiji003@gmail.com)
- View bookings
- Assign staff
- Log activities
- Generate OTPs

### Test 5: Complete User Journey
```bash
npx playwright test e2e/integration/complete-user-journey.spec.js --headed
```
**What it tests:**
- End-to-end user workflows
- Cross-module interactions
- AI recommendations
- Complete purchase flow

## 🐛 Troubleshooting

### Issue: Tests fail with "Navigation timeout"
**Solution:**
```bash
# Check if servers are running
curl http://localhost:5000/health
curl http://localhost:5173
```

### Issue: Login fails
**Solution:**
1. Verify credentials in database
2. Check if accounts are active
3. Try manual login in browser first

### Issue: "Element not found"
**Solution:**
- Run in headed mode to see what's happening
- Check if UI has changed
- Verify data-testid attributes exist

### Issue: Tests are flaky
**Solution:**
```bash
# Run with retries
npx playwright test --retries=3

# Run with slower execution
npx playwright test --slow-mo=1000
```

## 📊 Understanding Test Results

### ✅ Passed Test
```
✓ should add product to cart (2.5s)
```
Test completed successfully.

### ❌ Failed Test
```
✗ should add product to cart (5.2s)
  Error: Timeout 5000ms exceeded
```
Test failed - check screenshot and trace.

### ⊘ Skipped Test
```
⊘ should process payment
```
Test was skipped (usually conditional).

## 🎨 Test Report Features

The HTML report shows:
- ✅ Pass/Fail status
- ⏱️ Execution time
- 📸 Screenshots (on failure)
- 🎥 Videos (on failure)
- 🔍 Trace files (for debugging)
- 📊 Test statistics

## 🔄 Continuous Testing

### Watch Mode (Re-run on changes)
```bash
npx playwright test --watch
```

### Run on File Save
```bash
npx playwright test --ui
```

## 📝 Writing Your First Test

Create `tests/e2e/my-test.spec.js`:

```javascript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth.js';

test('my first test', async ({ page }) => {
  const authHelper = new AuthHelper(page);
  
  // Login
  await authHelper.loginAsUser();
  
  // Navigate
  await page.goto('/products');
  
  // Assert
  await expect(page.locator('h1')).toContainText('Products');
});
```

Run it:
```bash
npx playwright test my-test.spec.js --headed
```

## 🎯 Next Steps

1. ✅ Run all tests to verify setup
2. ✅ Review test reports
3. ✅ Explore test files in `e2e/` directory
4. ✅ Read `PLAYWRIGHT_TESTING_STRATEGY.md` for details
5. ✅ Check `README.md` for advanced usage

## 📞 Need Help?

- 📖 Check `README.md` for detailed documentation
- 🔑 See `TEST_CREDENTIALS.md` for account details
- 📋 Review `PLAYWRIGHT_TESTING_STRATEGY.md` for test scenarios
- 🐛 Check trace files for debugging failed tests

## 🎉 Success Checklist

- [ ] Servers are running
- [ ] Test accounts verified
- [ ] Playwright installed
- [ ] First test run successful
- [ ] HTML report viewed
- [ ] Ready to write more tests!

---

**Happy Testing! 🧪**

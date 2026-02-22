# 🎯 Simple Test Guide

## ✅ What Changed

I've simplified the tests to focus on **10 critical smoke tests** that run:
- ✅ **1 worker only** (sequential execution)
- ✅ **Chromium only** (no Firefox, Safari, Mobile)
- ✅ **No retries** (runs once)
- ✅ **Videos/screenshots only on failure** (saves space)

## 🚀 Quick Start

### Run Smoke Tests (Recommended)
```bash
cd tests
npm run test:smoke
```

This runs **10 essential tests** in ~2-3 minutes:
1. Homepage loads
2. User can login
3. User can access ecommerce
4. User can access temporary care
5. Ecommerce manager can login
6. Ecommerce manager can access dashboard
7. Ecommerce manager can access products
8. Temporary care manager can login
9. Temporary care manager can access dashboard
10. Temporary care manager can access bookings

### View Results
```bash
npm run report
```

## 📊 Test Configuration

### Current Settings
```javascript
workers: 1              // Single worker (sequential)
retries: 0              // No retries
fullyParallel: false    // Sequential execution
video: 'retain-on-failure'    // Only on failure
screenshot: 'only-on-failure' // Only on failure
trace: 'retain-on-failure'    // Only on failure
```

### Browser
- ✅ Chromium only
- ❌ Firefox (disabled)
- ❌ Safari (disabled)
- ❌ Mobile (disabled)

## 🎯 Test Files

### Main Test File
- **smoke-tests.spec.js** - 10 critical tests

### Other Test Files (Optional)
- ecommerce/user-browsing.spec.js - 3 tests
- ecommerce/user-cart.spec.js - 3 tests
- ecommerce/user-checkout.spec.js - 2 tests
- ecommerce/manager-products.spec.js - 3 tests
- temporary-care/user-booking.spec.js - 3 tests
- temporary-care/manager-bookings.spec.js - 3 tests
- integration/complete-user-journey.spec.js - 2 tests

## 📝 Commands

### Run Tests
```bash
# Smoke tests only (recommended)
npm run test:smoke

# All tests
npm test

# Watch mode
npm run test:headed

# Debug mode
npm run test:debug
```

### View Results
```bash
# Open HTML report
npm run report

# View trace
npm run trace:last

# Clean old results
npm run clean
```

## 🎬 What Gets Recorded

### On Success
- ✅ Test passes
- ❌ No video
- ❌ No screenshots
- ❌ No trace

### On Failure
- ❌ Test fails
- ✅ Video recorded
- ✅ Screenshots taken
- ✅ Trace captured

## 📈 Expected Results

### Smoke Tests
```
Running 10 tests using 1 worker

✓ 01 - Homepage loads (2s)
✓ 02 - User can login (3s)
✓ 03 - User can access ecommerce (2s)
✓ 04 - User can access temporary care (2s)
✓ 05 - Ecommerce manager can login (3s)
✓ 06 - Ecommerce manager can access dashboard (2s)
✓ 07 - Ecommerce manager can access products (2s)
✓ 08 - Temporary care manager can login (3s)
✓ 09 - Temporary care manager can access dashboard (2s)
✓ 10 - Temporary care manager can access bookings (2s)

10 passed (25s)
```

## 🔧 Troubleshooting

### Tests Still Running Multiple Times?
Check:
```bash
# Verify config
cat playwright.config.cjs | grep workers
# Should show: workers: 1

cat playwright.config.cjs | grep retries
# Should show: retries: 0
```

### Too Many Test Files Running?
Run smoke tests only:
```bash
npm run test:smoke
```

### Want to Run Specific Test?
```bash
npx playwright test smoke-tests.spec.js
```

## 🎯 Test Coverage

### What's Tested
- ✅ Authentication (all 3 roles)
- ✅ Page navigation
- ✅ Module access
- ✅ Dashboard access
- ✅ Basic functionality

### What's NOT Tested (Yet)
- ❌ Form submissions
- ❌ CRUD operations
- ❌ Payment flows
- ❌ Complex workflows

## 📊 Why Only 10 Tests?

These 10 tests verify:
1. **Application is running**
2. **Authentication works** for all roles
3. **Critical pages load** without errors
4. **Routing works** correctly
5. **No major crashes** or errors

This gives you **80% confidence** with **minimal test time**.

## 🚀 Next Steps

Once these 10 tests pass consistently:
1. Add more specific tests
2. Test form submissions
3. Test CRUD operations
4. Test payment flows
5. Enable other browsers

## 💡 Pro Tips

### Run in Headed Mode
```bash
npx playwright test smoke-tests.spec.js --headed
```
Watch the browser while tests run!

### Debug Specific Test
```bash
npx playwright test smoke-tests.spec.js -g "User can login" --debug
```

### Generate Test Code
```bash
npm run codegen
```
Record your actions as test code!

## 📞 Need Help?

If tests fail:
1. Check servers are running
2. Verify credentials in database
3. Try manual login in browser
4. Check console for errors
5. View video/trace of failed test

---

**Run `npm run test:smoke` to get started! 🚀**

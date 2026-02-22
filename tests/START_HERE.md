# 🎯 START HERE - Functional Testing

## ✅ What You Have Now

**20 focused functional tests** that run:
- 1 worker (sequential)
- Chromium only
- No retries
- Videos only on failure
- **Real functionality testing** (not just page loads!)

## 🚀 Quick Start (3 Steps)

### 1. Make sure servers are running
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Run functional tests
```bash
# Terminal 3 - Tests
cd tests
npm test
# or
npm run test:functional
```

### 3. View results
```bash
npm run report
```

## 📊 What Gets Tested (20 Tests)

### Ecommerce User Tests (7 tests)
1. ✅ Browse products and view details
2. ✅ Search for products
3. ✅ Add product to cart
4. ✅ View shopping cart
5. ✅ View wishlist
6. ✅ View order history
7. ✅ Access user profile

### Ecommerce Manager Tests (6 tests)
8. ✅ View dashboard with stats
9. ✅ View products list
10. ✅ Search products in manager panel
11. ✅ View orders list
12. ✅ Access inventory management
13. ✅ View category management

### Temporary Care User Tests (4 tests)
14. ✅ Browse facilities
15. ✅ View my bookings
16. ✅ View my applications
17. ✅ Access dashboard

### Temporary Care Manager Tests (3 tests)
18. ✅ View dashboard with stats
19. ✅ View all bookings
20. ✅ View facility management

## ⏱️ Expected Time

- **~3-5 minutes** for all 20 tests
- **Sequential execution** (one at a time)
- **No parallel workers**

## 🎯 Commands

```bash
# Run functional tests (default)
npm test

# Or explicitly
npm run test:functional

# Run smoke tests (10 basic tests)
npm run test:smoke

# Watch tests run
npm run test:headed

# Debug specific test
npx playwright test functional-tests.spec.js -g "Add product to cart" --debug

# View report
npm run report

# Clean results
npm run clean
```

## 📁 Key Files

- **functional-tests.spec.js** - Main test file (20 tests) ⭐
- **smoke-tests.spec.js** - Basic tests (10 tests)
- **playwright.config.cjs** - Configuration (1 worker, Chromium only)
- **START_HERE.md** - This file

## 🔑 Test Accounts

- **User**: albinjiji17@gmail.com / Albin@123
- **Temp Care Manager**: albinjiji003@gmail.com / Albin@123
- **Ecommerce Manager**: albinjiji005@gmail.com / Albin@123

## ✨ What Changed from Before

### Before (295 tests)
- Multiple browsers (Chrome, Firefox, Safari, Mobile)
- Multiple workers (parallel execution)
- Retries enabled
- All tests running
- Videos for everything

### Now (20 functional tests)
- Chromium only
- 1 worker (sequential)
- No retries
- Focused functional tests
- Videos only on failure
- **Tests real functionality** (search, cart, bookings, etc.)

## 🎉 Success Looks Like

```
Running 20 tests using 1 worker

✓ 01 - User: Browse products and view details (3s)
✓ 02 - User: Search for products (2s)
✓ 03 - User: Add product to cart (4s)
✓ 04 - User: View shopping cart (2s)
✓ 05 - User: View wishlist (2s)
✓ 06 - User: View order history (2s)
✓ 07 - User: Access user profile (2s)
✓ 08 - Manager: View ecommerce dashboard with stats (3s)
✓ 09 - Manager: View products list (2s)
✓ 10 - Manager: Search products in manager panel (3s)
✓ 11 - Manager: View orders list (2s)
✓ 12 - Manager: Access inventory management (2s)
✓ 13 - Manager: View category management (2s)
✓ 14 - User: Browse temporary care facilities (2s)
✓ 15 - User: View my bookings (2s)
✓ 16 - User: View my applications (2s)
✓ 17 - User: Access temporary care dashboard (2s)
✓ 18 - Manager: View temporary care dashboard with stats (3s)
✓ 19 - Manager: View all bookings (2s)
✓ 20 - Manager: View facility management (2s)

20 passed (50s)
```

## 🐛 If Tests Fail

1. **Check servers**
   ```bash
   curl http://localhost:5000/health
   curl http://localhost:5173
   ```

2. **Try manual login**
   - Open browser
   - Go to http://localhost:5173/login
   - Try logging in with test credentials

3. **View failed test video**
   ```bash
   npm run report
   # Click failed test → Watch video
   ```

4. **Check trace**
   ```bash
   npm run trace:last
   ```

## 📚 More Info

- **SIMPLE_TEST_GUIDE.md** - Detailed guide
- **functional-tests.spec.js** - View test code
- **README.md** - Full documentation

---

**Ready? Run `npm test` now! 🚀**

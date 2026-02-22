# 🚀 Playwright Commands Cheat Sheet

## ⚡ Quick Start

```bash
cd tests
npm install              # Install dependencies
npx playwright install   # Install browsers
npm test                # Run all tests
npm run report          # View HTML report
```

## 🎯 Run Tests

### All Tests
```bash
npm test                          # All tests, all browsers
npm run test:headed              # Watch browser while testing
npm run test:ui                  # Interactive UI mode
npm run test:debug               # Debug mode
```

### Specific Modules
```bash
npm run test:ecommerce           # Ecommerce tests only
npm run test:temporary-care      # Temporary care tests only
```

### Specific Browsers
```bash
npm run test:chromium            # Chrome only
npm run test:firefox             # Firefox only
npm run test:webkit              # Safari only
npm run test:mobile              # Mobile Chrome
```

### Specific Tests
```bash
# Run single file
npx playwright test e2e/ecommerce/user-cart.spec.js

# Run specific test by name
npx playwright test -g "should add product to cart"

# Run tests matching pattern
npx playwright test user-
```

## 📊 View Results

### Reports
```bash
npm run report                   # Open HTML report
npm run test:report              # Run tests + open report
```

### Videos & Traces
```bash
npm run trace:last               # View latest trace
npm run videos:list              # List all videos

# View specific trace
npx playwright show-trace test-results/[test-name]/trace.zip
```

## 🎥 Video & Screenshot Locations

```bash
# Videos
test-results/[test-name]-chromium/video.webm

# Screenshots
test-results/[test-name]-chromium/*.png

# Traces
test-results/[test-name]-chromium/trace.zip

# HTML Report
playwright-report/index.html
```

## 🔧 Utilities

### Clean & Setup
```bash
npm run clean                    # Remove old results
npm run install:browsers         # Reinstall browsers
npm run codegen                  # Record new tests
```

### Test Generation
```bash
# Record actions as test code
npm run codegen

# Record from specific URL
npx playwright codegen http://localhost:5173/products
```

## 🎨 Advanced Options

### Parallel Execution
```bash
npx playwright test --workers=4          # 4 parallel workers
npx playwright test --workers=1          # Sequential
```

### Retry & Timeout
```bash
npx playwright test --retries=3          # Retry failed tests 3 times
npx playwright test --timeout=60000      # 60 second timeout
```

### Output Control
```bash
npx playwright test --reporter=list      # List reporter
npx playwright test --reporter=dot       # Minimal output
npx playwright test --quiet              # Suppress output
```

### Screenshots & Videos
```bash
npx playwright test --screenshot=on      # Always screenshot
npx playwright test --video=on           # Always record
npx playwright test --trace=on           # Always trace
```

## 🐛 Debugging

### Debug Modes
```bash
npm run test:debug               # Debug mode
npm run test:headed              # See browser
npm run test:ui                  # Interactive UI

# Debug specific test
npx playwright test user-cart.spec.js --debug
```

### Pause Execution
```javascript
// In test file
await page.pause();              // Pauses test execution
```

### Inspect Element
```bash
# Generate selector
npx playwright inspector
```

## 📝 Test Writing

### Create New Test
```javascript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth.js';

test('my test', async ({ page }) => {
  const authHelper = new AuthHelper(page);
  await authHelper.loginAsUser();
  
  await page.goto('/products');
  await expect(page.locator('h1')).toContainText('Products');
});
```

### Run New Test
```bash
npx playwright test my-test.spec.js --headed
```

## 🔍 Filtering Tests

### By Status
```bash
npx playwright test --grep @smoke          # Smoke tests
npx playwright test --grep @regression     # Regression tests
npx playwright test --grep-invert @slow    # Exclude slow tests
```

### By File Pattern
```bash
npx playwright test user-                  # All user tests
npx playwright test manager-               # All manager tests
npx playwright test integration/           # Integration tests
```

## 📊 Reporting Options

### Multiple Reporters
```bash
# HTML + JSON + JUnit
npx playwright test --reporter=html,json,junit
```

### Custom Report Location
```bash
npx playwright test --reporter=html --reporter-output=my-report
```

## 🌐 Environment Variables

### Set Base URL
```bash
BASE_URL=http://localhost:3000 npm test
```

### Set API URL
```bash
API_URL=http://localhost:4000 npm test
```

### Use .env File
```bash
# Create .env.test
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000

# Tests will use these automatically
```

## 🎯 Common Workflows

### Workflow 1: Quick Test
```bash
npm test                         # Run tests
npm run report                   # View results
```

### Workflow 2: Debug Failed Test
```bash
npm test                         # Run tests
npm run report                   # Open report
# Click failed test → Watch video
npm run trace:last               # View trace
```

### Workflow 3: Develop New Test
```bash
npm run codegen                  # Record actions
# Edit generated test
npx playwright test new-test.spec.js --headed
```

### Workflow 4: CI/CD
```bash
npm test                         # Run all tests
# Upload playwright-report/ as artifact
```

## 🔑 Authentication

### Login Commands (in tests)
```javascript
const authHelper = new AuthHelper(page);

// User
await authHelper.loginAsUser();
// Uses: albinjiji17@gmail.com / Albin@123

// Temporary Care Manager
await authHelper.loginAsTemporaryCareManager();
// Uses: albinjiji003@gmail.com / Albin@123

// Ecommerce Manager
await authHelper.loginAsEcommerceManager();
// Uses: albinjiji005@gmail.com / Albin@123
```

## 📦 Package Scripts

```bash
npm test                         # Run all tests
npm run test:headed             # Headed mode
npm run test:debug              # Debug mode
npm run test:ui                 # UI mode
npm run test:chromium           # Chrome only
npm run test:firefox            # Firefox only
npm run test:webkit             # Safari only
npm run test:mobile             # Mobile
npm run test:ecommerce          # Ecommerce module
npm run test:temporary-care     # Temp care module
npm run test:smoke              # Smoke tests
npm run test:regression         # Regression tests
npm run test:report             # Run + open report
npm run report                  # Open report
npm run report:open             # Open report
npm run trace                   # Show trace
npm run trace:last              # Latest trace
npm run videos:list             # List videos
npm run clean                   # Clean results
npm run codegen                 # Record tests
npm run install:browsers        # Install browsers
```

## 🎬 Video Controls

### In HTML Report
- ▶️ Play/Pause
- ⏩ Speed: 0.5x, 1x, 1.5x, 2x
- 🔊 Mute/Unmute
- 📺 Fullscreen
- ⏱️ Scrub timeline

### Direct File Access
```bash
# Windows
start test-results/test-name-chromium/video.webm

# Mac
open test-results/test-name-chromium/video.webm

# Linux
xdg-open test-results/test-name-chromium/video.webm
```

## 🚨 Troubleshooting

### Tests Timeout
```bash
# Increase timeout
npx playwright test --timeout=60000

# Check servers
curl http://localhost:5000/health
curl http://localhost:5173
```

### Login Fails
```bash
# Verify credentials
cat tests/.env.test

# Try manual login in browser
# Check database for accounts
```

### Element Not Found
```bash
# Run in headed mode
npm run test:headed

# Use inspector
npx playwright inspector
```

### Flaky Tests
```bash
# Add retries
npx playwright test --retries=3

# Run with trace
npx playwright test --trace=on
```

## 📚 Documentation

```bash
# Quick start
cat tests/QUICK_START.md

# Commands
cat tests/COMMANDS_CHEAT_SHEET.md

# Reports
cat tests/QUICK_REPORT_GUIDE.md

# Full docs
cat tests/README.md
```

## 🎉 Most Used Commands

```bash
# Development
npm run test:headed             # Watch tests run
npm run test:ui                 # Interactive mode
npm run codegen                 # Record new tests

# Testing
npm test                        # Run all tests
npm run test:ecommerce         # Ecommerce only
npm run test:temporary-care    # Temp care only

# Debugging
npm run report                  # View results
npm run trace:last             # View trace
npx playwright test --debug    # Debug mode

# Maintenance
npm run clean                   # Clean results
npm run install:browsers       # Update browsers
```

---

**Print this and keep it handy! 📋**

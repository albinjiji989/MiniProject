# 📊 Viewing Test Reports and Videos

## 🎥 Video Recording Configuration

Your Playwright tests are now configured to **always record videos** for every test run, not just failures.

### Current Settings
```javascript
video: 'on'           // Records video for ALL tests
screenshot: 'on'      // Takes screenshots for ALL tests
trace: 'on'           // Captures trace for ALL tests
```

## 📁 Where Files Are Saved

After running tests, you'll find:

```
tests/
├── playwright-report/          # HTML Report
│   ├── index.html             # Main report file
│   └── data/                  # Report data
├── test-results/              # Test artifacts
│   ├── test-name-chromium/    # Per-test folder
│   │   ├── video.webm        # Video recording
│   │   ├── trace.zip         # Trace file
│   │   └── test-failed-1.png # Screenshots
│   └── test-results.json     # JSON results
└── videos/                    # All videos (if configured)
```

## 🎬 Viewing Videos

### Method 1: From HTML Report (Recommended)
```bash
# Run tests
npm test

# Open HTML report
npx playwright show-report
```

In the HTML report:
1. Click on any test
2. Click the **"Video"** tab
3. Watch the video inline in the browser

### Method 2: Direct Video Files
```bash
# Navigate to test results
cd test-results

# Find your test folder
ls -la

# Open video file
# Windows
start test-name-chromium/video.webm

# Mac
open test-name-chromium/video.webm

# Linux
xdg-open test-name-chromium/video.webm
```

### Method 3: Using VLC or Browser
1. Navigate to `tests/test-results/[test-name]/video.webm`
2. Double-click to open in default video player
3. Or drag into browser window

## 📊 Viewing HTML Report

### Open Report
```bash
# After running tests
npx playwright show-report

# Or manually open
# Windows
start playwright-report/index.html

# Mac
open playwright-report/index.html

# Linux
xdg-open playwright-report/index.html
```

### Report Features

#### 1. Test Overview
- ✅ Total tests run
- ✅ Pass/Fail count
- ✅ Execution time
- ✅ Browser breakdown

#### 2. Test Details
Click any test to see:
- **Steps**: Each action taken
- **Screenshots**: Visual snapshots
- **Video**: Full test recording
- **Trace**: Detailed execution trace
- **Errors**: Stack traces and messages

#### 3. Filtering
- Filter by status (passed/failed/skipped)
- Filter by browser
- Search by test name
- Sort by duration

#### 4. Timeline
- Visual timeline of test execution
- Parallel execution visualization
- Performance metrics

## 🔍 Viewing Trace Files

Trace files provide the most detailed debugging information.

### Open Trace Viewer
```bash
# For specific test
npx playwright show-trace test-results/test-name-chromium/trace.zip

# Or from HTML report
# Click test → Click "Trace" tab
```

### Trace Viewer Features

#### 1. Action Timeline
- Every action performed
- Timestamps
- Duration
- Success/failure status

#### 2. Screenshots
- Before/after each action
- Hover to see screenshot
- Click to enlarge

#### 3. Network Activity
- All API calls
- Request/response details
- Timing information
- Status codes

#### 4. Console Logs
- All console messages
- Errors and warnings
- Custom logs

#### 5. Source Code
- Test code
- Line-by-line execution
- Current step highlighted

#### 6. Call Stack
- Function calls
- Stack traces
- Error origins

## 📸 Screenshots

### Automatic Screenshots
Screenshots are taken:
- ✅ After every action (with `screenshot: 'on'`)
- ✅ On test failure
- ✅ At specific checkpoints

### Manual Screenshots
Add to your tests:
```javascript
// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Full page screenshot
await page.screenshot({ 
  path: 'full-page.png', 
  fullPage: true 
});

// Element screenshot
await page.locator('.product-card').screenshot({ 
  path: 'product.png' 
});
```

### View Screenshots
1. In HTML report: Click test → "Screenshots" tab
2. In test-results folder: `test-name-chromium/*.png`

## 🎯 Test Execution with Reports

### Run Tests and View Report
```bash
# Run all tests
npm test

# Automatically opens report
npx playwright show-report
```

### Run Specific Tests
```bash
# Run single test file
npx playwright test e2e/ecommerce/user-cart.spec.js

# View report
npx playwright show-report
```

### Run in Headed Mode (Watch Live)
```bash
# See browser while tests run
npm run test:headed

# Or
npx playwright test --headed
```

### Run with UI Mode (Interactive)
```bash
# Interactive test runner
npm run test:ui

# Features:
# - Watch tests run
# - Pause/resume
# - Step through
# - Time travel debugging
```

## 📹 Video Settings Options

### Current (Always Record)
```javascript
video: 'on'  // Records all tests
```

### Alternative Options
```javascript
// Only on failure
video: 'retain-on-failure'

// Only on first retry
video: 'on-first-retry'

// Never record
video: 'off'

// Custom settings
video: {
  mode: 'on',
  size: { width: 1280, height: 720 }
}
```

## 🎨 Customizing Reports

### Add Custom Reporter
Edit `playwright.config.cjs`:
```javascript
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'always' }],
  ['json', { outputFile: 'test-results.json' }],
  ['junit', { outputFile: 'junit.xml' }],
  ['list'], // Console output
  ['dot'],  // Minimal console
],
```

### Report Options
```javascript
reporter: [
  ['html', { 
    outputFolder: 'my-report',
    open: 'never',        // 'always', 'never', 'on-failure'
    host: 'localhost',
    port: 9323
  }]
]
```

## 📊 Understanding Test Results

### Test Status Icons
- ✅ **Passed**: Test completed successfully
- ❌ **Failed**: Test failed with error
- ⊘ **Skipped**: Test was skipped
- ⏱️ **Timeout**: Test exceeded time limit
- 🔄 **Flaky**: Test passed after retry

### Execution Time
- **Fast**: < 1 second (green)
- **Medium**: 1-5 seconds (yellow)
- **Slow**: > 5 seconds (red)

### Browser Icons
- 🌐 Chromium
- 🦊 Firefox
- 🧭 WebKit (Safari)
- 📱 Mobile

## 🔧 Troubleshooting

### Videos Not Recording?
```bash
# Check config
cat tests/playwright.config.cjs | grep video

# Should show: video: 'on'
```

### Report Not Opening?
```bash
# Manually open
cd tests
npx playwright show-report

# Or open file directly
open playwright-report/index.html
```

### Videos Too Large?
```javascript
// Reduce video size in config
video: {
  mode: 'on',
  size: { width: 800, height: 600 }
}
```

### Can't Find Test Results?
```bash
# List all test results
ls -la test-results/

# Find videos
find test-results -name "*.webm"

# Find screenshots
find test-results -name "*.png"
```

## 📦 Archiving Test Results

### Save Results
```bash
# Create archive
cd tests
tar -czf test-results-$(date +%Y%m%d).tar.gz test-results/ playwright-report/

# Or zip
zip -r test-results-$(date +%Y%m%d).zip test-results/ playwright-report/
```

### Clean Old Results
```bash
# Remove old results
rm -rf test-results/
rm -rf playwright-report/

# Run tests fresh
npm test
```

## 🎯 Best Practices

### 1. Always Review Videos for Failed Tests
```bash
# Run tests
npm test

# Open report
npx playwright show-report

# Click failed test → Watch video
```

### 2. Use Trace for Detailed Debugging
```bash
# Open trace for failed test
npx playwright show-trace test-results/failed-test-chromium/trace.zip
```

### 3. Compare Screenshots
- Before/after changes
- Cross-browser differences
- Visual regressions

### 4. Share Results
```bash
# Share HTML report
zip -r test-report.zip playwright-report/

# Send to team
# Upload to CI/CD artifacts
```

## 📈 CI/CD Integration

### GitHub Actions - Upload Artifacts
```yaml
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: tests/playwright-report/
    retention-days: 30

- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-videos
    path: tests/test-results/**/video.webm
    retention-days: 7
```

### Download from CI
1. Go to GitHub Actions run
2. Scroll to "Artifacts"
3. Download "playwright-report"
4. Extract and open `index.html`

## 🎬 Video Playback Tips

### Supported Formats
- ✅ WebM (default)
- ✅ MP4 (if configured)

### Playback Speed
In HTML report video player:
- Click settings icon
- Adjust playback speed (0.5x - 2x)

### Frame-by-Frame
In trace viewer:
- Use timeline slider
- Click through each action
- See exact state at each step

## 📊 Report Examples

### Successful Test Run
```
✓ 58 tests passed (2m 15s)
  ✓ Chromium: 58 passed
  ✓ Firefox: 58 passed
  ✓ WebKit: 58 passed
```

### Failed Test Run
```
✗ 2 tests failed (1m 45s)
✓ 56 tests passed

Failed Tests:
  ✗ should add product to cart
    - Screenshot: test-results/cart-test/screenshot.png
    - Video: test-results/cart-test/video.webm
    - Trace: test-results/cart-test/trace.zip
```

## 🎉 Quick Reference

### View Everything
```bash
# Run tests
npm test

# Open HTML report (includes videos)
npx playwright show-report

# Open specific trace
npx playwright show-trace test-results/[test-name]/trace.zip
```

### File Locations
- **HTML Report**: `tests/playwright-report/index.html`
- **Videos**: `tests/test-results/[test-name]/video.webm`
- **Screenshots**: `tests/test-results/[test-name]/*.png`
- **Traces**: `tests/test-results/[test-name]/trace.zip`

### Quick Commands
```bash
npm test                    # Run tests
npx playwright show-report  # View HTML report
npm run test:ui            # Interactive mode
npm run test:headed        # Watch live
```

---

**Now you'll get comprehensive reports with videos for every test run! 🎥📊**

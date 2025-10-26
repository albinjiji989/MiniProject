# Playwright Test Execution Instructions

This document provides instructions on how to run the Playwright tests and generate reports with video recordings.

## Prerequisites

1. Make sure the frontend application is running on `http://localhost:5173`
2. Make sure the backend API is running (typically on a different port)
3. Ensure all test users exist in the database with the correct credentials

## Available Test Suites

1. `core-pages-test.spec.js` - Tests access to landing, login, and register pages
2. `all-dashboards-test.spec.js` - Tests login and dashboard access for all user roles
3. `simple-auth-test.spec.js` - Simple authentication tests
4. `user-role-login.spec.js` - Detailed tests for each user role
5. `comprehensive-site-test.spec.js` - Comprehensive tests for all functionality

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run a specific test file
```bash
npx playwright test tests/core-pages-test.spec.js
```

### Run tests with HTML report
```bash
npx playwright test --reporter=html
```

### Run tests in headed mode (to see the browser)
```bash
npx playwright test --headed
```

### Run specific test
```bash
npx playwright test --grep "should login as admin"
```

## Viewing Test Results

After running tests, you can view the HTML report:
```bash
npx playwright show-report
```

## Video Recordings

Videos are automatically recorded for all tests and can be found in the `test-results` directory.

## Test Credentials

- **Admin**: albinjiji2026@mca.ajce.in / Admin@123
- **Adoption Manager**: albinjiji001@gmail.com / Albin@123
- **Petshop Manager**: albinjiji002@gmail.com / Albin@123
- **Public User**: albinjiji005@gmail.com / Albin@123

## Troubleshooting

If tests fail due to timeout issues:
1. Increase the timeout values in `playwright.config.cjs`
2. Ensure the application is running and accessible
3. Check that the credentials are correct and the users exist in the database
# Playwright Tests for PetWelfare Application

This directory contains end-to-end tests for the PetWelfare frontend application using Playwright.

## Test Suites

1. **comprehensive-site-test.spec.js** - Comprehensive tests for all pages and user roles
2. **smoke-test.spec.js** - Basic smoke tests to verify core functionality
3. **registration-flow.spec.js** - Tests for user registration functionality
4. **login-error-handling.spec.js** - Tests for login error handling

## Test Credentials

### Admin
- Email: albinjiji2026@mca.ajce.in
- Password: Admin@123

### Adoption Manager
- Email: albinjiji001@gmail.com
- Password: Albin@123

### Petshop Manager
- Email: albinjiji002@gmail.com
- Password: Albin@123

### Public User
- Email: albinjiji005@gmail.com
- Password: Albin@123

## Running Tests

### Prerequisites
Make sure the frontend application is running on `http://localhost:5173` and the backend API is accessible.

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/smoke-test.spec.js
```

### Run tests in headed mode (to see the browser)
```bash
npx playwright test --headed
```

### Run tests for a specific user role
```bash
npx playwright test tests/comprehensive-site-test.spec.js --grep "should login as admin"
```

### Run with verbose output
```bash
npx playwright test --reporter=list
```

## Test Structure

Each test file follows this structure:
1. Navigate to the appropriate page
2. Verify page elements are present
3. Perform actions (fill forms, click buttons)
4. Verify expected outcomes

## Common Issues

1. **Timeout errors**: Increase timeout values in the test configuration
2. **Element not found**: Update selectors based on changes in the UI
3. **Navigation issues**: Verify that the backend API is running and accessible

## Debugging Tests

To debug tests in headed mode:
```bash
npx playwright test --headed
```

To open the Playwright inspector:
```bash
npx playwright test --debug
```

To view the HTML report after running tests:
```bash
npx playwright show-report
```
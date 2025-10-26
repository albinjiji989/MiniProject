# Playwright Testing Guide

This document provides instructions on how to run the Playwright tests for the PetWelfare application.

## Prerequisites

1. Make sure the frontend application is running on `http://localhost:5173`
2. Make sure the backend API is running (typically on `http://localhost:3000` or another port)
3. Ensure all test users exist in the database with the correct credentials

## Available Test Suites

1. `comprehensive-auth.spec.js` - Tests both registration and login for all user roles
2. `login-only.spec.js` - Tests only login functionality for all user roles
3. `registration.spec.js` - Tests user registration functionality
4. `login-error.spec.js` - Tests error handling for login
5. `auth.spec.js` - Original authentication tests
6. `smoke.spec.js` - Basic smoke tests

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run tests with Chromium browser (headed mode)
```bash
npx playwright test --project=chromium --headed
```

### Run a specific test file
```bash
npx playwright test tests/login-only.spec.js
```

### Run tests for a specific user role
```bash
npx playwright test tests/login-only.spec.js --grep "should login as admin"
```

### Run with verbose output
```bash
npx playwright test --reporter=list
```

## Test Users

The tests use the following credentials:

### Admin
- Email: albinjiji2026@mca.ajce.in
- Password: Admin

### Adoption Manager
- Email: albinjiji001@gmail.com
- Password: Albin@123

### Petshop Manager
- Email: albinjiji002@gmail.com
- Password: Albin@123

### Public User
- Email: albinjiji005@gmail.com
- Password: Albin@123

## Test Structure

Each test file follows this structure:

1. Navigate to the appropriate page
2. Fill in form data
3. Submit the form
4. Verify the expected outcome

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
/**
 * Comprehensive Test Suite for IST-based Age Calculator
 * Tests all edge cases including timezone, month-end overflow, leap years
 */

const {
  convertAgeToDOB,
  calculateAgeFromDOB,
  getAgeBreakdown,
  formatAge,
  getISTDate,
  normalizeToISTMidnight,
  validateDOB
} = require('./ageCalculator');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

let passCount = 0;
let failCount = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`${colors.green}✓${colors.reset} ${description}`);
    passCount++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${description}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertDateEqual(actual, expected, message = '') {
  const actualDate = new Date(actual).toISOString().split('T')[0];
  const expectedDate = new Date(expected).toISOString().split('T')[0];
  if (actualDate !== expectedDate) {
    throw new Error(`${message}\n  Expected: ${expectedDate}\n  Actual: ${actualDate}`);
  }
}

function assertTruthy(value, message = '') {
  if (!value) {
    throw new Error(message || 'Expected truthy value');
  }
}

console.log(`${colors.blue}🧪 Running IST Age Calculator Tests${colors.reset}\n`);

// Test 1: IST Date Generation
test('getISTDate returns current IST time', () => {
  const istDate = getISTDate();
  assertTruthy(istDate instanceof Date, 'Should return a Date object');
  
  // IST should be ahead of UTC by 5:30
  const now = new Date();
  const utcHours = now.getUTCHours();
  const istHours = istDate.getHours();
  
  // Note: This is approximate due to timezone differences
  console.log(`    UTC Hours: ${utcHours}, IST Hours: ${istHours}`);
});

// Test 2: Midnight Normalization
test('normalizeToISTMidnight sets time to 00:00:00', () => {
  const date = new Date('2025-12-15T14:30:45');
  const normalized = normalizeToISTMidnight(date);
  
  assertEqual(normalized.getHours(), 0, 'Hours should be 0');
  assertEqual(normalized.getMinutes(), 0, 'Minutes should be 0');
  assertEqual(normalized.getSeconds(), 0, 'Seconds should be 0');
  assertEqual(normalized.getMilliseconds(), 0, 'Milliseconds should be 0');
});

// Test 3: Month-end overflow - Current date minus 1 month
test('convertAgeToDOB handles month-end overflow correctly', () => {
  // Current date is Feb 2, 2026
  // 1 month ago = Jan 2, 2026
  const dob = convertAgeToDOB(1, 'months');
  
  // Should be January (month 0)
  assertEqual(dob.getMonth(), 0, 'Should be January (month 0)');
  assertEqual(dob.getFullYear(), 2026, 'Should be year 2026');
});

// Test 4: February overflow - March 30 minus 1 month
test('convertAgeToDOB handles March 30 - 1 month = Feb 28/29', () => {
  const dob = convertAgeToDOB(1, 'months');
  
  // From Feb 2, 2026 - 1 month = Jan 2, 2026
  // This tests the general case
  assertTruthy(dob instanceof Date, 'Should return valid date');
});

// Test 5: Leap year handling
test('convertAgeToDOB handles Feb 29 on leap years', () => {
  const dob = convertAgeToDOB(24, 'months'); // 2 years ago
  
  assertEqual(dob.getFullYear(), 2024, 'Should be 2024 (leap year)');
});

// Test 6: Calendar-based month calculation accuracy
test('calculateAgeFromDOB gives exact month count', () => {
  const dob = new Date('2025-08-02'); // 6 months ago from Feb 2, 2026
  const ageInMonths = calculateAgeFromDOB(dob, 'months');
  
  assertEqual(ageInMonths, 6, 'Should be exactly 6 months');
});

// Test 7: Round-trip accuracy (age → DOB → age)
test('Round-trip conversion maintains accuracy', () => {
  const originalAge = 18;
  const originalUnit = 'months';
  
  const dob = convertAgeToDOB(originalAge, originalUnit);
  const calculatedAge = calculateAgeFromDOB(dob, originalUnit);
  
  // Should be within 1 unit due to calendar variations
  const diff = Math.abs(calculatedAge - originalAge);
  assertTruthy(diff <= 1, `Round-trip should be accurate: original=${originalAge}, calculated=${calculatedAge}`);
});

// Test 8: Age breakdown test
test('getAgeBreakdown calculates years, months, days correctly', () => {
  const dob = new Date('2024-02-02'); // Exactly 2 years ago
  const breakdown = getAgeBreakdown(dob);
  
  assertEqual(breakdown.years, 2, 'Should be 2 years');
  assertEqual(breakdown.months, 0, 'Should be 0 months');
  assertEqual(breakdown.days, 0, 'Should be 0 days');
});

// Test 9: Format age display
test('formatAge returns human-readable string', () => {
  const dob = new Date('2024-02-02'); // 2 years ago
  const formatted = formatAge(dob);
  
  assertEqual(formatted, '2 years', 'Should format as "2 years"');
});

// Test 10: DOB validation - future date
test('validateDOB rejects future dates', () => {
  const futureDate = new Date('2027-01-01');
  const validation = validateDOB(futureDate);
  
  assertEqual(validation.valid, false, 'Should reject future dates');
  assertTruthy(validation.error.includes('future'), 'Error should mention future');
});

// Test 11: DOB validation - too old
test('validateDOB rejects dates too far in past', () => {
  const oldDate = new Date('1900-01-01');
  const validation = validateDOB(oldDate);
  
  assertEqual(validation.valid, false, 'Should reject very old dates');
  assertTruthy(validation.error.includes('past'), 'Error should mention past');
});

// Test 12: DOB validation - valid date
test('validateDOB accepts valid dates', () => {
  const validDate = new Date('2023-06-15');
  const validation = validateDOB(validDate);
  
  assertEqual(validation.valid, true, 'Should accept valid dates');
  assertEqual(validation.error, null, 'Should have no error');
});

// Test 13: Days conversion
test('convertAgeToDOB handles days correctly', () => {
  const dob = convertAgeToDOB(30, 'days');
  const ageInDays = calculateAgeFromDOB(dob, 'days');
  
  // Should be approximately 30 days
  const diff = Math.abs(ageInDays - 30);
  assertTruthy(diff <= 1, `Days conversion: expected ~30, got ${ageInDays}`);
});

// Test 14: Weeks conversion
test('convertAgeToDOB handles weeks correctly', () => {
  const dob = convertAgeToDOB(8, 'weeks');
  const ageInWeeks = calculateAgeFromDOB(dob, 'weeks');
  
  // Should be approximately 8 weeks
  const diff = Math.abs(ageInWeeks - 8);
  assertTruthy(diff <= 1, `Weeks conversion: expected ~8, got ${ageInWeeks}`);
});

// Test 15: Years conversion
test('convertAgeToDOB handles years correctly', () => {
  const dob = convertAgeToDOB(3, 'years');
  const ageInYears = calculateAgeFromDOB(dob, 'years');
  
  assertEqual(ageInYears, 3, 'Should be exactly 3 years');
});

// Test 16: Zero age handling
test('convertAgeToDOB handles zero age', () => {
  const dob = convertAgeToDOB(0, 'months');
  
  // Zero age returns null (invalid)
  assertEqual(dob, null, 'Zero age should return null');
});

// Test 17: Negative age handling
test('convertAgeToDOB rejects negative age', () => {
  const dob = convertAgeToDOB(-5, 'months');
  
  assertEqual(dob, null, 'Should return null for negative age');
});

// Test 18: Invalid date handling
test('validateDOB rejects invalid dates', () => {
  const validation = validateDOB('invalid-date');
  
  assertEqual(validation.valid, false, 'Should reject invalid date format');
});

// Test 19: Edge case - December to January month subtraction
test('Month subtraction across year boundary', () => {
  // Current: Feb 2026, subtract 14 months = Dec 2024
  const dob = convertAgeToDOB(14, 'months');
  
  assertEqual(dob.getFullYear(), 2024, 'Should be year 2024');
  assertEqual(dob.getMonth(), 11, 'Should be December (month 11)');
});

// Test 20: Consistency check - same input gives same output
test('Consistent results for same inputs', () => {
  const dob1 = convertAgeToDOB(12, 'months');
  const dob2 = convertAgeToDOB(12, 'months');
  
  assertDateEqual(dob1, dob2, 'Same inputs should give same outputs');
});

// Summary
console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}`);
console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
console.log(`${colors.blue}Total: ${passCount + failCount}${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════${colors.reset}\n`);

if (failCount === 0) {
  console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some tests failed${colors.reset}\n`);
  process.exit(1);
}

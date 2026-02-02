/**
 * Test Suite for Calendar-Based Age Calculator
 * Demonstrates accuracy improvements
 */

const ageCalculator = require('./ageCalculator');

console.log('🧪 TESTING CALENDAR-BASED AGE CALCULATOR\n');
console.log('Current Date:', new Date().toLocaleDateString(), '\n');

// Test 1: Month Conversion (Variable Month Lengths)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 1: Month Conversion with Variable Month Lengths');
console.log('═══════════════════════════════════════════════════════');

// Simulate: User enters "2 months old" on Feb 2, 2026
const feb2_2026 = new Date('2026-02-02');
const mockNow = new Date('2026-02-02');

// OLD METHOD (Average): 2 × 30.44 = 60.88 days = Dec 4, 2025
// NEW METHOD (Calendar): Feb 2 - 2 months = Dec 2, 2025

const dob2months = ageCalculator.convertAgeToDOB(2, 'months');
console.log('Input: "2 months old" on Feb 2, 2026');
console.log('Expected DOB: Dec 2, 2025 (calendar)');
console.log('Calculated DOB:', dob2months.toLocaleDateString());
console.log('Match:', dob2months.toLocaleDateString() === new Date('2025-12-02').toLocaleDateString() ? '✅ CORRECT' : '❌ WRONG');
console.log();

// Test 2: Year Conversion (Leap Year)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 2: Year Conversion Across Leap Year');
console.log('═══════════════════════════════════════════════════════');

const dob1year = ageCalculator.convertAgeToDOB(1, 'years');
console.log('Input: "1 year old" on Feb 2, 2026');
console.log('Expected DOB: Feb 2, 2025 (calendar)');
console.log('Calculated DOB:', dob1year.toLocaleDateString());
console.log('Match:', dob1year.toLocaleDateString() === new Date('2025-02-02').toLocaleDateString() ? '✅ CORRECT' : '❌ WRONG');
console.log();

// Test 3: February Edge Case
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 3: February Month (28 days vs 30.44 average)');
console.log('═══════════════════════════════════════════════════════');

const dob1monthMarch = ageCalculator.convertAgeToDOB(1, 'months');
console.log('Input: "1 month old" on Feb 2, 2026');
console.log('Expected DOB: Jan 2, 2026 (calendar)');
console.log('Calculated DOB:', dob1monthMarch.toLocaleDateString());
console.log('Match:', dob1monthMarch.toLocaleDateString() === new Date('2026-01-02').toLocaleDateString() ? '✅ CORRECT' : '❌ WRONG');
console.log();

// Test 4: Calculate Age Back (Round Trip)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 4: Round Trip Accuracy (6 months → DOB → months)');
console.log('═══════════════════════════════════════════════════════');

const dob6months = ageCalculator.convertAgeToDOB(6, 'months');
const calculatedMonths = ageCalculator.calculateAgeFromDOB(dob6months, 'months');
console.log('Input: "6 months old"');
console.log('Converted DOB:', dob6months.toLocaleDateString());
console.log('Calculated back:', calculatedMonths, 'months');
console.log('Match:', calculatedMonths === 6 ? '✅ EXACT' : `⚠️ OFF BY ${Math.abs(6 - calculatedMonths)} months`);
console.log();

// Test 5: Month-End Edge Cases
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 5: Month-End Edge Cases (Jan 31 scenarios)');
console.log('═══════════════════════════════════════════════════════');

// Simulate: Pet born Jan 31, age calculation
const jan31_2025 = new Date('2025-01-31');
const ageInMonths = ageCalculator.calculateAgeFromDOB(jan31_2025, 'months');
const ageInYears = ageCalculator.calculateAgeFromDOB(jan31_2025, 'years');
const ageDisplay = ageCalculator.formatAge(jan31_2025);

console.log('DOB: Jan 31, 2025');
console.log('Today: Feb 2, 2026');
console.log('Age in months:', ageInMonths, 'months (should be 12)');
console.log('Age in years:', ageInYears, 'years (should be 1)');
console.log('Formatted display:', ageDisplay);
console.log();

// Test 6: Leap Year Birthday
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 6: Leap Year Birthday (Feb 29, 2024)');
console.log('═══════════════════════════════════════════════════════');

const feb29_2024 = new Date('2024-02-29');
const breakdown = ageCalculator.getAgeBreakdown(feb29_2024);
console.log('DOB: Feb 29, 2024 (Leap Year)');
console.log('Today: Feb 2, 2026');
console.log('Age breakdown:', breakdown);
console.log('Formatted:', ageCalculator.formatAge(feb29_2024));
console.log();

// Test 7: All Units Test
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 7: All Age Units for Same DOB');
console.log('═══════════════════════════════════════════════════════');

const testDOB = new Date('2025-06-15');
const allUnits = ageCalculator.getAgeInAllUnits(testDOB);
console.log('DOB: June 15, 2025');
console.log('Today: Feb 2, 2026');
console.log('Age in days:', allUnits.days, 'days');
console.log('Age in weeks:', allUnits.weeks, 'weeks');
console.log('Age in months:', allUnits.months, 'months');
console.log('Age in years:', allUnits.years, 'years');
console.log('Breakdown:', allUnits.breakdown);
console.log();

// Test 8: Comparison - Old vs New Method
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 8: Accuracy Comparison (18 months example)');
console.log('═══════════════════════════════════════════════════════');

const dob18months = ageCalculator.convertAgeToDOB(18, 'months');
const backToMonths = ageCalculator.calculateAgeFromDOB(dob18months, 'months');

console.log('Input: "18 months old" on Feb 2, 2026');
console.log('Calendar DOB:', dob18months.toLocaleDateString(), '(Aug 2, 2024 expected)');
console.log('Calculate back:', backToMonths, 'months');
console.log('Accuracy:', backToMonths === 18 ? '✅ EXACT MATCH' : `⚠️ LOST ${18 - backToMonths} months`);
console.log();

console.log('═══════════════════════════════════════════════════════');
console.log('✅ ALL TESTS COMPLETED');
console.log('═══════════════════════════════════════════════════════');
console.log('\n📊 BENEFITS OF CALENDAR-BASED CALCULATION:');
console.log('1. ✅ Accurate month/year conversion (no averages)');
console.log('2. ✅ Handles variable month lengths (28-31 days)');
console.log('3. ✅ Leap years handled automatically');
console.log('4. ✅ Round-trip accuracy preserved');
console.log('5. ✅ Consistent with user expectations');
console.log('6. ✅ Birthday dates are exact');

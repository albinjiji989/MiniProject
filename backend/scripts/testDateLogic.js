// Test the date categorization logic
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

console.log('Today:', today);
console.log('Tomorrow:', tomorrow);

// Test application dates from the log
const appStartDate = new Date('2026-03-17T00:00:00.000Z');
const appEndDate = new Date('2026-03-20T00:00:00.000Z');

console.log('\nApplication dates:');
console.log('Start:', appStartDate);
console.log('End:', appEndDate);

// Test categorization logic
const isCheckIn = appStartDate >= today && appStartDate < tomorrow;
const isCheckOutByDate = appEndDate >= today && appEndDate < tomorrow;
const isReadyForPickup = true; // final payment completed
const shouldBeInCheckOuts = isCheckOutByDate || isReadyForPickup;

console.log('\nCategorization:');
console.log('Is Check-in (starts today):', isCheckIn);
console.log('Is Check-out by date (ends today):', isCheckOutByDate);
console.log('Is Ready for Pickup (final payment done):', isReadyForPickup);
console.log('Should be in CheckOuts:', shouldBeInCheckOuts);
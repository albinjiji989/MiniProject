# OTP Debug Guide

## Issue
Manager clicks "Generate Pickup OTP" but doesn't see area to enter OTP from user.

## Debug Steps

### 1. Test the OTP Dialog Directly
1. Go to: `http://localhost:5173/manager/temporary-care/otp-debug`
2. Update the `testBookingId` in `OTPDebugTest.jsx` with a real booking ID
3. Click "Test Pickup OTP Dialog"
4. Check browser console for debug logs

### 2. Check Manager Dashboard Flow
1. Go to: `http://localhost:5173/manager/temporary-care/dashboard`
2. Look for pets in "Ready for Pickup" section
3. Click "🔐 Generate Pickup OTP" button
4. Check browser console for debug logs
5. Look for "✅ Enter OTP & Complete Handover" button
6. Click the second button to open OTP entry dialog

### 3. Expected Flow
1. **First Click**: "🔐 Generate Pickup OTP"
   - Generates OTP and sends to user email
   - Button changes to "✅ Enter OTP & Complete Handover"

2. **Second Click**: "✅ Enter OTP & Complete Handover"
   - Opens PickupOTPManager dialog
   - Shows generated OTP (for manager reference)
   - Shows OTP entry field (for user-provided OTP)
   - Shows "Complete Checkout" button

### 4. Debug Console Logs to Look For
```
🔍 generatePickupOTP called with booking: {...}
✅ Final payment completed, opening OTP dialog
🔍 Setting selectedBooking to: {...}
🔍 Setting otpDialogOpen to: true
✅ Dialog state updated
🔍 Dialog state changed: {selectedBooking: "...", otpDialogOpen: true}
🔍 PickupOTPManager props: {bookingId: "...", open: true, ...}
🔍 PickupOTPManager useEffect triggered: {open: true, bookingId: "..."}
✅ Loading booking details for: ...
✅ Booking details loaded: {...}
```

### 5. Common Issues
- **Dialog not opening**: Check if `otpDialogOpen` state is true
- **No booking data**: Check if API call succeeds
- **OTP section not showing**: Check if `generatedOTP` state is set
- **API errors**: Check network tab for failed requests

### 6. Manual Test Data
If you need to test with real data:
1. Create a temporary care booking
2. Complete advance payment
3. Complete final payment
4. Use the booking ID in the debug test

### 7. Remove Debug Code
After fixing, remove debug console.log statements from:
- `ManagerDashboard.jsx`
- `PickupOTPManager.jsx`
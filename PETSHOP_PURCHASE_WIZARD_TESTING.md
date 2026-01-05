# PetShop Purchase Wizard - Quick Testing Guide

## Quick Start

### Prerequisites
```bash
# Backend running
cd backend && npm start

# Frontend running (new terminal)
cd frontend && npm run dev

# Access at: http://localhost:5173/user/petshop/dashboard
```

### Quick Test Scenario

**Duration**: ~5 minutes

```
1. LOGIN
   └─ Log in as a regular user (not manager)

2. NAVIGATE TO PETSHOP
   └─ Go to http://localhost:5173/user/petshop/dashboard
   └─ Should see "Browse Batches" tab selected
   └─ Should see pet cards with images, species, breed, price

3. CLICK "BUY NOW" BUTTON
   └─ Dialog opens with title "Reserve & Purchase Pet"
   └─ Shows Stepper with 4 steps
   └─ Currently on Step 0: "Contact Info"
   └─ Email field pre-filled with your user email
   └─ Phone field pre-filled with your user phone

4. STEP 0: CONTACT INFORMATION
   └─ Email: Should be pre-filled, or enter test@example.com
   └─ Phone: Should be pre-filled, or enter 9876543210
   └─ Preferred Contact Method: Select "Both"
   └─ Click "Next" button
   └─ Should advance to Step 1

5. STEP 1: VISIT/PICKUP DETAILS
   └─ Preferred Date: Select any future date (e.g., tomorrow)
   └─ Preferred Time: Select "Afternoon"
   └─ Visit Purpose: Select "Home Delivery"
   └─ Click "Next" button
   └─ Should advance to Step 2

6. STEP 2: DELIVERY ADDRESS
   └─ Street: Enter "123 Main Street"
   └─ City: Enter "Mumbai"
   └─ State: Enter "Maharashtra"
   └─ ZIP Code: Enter "400001"
   └─ Contact Phone: Should be pre-filled or enter 9876543210
   └─ Click "Next" button
   └─ Should advance to Step 3

7. STEP 3: REVIEW & CONFIRMATION
   └─ Should see "Pet Details" card with species, breed, price
   └─ Should see "Contact Information" card with your email, phone
   └─ Should see "Visit Details" card with date, time, home delivery
   └─ Should see "Delivery Address" card with full address
   └─ Should see disclaimer about manager review
   └─ Click "Confirm & Submit" button
   └─ Button should show loading spinner briefly

8. SUCCESS NOTIFICATION
   └─ Green snackbar appears at bottom left
   └─ Message: "Reservation created! Code: RES-[CODE]"
   └─ Code is your reservation code for tracking
   └─ Dialog auto-closes after 2 seconds
   └─ Pet list refreshes
   └─ Pet status should now show "Reserved"

✅ TEST PASSED
```

## Validation Testing

### Test 1: Missing Email (Step 0)
```
1. Open purchase dialog
2. Clear email field (if pre-filled)
3. Click "Next"
4. Expect: Red snackbar "Email is required"
5. Verify: Stay on Step 0, cannot advance
✅ PASS
```

### Test 2: Missing Phone (Step 0)
```
1. Open purchase dialog
2. Clear phone field (if pre-filled)
3. Click "Next"
4. Expect: Red snackbar "Phone number is required"
5. Verify: Stay on Step 0, cannot advance
✅ PASS
```

### Test 3: Missing Date (Step 1)
```
1. Complete Step 0 (enter email, phone)
2. Click "Next" → Step 1
3. Click "Next" without selecting date
4. Expect: Red snackbar "Preferred date is required"
5. Verify: Stay on Step 1, cannot advance
✅ PASS
```

### Test 4: Conditional City Validation (Step 2)
```
1. Complete Steps 0 & 1
2. Click "Next" → Step 2: Delivery Address
3. Enter only "Street Address" (e.g., "123 Main St")
4. Leave City empty
5. Click "Next"
6. Expect: Red snackbar "City is required"
7. Verify: Stay on Step 2
8. Fix: Enter city "Mumbai"
9. Click "Next"
10. Expect: Advance to Step 3
✅ PASS
```

### Test 5: No Validation if Address Not Filled (Step 2)
```
1. Complete Steps 0 & 1
2. Click "Next" → Step 2: Delivery Address
3. Leave ALL address fields empty
4. Click "Next"
5. Expect: Advance to Step 3 (no validation error)
✅ PASS
```

### Test 6: Previous Button Navigation
```
1. Open dialog → Step 0
2. Complete Step 0, click "Next" → Step 1
3. Click "Previous" button
4. Expect: Return to Step 0
5. Verify: Form data preserved (email, phone still there)
6. Note: "Previous" button not shown on Step 0
✅ PASS
```

### Test 7: Cancel Button
```
1. Open dialog → Step 1 (partial entry)
2. Click "Cancel" button
3. Expect: Dialog closes immediately
4. Verify: Data not saved, pet still shows "Buy Now" button
✅ PASS
```

## API Response Testing

### Test 8: Successful Reservation (201 Created)
```
1. Complete all 4 steps and submit
2. Network tab: Should see POST /petshop/user/public/reservations/purchase
3. Status: 201 Created
4. Response body should contain:
   {
     "success": true,
     "data": {
       "reservation": {
         "_id": "...",
         "reservationCode": "RES-...",
         "status": "pending",
         "contactInfo": {...},
         "itemId": {...}
       }
     }
   }
5. Green snackbar shows reservation code
✅ PASS
```

### Test 9: Item Not Available (400 Bad Request)
```
1. From browser console, modify purchase to send reserved item:
   POST /petshop/user/public/reservations/purchase
   with itemId of a 'reserved' pet
2. Expect: HTTP 400 error
3. Snackbar shows error message
4. Dialog remains open for retry
✅ PASS
```

### Test 10: Item Not Found (404 Not Found)
```
1. Modify request to send invalid itemId
   POST /petshop/user/public/reservations/purchase
   with itemId = "invalid-id"
2. Expect: HTTP 404 error
3. Snackbar shows "Item not found" or similar
✅ PASS
```

## UI/UX Testing

### Test 11: Dialog Responsiveness
```
Desktop (1920px):
├─ Dialog appears centered
├─ Max-width: 'sm' (~600px)
└─ All fields visible

Tablet (768px):
├─ Dialog scales appropriately
├─ Horizontal layout preserved
└─ All fields visible

Mobile (375px):
├─ Dialog takes 95% width
├─ Vertical layout maintained
├─ Stepper readable
└─ Buttons accessible
✅ PASS
```

### Test 12: Stepper Visual Feedback
```
1. Step 0: Circle "0" should be BLUE/ACTIVE
2. Steps 1-3: Gray circles (inactive)
3. "Contact Info" label visible below step 0
4. Advance to Step 1: Step 0 becomes checked (green), Step 1 becomes active
5. Advance to Step 2: Step 1 becomes checked, Step 2 active
6. Advance to Step 3: Step 2 becomes checked, Step 3 active
7. Go back to Step 1: Step 3 becomes incomplete (white), Step 1 active
✅ PASS
```

### Test 13: Loading State During Submission
```
1. Step 3: Click "Confirm & Submit"
2. Button should show:
   ├─ CircularProgress spinner (left side)
   ├─ Text changes from "Confirm & Submit" to "Creating..."
   ├─ Button disabled (not clickable)
3. After API responds (2-3 seconds):
   └─ Button returns to normal state
✅ PASS
```

### Test 14: Form Data Persistence
```
1. Fill Step 0: email@test.com, 9876543210, Both
2. Click "Next" → Step 1
3. Back arrow "Previous"
4. Verify: email, phone, contact method STILL THERE
5. Advance all the way to Step 3
6. Review card shows same email and phone
✅ PASS
```

### Test 15: Time Field Options
```
Step 1: Preferred Time dropdown should show:
├─ Morning (9 AM - 12 PM)
├─ Afternoon (12 PM - 4 PM)
└─ Evening (4 PM - 7 PM)

All options selectable
✅ PASS
```

### Test 16: Visit Purpose Conditional Display
```
Step 1: Visit Purpose dropdown shows:
├─ Meet the Pet First
├─ Direct Purchase
└─ Home Delivery

Select "Home Delivery"
→ Step 2 should show address fields

Select "Meet the Pet First"
→ Step 2 address fields still visible (optional)

Select "Direct Purchase"
→ Step 2 address fields still visible (optional)
✅ PASS
```

### Test 17: Snackbar Auto-close
```
1. Trigger validation error (e.g., missing phone)
2. Red snackbar appears at bottom-left
3. Wait 6 seconds
4. Snackbar automatically disappears
5. Click "X" button closes it immediately
✅ PASS
```

### Test 18: Review Page Display
```
Step 3 should show all cards:

✓ Pet Details Card
  ├─ Shows species
  ├─ Shows breed
  └─ Shows price (₹XXX)

✓ Contact Information Card
  ├─ Shows email
  ├─ Shows phone
  └─ Shows contact method

✓ Visit Details Card
  ├─ Shows formatted date (DD/MM/YYYY)
  ├─ Shows time slot
  └─ Shows visit purpose (with underscores replaced by spaces)

✓ Delivery Address Card (ONLY IF ADDRESS FILLED)
  ├─ Shows street
  ├─ Shows "city, state zipcode"

✓ Special Notes Card (ONLY IF NOTES FILLED)
  ├─ Shows notes text

✓ Disclaimer Alert
  └─ "By confirming, you agree to our terms..."

✅ PASS
```

## Integration Testing

### Test 19: Pet List Refresh After Purchase
```
1. Note: Which pet you're buying (e.g., "Golden Retriever")
2. Complete purchase successfully
3. Dialog closes
4. Pet list refreshes (should reload from API)
5. Same pet should now show "Reserved" status
6. "Buy Now" button should be disabled/grayed out
✅ PASS
```

### Test 20: Multiple Purchases
```
1. Buy Pet #1: Complete entire flow
2. Pet #1 status changes to "Reserved"
3. Pet #2: Click "Buy Now" on different pet
4. Dialog opens fresh (empty form, Step 0)
5. Complete purchase for Pet #2
6. Both pets now show "Reserved"
✅ PASS
```

## Browser Console Debugging

If you need to debug, check browser console (F12 → Console):

```javascript
// Should see logs like:
"Item found for reservation: {itemId, item: {id, storeId, name}}"
"Reservation type mapping: {frontendType: 'purchase', backendType: 'reservation'}"
"Creating reservation with data: {...}"
"Saved reservation: {...}"
"Reservation code after save: RES-..."

// Check for errors:
// Should NOT see 403 Forbidden (use correct endpoints)
// Should NOT see 404 (endpoint exists)
// Should NOT see CORS errors
```

## Network Tab Analysis

Open DevTools → Network tab, then perform purchase:

```
Requests should be:
1. GET /petshop/user/public/batches (loads pet list)
2. POST /petshop/user/public/reservations/purchase (creates reservation)
   └─ Status: 201 Created
   └─ Response includes reservationCode
3. GET /petshop/user/public/batches (reload after success)
   └─ Same pet now has status: 'reserved'

❌ Should NOT see:
   - POST /petshop/manager/... (403 Forbidden)
   - Duplicate requests (no double-submission)
```

## Test Summary Checklist

- [ ] Dialog opens on "Buy Now" click
- [ ] Step 0: Email validation works
- [ ] Step 0: Phone validation works
- [ ] Step 1: Date validation works
- [ ] Step 2: Conditional city validation works
- [ ] Previous button navigation works
- [ ] Cancel button closes dialog
- [ ] Form data persists across steps
- [ ] API call succeeds (201)
- [ ] Reservation code shown
- [ ] Dialog auto-closes after success
- [ ] Pet list refreshes
- [ ] Pet status updates to "Reserved"
- [ ] Snackbar notifications appear
- [ ] Loading state shown during submission
- [ ] Stepper visual feedback correct
- [ ] Dialog responsive on mobile
- [ ] Multiple purchases work

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Dialog won't close | API error | Check response in Network tab |
| Snackbar doesn't show | Alert state not updating | Check console for errors |
| Pet not marked reserved | List not refreshing | Manually refresh page |
| Email pre-fill missing | User profile incomplete | Update profile with email |
| Date picker not working | Browser compatibility | Use modern browser (Chrome/Firefox) |
| API returns 400 | Pet already reserved | Try different pet |
| API returns 403 | Using wrong endpoint | Check route is `/petshop/user/public/...` |
| Dialog shows old data | Cache issue | Hard refresh (Ctrl+F5) |

## Success Metrics

```
✅ Feature Complete when:
   1. Dialog opens and closes correctly
   2. All 4 steps display proper fields
   3. Validation prevents invalid submissions
   4. API call succeeds with 201 status
   5. Reservation code shown to user
   6. Pet status updates to "Reserved"
   7. No console errors
   8. Works on mobile and desktop
   9. Snackbars show appropriate messages
   10. List refreshes after purchase
```

**Status**: Ready for user testing and production deployment

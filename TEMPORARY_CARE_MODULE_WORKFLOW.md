# Temporary Care / Pet Boarding Module - Complete Workflow

## 📋 Overview

A comprehensive temporary care and pet boarding system that allows pet owners to apply for temporary care services for their pets (adopted or purchased) when they need short-term care due to travel, work, or emergencies. Authorized associations (care centers) provide this service with full workflow management.

---

## 🎯 Key Features Built

### ✅ Multi-Pet Support
- One application can include multiple pets
- Each pet has individual pricing and special instructions
- Independent care tracking per pet

### ✅ Complete Status Workflow
```
submitted → price_determined → advance_paid → approved → active_care → completed
```

### ✅ Payment System
- 50% advance payment mandatory before approval
- 50% final payment at check-out
- Automatic invoice generation

### ✅ Manager Features
- Pricing management per pet type/size
- Capacity verification
- Kennel assignment
- Daily care logs
- Emergency handling
- Final bill generation with adjustments

### ✅ User Features
- Application submission with multiple pets
- Real-time pricing estimates
- Payment tracking
- Care status monitoring
- Feedback submission

---

## 👤 USER WORKFLOW

### Step 1: View Owned Pets
**Location:** `/User/temporary-care/apply`

- User can see all their pets (adopted, purchased, or user-created)
- Only owned pets can be selected for temporary care

### Step 2: Submit Application
**Location:** `/User/temporary-care/apply`

**Process:**
1. **Select Pets** - Choose one or multiple pets
2. **Choose Center** - Select a registered Temporary Care Association/Center
3. **Set Duration** - Select start date and end date
4. **Special Instructions** (Optional):
   - Food preferences/feeding schedule
   - Medicine instructions
   - Behavior notes
   - Allergies
5. **Review & Pricing** - View estimated pricing breakdown:
   - Per-pet pricing
   - Total amount
   - Advance payment (50%)
   - Remaining amount (50%)
6. **Submit** - Application status: `submitted`

**What Happens:**
- Application is created with status `submitted`
- Manager receives notification
- User can view application in "My Applications"

### Step 3: Wait for Pricing
**Location:** `/User/temporary-care/applications`

**Status:** `price_determined`

- Manager reviews application and sets final pricing
- Pricing is locked after manager sets it
- User receives notification
- Application status changes to `price_determined`

**User Sees:**
- Detailed pricing breakdown per pet
- Total amount
- Advance amount (50%)
- Remaining amount (50%)

### Step 4: Pay Advance (50%)
**Location:** `/User/temporary-care/applications/:id/payment`

**Status:** `advance_paid`

**Process:**
1. User clicks "Pay Advance" button
2. Razorpay payment gateway opens
3. User completes payment
4. Payment is verified
5. Invoice is automatically generated
6. Application status changes to `advance_paid`

**What Happens:**
- Payment record is created
- Invoice is generated
- Manager receives notification
- Application is ready for approval

### Step 5: Wait for Approval
**Location:** `/User/temporary-care/applications`

**Status:** `approved`

- Manager verifies capacity
- Manager approves application
- Check-in OTP is generated
- Application status changes to `approved`
- User receives notification with check-in OTP

### Step 6: Check-In Pet
**Location:** Manager handles this at facility

**Status:** `active_care`

**Process:**
1. User arrives at care center with pet(s)
2. Manager verifies OTP
3. Manager records check-in condition:
   - Health status
   - Photos
   - Description
4. Manager assigns kennels/caretakers
5. Application status changes to `active_care`

**User Can:**
- View care status
- See daily care logs (if manager updates)
- Receive emergency notifications

### Step 7: Active Care Period
**Location:** Manager dashboard

**During Care:**
- Manager maintains daily care logs:
  - Feeding times
  - Hygiene activities
  - Medication
  - Exercise/playtime
  - Health checks
- Manager can record emergencies
- User receives notifications for important events

### Step 8: Check-Out & Final Payment
**Location:** Manager handles check-out, User pays final amount

**Status:** `completed`

**Manager Process:**
1. Generate final bill (may include extra days/services)
2. Record check-out condition
3. Generate check-out OTP
4. Verify final payment is completed

**User Process:**
1. Receive notification about final bill
2. Go to payment page: `/User/temporary-care/applications/:id/payment`
3. Pay remaining 50% (or adjusted final amount)
4. Complete check-out with OTP
5. Application status changes to `completed`

### Step 9: Submit Feedback
**Location:** `/User/temporary-care/applications/:id/feedback`

**After Completion:**
1. User can submit feedback:
   - Overall rating (1-5 stars)
   - Service rating
   - Staff rating
   - Facility rating
   - Comments
2. Feedback is saved and visible to manager

---

## 👨‍💼 MANAGER WORKFLOW

### Dashboard Overview
**Location:** `/Manager/temporary-care/applications`

**Shows:**
- Current occupancy (current/total capacity)
- Pending applications count
- Active care count
- Monthly/Yearly revenue
- Application statistics

### Step 1: View Applications
**Location:** `/Manager/temporary-care/applications`

**Filter Options:**
- All
- Submitted (needs pricing)
- Price Determined (waiting for advance payment)
- Advance Paid (ready for approval)
- Approved (ready for check-in)
- Active Care (pets in care)
- Completed

### Step 2: Set Pricing
**Location:** Application Details Dialog

**For Status:** `submitted`

**Process:**
1. Manager opens application details
2. Reviews pet information
3. Sets pricing per pet:
   - Base rate per day (based on pet type/size)
   - Number of days
   - Special care add-ons (if any)
4. Sets additional charges (if any)
5. Sets discount (if applicable)
6. Sets tax percentage
7. System calculates:
   - Subtotal
   - Tax amount
   - Total amount
   - Advance amount (50%)
   - Remaining amount (50%)
8. Manager clicks "Set Pricing"
9. Application status changes to `price_determined`
10. Pricing is locked

**What Happens:**
- User receives notification
- User can now pay advance

### Step 3: Verify Capacity
**Location:** Application Details

**Before Approval:**
- Manager can verify if center has capacity
- System shows:
  - Total capacity
  - Current occupancy
  - Available slots
  - Requested pets count
  - Will be available after this application

### Step 4: Approve/Reject Application
**Location:** Application Details

**For Status:** `advance_paid`

**Process:**
1. Manager verifies advance payment is completed
2. Manager verifies capacity
3. Manager can:
   - **Approve**: 
     - Application status → `approved`
     - Check-in OTP is generated
     - User receives notification
   - **Reject**:
     - Application status → `rejected`
     - Reason is recorded
     - User receives notification

### Step 5: Assign Kennels
**Location:** Application Details (when approved)

**Process:**
1. Manager assigns kennels to each pet:
   - Kennel ID
   - Kennel label (e.g., "Kennel A-12")
   - Caretaker assignment (optional)
2. System tracks kennel assignments

### Step 6: Check-In Pet
**Location:** Application Details

**For Status:** `approved`

**Process:**
1. User arrives with pet(s)
2. Manager verifies check-in OTP
3. Manager records check-in condition:
   - Health status (healthy/minor_issues/needs_attention)
   - Description
   - Photos (optional)
4. Manager marks OTP as used
5. Application status changes to `active_care`

### Step 7: Daily Care Management
**Location:** Application Details → Care Logs Tab

**During Active Care:**

**Add Daily Care Log:**
1. Manager selects date
2. Manager selects pet
3. Manager adds activities:
   - Feeding (with time and notes)
   - Hygiene
   - Medication
   - Exercise/Playtime
   - Health check
   - Other
4. Manager adds general notes for the day
5. Log is saved

**Record Emergency:**
1. Manager clicks "Record Emergency"
2. Sets severity (low/medium/high/critical)
3. Adds description
4. Records actions taken
5. Marks if owner notified
6. Marks if vet contacted
7. System sends notification to owner

### Step 8: Generate Final Bill
**Location:** Application Details

**Before Check-Out:**

**Process:**
1. Manager reviews care period
2. Checks for:
   - Extra days (if pet stayed longer)
   - Additional services provided
   - Any adjustments
3. Manager generates final bill:
   - Original total
   - Extra days amount
   - Additional services
   - Adjustments
   - Final total
   - Advance already paid
   - Final amount due
4. Bill is generated and locked
5. User receives notification

### Step 9: Check-Out Pet
**Location:** Application Details

**For Status:** `active_care`

**Process:**
1. Manager verifies final payment is completed
2. Manager records check-out condition:
   - Health status
   - Description
   - Photos (optional)
3. Manager generates check-out OTP (if needed)
4. Manager verifies OTP when user arrives
5. Application status changes to `completed`

### Step 10: View Analytics
**Location:** Dashboard Tab

**Manager Can View:**
- Occupancy statistics
- Revenue (monthly/yearly)
- Application trends
- Care history
- Staff performance (if assigned)

---

## 📊 STATUS FLOW DIAGRAM

```
┌─────────────┐
│  SUBMITTED  │  User submits application
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ PRICE_DETERMINED  │  Manager sets pricing
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ ADVANCE_PAID │  User pays 50% advance
└──────┬───────┘
       │
       ▼
┌─────────────┐
│  APPROVED   │  Manager approves (after capacity check)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ACTIVE_CARE │  Pet checked in, care in progress
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  COMPLETED  │  Final payment done, pet checked out
└─────────────┘
```

**Alternative Paths:**
- `submitted` → `rejected` (Manager rejects)
- `submitted` → `cancelled` (User cancels)
- Any status → `cancelled` (User cancels before active_care)

---

## 💰 PRICING STRUCTURE

### Per Pet Pricing
- **Base Rate Per Day**: Based on pet type (Dog, Cat, etc.) and size (small, medium, large, extra_large)
- **Special Care Add-ons**: Medical care, special diet, grooming, etc.
- **Number of Days**: Calculated from start to end date

### Total Calculation
```
For each pet:
  Base Amount = Base Rate Per Day × Number of Days
  Add-ons Amount = Sum of special care add-ons
  Pet Total = Base Amount + Add-ons Amount

Subtotal = Sum of all pet totals
Additional Charges = Any center-level charges
After Discount = Subtotal + Additional Charges - Discount
Tax = After Discount × Tax Percentage
Total Amount = After Discount + Tax

Advance Amount = Total Amount × 50%
Remaining Amount = Total Amount - Advance Amount
```

### Final Bill (May Include)
- Original total
- Extra days (if pet stayed longer)
- Additional services
- Adjustments (discounts/charges)
- Final total
- Final amount due = Final total - Advance already paid

---

## 🔐 SECURITY FEATURES

1. **OTP Verification**
   - Check-in OTP (generated on approval)
   - Check-out OTP (generated before check-out)

2. **Payment Security**
   - Razorpay integration
   - Payment signature verification
   - Automatic invoice generation

3. **Access Control**
   - Users can only see their own applications
   - Managers can only see their center's applications
   - Role-based access control

---

## 📱 NOTIFICATIONS

### User Receives:
- Pricing determined
- Advance payment confirmation
- Application approved (with check-in OTP)
- Daily care updates (if enabled)
- Emergency alerts
- Final bill generated
- Check-out ready

### Manager Receives:
- New application submitted
- Advance payment completed
- Care reminders
- Emergency alerts

---

## 📁 FILE STRUCTURE

### Backend
```
backend/modules/temporary-care/
├── models/
│   ├── TemporaryCareApplication.js (NEW)
│   ├── CenterPricing.js (NEW)
│   └── TemporaryCareCenter.js (UPDATED)
├── user/
│   ├── controllers/
│   │   ├── applicationController.js (NEW)
│   │   ├── applicationPaymentController.js (NEW)
│   │   └── applicationFeedbackController.js (NEW)
│   └── routes/
│       └── temporaryCareUserRoutes.js (UPDATED)
└── manager/
    ├── controllers/
    │   └── applicationManagerController.js (NEW)
    └── routes/
        └── temporaryCareManagerRoutes.js (UPDATED)
```

### Frontend
```
frontend/src/
├── pages/
│   ├── User/TemporaryCare/
│   │   ├── SubmitTemporaryCareApplication.jsx (NEW)
│   │   ├── MyApplications.jsx (NEW)
│   │   ├── ApplicationPayment.jsx (NEW)
│   │   └── ApplicationFeedback.jsx (NEW)
│   └── Manager/TemporaryCare/
│       └── ApplicationManagerDashboard.jsx (NEW)
├── services/
│   └── api.js (UPDATED)
└── utils/
    └── razorpay.js (NEW)
```

---

## 🚀 GETTING STARTED

### For Users:
1. Navigate to `/User/temporary-care/apply`
2. Select your pets
3. Choose a care center
4. Set dates and special instructions
5. Submit application
6. Wait for pricing
7. Pay advance when ready
8. Wait for approval
9. Check-in pet at facility
10. Monitor care (view logs)
11. Pay final amount
12. Check-out pet
13. Submit feedback

### For Managers:
1. Navigate to `/Manager/temporary-care/applications`
2. View dashboard statistics
3. Review submitted applications
4. Set pricing for each application
5. Verify capacity before approval
6. Approve applications after advance payment
7. Assign kennels and caretakers
8. Record check-in conditions
9. Maintain daily care logs
10. Handle emergencies
11. Generate final bills
12. Record check-out conditions
13. View analytics and reports

---

## ✅ COMPLETE FEATURE CHECKLIST

- [x] Multi-pet application support
- [x] Center/Association selection
- [x] Date range selection
- [x] Special instructions per pet
- [x] Auto-calculated pricing preview
- [x] Manager pricing determination
- [x] Per-pet pricing breakdown
- [x] 50% advance payment
- [x] 50% final payment
- [x] Status workflow (all 6 statuses)
- [x] Capacity verification
- [x] Application approval/rejection
- [x] Kennel assignment
- [x] Caretaker assignment
- [x] Check-in condition recording
- [x] Daily care logs
- [x] Emergency handling
- [x] Final bill generation
- [x] Check-out condition recording
- [x] Invoice generation
- [x] Payment history
- [x] Feedback/review system
- [x] Manager dashboard with analytics
- [x] User application tracking
- [x] OTP-based check-in/check-out
- [x] Notifications (structure ready)

---

## 🎯 BUSINESS RULES IMPLEMENTED

1. ✅ Pricing must be determined before advance payment
2. ✅ 50% advance payment is mandatory for confirmation
3. ✅ One application can include multiple pets
4. ✅ Pricing is calculated per pet
5. ✅ Final payment required before pet return
6. ✅ Capacity must be validated before approval
7. ✅ Pricing is locked after manager sets it
8. ✅ Check-in OTP generated on approval
9. ✅ Final bill includes extra days/services
10. ✅ Feedback can only be submitted after completion

---

This is a complete, production-ready temporary care/boarding module with all the features you requested! 🎉

# Complete PetShop Feature Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER PETSHOP DASHBOARD                        │
│                  (PetShopUserDashboard.jsx)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Search & Filter  │ │ Wishlist Tab │ │  Orders Tab  │
        └──────────────────┘ └──────────────┘ └──────────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │    Browse Pets Grid (Batches)    │
        │    With BatchCard Components     │
        └──────────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │  BatchCard with "Buy Now" Button │
        │  - Images                        │
        │  - Species/Breed                 │
        │  - Price                         │
        │  - Action Buttons                │
        └──────────────────────────────────┘
                    │ Click "Buy Now"
                    ▼
    ┌───────────────────────────────────────────────────┐
    │        PURCHASE WIZARD DIALOG (NEW)                │
    │       └─ Multi-Step Form Dialog                   │
    │          ├─ Step 0: Contact Info                  │
    │          ├─ Step 1: Visit Details                 │
    │          ├─ Step 2: Delivery Address              │
    │          └─ Step 3: Review & Confirm              │
    │                                                    │
    │       └─ Form Validation                          │
    │       └─ Error Snackbars                          │
    │       └─ Loading States                           │
    └───────────────────────────────────────────────────┘
                    │ Submit
                    ▼
    ┌───────────────────────────────────────────────────┐
    │  Backend: POST /petshop/user/public/             │
    │           reservations/purchase                   │
    │                                                    │
    │  publicController.createPurchaseReservation()    │
    │  ├─ Validate itemId exists                        │
    │  ├─ Check status = 'available_for_sale'           │
    │  ├─ Create PetReservation document                │
    │  ├─ Update item.status → 'reserved'               │
    │  ├─ Generate reservationCode                      │
    │  └─ Return response with code                     │
    └───────────────────────────────────────────────────┘
                    │ Response
                    ▼
    ┌───────────────────────────────────────────────────┐
    │  Frontend Success Handler                         │
    │  ├─ Show snackbar with reservation code           │
    │  ├─ Close dialog                                  │
    │  ├─ Refresh pet list                              │
    │  └─ Update pet status to "Reserved"               │
    └───────────────────────────────────────────────────┘
```

## Data Flow: Pet to Purchase

```
MANAGER PERSPECTIVE:
  Manager adds pets → Pet status 'in_petshop' → Publishes → Status 'available_for_sale'

USER PERSPECTIVE:
  1. DISCOVERY
     └─ GET /petshop/user/public/listings → All available pets
     └─ GET /petshop/user/public/batches → Grouped pet batches
     └─ Rendered as BatchCard components with images, price, etc.

  2. INTERACTION
     └─ User clicks "Buy Now" button
     └─ handleReserve() opens purchase dialog
     └─ Dialog shows 4-step wizard

  3. FORM SUBMISSION
     └─ Step 0: Collect contact (email, phone, method)
     └─ Step 1: Collect preferences (date, time, purpose)
     └─ Step 2: Collect address (if home delivery)
     └─ Step 3: Review all data before submit

  4. API CALL
     └─ POST /petshop/user/public/reservations/purchase
     └─ Send: itemId + contactInfo + visitDetails + deliveryAddress
     └─ Backend validates and creates PetReservation

  5. COMPLETION
     └─ Show reservation code
     └─ Update pet to 'reserved' status
     └─ Refresh dashboard
     └─ User can track via reservation code

MANAGER PERSPECTIVE (AFTER PURCHASE):
  Manager sees new reservation → Approves/Contacts user → Schedules handover/delivery
```

## Component Hierarchy

```
PetShopUserDashboard
├── Header & Title
├── Tab Navigation
│   ├── Browse Batches
│   ├── Wishlist
│   └── My Orders
├── Tab Content: Browse Batches
│   ├── Search & Filter Bar
│   │   ├── Search TextField
│   │   └── PetShop Select
│   ├── Pets Grid
│   │   └── BatchCard (Repeated)
│   │       ├── Image
│   │       ├── Info (species, breed, price)
│   │       ├── Save Button
│   │       ├── Details Button
│   │       └── Buy Now Button (LAUNCHES WIZARD)
│   └── Pagination
├── Tab Content: Wishlist
│   └── Filtered BatchCards (isFavorite only)
├── Tab Content: My Orders
│   └── Order Cards with view details button
│
├── PURCHASE WIZARD DIALOG (NEW)
│   ├── Dialog Title: "Reserve & Purchase Pet"
│   ├── Stepper (Steps: 0-3)
│   │
│   ├── Content Area (Dynamic by step)
│   │   ├── Step 0: Contact Information
│   │   │   ├── Email TextField
│   │   │   ├── Phone TextField
│   │   │   └── Contact Method Select
│   │   │
│   │   ├── Step 1: Visit/Pickup Details
│   │   │   ├── Preferred Date Picker
│   │   │   ├── Preferred Time Select
│   │   │   └── Visit Purpose Select
│   │   │
│   │   ├── Step 2: Delivery Address (Optional)
│   │   │   ├── Street TextField
│   │   │   ├── City TextField
│   │   │   ├── State TextField
│   │   │   ├── ZIP TextField
│   │   │   └── Phone TextField
│   │   │
│   │   └── Step 3: Review & Confirmation
│   │       ├── Pet Details Card
│   │       ├── Contact Info Card
│   │       ├── Visit Details Card
│   │       ├── Delivery Address Card (if applicable)
│   │       └── Disclaimer Alert
│   │
│   ├── Dialog Actions
│   │   ├── Cancel Button
│   │   ├── Previous Button (Steps 1-3)
│   │   ├── Next Button (Steps 0-2)
│   │   └── Submit Button (Step 3)
│
└── SNACKBAR
    ├── Success: "Reservation created! Code: RES-..."
    └── Error: Validation or API error messages
```

## State Management

```
PetShopUserDashboard State:

├── Tab State
│   └── tabValue: 0 | 1 | 2

├── Browsing State
│   ├── batches: Pet[]
│   ├── shops: PetShop[]
│   ├── searchQuery: string
│   ├── selectedShop: string
│   ├── page: number
│   ├── total: number
│   ├── limit: number
│   ├── loading: boolean
│   └── error: string

├── Wishlist State
│   ├── wishlist: Pet[]
│   ├── orders: Order[]
│   └── favorites: Set<string> (petIds)

└── PURCHASE WIZARD STATE (NEW)
    ├── purchaseDialog: boolean
    ├── selectedPet: Pet | null
    ├── purchaseStep: 0 | 1 | 2 | 3
    ├── purchaseLoading: boolean
    │
    ├── purchaseData:
    │   ├── contactInfo:
    │   │   ├── phone: string
    │   │   ├── email: string
    │   │   └── preferredContactMethod: 'email' | 'phone' | 'both'
    │   ├── visitDetails:
    │   │   ├── preferredDate: string (ISO date)
    │   │   ├── preferredTime: 'morning' | 'afternoon' | 'evening'
    │   │   └── visitPurpose: 'meet_pet' | 'direct_purchase' | 'home_delivery'
    │   ├── deliveryAddress:
    │   │   ├── street: string
    │   │   ├── city: string
    │   │   ├── state: string
    │   │   ├── zipCode: string
    │   │   └── phone: string
    │   └── notes: string
    │
    └── snackbar:
        ├── open: boolean
        ├── message: string
        └── severity: 'success' | 'error' | 'warning' | 'info'
```

## Event Handlers

```
BatchCard Actions:
├── onSelect(batch) → navigate to batch detail page
├── onReserve(batch) → handleReserve(batch)
└── onFavoriteToggle(batchId) → handleFavoriteToggle(batchId)

handleReserve(pet) [MODIFIED]
├── Set selectedPet = pet
├── Initialize purchaseData with user info
├── Set purchaseStep = 0
├── Open purchaseDialog = true

handlePurchaseNextStep()
├── Validate current step fields
├── If invalid: Show snackbar error → return
├── If valid & step < 3: Increment purchaseStep
├── If step === 3: Show submit button

handlePurchasePrevStep()
├── If purchaseStep > 0: Decrement purchaseStep

handlePurchaseSubmit() [ASYNC]
├── Get selectedPet._id as itemId
├── POST /petshop/user/public/reservations/purchase
├── Send: itemId + contactInfo + visitDetails + deliveryAddress + notes
├── On success (201):
│   ├── Show success snackbar with reservationCode
│   ├── setTimeout(2s):
│   │   ├── Close dialog
│   │   ├── Refresh batches list
├── On error (4xx/5xx):
│   └── Show error snackbar with error message

handlePurchaseDialogClose()
├── Reset purchaseDialog = false
├── Reset purchaseStep = 0
├── Clear selectedPet = null
```

## API Integration Points

### 1. Initial Load
```
GET /petshop/user/public/shops
  ↓
GET /petshop/user/public/batches
  ↓
GET /petshop/user/public/listings
  ↓
(Optional) GET /petshop/manager/inventory (if user is manager)
```

### 2. Purchase Flow
```
POST /petshop/user/public/reservations/purchase
├─ Request:
│  ├─ itemId: string
│  ├─ contactInfo: { phone, email, preferredContactMethod }
│  ├─ reservationType: 'purchase'
│  ├─ visitDetails: { preferredDate, preferredTime, visitPurpose }
│  ├─ deliveryAddress: { street, city, state, zipCode, phone }
│  └─ notes: string
│
└─ Response (201):
   ├─ success: true
   ├─ data:
   │  └─ reservation:
   │     ├─ _id: string
   │     ├─ reservationCode: string ← SHOWN TO USER
   │     ├─ itemId: { _id, name, price, images }
   │     ├─ userId: { _id, name, email }
   │     ├─ status: 'pending'
   │     ├─ contactInfo: { ... }
   │     ├─ visitDetails: { ... }
   │     ├─ deliveryInfo: { ... }
   │     └─ timeline: [{ status, timestamp, updatedBy, notes }]
   └─ message: "Reservation created successfully..."
```

## Validation Rules

### Contact Information (Step 0)
- Email: Required, valid format
- Phone: Required, valid format
- Contact Method: Required (default: 'both')

### Visit Details (Step 1)
- Preferred Date: Required, future date
- Preferred Time: Required (default: 'morning')
- Visit Purpose: Required (default: 'meet_pet')

### Delivery Address (Step 2)
- Street: Optional
- City: Required IF street is filled
- State: Optional
- ZIP Code: Optional
- Phone: Optional

### Review (Step 3)
- No validation (display only)
- Submit button always available

## Success Criteria

✅ **Dialog Opens**: Clicking "Buy Now" opens wizard dialog
✅ **Step Navigation**: Next/Previous buttons work
✅ **Validation**: Form validates required fields
✅ **Error Messages**: Clear messages for invalid inputs
✅ **API Integration**: POST request sent correctly
✅ **Response Handling**: Reservation code shown
✅ **Auto-close**: Dialog closes on success
✅ **List Refresh**: Pet list refreshes showing updated status
✅ **Snackbar Notifications**: Success and error messages displayed
✅ **Loading State**: Spinner shown during submission
✅ **Responsive**: Dialog works on mobile and desktop

## Future Integration Points

### Email Notifications (Ready in Backend)
```javascript
// Send email to user with reservation details
// Backend has template: "Your reservation for [petName] is confirmed!"

// Send email to manager
// "New reservation from [userName] for [petName]"
```

### Payment Gateway
```javascript
// Step 3.5: Payment Information (optional)
POST /petshop/payments/razorpay/order
  └─ Create payment order for pet price
  
POST /petshop/payments/razorpay/verify
  └─ Verify payment signature
```

### Pickup Scheduling
```javascript
// Step 4: Pickup Scheduling
POST /petshop/pickup/:reservationId/schedule
  └─ User confirms pickup date/time

POST /petshop/pickup/:reservationId/verify-otp
  └─ Manager sends OTP, user verifies at pickup
```

### SMS Notifications
```javascript
// Both user and manager get SMS
// Reservation confirmation
// Pickup reminder (24h before)
// Delivery notification (in transit)
```

## Summary

The PetShop purchase wizard is a complete, production-ready feature that:

1. **Provides guided UI**: Multi-step wizard with clear progression
2. **Validates input**: Required fields checked before advancing
3. **Integrates with backend**: API call sends reservation to database
4. **Handles errors**: Validation and API errors shown to user
5. **Provides feedback**: Success codes and loading states
6. **Updates state**: Pet marked reserved, list refreshed
7. **Follows conventions**: React patterns, Material-UI design
8. **Is extensible**: Ready for payment, scheduling, notifications

Users can now complete full purchase flow in intuitive dialog, with managers receiving notifications for approval and handover coordination.

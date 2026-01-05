# Three Separate Modules Architecture

## Overview
Building **3 completely independent modules** with full backend and frontend integration:
1. **Ecommerce** - Pet supplies, food, accessories
2. **Pharmacy** - Pet medicines, prescriptions (separate from Ecommerce)
3. **Temporary Care** - Pet boarding, daycare services

## System Architecture

### 1. Module Management (Admin)
**Location:** `/api/modules` (already exists)
- Each module has: key, name, icon, color, status, hasManagerDashboard
- Status: 'active', 'maintenance', 'blocked', 'coming_soon'
- Admin can enable/disable modules
- Admin can view module status

### 2. Manager Management (Admin)
**Location:** `/api/admin/managers` or `/api/rbac/users/module-admin`
- Create managers for each module
- Assign managers to modules
- Manager invitation system (accept/reject)
- Module-specific manager dashboards

### 3. Module Definitions in DB

```javascript
// Core modules that will be in Module collection
{
  key: 'ecommerce',
  name: 'E-Commerce',
  description: 'Pet supplies and accessories shopping',
  icon: 'ShoppingCart',
  color: '#ef4444',
  status: 'active',
  hasManagerDashboard: true,
  displayOrder: 4
}

{
  key: 'pharmacy',
  name: 'Pharmacy',
  description: 'Pet medicines with prescription support',
  icon: 'LocalPharmacy',
  color: '#f59e0b',
  status: 'active',
  hasManagerDashboard: true,
  displayOrder: 5
}

{
  key: 'temporary-care',
  name: 'Temporary Care',
  description: 'Pet boarding and daycare services',
  icon: 'Home',
  color: '#06b6d4',
  status: 'active',
  hasManagerDashboard: true,
  displayOrder: 6
}
```

## Backend Structure

### Ecommerce Module
```
backend/modules/ecommerce/
├── models/
│   ├── Ecommerce.js (Product, Cart, Order - NOT PharmacyItem)
│   └── EcommerceManager.js (Store details for manager)
├── manager/
│   ├── controllers/
│   ├── routes/
│   └── services/
├── user/
│   ├── controllers/
│   ├── routes/
│   └── services/
└── routes/
    └── index.js
```

### Pharmacy Module (SEPARATE)
```
backend/modules/pharmacy/
├── models/
│   ├── Pharmacy.js (Medicine, Prescription, Order)
│   └── PharmacyManager.js (Store details)
├── manager/
│   ├── controllers/
│   ├── routes/
│   └── services/
├── user/
│   ├── controllers/
│   ├── routes/
│   └── services/
└── routes/
    └── index.js
```

### Temporary Care Module
```
backend/modules/temporary-care/
├── models/
│   ├── TemporaryCare.js (Facility, Caregiver, Booking)
│   └── TemporaryCareManager.js (Facility manager)
├── manager/
│   ├── controllers/
│   ├── routes/
│   └── services/
├── user/
│   ├── controllers/
│   ├── routes/
│   └── services/
└── routes/
    └── index.js
```

## Frontend Structure

### Manager Dashboards
```
frontend/src/modules/managers/
├── Ecommerce/
│   ├── EcommerceManagerDashboard.jsx (3-4 tabs)
│   ├── ProductManagement.jsx
│   ├── OrderManagement.jsx
│   └── Reports.jsx
├── Pharmacy/
│   ├── PharmacyManagerDashboard.jsx (3-4 tabs)
│   ├── MedicineManagement.jsx
│   ├── PrescriptionRequests.jsx
│   ├── OrderManagement.jsx
│   └── Reports.jsx
└── TemporaryCare/
    ├── TemporaryCareManagerDashboard.jsx (already exists)
    ├── FacilityManagement.jsx
    ├── CaregiverManagement.jsx
    ├── BookingManagement.jsx
    └── Reports.jsx
```

### User Pages
```
frontend/src/pages/User/
├── Ecommerce/
│   ├── Ecommerce.jsx (Browse products)
│   ├── Cart.jsx (Shopping cart)
│   ├── EcommerceDashboard.jsx (Checkout - already exists)
│   └── Orders.jsx (Order history - already exists)
├── Pharmacy/
│   ├── Pharmacy.jsx (Browse medicines)
│   ├── CartPharmacy.jsx (Pharmacy cart)
│   ├── PharmacyCheckout.jsx (Checkout with prescription)
│   └── PharmacyOrders.jsx (Order history)
└── TemporaryCare/
    ├── BrowseFacilities.jsx (already exists)
    ├── BookPetCare.jsx (already exists)
    └── TemporaryCareBookings.jsx (My bookings)
```

### User Dashboard Integration
```
frontend/src/pages/User/PublicUserDashboard.jsx
- Add Ecommerce, Pharmacy, TemporaryCare to sidebar
- Add quick access cards to dashboard
- Show notification for each module
```

## API Endpoints

### Ecommerce
- GET `/api/ecommerce/products` - Browse products
- GET `/api/ecommerce/cart` - Get cart
- POST `/api/ecommerce/cart/add` - Add to cart
- DELETE `/api/ecommerce/cart/:productId` - Remove from cart
- POST `/api/ecommerce/orders` - Create order
- GET `/api/ecommerce/orders` - Get user orders
- POST `/api/ecommerce/manager/products` - Create/update products
- GET `/api/ecommerce/manager/orders` - Manager view orders

### Pharmacy
- GET `/api/pharmacy/medicines` - Browse medicines
- GET `/api/pharmacy/cart` - Get pharmacy cart
- POST `/api/pharmacy/cart/add` - Add medicine to cart
- POST `/api/pharmacy/orders` - Create order with prescription
- GET `/api/pharmacy/orders` - Get user orders
- POST `/api/pharmacy/manager/medicines` - Manage medicines
- GET `/api/pharmacy/manager/prescriptions` - View prescription requests

### Temporary Care
- GET `/api/temporary-care/facilities` - Browse facilities
- POST `/api/temporary-care/bookings` - Create booking
- GET `/api/temporary-care/bookings` - Get user bookings
- GET `/api/temporary-care/manager/facilities` - Manage facilities
- GET `/api/temporary-care/manager/bookings` - Manager view bookings

## Manager-User Handshake

### Flow
1. Admin creates manager in Module Management
2. System sends invitation email to manager
3. Manager accepts invitation
4. Manager's user type is set to `{module}_manager` (e.g., `ecommerce_manager`)
5. Manager is assigned store/facility details
6. Manager can access only their module's dashboard
7. Manager can manage their store/facility

### Implementation
- Model: `ManagerInvitation` (already exists as `AdminInvite`)
- Routes: `/api/admin/invite-manager`, `/api/admin/accept-invitation`
- Store Details: UserDetails.storeDetails per manager

## User Dashboard Navigation

### Sidebar Updates
Each module gets:
- Menu item with icon and name
- Badge showing pending actions (orders, bookings, etc.)
- Link to module page

### Dashboard Cards
- Ecommerce: Recent orders, total spending
- Pharmacy: Recent prescriptions, pending approvals
- Temporary Care: Active bookings, upcoming care dates

## Integration Points

### Authentication
- User role-based access (user, {module}_manager, admin)
- Module-level permissions checked via `useAuth` context

### Module Status Check
- Frontend checks module.status before rendering
- Show "Coming Soon" or "Under Maintenance" message
- Block access to blocked modules

### Manager Assignment
- Check if user has manager role for module
- Load manager-specific dashboards only if assigned
- UserDetails.assignedModule = module key

## Required Changes Summary

1. ✅ Module Management - Already exists
2. ✅ Manager Management - Already exists  
3. ⚠️ Ecommerce Backend - Needs cleanup (remove pharmacy)
4. ⚠️ Pharmacy Backend - Needs to be separated from ecommerce
5. ⚠️ Temporary Care Backend - Already exists, verify complete
6. ⚠️ Manager Dashboards Frontend - Ecommerce & Pharmacy need completion
7. ⚠️ User Pages Frontend - All need completion/verification
8. ⚠️ User Dashboard Integration - Add 3 modules to sidebar and dashboard
9. ✅ Build & Test - Verify all 3 modules work together

## Database Models Required

### Core Models (already exist)
- User
- UserDetails
- Module
- ManagerInvitation/AdminInvite

### Ecommerce Models
- Product (name, price, category, stock, image, description)
- Cart (userId, items[])
- Order (userId, items[], shippingAddress, totalAmount, status)

### Pharmacy Models
- Medicine (name, price, category, stock, prescriptionRequired, image)
- Prescription (userId, medicineId, doctorName, prescriptionImage, status)
- PharmacyCart (userId, items[])
- PharmacyOrder (userId, items[], prescriptions[], status)

### Temporary Care Models
- Facility (name, location, services, dailyRate, capacity)
- Caregiver (name, qualifications, facility)
- Booking (userId, facilityId, petId, dates, status, totalCost)


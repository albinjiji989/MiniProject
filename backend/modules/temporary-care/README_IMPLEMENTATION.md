# Temporary Care Module - Complete Implementation Guide

## Overview
A comprehensive, industry-level temporary care/pet boarding module for the PetConnect platform. This module allows pet owners to book temporary care services for their pets when they travel or need assistance.

## Features

### 🎯 Core Functionality

#### User Features
- **Service Discovery**: Browse available temporary care services (boarding, in-home, daycare, overnight)
- **Pet Selection**: Only book services for owned/adopted pets
- **Smart Booking**: Multi-step booking wizard with real-time price calculation
- **Dual Location Options**:
  - Facility Boarding: Drop pet at care center
  - In-Home Care: Caregiver comes to customer's home
- **Payment Integration**: Split payment system (advance + final payment)
- **OTP-based Handover**: Secure drop-off and pickup verification
- **Activity Timeline**: Real-time updates on pet's care activities
- **Review & Rating**: Rate service and staff after completion
- **Booking Management**: View, track, and cancel bookings

#### Manager Features
- **Dashboard**: Real-time stats and today's schedule
- **Check-in/Check-out Management**: OTP generation and verification
- **Staff Assignment**: Assign caregivers to bookings
- **Activity Logging**: Record feeding, walking, medication, playtime, etc.
- **Booking Oversight**: View and manage all facility bookings
- **Staff Management**: View available staff and performance metrics

#### Admin Features
- **Service Type Management**: Create and manage service offerings
- **Staff Management**: Onboard, verify, and manage care staff
- **Booking Management**: Full CRUD operations on all bookings
- **Analytics**: Revenue reports, booking trends, staff performance
- **Staff Assignment**: Assign and reassign staff to bookings
- **Payment Management**: Process refunds for cancellations

## Database Models

### 1. ServiceType
Defines available temporary care services:
```javascript
{
  name: String,
  code: String (unique),
  category: 'boarding' | 'in-home' | 'daycare' | 'overnight',
  pricing: {
    basePrice: Number,
    priceUnit: 'per_day' | 'per_hour' | 'per_visit',
    additionalCharges: Array,
    advancePercentage: Number
  },
  features: Array,
  requirements: Object,
  isActive: Boolean
}
```

### 2. CareBooking
Main booking entity:
```javascript
{
  bookingNumber: String (auto-generated),
  userId: ObjectId,
  petId: ObjectId,
  serviceType: ObjectId,
  serviceCategory: String,
  startDate: Date,
  endDate: Date,
  duration: { value: Number, unit: String },
  location: {
    type: 'facility' | 'customer_home',
    address: Object
  },
  specialRequirements: {
    diet: String,
    medication: Array,
    allergies: Array,
    behaviorNotes: String,
    emergencyContact: Object,
    vetContact: Object
  },
  assignedCaregivers: Array,
  pricing: {
    baseAmount: Number,
    additionalCharges: Array,
    tax: Object,
    totalAmount: Number,
    advanceAmount: Number,
    remainingAmount: Number
  },
  paymentStatus: {
    advance: Object,
    final: Object
  },
  status: 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded',
  handover: {
    dropOff: { otp: Object, actualTime: Date },
    pickup: { otp: Object, actualTime: Date }
  },
  activityLog: Array,
  review: Object
}
```

### 3. CareStaff
Staff member details:
```javascript
{
  userId: ObjectId,
  employeeId: String (auto-generated),
  qualifications: Array,
  experience: {
    years: Number,
    specializations: Array
  },
  skills: Array,
  availability: {
    status: 'available' | 'busy' | 'on_leave' | 'inactive',
    workingHours: Array,
    maxBookingsPerDay: Number
  },
  performance: {
    totalBookings: Number,
    completedBookings: Number,
    averageRating: Number,
    totalReviews: Number
  },
  documents: Array,
  emergencyContact: Object
}
```

### 4. CareReview
Customer reviews:
```javascript
{
  bookingId: ObjectId,
  userId: ObjectId,
  petId: ObjectId,
  ratings: {
    overall: Number (1-5),
    care_quality: Number,
    communication: Number,
    cleanliness: Number,
    value_for_money: Number
  },
  comment: String,
  staffRatings: Array,
  wouldRecommend: Boolean,
  response: Object,
  status: 'pending' | 'approved' | 'rejected'
}
```

### 5. TemporaryCarePayment
Payment tracking:
```javascript
{
  temporaryCareId: ObjectId,
  userId: ObjectId,
  amount: Number,
  paymentType: 'advance' | 'final',
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  refund: Object
}
```

## API Endpoints

### User Routes (`/api/temporary-care/user`)

#### Service Discovery
- `GET /services` - Get available services
- `GET /my-pets` - Get user's pets for booking
- `POST /calculate-price` - Calculate booking price

#### Booking Management
- `POST /bookings` - Create new booking
- `GET /bookings` - Get user's bookings (with pagination)
- `GET /bookings/:id` - Get booking details
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/review` - Submit review
- `POST /bookings/:id/verify-otp` - Verify handover OTP
- `GET /bookings/:id/timeline` - Get activity timeline

#### Payment
- `POST /payments/advance/create-order` - Create advance payment order
- `POST /payments/final/create-order` - Create final payment order
- `POST /payments/verify` - Verify Razorpay payment
- `GET /payments/booking/:bookingId` - Get payment history

### Manager Routes (`/api/temporary-care/manager`)

#### Dashboard
- `GET /dashboard-stats` - Get dashboard statistics
- `GET /schedule/today` - Get today's schedule
- `GET /bookings-new` - Get all bookings
- `GET /bookings-new/:id` - Get booking details

#### Operations
- `POST /bookings-new/:id/assign-staff` - Assign staff
- `POST /bookings-new/:id/activity` - Add activity log
- `POST /bookings-new/:id/dropoff/generate-otp` - Generate drop-off OTP
- `POST /bookings-new/:id/dropoff/verify` - Verify drop-off OTP
- `POST /bookings-new/:id/pickup/generate-otp` - Generate pickup OTP
- `POST /bookings-new/:id/pickup/verify` - Verify pickup OTP
- `GET /staff/available` - Get available staff

### Admin Routes (`/api/temporary-care/admin`)

#### Service Type Management
- `GET /service-types` - List all service types
- `GET /service-types/:id` - Get single service type
- `POST /service-types` - Create service type
- `PUT /service-types/:id` - Update service type
- `PATCH /service-types/:id/toggle-status` - Activate/deactivate
- `DELETE /service-types/:id` - Delete service type
- `GET /service-types/stats` - Get statistics

#### Staff Management
- `GET /staff` - List all staff
- `GET /staff/:id` - Get staff details
- `POST /staff` - Create staff member
- `PUT /staff/:id` - Update staff
- `PATCH /staff/:id/status` - Update availability status
- `PATCH /staff/:id/documents/:documentId/verify` - Verify document
- `DELETE /staff/:id` - Delete staff
- `GET /staff/stats` - Get staff statistics
- `GET /staff/performance` - Get performance report

#### Booking Management
- `GET /bookings` - List all bookings
- `GET /bookings/:id` - Get booking details
- `PATCH /bookings/:id/status` - Update booking status
- `POST /bookings/:id/assign-caregiver` - Assign caregiver
- `DELETE /bookings/:id/remove-caregiver` - Remove caregiver
- `POST /bookings/:id/activity-log` - Add activity
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/generate-otp` - Generate OTP
- `GET /bookings/stats` - Get booking statistics

## Frontend Components

### User Components
1. **BookTemporaryCare.jsx** - Multi-step booking wizard
2. **MyBookings.jsx** - Booking list and management
3. **BookingDetails.jsx** - Detailed booking view
4. **SubmitReview.jsx** - Review submission form
5. **PaymentPage.jsx** - Razorpay payment integration

### Manager Components
1. **ManagerDashboard.jsx** - Operations dashboard
2. **TodaySchedule.jsx** - Daily check-in/out management
3. **BookingManagement.jsx** - All bookings view
4. **StaffAssignment.jsx** - Staff allocation interface
5. **ActivityLogger.jsx** - Record pet care activities

### Admin Components
1. **AdminDashboard.jsx** - Overview and analytics
2. **ServiceTypeManagement.jsx** - CRUD for services
3. **StaffManagement.jsx** - Staff onboarding and management
4. **BookingOversight.jsx** - All bookings management
5. **Analytics.jsx** - Reports and insights

## Key Features Implemented

### 🔒 Security
- Only owned pets can be booked
- OTP-based handover verification (6-digit, 15-30 min expiry)
- Payment signature verification
- Role-based access control
- JWT authentication

### 💰 Payment Flow
1. User creates booking (status: `pending_payment`)
2. System generates advance payment order (e.g., 50% of total)
3. User completes advance payment
4. Booking confirmed (status: `confirmed`)
5. Drop-off with OTP verification (status: `in_progress`)
6. Final payment before pickup
7. Pickup with OTP verification (status: `completed`)

### 📱 Booking Workflow

#### For Users:
1. Select pet from owned pets
2. Choose service type (boarding/in-home/etc.)
3. Set dates and location
4. Add special requirements (optional)
5. Review pricing and confirm
6. Pay advance amount
7. Receive booking confirmation
8. Drop-off pet with OTP
9. Track activities in real-time
10. Pay remaining amount
11. Pickup pet with OTP
12. Submit review

#### For Managers:
1. View today's schedule
2. Generate OTP for check-in
3. Verify customer OTP
4. Assign caregivers
5. Log care activities
6. Generate pickup OTP
7. Verify final payment
8. Complete checkout

#### For Admins:
1. Configure service types
2. Onboard staff members
3. Monitor all bookings
4. Assign/reassign staff
5. Process refunds
6. Generate reports
7. Manage pricing

## Installation & Setup

### Backend Setup
```bash
cd backend/modules/temporary-care

# Models are in: ./models/
# Controllers are in: ./admin/controllers/, ./manager/controllers/, ./user/controllers/
# Routes are in: ./routes/
# Services are in: ./services/
```

### Frontend Setup
```bash
cd frontend/src/pages

# Admin components: ./Admin/TemporaryCare/
# Manager components: ./Manager/TemporaryCare/
# User components: ./User/TemporaryCare/
```

### Environment Variables
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Usage Examples

### Creating a Service Type (Admin)
```javascript
POST /api/temporary-care/admin/service-types
{
  "name": "Premium Dog Boarding",
  "code": "PREM_DOG_BOARD",
  "category": "boarding",
  "description": "24/7 supervised care with playtime and training",
  "pricing": {
    "basePrice": 500,
    "priceUnit": "per_day",
    "advancePercentage": 50
  },
  "features": [
    "24/7 Supervision",
    "Playtime sessions",
    "Basic grooming",
    "Photo updates"
  ]
}
```

### Creating a Booking (User)
```javascript
POST /api/temporary-care/user/bookings
{
  "petId": "pet_id_here",
  "serviceTypeId": "service_id_here",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "locationType": "facility",
  "specialRequirements": {
    "diet": "Grain-free kibble, twice a day",
    "behaviorNotes": "Friendly but shy with strangers",
    "emergencyContact": {
      "name": "John Doe",
      "phone": "+91 9876543210"
    }
  }
}
```

### Verify Drop-off (Manager)
```javascript
POST /api/temporary-care/manager/bookings-new/{bookingId}/dropoff/verify
{
  "otp": "123456",
  "notes": "Pet received in good health"
}
```

## Testing Checklist

- [ ] User can only book owned pets
- [ ] Price calculation is accurate
- [ ] Payment integration works
- [ ] OTP generation and verification
- [ ] Staff assignment and availability tracking
- [ ] Activity logging
- [ ] Review submission
- [ ] Cancellation and refund flow
- [ ] Email notifications (if implemented)
- [ ] Dashboard statistics accuracy
- [ ] Mobile responsiveness

## Future Enhancements

- [ ] SMS/Email notifications for OTP
- [ ] Real-time chat between owner and caregiver
- [ ] Photo/video updates during care
- [ ] GPS tracking for in-home services
- [ ] Multi-pet booking discounts
- [ ] Loyalty program
- [ ] Emergency vet coordination
- [ ] Automated medication reminders
- [ ] Pet health monitoring integration
- [ ] Calendar synchronization

## Support & Maintenance

### Common Issues

**Issue**: "You can only book temporary care for your own pets"
- **Solution**: Ensure pet has `ownerId` or `owner.userId` matching logged-in user

**Issue**: "Booking cannot be cancelled"
- **Solution**: Cancellation requires 24-hour advance notice

**Issue**: "Final payment must be completed before checkout"
- **Solution**: User must pay remaining amount before pickup OTP verification

## License
Part of PetConnect platform - All rights reserved

## Contributors
- Backend: Complete REST API implementation
- Frontend: React components with Tailwind CSS
- Database: MongoDB with Mongoose ODM
- Payment: Razorpay integration

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅

# Temporary Care / Pet Boarding - Complete Workflow

## Overview
The Temporary Care module allows users to request boarding services for their pets while they're away. The process involves application submission, manager approval with pricing, payments, OTP-based handover, and activity tracking.

## Complete User Journey

### 1️⃣ Application Submission (User)
**User Actions:**
- Select one or more pets for boarding
- Choose a temporary care center
- Set start and end dates for boarding
- Add special instructions for each pet (food, medicine, behavior notes)
- Submit application

**System Response:**
- Application is created with status: `submitted`
- Manager of the care center receives notification
- User can view application in "My Applications" section

**Note:** If the center has pre-configured pricing, an estimate will be shown. Otherwise, the user will see a message that pricing will be set by the manager.

---

### 2️⃣ Manager Review & Pricing (Manager)
**Manager Actions:**
- Review the application details (pets, dates, special requirements)
- Verify center capacity for the requested dates
- Set pricing based on:
  - Pet types and sizes
  - Duration of stay
  - Special care requirements
  - Seasonal rates
- Approve or reject the application

**System Updates:**
- Application status changes to: `price_determined`
- User receives notification with pricing details
- Invoice/pricing breakdown is generated

---

### 3️⃣ Advance Payment (User)
**User Actions:**
- Review the pricing set by manager
- Pay **50% advance payment** via Razorpay
- Complete payment verification

**Payment Details:**
- Amount: 50% of total cost
- Payment Gateway: Razorpay
- After successful payment, application status changes to: `advance_paid`

**System Updates:**
- Payment record is created
- Manager is notified of payment completion
- Application status changes to: `advance_paid`
- User can now proceed to drop-off

---

### 4️⃣ Pet Drop-Off with OTP (User + Manager)
**Process:**
1. User brings pet to the care center on start date
2. Manager generates a **Drop-Off OTP** (6-digit code)
3. User enters the OTP to verify handover
4. Manager records check-in with pet condition notes

**System Updates:**
- Application status changes to: `active_care`
- Check-in timestamp recorded
- Pet condition at arrival documented
- Care period begins

---

### 5️⃣ Active Care Period (Manager + User Tracking)
**Manager Activities:**
- Assign kennel/space to each pet
- Assign caregiver staff
- Log daily care activities:
  - Feeding records
  - Medicine administration
  - Exercise/play time
  - Health observations
  - Photo updates
- Record any emergencies or incidents
- Update additional charges if any (vet visits, special care)

**User Can:**
- **Track pet in real-time** through the dashboard
- View daily activity logs
- See photos uploaded by caregivers
- Receive notifications for important events
- Contact the care center if needed

**System Features:**
- Activity timeline for each pet
- Photo gallery
- Health status updates
- Emergency notifications
- Care log history

---

### 6️⃣ Pet Pick-Up with OTP (User + Manager)
**Process:**
1. User arrives for pick-up on end date
2. Manager generates a **Pick-Up OTP** (6-digit code)
3. User enters the OTP to verify collection
4. Manager records check-out with pet condition notes
5. Final bill is presented

**System Updates:**
- Check-out timestamp recorded
- Pet condition at departure documented
- Final bill generated (including any additional charges)

---

### 7️⃣ Final Payment (User)
**User Actions:**
- Review final bill (may include additional charges)
- Pay remaining **50% balance** via Razorpay
- Complete payment verification

**Payment Details:**
- Base Amount: Remaining 50% of original cost
- Additional Charges: Vet visits, special care, extended stay, etc.
- Total: Calculated and shown in final bill

**System Updates:**
- Payment record created
- Application status changes to: `completed`
- Full payment history available

---

### 8️⃣ Feedback & Rating (User)
**User Actions:**
- Rate the overall experience (1-5 stars)
- Rate specific aspects:
  - Care quality
  - Staff behavior
  - Facility cleanliness
  - Communication
- Write detailed feedback
- Submit review

**System Updates:**
- Feedback saved and linked to application
- Manager can view feedback
- Ratings contribute to center's overall score
- Application fully closed

---

## Application Status Flow

```
submitted
   ↓
price_determined (Manager sets pricing)
   ↓
advance_paid (User pays 50%)
   ↓
approved (Manager confirms booking)
   ↓
active_care (Pet checked in with OTP)
   ↓
completed (Pet checked out with OTP + Final payment)
   ↓
[Feedback submitted]
```

## Alternative Status:
- **cancelled** - User cancels before drop-off
- **rejected** - Manager rejects application
- **emergency** - Emergency situation during care

---

## Key Features

### 🔐 OTP Verification
- **Drop-Off OTP:** Ensures proper handover of pet to care center
- **Pick-Up OTP:** Ensures pet is collected by authorized person
- 6-digit codes generated for each transaction
- Expires after successful verification

### 📊 Activity Tracking
Users can view:
- Daily feeding schedules
- Medicine administration records
- Exercise and playtime logs
- Health observations
- Photo updates
- Any incidents or emergencies

### 💰 Split Payment System
- **Advance (50%):** Secures the booking
- **Final (50% + extras):** Paid at checkout
- All payments via secure Razorpay gateway
- Complete payment history maintained

### 📱 Real-Time Updates
- Notifications for status changes
- Daily activity updates
- Emergency alerts
- Payment reminders
- OTP notifications

---

## Important Notes

1. **Pricing Flexibility:** Centers can either pre-configure standard pricing or set custom pricing per application

2. **Multi-Pet Support:** Users can submit applications for multiple pets in one booking

3. **Special Care:** Users can specify special requirements (food, medicine, behavior) for each pet

4. **Capacity Management:** Managers verify center capacity before approving applications

5. **Cancellation Policy:** Users can cancel applications before drop-off (advance payment may be refunded based on center policy)

6. **Emergency Handling:** Managers can record and notify users of any emergencies during care period

---

## For Developers

### API Endpoints Used

**User Endpoints:**
- `POST /api/temporary-care/user/applications` - Submit application
- `GET /api/temporary-care/user/applications` - List my applications
- `GET /api/temporary-care/user/applications/:id` - Get details
- `POST /api/temporary-care/user/applications/:id/cancel` - Cancel application
- `POST /api/temporary-care/user/applications/calculate-pricing` - Get estimate (optional)
- `POST /api/temporary-care/user/applications/payments/create-order` - Create payment
- `POST /api/temporary-care/user/applications/payments/verify` - Verify payment
- `GET /api/temporary-care/user/applications/:id/payments` - Payment history
- `POST /api/temporary-care/user/applications/:id/feedback` - Submit feedback

**Manager Endpoints:**
- `GET /api/temporary-care/manager/applications` - List applications
- `GET /api/temporary-care/manager/applications/:id` - Get details
- `POST /api/temporary-care/manager/applications/:id/pricing` - Set pricing
- `POST /api/temporary-care/manager/applications/:id/approve-reject` - Approve/Reject
- `POST /api/temporary-care/manager/applications/:id/check-in` - Record drop-off
- `POST /api/temporary-care/manager/applications/:id/care-logs` - Add activity log
- `POST /api/temporary-care/manager/applications/:id/check-out` - Record pick-up
- `POST /api/temporary-care/manager/applications/:id/final-bill` - Generate final bill

### Database Models
- **TemporaryCareApplication** - Main application record
- **TemporaryCareCenter** - Care center details
- **CenterPricing** - Pricing configuration
- **CareLog** - Daily activity logs
- **Payment** - Payment transactions
- **Feedback** - User feedback and ratings

---

## Success Criteria

✅ User can easily submit applications for multiple pets  
✅ Manager has full control over pricing and approvals  
✅ Secure OTP-based handover system  
✅ Real-time activity tracking for pet owners  
✅ Split payment system reduces upfront cost  
✅ Complete audit trail of all activities  
✅ Feedback system improves service quality  

---

**Last Updated:** January 8, 2026

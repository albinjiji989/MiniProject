# Temporary Care Module

## Overview
The Temporary Care module provides a comprehensive system for pet owners to temporarily place their pets in professional care when they're traveling or unable to care for their pets. This module includes functionality for users to request care services, managers to operate care centers, and administrators to monitor the system.

## Features

### User Features
- Request temporary care services for pets
- Select care dates and type of care needed
- Make 50% advance payment and 50% final payment
- Track pet care activities (feeding, bathing, walking, etc.)
- Receive notifications about pet care updates
- View care history and active care records

### Manager Features
- Manage temporary care centers and caregivers
- Review and approve care requests
- Assign caregivers to care requests
- Update care status (pending, active, completed, cancelled)
- Process refunds for payments
- View payment records and revenue reports

### Admin Features
- Monitor all temporary care centers
- View system statistics and analytics
- Generate revenue reports
- Analyze care type distribution

## API Endpoints

### User Routes (`/api/temporary-care/user`)
- `POST /requests` - Submit a temporary care request
- `GET /requests` - List user's temporary care requests
- `GET /active-care` - Get user's active temporary care records
- `GET /care-history` - Get user's care history
- `PUT /requests/:id/cancel` - Cancel a temporary care request
- `POST /payments/order` - Create a payment order
- `POST /payments/verify` - Verify a payment
- `POST /care-activities` - Log a care activity
- `GET /care-activities/:temporaryCareId` - Get care activities for a record
- `GET /public/centers` - List active care centers

### Manager Routes (`/api/temporary-care/manager`)
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /bookings` - List bookings
- `GET /facilities` - List facilities
- `GET /caregivers-list` - List caregivers
- `GET /me/store` - Get manager's store info
- `PUT /me/store` - Update manager's store info
- `GET /me/center` - Get manager's center
- `POST /me/center` - Create/update manager's center
- `GET /requests` - List care requests
- `PUT /requests/:id/decision` - Approve/decline a request
- `POST /requests/:id/assign` - Assign a request to a caregiver
- `GET /caregivers` - List caregivers
- `POST /caregivers` - Create a caregiver
- `PUT /caregivers/:id` - Update a caregiver
- `DELETE /caregivers/:id` - Delete a caregiver
- `GET /cares` - List temporary care records
- `GET /cares/:id` - Get a temporary care record
- `PUT /cares/:id/status` - Update care status
- `PUT /cares/:id/reassign` - Reassign caregiver
- `PUT /cares/:id/complete` - Complete care
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment details
- `POST /payments/:id/refund` - Process a refund

### Admin Routes (`/api/temporary-care/admin`)
- `GET /centers` - List all care centers
- `PUT /centers/:id/status` - Update center status
- `GET /stats` - Get system statistics
- `GET /reports/revenue` - Get revenue reports
- `GET /reports/care-types` - Get care type distribution

## Data Models

### TemporaryCare
Main model for temporary care records with payment tracking and care activities.

### TemporaryCareRequest
Model for user requests before they are approved and assigned.

### Caregiver
Model for care staff who provide temporary care services.

### TemporaryCareCenter
Model for care facilities where temporary care services are provided.

### TemporaryCarePayment
Model for tracking payments for temporary care services.

## Payment Flow
1. User submits a temporary care request
2. Manager approves the request
3. User makes 50% advance payment through Razorpay
4. Care begins and activities are logged
5. User makes 50% final payment through Razorpay
6. Care is completed and pet is returned to owner

## Notification System
The module includes a comprehensive notification system that sends:
- Email and SMS notifications for care activities
- Payment confirmations and status updates
- Care status changes (started, completed, cancelled)

## Setup Requirements
1. Configure Razorpay keys in environment variables
2. Set up email configuration (SMTP or OAuth2)
3. Ensure proper role-based access control is configured

## Future Enhancements
- Home delivery/pickup services
- Care rating and feedback system
- Advanced scheduling features
- Care package customization
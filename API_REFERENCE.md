# Manager Invitation API Reference

## Endpoints Overview

### 1. Invite Manager (Step 1)
```
POST /api/admin/invite-module-manager
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "module": "adoption"  // or: petshop, temporary-care, veterinary
}

Success Response (200):
{
  "success": true,
  "message": "OTP sent to candidate email",
  "inviteId": "65a1b2c3d4e5f6g7h8i9j0k1"
}

Error Response (400):
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "param": "email",
      "msg": "Please provide a valid email address"
    }
  ]
}

Error Response (400 - Email exists):
{
  "success": false,
  "message": "Email already registered"
}

Error Response (500):
{
  "success": false,
  "message": "Server error during invite"
}

Email Sent:
Subject: Verify module manager invitation (adoption)
Body: Your verification code is 123456. It expires in 10 minutes.
```

---

### 2. Verify OTP & Create Manager (Step 2)
```
POST /api/admin/verify-module-manager
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "email": "john@example.com",
  "module": "adoption",
  "otp": "123456"
}

Success Response (200):
{
  "success": true,
  "message": "Module manager created and credentials emailed"
}

Error Response (400 - Invalid OTP):
{
  "success": false,
  "message": "Invalid OTP"
}

Error Response (400 - OTP Expired):
{
  "success": false,
  "message": "OTP expired"
}

Error Response (404):
{
  "success": false,
  "message": "Invitation not found"
}

Error Response (400 - Validation):
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "param": "otp",
      "msg": "OTP must be 6 digits"
    }
  ]
}

Email Sent (After successful verification):
Subject: Your adoption manager account details
Body:
  Your account is ready
  Use the credentials below to sign in and you will be asked to 
  change your password immediately.
  
  Email: john@example.com
  Temporary Password: aB7c2XyZ1A
```

---

### 3. Login with Credentials (Step 3)
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "aB7c2XyZ1A"
}

Success Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "adoption_manager",
      "mustChangePassword": true,  // ← Force password change
      "assignedModule": "adoption",
      "storeId": null,
      "storeName": ""
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

Error Response (400 - Wrong Password):
{
  "success": false,
  "message": "Invalid credentials"
}

Error Response (400 - No Password Set):
{
  "success": false,
  "message": "This account was created with Google. Please use..."
}

Error Response (403 - Account Inactive):
{
  "success": false,
  "message": "Account is deactivated. Contact support."
}
```

---

### 4. Change Password (Step 4)
```
POST /api/auth/change-password
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "currentPassword": "aB7c2XyZ1A",
  "newPassword": "SecureNewPass123",
  "confirmPassword": "SecureNewPass123"
}

Success Response (200):
{
  "success": true,
  "message": "Password changed successfully"
}

Error Response (400 - Wrong Current Password):
{
  "success": false,
  "message": "Current password is incorrect"
}

Error Response (400 - Passwords Don't Match):
{
  "success": false,
  "message": "New passwords do not match"
}

Error Response (400 - Weak Password):
{
  "success": false,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
}
```

---

### 5. Resend OTP (Optional)
```
POST /api/admin/resend-invite
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "email": "john@example.com",
  "module": "adoption"
}

Success Response (200):
{
  "success": true,
  "message": "OTP sent to candidate email"
}

Error Response (404):
{
  "success": false,
  "message": "Pending invitation not found"
}

Email Sent:
Subject: Verify module manager invitation (adoption)
Body: Your verification code is 654321. It expires in 10 minutes.
```

---

## API Request Examples

### Using cURL

#### Invite Manager
```bash
curl -X POST http://localhost:3001/api/admin/invite-module-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "module": "adoption"
  }'
```

#### Verify OTP
```bash
curl -X POST http://localhost:3001/api/admin/verify-module-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "john@example.com",
    "module": "adoption",
    "otp": "123456"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "aB7c2XyZ1A"
  }'
```

---

### Using JavaScript/Fetch

```javascript
// Invite Manager
const inviteManager = async (adminToken) => {
  const response = await fetch('/api/admin/invite-module-manager', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
      module: 'adoption'
    })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (adminToken, email, module, otp) => {
  const response = await fetch('/api/admin/verify-module-manager', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ email, module, otp })
  });
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

---

## Validation Rules

### Invite Endpoint
- `name` - Required, string (1-100 chars)
- `email` - Required, valid email format
- `phone` - Optional, string
- `module` - Required, one of: `adoption`, `petshop`, `temporary-care`, `veterinary`

### Verify Endpoint
- `email` - Required, valid email format
- `module` - Required, one of: `adoption`, `petshop`, `temporary-care`, `veterinary`
- `otp` - Required, exactly 6 digits (format: `^\d{6}$`)

### Login Endpoint
- `email` - Required, valid email format
- `password` - Required, at least 1 character

---

## Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Request successful |
| 400 | Bad Request | Validation error, wrong OTP, expired OTP |
| 403 | Forbidden | Account deactivated |
| 404 | Not Found | User or invitation not found |
| 500 | Server Error | Database or server issue |

---

## Response Structure

All responses follow this structure:

```javascript
{
  "success": true/false,
  "message": "Human readable message",
  "data": {
    // Optional: Response data (user, token, etc)
  },
  "errors": [
    // Optional: Validation errors
    {
      "param": "field name",
      "msg": "Error message"
    }
  ]
}
```

---

## Rate Limiting

- Login endpoint: 5 attempts per 15 minutes (in production)
- Other endpoints: No rate limit applied currently
- Note: Rate limiting disabled in development mode

---

## Authentication

- All admin endpoints require `Authorization: Bearer {JWT_TOKEN}` header
- Public endpoints (login, password reset) don't require auth
- JWT expires in 7 days

---

## Database Collections

### AdminInvite
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  phone: String,
  module: String,
  otp: String,
  expiresAt: Date,
  verified: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  phone: String,
  role: String,  // e.g., "adoption_manager"
  mustChangePassword: Boolean,
  isActive: Boolean,
  authProvider: String,  // "local" | "google" | "both"
  storeId: String,
  storeName: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Common Issues & Solutions

### Issue: "Email already registered"
**Cause**: User with this email already exists
**Solution**: Use a different email address

### Issue: "Invalid OTP"
**Cause**: OTP is incorrect
**Solution**: Check the OTP in the email and enter exactly

### Issue: "OTP expired"
**Cause**: More than 10 minutes have passed
**Solution**: Click "Resend OTP" to get a new code

### Issue: "Invalid credentials" on login
**Cause**: Wrong email or password
**Solution**: 
- Verify temporary password from email
- Check for spaces before/after password
- Try resending OTP if password email wasn't received

### Issue: Can't change password
**Cause**: Current password is wrong
**Solution**: Use the temporary password from the credentials email

---

**Last Updated**: January 4, 2026
**API Version**: 1.0
**Status**: ✅ Production Ready

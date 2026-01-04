# Manager Invitation Flow Diagram

## Complete Process Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                             │
│                    (Manager Management Page)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: ADMIN INVITES MANAGER                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Form Input:                                                         │
│  • Name: John Doe                                                   │
│  • Email: john@example.com                                          │
│  • Phone: 9876543210                                                │
│  • Module: adoption (or petshop, temporary-care, veterinary)        │
│                                                                     │
│ Click: "Send OTP"                                                   │
│        ↓                                                             │
│ POST /api/admin/invite-module-manager                               │
│        ↓                                                             │
│ Backend Actions:                                                    │
│  1. Generate 6-digit OTP (e.g., 123456)                            │
│  2. Save to AdminInvite collection:                                 │
│     {                                                               │
│       email: "john@example.com",                                   │
│       module: "adoption",                                           │
│       otp: "123456",                                                │
│       expiresAt: Date(+10 minutes),                                │
│       verified: false                                               │
│     }                                                               │
│  3. SEND EMAIL: OTP Email Only                                     │
│     Subject: "Verify module manager invitation (adoption)"         │
│     Body: "Your code is 123456. It expires in 10 minutes."        │
│  ✓ Response: OTP sent successfully                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: ADMIN VERIFIES OTP                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Admin sees second dialog: "Enter OTP"                               │
│                                                                     │
│ Input:                                                              │
│  • Email: john@example.com (pre-filled)                            │
│  • OTP: 123456                                                      │
│  • Module: adoption (pre-filled)                                    │
│                                                                     │
│ Click: "Verify & Create Manager"                                    │
│        ↓                                                             │
│ POST /api/admin/verify-module-manager                               │
│        ↓                                                             │
│ Backend Actions:                                                    │
│  1. Find AdminInvite with matching email, module, OTP              │
│  2. Validate OTP:                                                   │
│     - Check if OTP is correct                                      │
│     - Check if not expired                                         │
│  3. Generate Temporary Password (e.g., aB7c2XyZ1A)                │
│  4. Create User Account:                                            │
│     {                                                               │
│       name: "John Doe",                                             │
│       email: "john@example.com",                                   │
│       password: "aB7c2XyZ1A" (hashed by pre-save hook)            │
│       role: "adoption_manager",                                     │
│       mustChangePassword: true,                                     │
│       authProvider: "local"                                         │
│     }                                                               │
│  5. Mark AdminInvite as verified: verified = true                  │
│  6. SEND EMAIL: Credentials Email                                  │
│     Subject: "Your adoption manager account details"              │
│     Body: "Email: john@example.com                                 │
│             Temporary Password: aB7c2XyZ1A"                       │
│  ✓ Response: Module manager created and credentials emailed        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: MANAGER LOGS IN                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Manager navigates to: http://localhost:5173/login                  │
│                                                                     │
│ Input:                                                              │
│  • Email: john@example.com                                         │
│  • Password: aB7c2XyZ1A (from credentials email)                   │
│                                                                     │
│ Click: "Sign In"                                                    │
│        ↓                                                             │
│ POST /api/auth/login                                                │
│        ↓                                                             │
│ Backend Actions:                                                    │
│  1. Find User by email                                              │
│  2. Validate password:                                              │
│     await user.matchPassword("aB7c2XyZ1A")                         │
│     Uses: bcrypt.compare() to verify against hashed password       │
│  3. Generate JWT token                                              │
│  4. Return user data with mustChangePassword: true                │
│  ✓ Response: Login successful + token                              │
│                                                                     │
│ Frontend Actions:                                                   │
│  1. Check mustChangePassword flag                                   │
│  2. If true → Show password change dialog                          │
│  3. Manager must set new password before accessing dashboard       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: MANAGER CHANGES PASSWORD                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Dialog: "Change Your Password"                                      │
│                                                                     │
│ Input:                                                              │
│  • Current Password: aB7c2XyZ1A                                    │
│  • New Password: SecureNewPass123                                   │
│  • Confirm Password: SecureNewPass123                               │
│                                                                     │
│ Click: "Update Password"                                            │
│        ↓                                                             │
│ POST /api/auth/change-password                                      │
│        ↓                                                             │
│ Backend: Updates password, sets mustChangePassword: false          │
│        ↓                                                             │
│ ✓ Manager can now access dashboard                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Password Hashing & Comparison

```
┌────────────────────────────────────┐
│ User Creation (Temp Password)      │
├────────────────────────────────────┤
│ Temp Password (Plain): aB7c2XyZ1A │
│          ↓                         │
│   (Pre-save Hook)                  │
│          ↓                         │
│  bcrypt.hash(password, 10)         │
│          ↓                         │
│  Stored Hash: $2b$10$... (60 char)│
└────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│ Login (Password Verification)      │
├────────────────────────────────────┤
│ User Input: aB7c2XyZ1A             │
│          ↓                         │
│  bcrypt.compare(input, stored)     │
│          ↓                         │
│  ✓ Match → Login Success           │
│  ✗ No Match → Invalid Credentials  │
└────────────────────────────────────┘
```

## Email Timeline

```
Timeline:
─────────────────────────────────────────────────

T=0 min   → Admin clicks "Send OTP"
          └─► ✓ OTP Email Sent (123456)
                Expires in 10 minutes

T=1 min   → Admin receives OTP in email
          → Admin enters OTP in dialog

T=2 min   → Admin clicks "Verify & Create Manager"
          └─► ✓ User account created
              ✓ Credentials Email Sent (email + temp password)

T=3 min   → Manager receives credentials email
          → Manager goes to login page
          → Manager enters credentials

T=5 min   → Manager logged in successfully
          → Forced to change password

T=6 min   → Manager sets new password
          → Can now access dashboard
```

## Key Improvements

✅ **OTP First Approach**
   - Admin invites manager
   - OTP email arrives
   - Only after verification, credentials are sent

✅ **Password Hashing**
   - Temporary password is hashed using bcrypt
   - Login uses bcrypt.compare() for validation
   - No plaintext passwords in database

✅ **Security**
   - OTP expires in 10 minutes
   - Temporary password must be changed on first login
   - Forced password change via mustChangePassword flag

✅ **Error Handling**
   - Email failure doesn't break the process
   - Clear validation messages for OTP
   - User can still login even if email fails

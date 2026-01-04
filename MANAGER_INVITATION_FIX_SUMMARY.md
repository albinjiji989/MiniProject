# Manager Invitation Process Fix - Summary

## Issues Fixed

### 1. **Sequential Email Delivery (OTP First, Password After)**
**Problem**: Both OTP and temporary password emails were being sent together when admin invited a manager.

**Solution**: Modified the backend to follow a two-step process:
- **Step 1 (Invite)**: Only send OTP email to candidate
- **Step 2 (Verify OTP)**: After OTP verification, create user account and send credentials email

### 2. **Temporary Password Login Issue**
**Problem**: Even when the correct temporary password was entered, login showed "Invalid credentials".

**Solution**: Fixed password handling in user creation:
- Set password in constructor instead of after instantiation
- Ensure bcrypt hashing happens correctly in pre-save hook
- Password comparison in login route works correctly with hashed passwords

## Files Modified

### Backend: `/backend/modules/admin/routes/admin.js`

**Routes Updated:**
1. `POST /api/admin/verify-module-admin` (lines 451-510)
2. `POST /api/admin/verify-module-manager` (lines 515-556)

**Changes Made:**
- Password is now set in User object constructor with `password: tempPassword`
- Password email is sent ONLY after OTP is verified
- Added error handling for email delivery (doesn't fail if email sending fails)
- Removed duplicate password email sending from verification step

## How the Process Works Now

### Admin Invites Manager
```
POST /api/admin/invite-module-manager
- Admin provides: name, email, phone, module
- Backend: Generates OTP, saves to AdminInvite
- Email: OTP sent to candidate email
- Response: Success with invite ID
```

### Candidate Verifies OTP
```
POST /api/admin/verify-module-manager
- Admin/Candidate provides: email, module, OTP
- Backend: 
  - Validates OTP
  - Creates User account with temporary password
  - Marks invite as verified
  - Sends credentials email (email + temporary password)
- Response: Success - account created
```

### Candidate Logs In
```
POST /api/auth/login
- Candidate provides: email, temporary password
- Backend: Uses bcrypt.compare() to validate password
- Response: JWT token + user data
- Frontend: Shows password change prompt (mustChangePassword: true)
```

## Password Hashing Flow

1. **User Creation**:
   ```javascript
   const user = new User({
     email,
     password: tempPassword,  // Plain text password
     mustChangePassword: true
   });
   await user.save();  // Pre-save hook hashes password
   ```

2. **Pre-save Hook** (in User model):
   ```javascript
   userSchema.pre('save', async function(next) {
     if (!this.isModified('password') || !this.password) {
       return next();
     }
     // Hashes password with bcrypt
     const salt = await bcrypt.genSalt(10);
     this.password = await bcrypt.hash(this.password, salt);
     return next();
   });
   ```

3. **Login Validation**:
   ```javascript
   const isMatch = await user.matchPassword(password);  // Uses bcrypt.compare()
   ```

## Email Sequence

### Old Process (BROKEN)
1. Admin invites → OTP email + Password email together ❌

### New Process (FIXED)
1. Admin invites → **OTP email sent** ✓
2. Admin/Candidate enters OTP → **Verified**
3. After verification → **Password email sent** ✓

## Testing Checklist

- [ ] Admin can invite manager with name, email, phone, module
- [ ] OTP is sent to candidate email (check email)
- [ ] Invalid OTP shows error message
- [ ] Valid OTP verification shows success
- [ ] Credentials email arrives after OTP verification
- [ ] Manager can login with temporary password
- [ ] Login shows "Invalid credentials" for wrong password
- [ ] Login succeeds with correct temporary password
- [ ] mustChangePassword flag is set (forces password change on first login)

## Error Handling Improvements

- If password email fails to send, the process continues (user can still login)
- Better logging for debugging email delivery issues
- Consistent error messages for OTP validation

## Migration Notes

No database migration needed. This is a process/logic change only.

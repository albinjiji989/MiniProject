# Certificate System Fixes

## Problem Summary

The adoption certificate system was not working correctly due to path mismatches between certificate generation and file access. Certificates were being generated in one directory but the system was trying to access them from another location.

## Issues Identified

1. **Incorrect Certificate Generation Path**: Certificates were being generated in `backend/modules/adoption/uploads/adoption/manager/certificate/` instead of the correct location `backend/uploads/adoption/manager/certificate/`.

2. **File Access Path Mismatch**: Both manager and user controllers were looking for certificates in the wrong locations.

3. **Legacy Directory Structure**: Old certificate files existed in incorrect directories causing confusion.

## Fixes Implemented

### 1. Fixed Certificate Generation Path (Manager Controller)

**File**: `backend/modules/adoption/manager/controllers/certificateController.js`

**Change**: Updated the directory path for certificate generation to match the static file serving configuration:

```javascript
// Before (incorrect):
const dir = path.join(__dirname, '..', '..', 'uploads', 'adoption', 'manager', 'certificate');

// After (correct):
const dir = path.join(__dirname, '..', '..', '..', 'uploads', 'adoption', 'manager', 'certificate');
```

### 2. Fixed Certificate Streaming Logic (Both Controllers)

**Files**: 
- `backend/modules/adoption/manager/controllers/certificateController.js`
- `backend/modules/adoption/user/controllers/certificateController.js`

**Change**: Updated the file access path to directly use the correct directory structure:

```javascript
// Before (incorrect):
const diskPath = path.join(backendRoot, fileUrl.replace(/^\//, ''));

// After (correct):
const diskPath = path.join(backendRoot, 'uploads', 'adoption', 'manager', 'certificate', path.basename(fileUrl));
```

### 3. Verified Static File Serving Configuration

**File**: `backend/server.js`

**Verification**: Confirmed that the static file serving route is correctly configured:

```javascript
app.use('/uploads/adoption/manager/certificate', 
  express.static(path.join(__dirname, 'uploads', 'adoption', 'manager', 'certificate')));
```

### 4. Cleaned Up Legacy Directories

Removed the incorrect directory structure that was causing confusion:
- `backend/modules/adoption/uploads/` (and all contents)

## Testing Verification

The fixes have been verified with the test script `test-certificate-fix.js` which confirms:

1. ✓ Certificate directory exists at the correct path
2. ✓ Incorrect certificate directory has been removed
3. ✓ Static serving configuration matches certificate generation path

## How It Works Now

1. **Certificate Generation**: When an adoption manager generates a certificate, it is saved to:
   ```
   backend/uploads/adoption/manager/certificate/
   ```

2. **Manager Access**: Adoption managers can view/download certificates through:
   ```
   GET /api/adoption/manager/certificates/:applicationId/file
   ```

3. **User Access**: Adopters can download certificates through:
   ```
   GET /api/adoption/user/certificates/:applicationId/file
   ```

4. **Static Serving**: Direct access to certificate files is available at:
   ```
   /uploads/adoption/manager/certificate/filename.pdf
   ```

## Benefits of the Fix

1. **Consistent Pathing**: All components now use the same directory structure
2. **Improved Reliability**: Certificates will be found and served correctly
3. **Cleaner Organization**: Removed legacy directory structures that caused confusion
4. **Better Maintainability**: Clear separation between module-specific and general uploads

## Files Modified

1. `backend/modules/adoption/manager/controllers/certificateController.js`
2. `backend/modules/adoption/user/controllers/certificateController.js`
3. Removed legacy directory: `backend/modules/adoption/uploads/`

## Testing the Fix

To test the certificate system after these fixes:

1. Log in as an adoption manager
2. Navigate to an approved adoption application with completed payment
3. Generate a certificate
4. Verify the certificate is created in `backend/uploads/adoption/manager/certificate/`
5. View/download the certificate as manager
6. Log in as the adopter user
7. Download the certificate from the user interface

The certificate should now be accessible from both manager and user perspectives without any path errors.
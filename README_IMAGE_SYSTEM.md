# Image Upload System Implementation

## Overview
This document describes the implementation of a new image upload system that stores images in a modular directory structure and saves only file paths in the database, not base64 data.

## Changes Made

### 1. Backend Changes

#### Directory Structure
Created a new modular directory structure for image storage:
```
backend/uploads/
├── core/
│   ├── admin/
│   ├── manager/
│   └── user/
├── adoption/
│   ├── admin/
│   ├── manager/
│   └── user/
├── petshop/
│   ├── admin/
│   ├── manager/
│   └── user/
├── veterinary/
│   ├── admin/
│   ├── manager/
│   └── user/
├── temporary-care/
│   ├── admin/
│   ├── manager/
│   └── user/
└── otherpets/
    ├── admin/
    ├── manager/
    └── user/
```

#### New Files Created
1. `backend/core/utils/imageUploadHandler.js` - Utility functions for image processing
2. `backend/scripts/testImageUpload.js` - Test script for the image upload system
3. `backend/docs/image-upload-system.md` - Documentation for the image upload system

#### Modified Files
1. `backend/core/models/Image.js` - Added module and role fields
2. `backend/core/routes/user/user/pets.js` - Updated image handling logic

### 2. Frontend Changes

#### New Files Created
1. `frontend/src/utils/imageUtils.js` - Utility functions for frontend image handling

#### Modified Files
1. `frontend/src/pages/User/Pets/AddPet.jsx` - Updated to use new image utilities

## Features Implemented

### 1. Unique Filename Generation
- Uses crypto for better uniqueness
- Format: `{name}-{entityId}-{timestamp}-{uniqueId}.{extension}`

### 2. Modular Storage
- Images organized by module (core, adoption, petshop, etc.) and role (admin, manager, user)
- User-added pet images stored in `backend/uploads/otherpets/user/`

### 3. Database Efficiency
- Only file paths stored in database, not base64 data
- Reduced database size and improved query performance

### 4. File Validation
- File type validation (JPEG, PNG, GIF, WebP)
- File size validation (default 5MB limit)
- Number of files validation (default 5 files limit)

### 5. Error Handling
- Graceful handling of image processing errors
- Detailed error messages for users

## Testing
The implementation has been tested with a test script that:
1. Creates a test pet
2. Processes test images
3. Saves images to the file system
4. Stores file paths in the database
5. Verifies file existence
6. Cleans up test data

## Usage

### For Users
Users can add pets at `http://localhost:5173/User/pets/add` and upload up to 5 images. The images will be:
1. Converted from base64 to files
2. Saved in `backend/uploads/otherpets/user/`
3. File paths stored in the database
4. Only file paths sent to the frontend

### For Developers
To use the image upload system in other parts of the application:

```javascript
const { processEntityImages } = require('../core/utils/imageUploadHandler');

const savedImages = await processEntityImages(
  images,      // Array of image objects
  'PetNew',    // Entity type
  petId,       // Entity ID
  userId,      // User ID
  'otherpets', // Module
  'user'       // Role
);
```

## Benefits
1. **Organized Storage**: Images are organized by module and user role
2. **Unique Filenames**: No conflicts even with same filenames
3. **Database Efficiency**: Only file paths stored, not large base64 data
4. **Scalability**: Easy to extend for other modules and roles
5. **Performance**: Faster database queries and responses
6. **Maintainability**: Clear separation of concerns with utility functions

## Future Improvements
1. Add image compression before saving
2. Implement image resizing for different use cases
3. Add support for cloud storage (AWS S3, Google Cloud Storage)
4. Implement image caching for better performance
5. Add image optimization (WebP conversion, etc.)
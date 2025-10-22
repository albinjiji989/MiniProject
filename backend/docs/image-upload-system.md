# Image Upload System Documentation

## Overview
This document describes the new image upload system that stores images in a modular directory structure and saves only file paths in the database, not base64 data.

## Directory Structure
The images are now stored in a modular structure under `backend/uploads`:

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

## Implementation Details

### 1. Image Model Updates
The [Image](file:///d:/Second/MiniProject/backend/core/models/Image.js#L53-L53) model has been enhanced with new fields:
- `module`: Indicates which module the image belongs to (core, adoption, petshop, veterinary, etc.)
- `role`: Indicates the user role (admin, manager, user)

### 2. Image Upload Utility
A new utility file [imageUploadHandler.js](file:///d:/Second/MiniProject/backend/core/utils/imageUploadHandler.js) provides functions for:
- Generating unique filenames using crypto for better uniqueness
- Saving base64 images to the file system
- Creating directories if they don't exist
- Processing entity images with proper organization

### 3. Filename Generation
Filenames are generated using the format:
```
{name}-{entityId}-{timestamp}-{uniqueId}.{extension}
```

This ensures uniqueness even if the same user uploads the same image multiple times.

### 4. User Pet Creation
When users create pets at `http://localhost:5173/User/pets/add`, the images are:
1. Converted from base64 to files
2. Saved in `backend/uploads/otherpets/user/`
3. File paths are stored in the database
4. Only file paths are sent to the frontend, not base64 data

## Benefits
1. **Organized Storage**: Images are organized by module and user role
2. **Unique Filenames**: No conflicts even with same filenames
3. **Database Efficiency**: Only file paths stored, not large base64 data
4. **Scalability**: Easy to extend for other modules and roles
5. **Performance**: Faster database queries and responses

## Testing
A test script [testImageUpload.js](file:///d:/Second/MiniProject/backend/scripts/testImageUpload.js) is available to verify the functionality.

## Usage Example
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
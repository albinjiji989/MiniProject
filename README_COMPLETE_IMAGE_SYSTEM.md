# Complete Image and Document Storage System

## Overview
This document describes the complete implementation of the image and document storage system that stores all files in a modular directory structure and saves only file paths in the database, not base64 data.

## Complete Directory Structure
All files (images and documents) are stored in `backend/uploads` organized by modules and roles:

```
backend/uploads/
├── adoption/
│   ├── admin/
│   ├── manager/
│   └── user/
├── core/
│   ├── admin/
│   ├── manager/
│   └── user/
├── otherpets/
│   ├── admin/
│   ├── manager/
│   └── user/
├── petshop/
│   ├── admin/
│   ├── manager/
│   └── user/
├── temporary-care/
│   ├── admin/
│   ├── manager/
│   └── user/
└── veterinary/
    ├── admin/
    ├── manager/
    ├── user/
```

## Implementation Details

### 1. File Naming Convention
All files use a unique naming scheme to prevent conflicts:
```
{name}-{entityId}-{timestamp}-{cryptoHash}.{extension}
```

Examples:
- `image_0-64f8a0b4c9e7a123456789ad-1761053044859-bb9f3ffaccc12a2a687e80353d4e2b59.png`
- `contract-64f8a0b4c9e7a123456789ad-1761053045202-0.pdf`

### 2. Database Storage
Only file paths are stored in the database, not base64 data:
- Images are stored in the [Image](file:///d:/Second/MiniProject/backend/core/models/Image.js#L53-L53) collection
- Documents are stored in the [Document](file:///d:/Second/MiniProject/backend/core/models/Document.js#L77-L77) collection
- Both include module and role metadata for organization

### 3. File Types Supported
The system handles all file types including:
- **Images**: PNG, JPG, JPEG, GIF, WebP (.png, .jpg, .jpeg, .gif, .webp)
- **Documents**: PDF, DOC, DOCX, TXT, etc. (.pdf, .doc, .docx, .txt)

### 4. Module-Specific Storage
Each module stores files in its respective directory:
- **Adoption**: Contracts, certificates, pet photos → `uploads/adoption/{role}/`
- **Petshop**: Product images, inventory photos → `uploads/petshop/{role}/`
- **Veterinary**: Medical records, X-rays, certificates → `uploads/veterinary/{role}/`
- **Temporary Care**: Care records, photos → `uploads/temporary-care/{role}/`
- **Otherpets**: User-added pet images → `uploads/otherpets/{role}/`
- **Core**: Profile photos, system documents → `uploads/core/{role}/`

## Key Features

### 1. Unique File Names
- Uses crypto for better uniqueness
- Prevents file name conflicts
- Maintains file extensions
- Includes entity ID and timestamp for traceability

### 2. Modular Organization
- Files organized by module and role
- Easy to locate and manage files
- Supports role-based access control
- Scalable for future modules

### 3. Database Efficiency
- Only file paths stored in database
- Reduced database size
- Faster database queries
- No base64 encoding/decoding overhead

### 4. File Fetching
Files are fetched by:
1. Getting the file path from the database
2. Serving the file from the file system using the path

Example implementation:
```javascript
app.get('/api/images/:imageId', async (req, res) => {
  const image = await Image.findById(req.params.imageId);
  if (!image) return res.status(404).json({error: 'Image not found'});
  res.sendFile(path.join(__dirname, '../', image.url));
});
```

## Implementation Files

### Backend
1. `backend/core/utils/imageUploadHandler.js` - Core utility for processing images
2. `backend/core/models/Image.js` - Image model with module/role fields
3. `backend/core/models/Document.js` - Document model with module/role fields
4. `backend/core/routes/user/user/pets.js` - Updated user pet creation with new system
5. `backend/modules/adoption/manager/controllers/petManagementController.js` - Updated adoption module
6. `backend/modules/petshop/manager/controllers/inventoryController.js` - Updated petshop module

### Frontend
1. `frontend/src/utils/imageUtils.js` - Frontend utilities for image handling
2. `frontend/src/pages/User/Pets/AddPet.jsx` - Updated user pet creation UI

## Testing
Comprehensive tests verify:
- All modules store files correctly
- All roles (admin, manager, user) work properly
- Both images and documents are handled
- Unique naming prevents conflicts
- Database only stores paths, not base64 data
- Files can be fetched correctly

## Usage Examples

### For Adoption Contracts/Certificates
When an adoption manager uploads a contract:
1. File saved to `backend/uploads/adoption/manager/`
2. Unique name: `contract-{petId}-{timestamp}-{hash}.pdf`
3. Path stored in database: `/uploads/adoption/manager/contract-...pdf`

### For User Pet Images
When a user adds pet photos:
1. Files saved to `backend/uploads/otherpets/user/`
2. Unique names: `image_0-{petId}-{timestamp}-{hash}.png`
3. Paths stored in database: `/uploads/otherpets/user/image_0-....png`

### For Profile Photos
When a user uploads a profile photo:
1. File saved to `backend/uploads/core/user/`
2. Unique name: `profile-{userId}-{timestamp}-{hash}.jpg`
3. Path stored in database: `/uploads/core/user/profile-....jpg`

## Benefits
1. **Organized Storage**: Files organized by module and role
2. **Unique Names**: No conflicts even with same filenames
3. **Database Efficiency**: Only paths stored, not large base64 data
4. **Scalability**: Easy to extend for other modules and roles
5. **Performance**: Faster database queries and responses
6. **Security**: Files stored outside web root with proper access control
7. **Maintainability**: Clear separation of concerns with utility functions

## Future Improvements
1. Add image compression before saving
2. Implement image resizing for different use cases
3. Add support for cloud storage (AWS S3, Google Cloud Storage)
4. Implement file caching for better performance
5. Add file optimization (WebP conversion, etc.)
6. Implement document preview generation
7. Add file versioning for important documents
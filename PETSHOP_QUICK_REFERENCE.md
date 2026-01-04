# PetShop Manager Module - Quick Reference Guide

## 🚀 Quick Start

### For Managers (Users)
1. Go to Dashboard: `http://yourapp.com/manager/petshop/dashboard`
2. Click "Add Pets" or navigate to Wizard
3. Fill 5 steps (2-3 min total)
4. Click Submit
5. View your new pets in Inventory

### For Developers (Integration)
1. Ensure backend has `wizardController.js` ✅
2. Ensure routes are in `petshopManagerRoutes.js` ✅
3. Start wizard frontend
4. Test complete flow
5. Verify dashboard/inventory display

---

## 📍 File Locations

### Frontend Wizard
```
/frontend/src/modules/managers/PetShop/Wizard/
├── StepBasicInfoImproved.jsx          ✅ Step 1
├── StepClassificationImproved.jsx     ✅ Step 2
├── StepPricingImproved.jsx            ✅ Step 3
├── StepGenderClassification.jsx       ✅ Step 4
├── StepReviewImproved.jsx             ✅ Step 5
└── WizardLayoutImproved.jsx           (stepper container)
```

### Frontend Dashboard & Inventory
```
/frontend/src/modules/managers/PetShop/
├── PetShopManagerDashboard.jsx        (dashboard)
├── ManageInventory.jsx                (inventory)
└── Inventory.jsx                      (simpler inventory)
```

### Backend Wizard
```
/backend/modules/petshop/manager/
├── controllers/
│   └── wizardController.js            ✅ NEW
├── routes/
│   └── petshopManagerRoutes.js        ✅ UPDATED
└── models/
    ├── PetStock.js                    (verified)
    └── PetInventoryItem.js            (verified)
```

---

## 🔑 Key Functions

### Frontend - Save Data
```javascript
// Used in all wizard steps
const save = (patch) => {
  const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
  const next = { ...prev, [section]: { ...(prev[section] || {}), ...patch } }
  localStorage.setItem(KEY, JSON.stringify(next))
}

// Usage
save({ stockName: "My Stock" })  // Step 1
save({ categoryId: "..." })      // Step 2
save({ price: 50000 })           // Step 3
save({ maleCount: 3 })           // Step 4
```

### Frontend - Submit Wizard
```javascript
// Used in Step 5 Review
const handleSubmit = async () => {
  const stockData = {
    stockName, categoryId, speciesId, breedId,
    age, ageUnit, color, size,
    price, discountPrice,
    maleCount, femaleCount,
    maleImages, femaleImages
  }
  
  const response = await apiClient.post(
    '/petshop/manager/wizard/submit',
    stockData
  )
  
  if (response.data.success) {
    localStorage.removeItem(KEY)
    navigate('/manager/petshop/inventory')
  }
}
```

### Backend - Submit Wizard
```javascript
// In wizardController.js
const submitWizard = async (req, res) => {
  // 1. Validate required fields
  // 2. Upload images to Cloudinary via processEntityImages
  // 3. Create PetStock record
  // 4. Generate individual pets via UnifiedPetService
  // 5. Return success response
}
```

---

## 🧪 Testing Commands

### Test Wizard Submission (cURL)
```bash
curl -X POST http://localhost:5000/petshop/manager/wizard/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stockName": "Test Golden Retrievers",
    "categoryId": "63a1b2c...",
    "speciesId": "63a1b2c...",
    "breedId": "63a1b2c...",
    "price": 50000,
    "maleCount": 3,
    "femaleCount": 2,
    "age": 3,
    "ageUnit": "months",
    "color": "Golden",
    "size": "Medium"
  }'
```

### Check Wizard Data (Browser Console)
```javascript
// View current wizard data
JSON.parse(localStorage.getItem('petshop_wizard'))

// Clear wizard data
localStorage.removeItem('petshop_wizard')

// Manually set data for testing
localStorage.setItem('petshop_wizard', JSON.stringify({
  basic: { stockName: "Test" },
  classification: { categoryId: "...", speciesId: "...", breedId: "..." },
  pricing: { price: 50000 },
  gender: { maleCount: 3, femaleCount: 2, maleImages: [], femaleImages: [] }
}))
```

### Test Inventory Listing
```bash
# List all pets
curl -X GET http://localhost:5000/petshop/manager/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List by status
curl -X GET "http://localhost:5000/petshop/manager/inventory?status=available_for_sale" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search
curl -X GET "http://localhost:5000/petshop/manager/inventory?search=Golden" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛠️ Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Wizard step doesn't load | localStorage corrupted | `localStorage.clear()` then refresh |
| Classification dropdown empty | API not returning data | Check `/admin/pet-categories` endpoint |
| Images not uploading | Cloudinary URL not set | Check `CLOUDINARY_URL` env var |
| Pets not generating | maleCount + femaleCount = 0 | Ensure at least 1 pet specified |
| Redirect fails after submit | Inventory page not found | Check routing configuration |
| Dashboard won't load | Stats endpoint missing | Create `/petshop/manager/dashboard/stats` |

---

## 📱 Navigation URLs

### Wizard Pages
- `/petshop/manager/wizard` - Start/Index
- `/petshop/manager/wizard/basic` - Step 1
- `/petshop/manager/wizard/classification` - Step 2
- `/petshop/manager/wizard/pricing` - Step 3
- `/petshop/manager/wizard/gender` - Step 4
- `/petshop/manager/wizard/review` - Step 5

### Management Pages
- `/petshop/manager/dashboard` - Dashboard
- `/petshop/manager/inventory` - Inventory listing
- `/petshop/manager/stocks` - Stock management
- `/petshop/manager/orders` - Orders

---

## 🔐 Authentication

All wizard/inventory endpoints require:
```javascript
// Header
Authorization: "Bearer JWT_TOKEN"

// User must have role
user.role.includes('manager') || user.role.includes('petshop_manager')

// User must have storeId
user.storeId != null
```

---

## 📊 Data Validation Rules

### Stock Name (Step 1)
- ✅ Required
- ✅ Non-empty string
- ✅ Length: 1-100 characters
- ✅ Can contain spaces, special chars

### Classification (Step 2)
- ✅ categoryId: Required, valid ObjectId
- ✅ speciesId: Required, valid ObjectId
- ✅ breedId: Required, valid ObjectId
- ✅ All must exist in database

### Pricing (Step 3)
- ✅ price: Required, positive number
- ✅ discountPrice: Optional, positive number or null
- ✅ price must be > 0
- ✅ discountPrice cannot exceed price

### Gender & Images (Step 4)
- ✅ maleCount: Non-negative integer
- ✅ femaleCount: Non-negative integer
- ✅ At least one > 0 (maleCount + femaleCount > 0)
- ✅ Images: Optional, max 5MB each

---

## 🎯 Integration Checklist

Before going to production:
- [ ] Cloudinary API configured
- [ ] Database indexes created
- [ ] API endpoints tested
- [ ] Frontend components tested
- [ ] Error handling verified
- [ ] Image upload works
- [ ] Pet generation works
- [ ] Dashboard loads
- [ ] Inventory displays pets
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] Security headers added

---

## 📈 Performance Tips

### Frontend
```javascript
// ✅ Good: Load data once
useEffect(() => { loadData() }, [])

// ❌ Avoid: Load on every render
useEffect(() => { loadData() })

// ✅ Good: Memoize expensive components
const PetCard = React.memo(({ pet }) => ...)

// ✅ Good: Lazy load images
<img loading="lazy" src="..." />
```

### Backend
```javascript
// ✅ Good: Batch pet generation
async function generatePets(stock, count) {
  const pets = Array(count).fill().map((_, i) => ({...}))
  return PetInventoryItem.insertMany(pets)
}

// ❌ Avoid: Create pets one by one
for (let i = 0; i < count; i++) {
  await PetInventoryItem.create({...})
}
```

---

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# Watch for errors
npm run dev

# Look for:
# - "Failed to upload image"
# - "Database error"
# - "Validation failed"
```

### Check Browser DevTools
```javascript
// Network tab
// Look for failed requests to:
// - /petshop/manager/wizard/submit
// - /admin/pet-categories
// - /admin/species
// - /admin/breeds

// Console tab
// Look for JavaScript errors
// Check localStorage content
```

### Enable Request Logging
```javascript
// In frontend API client
apiClient.interceptors.response.use(
  response => {
    console.log('✅', response.config.method, response.config.url)
    return response
  },
  error => {
    console.error('❌', error.response?.status, error.config?.url, error.response?.data)
    return Promise.reject(error)
  }
)
```

---

## 🚀 Deployment Steps

### 1. Backend Setup
```bash
# Ensure wizardController.js is in place
ls backend/modules/petshop/manager/controllers/wizardController.js

# Ensure routes are updated
grep "wizard/submit" backend/modules/petshop/manager/routes/petshopManagerRoutes.js

# Set environment variables
export CLOUDINARY_URL=cloudinary://...
export MONGODB_URI=mongodb://...

# Start backend
npm run start
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Serve frontend
npm run preview  # or deploy to hosting
```

### 3. Verify Setup
```bash
# Test wizard API
curl -X POST http://localhost:5000/petshop/manager/wizard/submit \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stockName":"test",...}'

# Verify routes
curl http://localhost:5000/petshop/manager/wizard/state

# Check Cloudinary
# Should upload images successfully
```

---

## 📞 Support References

### Documentation Files
1. `PETSHOP_MANAGER_FIXES.md` - Comprehensive technical reference
2. `PETSHOP_DASHBOARD_INVENTORY_GUIDE.md` - Dashboard/inventory guide
3. `PETSHOP_IMPLEMENTATION_COMPLETE.md` - Complete implementation summary

### Code References
- Wizard Controller: `/backend/modules/petshop/manager/controllers/wizardController.js`
- Wizard Routes: `/backend/modules/petshop/manager/routes/petshopManagerRoutes.js`
- Step Components: `/frontend/src/modules/managers/PetShop/Wizard/*`

### External Resources
- Cloudinary Docs: https://cloudinary.com/documentation
- MongoDB Docs: https://docs.mongodb.com
- React Docs: https://react.dev

---

## 🎓 Learning Path

### For New Developers
1. Read: `PETSHOP_IMPLEMENTATION_COMPLETE.md`
2. Review: All 5 wizard step files
3. Study: `wizardController.js`
4. Trace: Complete user journey
5. Test: End-to-end workflow
6. Debug: Common issues section

### For Existing Developers
1. Check: File changes summary
2. Review: API endpoints
3. Test: Integration endpoints
4. Verify: Deployment steps

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Testing  
**Version:** 1.0  


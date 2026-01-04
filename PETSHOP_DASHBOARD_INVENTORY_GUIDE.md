# PetShop Manager - Dashboard & Inventory Implementation Guide

## Current Status

### Dashboard Component
**File:** `/frontend/src/modules/managers/PetShop/PetShopManagerDashboard.jsx` (726 lines)

**Issues Found:**
1. ❌ Dashboard tries to call `/petshop/manager/stats` - needs to be verified/created
2. ⚠️ Inventory stats calculation from multiple API calls
3. ⚠️ Store setup dialog might be preventing dashboard display
4. ⚠️ Error handling could be improved

**Working Features:**
- ✅ Stats loading and display
- ✅ Recent activities timeline
- ✅ Quick action buttons
- ✅ Navigation to sub-pages

---

### Inventory Component
**File:** `/frontend/src/modules/managers/PetShop/ManageInventory.jsx` (948 lines)

**Issues Found:**
1. ❌ Long component with multiple tabs and states
2. ✅ Has proper CRUD operations
3. ✅ Pagination implemented
4. ✅ Filtering and search
5. ✅ Bulk operations

**Working Features:**
- ✅ Inventory listing with pagination
- ✅ Filter/search functionality
- ✅ Edit pet details
- ✅ Image upload
- ✅ Status management
- ✅ Bulk selection

---

## Key APIs to Verify

### Dashboard Stats Endpoint
**Endpoint:** `GET /petshop/manager/dashboard/stats`

**Expected Response:**
```javascript
{
  success: true,
  data: {
    totalPets: number,
    availableForSale: number,
    inStock: number,
    reserved: number,
    sold: number,
    revenue: number,
    pendingOrders: number,
    recentActivities: [ /* ... */ ]
  }
}
```

**Fallback Implementation:**
If this endpoint doesn't exist, the dashboard currently falls back to:
- `GET /petshop/manager/inventory?limit=1` (for pagination.total)
- `GET /petshop/manager/inventory?status=available_for_sale&limit=1`
- `GET /petshop/manager/orders?status=pending`

---

### Inventory List Endpoints
**Endpoint:** `GET /petshop/manager/inventory`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (available_for_sale, sold, reserved, pending_images)
- `search` (text search)
- `sortBy` (name, price, createdAt)
- `sortOrder` (asc, desc)

**Expected Response:**
```javascript
{
  success: true,
  data: {
    items: [ 
      {
        _id: string,
        petCode: string,
        name: string,
        species: string,
        breed: string,
        gender: string,
        age: number,
        ageUnit: string,
        price: number,
        discountPrice?: number,
        status: string,
        images: [ /* URL array */ ],
        createdAt: ISO string
      }
    ],
    pagination: {
      current: number,
      total: number,
      pages: number
    }
  }
}
```

---

## Required Backend Endpoints

### 1. Dashboard Stats
```javascript
// GET /petshop/manager/dashboard/stats
// Returns aggregated stats for the manager's store
```

**Implementation Notes:**
- Should aggregate data from PetInventoryItem and PetStock collections
- Count by status
- Calculate revenue from sold items
- Get recent activities from PetChangeLog

### 2. Inventory Management
```javascript
// GET /petshop/manager/inventory - List pets
// POST /petshop/manager/inventory - Create pet (used internally)
// GET /petshop/manager/inventory/:id - Get pet details
// PUT /petshop/manager/inventory/:id - Update pet
// DELETE /petshop/manager/inventory/:id - Delete pet
// PATCH /petshop/manager/inventory/:id/status - Change status
```

**Status Values:**
- `pending_images` - Needs image upload
- `available_for_sale` - Ready to sell
- `reserved` - Reserved by customer
- `sold` - Already sold
- `returned` - Returned by customer

### 3. Bulk Operations
```javascript
// PATCH /petshop/manager/inventory/bulk/status
// Request: { ids: [string], status: string }
// Response: { success: boolean, updated: number }

// DELETE /petshop/manager/inventory/bulk
// Request: { ids: [string] }
// Response: { success: boolean, deleted: number }
```

---

## Navigation Flow

### From Wizard
```
Wizard Complete
  ↓
/petshop/manager/wizard/submit (POST)
  ↓
Backend creates stock + pets
  ↓
Frontend redirects to /petshop/manager/inventory
```

### From Dashboard
```
Dashboard Menu Options:
├─ Add Pets → /petshop/manager/wizard
├─ Manage Inventory → /petshop/manager/inventory
├─ Add Stock → /petshop/manager/stocks
├─ View Reports → /petshop/manager/reports
└─ Manage Orders → /petshop/manager/orders
```

---

## Testing Wizard Integration

### Test Scenario: Complete Wizard Flow

```
1. Start: http://localhost:5173/petshop/manager/wizard
2. Step 1: Fill basic info
   - Stock Name: "Golden Retriever Batch 1"
   - Age: 3 months
   - Color: Golden
   - Size: Medium
3. Step 2: Select classification
   - Category: Dogs
   - Species: Canis familiaris
   - Breed: Golden Retriever
4. Step 3: Set pricing
   - Price: ₹50,000
   - Discount: ₹45,000
5. Step 4: Gender & Images
   - Males: 3
   - Females: 2
   - Upload images for each
6. Step 5: Review & Submit
   - Verify all data
   - Click Submit
   - Should show: "Stock created! 5 pets generated"
   - Should redirect to inventory
7. Inventory Check:
   - Should see 5 new pets (3 male, 2 female)
   - All with code "GoldenRetriever..."
   - Status: "available_for_sale"
   - Gender properly assigned
```

---

## Quick Fix Checklist

### Priority 1: Get Wizard Working
- [x] ✅ Create wizardController.js
- [x] ✅ Add wizard routes
- [x] ✅ Fix StepReviewImproved.jsx
- [x] ✅ Fix all wizard steps
- [ ] Test complete flow end-to-end
- [ ] Verify pet generation works
- [ ] Check Cloudinary upload

### Priority 2: Dashboard Stats
- [ ] Verify `/petshop/manager/dashboard/stats` endpoint exists
- [ ] Create if missing (aggregates inventory stats)
- [ ] Test dashboard loads without errors
- [ ] Verify stats display correctly

### Priority 3: Inventory Display
- [ ] Verify `/petshop/manager/inventory` endpoint
- [ ] Test listing loads with pagination
- [ ] Test filtering by status
- [ ] Test search functionality
- [ ] Verify generated pets appear

### Priority 4: Polish
- [ ] Add error boundaries
- [ ] Improve loading states
- [ ] Add success notifications
- [ ] Fix any UI glitches
- [ ] Performance optimization

---

## Example: Creating Test Data via Wizard

### Using Browser Console
```javascript
// Set wizard data directly
const wizardData = {
  basic: {
    stockName: "Test Golden Retrievers",
    age: 2,
    ageUnit: "months",
    color: "Golden",
    size: "Medium"
  },
  classification: {
    categoryId: "63a1b2c3d4e5f6g7h8i9j0k1",  // Get from API
    categoryName: "Dogs",
    speciesId: "63a1b2c3d4e5f6g7h8i9j0k2",  // Get from API
    speciesName: "Canis familiaris",
    breedId: "63a1b2c3d4e5f6g7h8i9j0k3",   // Get from API
    breedName: "Golden Retriever"
  },
  pricing: {
    price: 50000,
    discountPrice: 45000,
    tags: ["purebred", "vaccinated"]
  },
  gender: {
    maleCount: 3,
    femaleCount: 2,
    maleImages: [],  // Can be empty for testing
    femaleImages: []
  }
};

localStorage.setItem('petshop_wizard', JSON.stringify(wizardData));
```

Then navigate to review step and submit.

---

## Debugging Tips

### Check Backend Logs
```bash
# Watch backend logs for errors
npm run dev  # or your backend start command

# Look for:
# - Image upload errors
# - Database errors
# - Missing permissions
```

### Check Browser Console
```javascript
// View wizard data
JSON.parse(localStorage.getItem('petshop_wizard'))

// Monitor API calls
// Open DevTools → Network tab
// Filter for petshop
```

### Check Network Requests
1. Open DevTools → Network tab
2. Navigate through wizard steps
3. Look for failed requests
4. Check response status and error messages

### Reset Wizard Data
```javascript
localStorage.removeItem('petshop_wizard')
// Then refresh and start fresh
```

---

## Known Issues & Workarounds

### Issue: Images not uploading
**Workaround:** Skip images in Step 4 (optional field) and test basic flow first

### Issue: Pets not generating
**Solution:** 
- Verify maleCount + femaleCount > 0
- Check database connection
- Check PetStock and PetInventoryItem models exist

### Issue: Stock name validation
**Note:** StepBasicInfoImproved now requires stockName. All steps validate before proceeding.

### Issue: localStorage cleared on refresh
**Expected behavior:** Wizard data only persists during session. User must start over after page refresh.

---

## Success Criteria

Wizard + Inventory integration is complete when:

✅ User can complete 5-step wizard
✅ Clicking submit successfully creates stock
✅ User sees "Stock created! N pets generated" message
✅ User is redirected to inventory page
✅ Generated pets appear in inventory listing
✅ Each pet has correct gender and price
✅ All pets linked to parent stock
✅ Dashboard stats update to reflect new pets
✅ Images (if uploaded) display correctly
✅ No console errors

---

## Next Steps After Fixes

1. **Dashboard Enhancements**
   - Add revenue charts
   - Add top selling pets
   - Add recent orders list
   - Add quick stats

2. **Inventory Enhancements**
   - Bulk edit pricing
   - Bulk status change
   - Export to CSV
   - Advanced filtering

3. **Reporting**
   - Sales reports
   - Inventory reports
   - Revenue analysis
   - Gender distribution stats

4. **Performance**
   - Virtualization for large lists
   - Caching API responses
   - Image optimization
   - Database indexing

---


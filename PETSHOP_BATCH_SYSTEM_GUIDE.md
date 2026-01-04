# PetShop Batch System Implementation - Quick Start Guide

## 📋 What Was Built

A **batch-first PetShop system** where petshops create and manage batches (groups of animals) instead of individual items. Users browse batches, select gender preferences, and reserve specific pets through a guided wizard.

---

## 🗂️ Files Created/Modified

### Backend

#### New Models
- **`backend/modules/petshop/manager/models/PetBatch.js`** (NEW)
  - Mongoose schema for batch management
  - Fields: speciesId, breedId, ageRange, counts (male/female/unknown), samplePets, price, status, availability
  - Methods: reserve(), markSold(), cancelReservation(), publish(), archive()
  - Virtuals: availableByGender, isSoldOut, soldPercentage

#### Modified Models
- **`backend/modules/petshop/manager/models/PetInventoryItem.js`** (MODIFIED)
  - Added fields: batchId, reservedBy, reservedAt, reservationExpiresAt, confirmedBy, confirmedAt

#### Migration & Scripts
- **`backend/scripts/migrateToPetBatches.js`** (NEW)
  - Converts existing PetStock + inventory items into PetBatches
  - Groups items by species/breed/stock
  - Usage: `node backend/scripts/migrateToPetBatches.js`

#### Controllers
- **`backend/modules/petshop/manager/controllers/batchController.js`** (NEW)
  - Public: listBatches, getBatchDetails, getBatchInventory, reservePetFromBatch
  - Manager: createBatch, updateBatch, publishBatch, archiveBatch, confirmReservation, releaseReservation, markPetAsSold

#### Routes
- **`backend/modules/petshop/manager/routes/batchRoutes.js`** (NEW)
  - Endpoints for batch CRUD and reservation flow
- **`backend/modules/petshop/manager/routes/petshopManagerRoutes.js`** (MODIFIED)
  - Integrated batch routes with manager authentication

### Frontend

#### New Components
- **`frontend/src/pages/User/PetShop/components/BatchCard.jsx`** (NEW)
  - Card component displaying batch summary (species, breed, age, counts, price, availability %)
  
- **`frontend/src/pages/User/PetShop/components/BatchList.jsx`** (NEW)
  - List view with filters (species, breed, category, search)
  - Pagination, sorting, and active filter chips
  
- **`frontend/src/pages/User/PetShop/components/BatchDetails.jsx`** (NEW)
  - Multi-step wizard:
    - Step 1: View batch details (gallery, info, gender distribution)
    - Step 2: Select gender preference (male/female/any)
    - Step 3: Choose specific pet from filtered list
    - Step 4: Confirmation with TTL notification

---

## 🚀 Quickstart

### 1. Run Database Migration

```bash
cd backend
node scripts/migrateToPetBatches.js
```

**Output:**
- Creates PetBatch documents from existing PetStock + inventory items
- Links PetInventoryItems to batches via `batchId`
- Prints migration statistics

### 2. API Endpoints Available

**Public (no auth):**
```
GET    /api/petshop/manager/batches                    # List batches
GET    /api/petshop/manager/batches/:id                # Get batch details
GET    /api/petshop/manager/batches/:id/inventory      # List pets in batch
```

**User (auth required):**
```
POST   /api/petshop/manager/batches/:id/reserve        # Reserve a pet from batch
       Body: { gender: 'male'|'female'|'any' }
```

**Manager (auth + petshop_manager role):**
```
POST   /api/petshop/manager/batches                    # Create batch
PUT    /api/petshop/manager/batches/:id                # Update batch
POST   /api/petshop/manager/batches/:id/publish        # Publish batch
POST   /api/petshop/manager/batches/:id/archive        # Archive batch
POST   /api/petshop/manager/batches/:id/confirm-reservation/:petId  # Accept reservation
POST   /api/petshop/manager/batches/:id/release-reservation/:petId  # Reject reservation
POST   /api/petshop/manager/batches/:id/mark-sold/:petId           # Mark sold after payment
```

### 3. Integrate Components into Dashboard

In your user PetShop dashboard, import and use:

```jsx
import BatchList from './components/BatchList';

// In your dashboard JSX:
<BatchList 
  shopId={selectedShopId} 
  onReserve={(batch) => {
    // Handle successful reservation
  }} 
/>
```

---

## 📊 Data Model Overview

### PetBatch Schema

```javascript
{
  shopId: ObjectId,              // Reference to PetShop
  stockId: ObjectId,             // Optional: original PetStock
  category: String,              // e.g., "puppies", "kittens"
  speciesId: ObjectId,           // Reference to Species
  breedId: ObjectId,             // Reference to Breed
  ageRange: {
    min: Number,
    max: Number,
    unit: 'days'|'weeks'|'months'|'years'
  },
  counts: {
    total: Number,
    male: Number,
    female: Number,
    unknown: Number
  },
  availability: {
    available: Number,
    reserved: Number,
    sold: Number
  },
  samplePets: [
    {
      petId: ObjectId,
      name: String,
      petCode: String,
      gender: String,
      age: Number,
      ageUnit: String,
      imageIds: [ObjectId]
    }
  ],
  price: {
    min: Number,
    max: Number,
    basePrice: Number,
    currency: 'INR'
  },
  status: 'draft'|'published'|'sold_out'|'archived',
  images: [ObjectId],
  description: String,
  tags: [String],
  createdBy: ObjectId,
  publishedAt: Date,
  archivedAt: Date
}
```

### PetInventoryItem Extended

Added fields for batch tracking:
- `batchId`: Links to PetBatch
- `reservedBy`, `reservedAt`, `reservationExpiresAt`: Track user reservations
- `confirmedBy`, `confirmedAt`: Track manager confirmation

---

## 🔄 Reservation Flow (Handshake)

1. **User reserves from batch:**
   - Selects gender preference → Views gender-filtered pets → Selects specific pet
   - System marks pet as `reserved` (TTL: 15 minutes)
   - Updates batch `availability.reserved` counter

2. **Manager notifies (TODO - websocket/polling):**
   - Backend endpoint `/manager/reservations` shows pending
   - Manager can confirm or release reservation

3. **On manager confirmation:**
   - Pet status → `reserved_confirmed`
   - User proceeds to payment

4. **After payment:**
   - Pet status → `sold`
   - Batch `availability.sold` counter increases
   - If all sold → batch status → `sold_out`

5. **Timeout fallback:**
   - If manager doesn't respond in 15 min → reservation auto-expires
   - Pet status → `available`
   - Batch availability restored

---

## 📝 Next Steps (Remaining Tasks)

### Task 5: Purchase Wizard & Manager Handshake
- [ ] Create reservation notification system (websocket or polling)
- [ ] Build manager dashboard showing pending reservations
- [ ] Add payment integration endpoint
- [ ] Implement TTL auto-release logic

### Task 6: Testing & QA
- [ ] Unit tests for PetBatch model methods
- [ ] Integration tests for batch CRUD endpoints
- [ ] UI tests for wizard flow
- [ ] E2E test for full reservation → payment flow
- [ ] Performance test for large batch listings (1000+ items)

### Task 7: Documentation & Rollout
- [ ] Update API docs with batch endpoints
- [ ] Create user guide with screenshots
- [ ] Write rollout plan with feature flag
- [ ] Add monitoring/logging for batch operations
- [ ] Create operator runbook for troubleshooting

---

## 🧪 Testing the System

### 1. Create a Test Batch (Manager)

```bash
curl -X POST http://localhost:5000/api/petshop/manager/batches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shopId": "shop_id",
    "speciesId": "species_id",
    "breedId": "breed_id",
    "ageRange": { "min": 8, "max": 12, "unit": "weeks" },
    "counts": { "total": 10, "male": 6, "female": 4, "unknown": 0 },
    "price": { "min": 15000, "max": 20000, "currency": "INR" },
    "category": "puppies"
  }'
```

### 2. Publish Batch

```bash
curl -X POST http://localhost:5000/api/petshop/manager/batches/:id/publish \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### 3. List Batches (User)

```bash
curl http://localhost:5000/api/petshop/manager/batches?status=published&limit=10
```

### 4. Reserve Pet (User)

```bash
curl -X POST http://localhost:5000/api/petshop/manager/batches/:id/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{ "gender": "male" }'
```

---

## 🔧 Configuration & Environment

Batch system uses existing environment variables. No new config required.

For production rollout, consider adding:
```
BATCH_RESERVATION_TTL_MINUTES=15
BATCH_MAX_SAMPLE_PETS=3
BATCH_ENABLE_FEATURE=true  # Feature flag for gradual rollout
```

---

## 📞 Support & Issues

- **Migration fails:** Check if PetStock items exist and have valid speciesId/breedId
- **Batch not showing:** Ensure batch `status === 'published'`
- **Reservation expires:** TTL is 15 minutes; user must complete payment
- **Manager doesn't receive notification:** Implement websocket in task 5

---

## 🎉 Summary

✅ **Backend:** PetBatch model, migration, controllers, routes  
✅ **Frontend:** Batch components (Card, List, Details) with full wizard  
⏳ **TODO:** Manager notifications, payment integration, tests, docs  

Ready to demo! 🚀

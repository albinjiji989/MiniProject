# 🔍 AI Stock Check - Debugging Guide

## Issue: AI finds breed but says "Not in Stock"

### Possible Causes:
1. **Breed name mismatch** - AI says "German Shepherd" but database has "German Shepherd Dog"
2. **Species name mismatch** - AI says "Dog" but database has "Canine"
3. **No batches in database** - Breed exists but no stock added
4. **Batch not published** - Stock exists but status is not "published"
5. **Availability is 0** - Batch exists but all sold out

---

## 🔧 Debugging Steps

### Step 1: Check What Breeds Are in Database

```bash
# List all breeds
curl http://localhost:5000/api/petshop/user/list-all-breeds

# List breeds for specific species
curl "http://localhost:5000/api/petshop/user/list-all-breeds?speciesName=Dog"
curl "http://localhost:5000/api/petshop/user/list-all-breeds?speciesName=Cat"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "bySpecies": {
      "Dog": [
        { "id": "123", "name": "German Shepherd" },
        { "id": "456", "name": "Labrador" }
      ],
      "Cat": [
        { "id": "789", "name": "Persian" },
        { "id": "012", "name": "Siamese" }
      ]
    }
  }
}
```

### Step 2: Test Stock Check with Exact Names

```bash
# Test with exact breed name from database
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=German%20Shepherd"
```

**Check the backend console logs:**
```
🔍 AI Stock Check Request: { species: 'Dog', breed: 'German Shepherd' }
📊 Species found: { id: '...', name: 'Dog' }
🐕 Breed found: { id: '...', name: 'German Shepherd' }
📦 Batches found: 2
📦 Batch details: [...]
✅ Total stock: 5
```

### Step 3: Check Batch Status

If breed is found but stock is 0, check batches in database:

```javascript
// In MongoDB or via API
db.petbatches.find({
  breedId: ObjectId("your-breed-id"),
  status: "published",
  "availability.available": { $gt: 0 }
})
```

---

## 🛠️ Solutions

### Solution 1: Breed Name Mismatch

**Problem:** AI says "German Shepherd" but database has "German Shepherd Dog"

**Fix:** The improved matching now handles this automatically with 4 strategies:
1. Exact match
2. Contains match
3. Partial word match
4. Reverse match

**Test:**
```bash
# These should all work now:
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=German%20Shepherd"
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=German"
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=Shepherd"
```

### Solution 2: Add Missing Breeds

If breed doesn't exist in database, add it:

**Option A: Via Manager Dashboard**
1. Go to Manager → Petshop → Add Stock
2. Select species
3. Add new breed if not in list

**Option B: Via Database**
```javascript
// Add breed to database
db.breeds.insertOne({
  name: "German Shepherd",
  speciesId: ObjectId("dog-species-id"),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Solution 3: Add Stock for Breed

If breed exists but no stock:

1. Go to Manager → Petshop → Add Stock
2. Select species and breed
3. Add quantity, price, age range
4. Publish the batch

### Solution 4: Publish Existing Batches

If batches exist but not published:

```javascript
// Update batch status
db.petbatches.updateMany(
  { status: "draft" },
  { $set: { status: "published", publishedAt: new Date() } }
)
```

---

## 📊 Common Breed Name Mappings

### Dogs
| AI Name | Database Name | Match Strategy |
|---------|---------------|----------------|
| German Shepherd | German Shepherd Dog | Partial word |
| Golden Retriever | Golden Retriever | Exact |
| Lab | Labrador Retriever | Contains |
| Husky | Siberian Husky | Contains |

### Cats
| AI Name | Database Name | Match Strategy |
|---------|---------------|----------------|
| Persian | Persian Cat | Partial word |
| Siamese | Siamese Cat | Partial word |
| Tabby | Tabby Cat | Exact |

---

## 🧪 Testing Workflow

### 1. Upload Image to AI
```
User uploads dog image
↓
AI identifies: "German Shepherd" (95% confidence)
↓
Frontend calls: /api/petshop/user/check-availability?species=Dog&breed=German%20Shepherd
```

### 2. Backend Processing
```
Backend receives: species=Dog, breed=German Shepherd
↓
Find species: Dog ✅
↓
Find breed: Try 4 matching strategies
  1. Exact: "German Shepherd" ✅
  2. Contains: "German" in name ✅
  3. Partial: "German" OR "Shepherd" ✅
  4. Reverse: name contains "German Shepherd" ✅
↓
Find batches: status=published, available>0
↓
Return: available=true, totalStock=5
```

### 3. Frontend Display
```
✅ Great news! We have 5 German Shepherd(s) available in stock.

Batch 1: 2-4 months, ₹15,000-₹20,000, 2 available
Batch 2: 5-7 months, ₹18,000-₹25,000, 3 available

[View in Petshop] button
```

---

## 🐛 Still Not Working?

### Check Backend Logs

Look for these console logs:
```
🔍 AI Stock Check Request: { species: 'Dog', breed: 'German Shepherd' }
📊 Species found: { id: '...', name: 'Dog' }
🐕 Breed found: { id: '...', name: 'German Shepherd' }
📦 Batches found: 2
✅ Total stock: 5
```

### If Species NOT FOUND:
```
📊 Species found: NOT FOUND
```
**Fix:** Add species to database or check species name

### If Breed NOT FOUND:
```
🐕 Breed found: NOT FOUND
```
**Fix:** Add breed to database or check breed name

### If Batches = 0:
```
📦 Batches found: 0
```
**Fix:** Add stock batches or publish existing ones

---

## 📞 Quick Debug Commands

```bash
# 1. List all breeds
curl http://localhost:5000/api/petshop/user/list-all-breeds

# 2. Check specific breed
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=German%20Shepherd"

# 3. Search breeds
curl "http://localhost:5000/api/petshop/user/search-breeds?query=shepherd"

# 4. Check backend logs
# Look for console.log output in terminal
```

---

## ✅ Verification Checklist

- [ ] Species exists in database
- [ ] Breed exists in database
- [ ] Breed is linked to correct species
- [ ] At least one batch exists for breed
- [ ] Batch status is "published"
- [ ] Batch availability.available > 0
- [ ] Backend logs show breed found
- [ ] Backend logs show batches found
- [ ] Frontend receives available=true

---

## 🎯 Expected Behavior

**When Everything Works:**

1. User uploads dog image
2. AI identifies: "German Shepherd" (95%)
3. Click "Check if Available in Stock"
4. Backend finds breed (even with slight name differences)
5. Backend finds batches with stock
6. Frontend shows: "✅ 5 German Shepherd(s) available"
7. User can click "View in Petshop"

**Status: ✅ Improved matching should fix most issues!**

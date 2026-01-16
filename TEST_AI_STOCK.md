# 🧪 Test AI Stock Check - Quick Debug

## Step 1: Check What's Actually in Database

```bash
# See all published batches with breed names
curl http://localhost:5000/api/petshop/user/debug-batches
```

**This will show you EXACTLY what's in stock:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "batches": [
      {
        "batchId": "123",
        "species": "Dog",
        "breed": "German Shepherd",
        "available": 5,
        "status": "published"
      },
      {
        "batchId": "456",
        "species": "Cat",
        "breed": "Persian",
        "available": 3,
        "status": "published"
      }
    ]
  }
}
```

## Step 2: Test with EXACT Names from Database

Copy the exact breed and species names from Step 1, then test:

```bash
# Example: If database shows "German Shepherd" and "Dog"
curl "http://localhost:5000/api/petshop/user/check-availability?species=Dog&breed=German%20Shepherd"

# Example: If database shows "Persian" and "Cat"
curl "http://localhost:5000/api/petshop/user/check-availability?species=Cat&breed=Persian"
```

## Step 3: Check Backend Console

Look at your backend terminal for these logs:

```
🔍 AI Stock Check Request: { species: 'Dog', breed: 'German Shepherd' }
📊 Species found: { id: '...', name: 'Dog' }
🐕 Breed found: { id: '...', name: 'German Shepherd' }
📦 Batches found: 2
📦 Batch details: [...]
✅ Total stock: 5
```

## Common Issues & Fixes

### Issue 1: Breed name has different case

**Database:** "german shepherd" (lowercase)
**AI:** "German Shepherd" (title case)

**Fix:** Already handled! The code uses case-insensitive matching.

### Issue 2: Breed name has extra words

**Database:** "German Shepherd Dog"
**AI:** "German Shepherd"

**Fix:** Already handled! The code matches partial words.

### Issue 3: No batches found

**Possible reasons:**
1. Batch status is not "published"
2. Availability is 0
3. Breed/Species IDs don't match

**Check:**
```bash
curl http://localhost:5000/api/petshop/user/debug-batches
```

## Quick Fix Commands

### If you see batches but they're not "published":

Go to Manager Dashboard → Petshop → Inventory → Publish the batch

### If availability is 0:

Go to Manager Dashboard → Petshop → Add Stock → Add more pets

### If breed doesn't exist:

Go to Manager Dashboard → Petshop → Add Stock → Add new breed

## Test with Frontend

1. Go to User/Manager Petshop Dashboard
2. Click "AI Pet Identifier" button
3. Upload image
4. Click "Identify Pet Breed"
5. Click "Check if Available in Stock"
6. Check browser console for API calls
7. Check backend console for logs

## Expected Flow

```
User uploads dog image
↓
AI: "German Shepherd" (95%)
↓
Frontend calls: /check-availability?species=Dog&breed=German%20Shepherd
↓
Backend logs:
  🔍 Request: Dog, German Shepherd
  📊 Species: Found
  🐕 Breed: Found
  📦 Batches: 2
  ✅ Stock: 5
↓
Frontend shows: "✅ 5 German Shepherd(s) available"
```

## Still Not Working?

Run these commands and share the output:

```bash
# 1. Show all batches
curl http://localhost:5000/api/petshop/user/debug-batches

# 2. Show all breeds
curl http://localhost:5000/api/petshop/user/list-all-breeds

# 3. Test specific breed (use exact name from step 1)
curl "http://localhost:5000/api/petshop/user/check-availability?species=YOUR_SPECIES&breed=YOUR_BREED"
```

Then check:
- Backend console logs
- Frontend browser console
- Network tab in browser dev tools

**The debug endpoints will show you EXACTLY what's in the database!** 🔍

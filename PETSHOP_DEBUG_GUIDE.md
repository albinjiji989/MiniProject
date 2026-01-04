# PetShop Dashboard 500 Error - Diagnosis & Fix Guide

## Summary of Changes Made

I've enhanced the error handling and logging in both the inventory and stats endpoints to help diagnose the 500 errors you're seeing.

### Files Modified

1. **[backend/modules/petshop/manager/controllers/inventoryController.js](backend/modules/petshop/manager/controllers/inventoryController.js)**
   - Added safe parsing of pagination parameters with max limit of 100
   - Improved parameter validation before database queries
   - Added `.lean()` for better query performance
   - Enhanced error logging with user details and query parameters

2. **[backend/modules/petshop/manager/controllers/storeController.js](backend/modules/petshop/manager/controllers/storeController.js)** (getPetShopStats function)
   - Added detailed console logging to track storeFilter, user info, and query results
   - Wrapped individual database queries in try-catch blocks
   - Added defensive checks for null/undefined values
   - Separated counting logic with individual error handling

## Key Improvements

### Inventory Controller (listInventory)
```javascript
// Before: limit * 1 and parseInt(page)
// After: Safe parsing with bounds checking
const parsedPage = Math.max(1, parseInt(page) || 1);
const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

// Added better error context
console.error('Get inventory error:', error.message);
console.error('User:', req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated');
console.error('Query params:', req.query);
```

### Stats Controller (getPetShopStats)
```javascript
// Now logs:
// - storeFilter being used
// - user role and storeId
// - number of animals/products/services found
// - specific field values

// Each database query wrapped separately:
try { totalAnimals = await PetInventoryItem.countDocuments(...); } catch (err) { ... }
try { availableForSale = await PetInventoryItem.countDocuments(...); } catch (err) { ... }
try { const petShop = await PetShop.findOne(...); } catch (err) { ... }
```

## Troubleshooting Steps

### 1. **IMPORTANT: Restart the Backend Server**
The code changes above require a backend restart to take effect:
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart it
npm start
# Or if using a development setup:
node server.js
```

### 2. **Check the Console Logs**
After restarting, go to the PetShop Dashboard and trigger the requests. Look for logs like:
```
getPetShopStats - storeFilter: { storeId: 'some-id' }
getPetShopStats - user: { id: '...', role: 'petshop_manager', storeId: '...' }
getPetShopStats - returning stats: { totalAnimals: 5, availableForSale: 3, ... }
```

### 3. **Interpret the Logs**

**If you see "returning zeros due to invalid storeFilter":**
- The user doesn't have a proper storeId set
- Check the User collection to verify the manager has storeId populated
- Log back in to refresh the token

**If you see "Error counting totalAnimals:" or "Error fetching PetShop:":**
- There's an issue with the database connection or collections
- Check MongoDB connection is active
- Verify PetInventoryItem and PetShop collections exist

**If you see specific counts like totalAnimals: 5:**
- The endpoint is working! The dashboard should display the stats

### 4. **Frontend Development Tools**
Open your browser's Developer Tools (F12 → Network tab):
1. Reload the dashboard
2. Look for requests to:
   - `GET /api/petshop/manager/inventory?limit=1` or similar
   - `GET /api/petshop/manager/stats`
3. Click on each request to see:
   - Status code (should be 200, not 500)
   - Response body (should show success: true with data)
   - Full URL and parameters being sent

### 5. **Test with cURL or Postman**
If you want to test the endpoints directly:
```bash
# First, get a valid JWT token from login
# Then test the stats endpoint:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/petshop/manager/stats

# Test inventory with pagination:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/petshop/manager/inventory?limit=5"
```

## Common Issues & Solutions

### Issue: Still getting 500 errors
**Solution:**
1. Make sure you restarted the backend server
2. Check backend logs for the new detailed error messages
3. Verify your authentication token is valid (should have a storeId if you're a manager)

### Issue: "returning zeros due to invalid storeFilter"
**Solution:**
1. Your user doesn't have a storeId
2. Ask an admin to create a store for you or update your user record
3. Or sign out and sign back in to refresh your token

### Issue: "Error counting totalAnimals" or database-related errors
**Solution:**
1. Verify MongoDB is running
2. Check that PetInventoryItem collection exists in the database
3. Check the server's MongoDB connection string in `.env` file

## Next Steps

1. **Restart the backend server** (most important)
2. **Check the console logs** when you access the dashboard
3. **Report the specific error message** from the logs if you still get 500 errors
4. **Include the full stack trace** from the console logs in any bug report

## Technical Details

### Changed Query Pattern
- **Before:** Complex Promise.all() with MongoDB aggregation pipelines
- **After:** Sequential simple countDocuments() and findOne() queries with individual error handling

This approach is:
- ✅ More reliable (fails gracefully per operation)
- ✅ Easier to debug (logs show which operation failed)
- ✅ Better for performance (no unnecessary aggregations)
- ✅ More defensive (handles null/undefined values)

### Error Handling Strategy
Each database operation now follows this pattern:
```javascript
try {
  const result = await Model.operation();
  // use result
} catch (err) {
  console.warn('operation failed:', err.message);
  // return safe default value
}
```

This ensures one failed query doesn't crash the entire endpoint.

## File Locations

- Inventory Controller: `backend/modules/petshop/manager/controllers/inventoryController.js` (lines 7-87)
- Stats Controller: `backend/modules/petshop/manager/controllers/storeController.js` (lines 260-330)
- Store Filter Utility: `backend/core/utils/storeFilter.js`
- Route Configuration: `backend/modules/petshop/manager/routes/petshopManagerRoutes.js` (lines 54, 99)

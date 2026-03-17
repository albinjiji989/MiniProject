# Temporary Care Module Reset Script

## Overview
This script completely resets the temporary care module by:
- Finding all pets currently in temporary care (regular, adoption, petshop)
- Returning pets to their original owners
- Removing temporary care banners and "in care" status
- Restoring pet location to "at_owner"
- Cleaning up all temporary care applications, bookings, and payments
- Restoring original pet tags (Adopted/Purchased)

## Usage

### Run the Script
```bash
cd backend
node scripts/resetTemporaryCareModule.js
```

### What the Script Does

#### Step 1: Find Pets in Temporary Care
- Searches for all pets with `temporaryCareStatus.inCare: true`
- Includes regular pets, adoption pets, and petshop pets
- Displays detailed information about each pet and their owner

#### Step 2: Restore Pet Ownership
- Removes temporary care status from all pets
- Sets `temporaryCareStatus.inCare` to `false`
- Clears temporary care application and center references
- Restores pet location to `at_owner`

#### Step 3: Clean Up Temporary Care Data
- Deletes all `CareBooking` records
- Deletes all `TemporaryCare` records
- Deletes all `TemporaryCarePayment` records

#### Step 4: Handle Specific User
- Specifically handles user with email `albinjiji17@gmail.com`
- Processes all their pets (regular, adoption, petshop)
- Cleans up their bookings, payments, and temporary care records

#### Step 5: Generate Report
- Counts remaining pets in temporary care
- Counts remaining temporary care data
- Confirms complete reset or reports any remaining items

## Expected Output

### Successful Reset
```
🎉 TEMPORARY CARE MODULE RESET COMPLETE!
All pets have been returned to their owners.
All temporary care data has been cleaned up.
Pet banners will now show their original status (Adopted/Purchased).

✅ Script completed successfully!
🏠 All pets are now back with their owners
🏷️  Pet cards will show original tags (Adopted/Purchased)
📍 Pet location is set to "at_owner"
```

### What Happens After Reset

1. **Pet Cards in User Dashboard**: Will show original tags like "Adopted" or "Purchased"
2. **Pet Location**: All pets will have `currentLocation: "at_owner"`
3. **Temporary Care Banners**: Removed from all pet cards
4. **Pet Details Pages**: Will show correct ownership and location
5. **Manager Dashboard**: No pets will appear in temporary care

## Database Changes

### Pet Models Updated
- `Pet.temporaryCareStatus.inCare` → `false`
- `Pet.currentLocation` → `"at_owner"`
- `AdoptionPet.temporaryCareStatus.inCare` → `false`
- `PetshopPet.temporaryCareStatus.inCare` → `false` (if exists)

### Records Deleted
- All `CareBooking` documents
- All `TemporaryCare` documents
- All `TemporaryCarePayment` documents

## Safety Features

- **Read-Only First**: Script first identifies all affected pets before making changes
- **Detailed Logging**: Every action is logged with success/failure status
- **Error Handling**: Individual pet failures don't stop the entire process
- **Final Verification**: Reports exact counts of remaining items

## Troubleshooting

### If Script Shows Warnings
- Check the final report for remaining items
- Re-run the script if needed
- Manually verify database state

### Common Issues
- **MongoDB Connection**: Ensure MongoDB is running and accessible
- **Missing Models**: Some pet models may not exist (handled gracefully)
- **Permission Errors**: Ensure proper database write permissions

## Manual Verification

After running the script, you can verify the reset by:

1. **Check User Dashboard**: Visit user dashboard to see pet cards
2. **Check Pet Details**: Verify pet location and status
3. **Check Manager Dashboard**: Should show no pets in temporary care
4. **Database Query**: Run direct MongoDB queries to verify data

```javascript
// Check remaining pets in temporary care
db.pets.countDocuments({"temporaryCareStatus.inCare": true})
db.adoptionpets.countDocuments({"temporaryCareStatus.inCare": true})

// Check remaining temporary care data
db.carebookings.countDocuments({})
db.temporarycares.countDocuments({})
db.temporarycarepayments.countDocuments({})
```

## Notes

- Script is idempotent - safe to run multiple times
- Handles missing petshop models gracefully
- Specifically designed for user `albinjiji17@gmail.com` but works for all users
- Preserves original pet ownership and tags
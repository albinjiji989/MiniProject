# System Management Scripts

This directory contains utility scripts to help manage the system, especially when dealing with large numbers of pets and data cleanup operations.

## Scripts Overview

### 1. `listAdoptionPets.js`
List adoption pets with pagination and filtering.

**Usage:**
```bash
node scripts/listAdoptionPets.js [--page <number>] [--limit <number>] [--status <string>] [--search <string>] [--sort <field>] [--order <asc|desc>]
```

**Examples:**
```bash
# List first 20 available pets
node scripts/listAdoptionPets.js

# List 10 adopted pets, sorted by name
node scripts/listAdoptionPets.js --status adopted --limit 10 --sort name --order asc

# Search for pets with "Buddy" in name
node scripts/listAdoptionPets.js --search Buddy
```

### 2. `verifyAdoptionPet.js`
Verify if a specific pet exists in the database.

**Usage:**
```bash
node scripts/verifyAdoptionPet.js [petId]
```

**Examples:**
```bash
# Check default problematic pet ID
node scripts/verifyAdoptionPet.js

# Check specific pet
node scripts/verifyAdoptionPet.js 68f74a849867d88ea26b5b1b
```

### 3. `checkAdoptionPet.js`
Detailed check of a specific pet with additional information.

**Usage:**
```bash
node scripts/checkAdoptionPet.js <petId>
```

**Examples:**
```bash
# Check specific pet
node scripts/checkAdoptionPet.js 68f74a849867d88ea26b5b1b
```

### 4. `listAdoptionApplications.js`
List adoption applications with pagination and filtering.

**Usage:**
```bash
node scripts/listAdoptionApplications.js [--page <number>] [--limit <number>] [--status <string>] [--sort <field>] [--order <asc|desc>]
```

**Examples:**
```bash
# List first 20 applications
node scripts/listAdoptionApplications.js

# List pending applications
node scripts/listAdoptionApplications.js --status pending
```

### 5. `adoptionSystemOverview.js`
Get a comprehensive overview of the adoption system.

**Usage:**
```bash
node scripts/adoptionSystemOverview.js
```

### 6. `cleanupAdoptionPets.js`
Clean up old or inactive pets (dry run by default).

**Usage:**
```bash
node scripts/cleanupAdoptionPets.js [--dryRun <true|false>] [--days <number>] [--status <string>]
```

**Examples:**
```bash
# Dry run to see what would be cleaned up
node scripts/cleanupAdoptionPets.js --days 60

# Actually clean up pets older than 90 days
node scripts/cleanupAdoptionPets.js --dryRun false --days 90
```

### 7. `bulkAddAdoptionPets.js`
Add multiple pets at once (dry run by default).

**Usage:**
```bash
node scripts/bulkAddAdoptionPets.js [--dryRun <true|false>]
```

**Examples:**
```bash
# Dry run to see what would be added
node scripts/bulkAddAdoptionPets.js --dryRun true

# Actually add pets
node scripts/bulkAddAdoptionPets.js --dryRun false
```

## Common Use Cases

### Checking if a Pet Exists
When users report "Pet not found" errors:
```bash
node scripts/checkAdoptionPet.js <PET_ID_FROM_ERROR>
```

### Listing All Available Pets
To see all pets available for adoption:
```bash
node scripts/listAdoptionPets.js --status available
```

### Finding Pets Without Applications
To identify potentially stale listings:
```bash
node scripts/adoptionSystemOverview.js
```

### Bulk Operations
For adding many pets at once:
```bash
node scripts/bulkAddAdoptionPets.js --dryRun true  # Test first
node scripts/bulkAddAdoptionPets.js --dryRun false # Then execute
```

## PetShop Cleanup Scripts

### 1. `cleanup-petshop-completely.js`
Completely remove all petshop data including inventory items, reservations, shops, wishlists, reviews, orders, and associated images.

**Usage:**
```bash
node cleanup-petshop-completely.js
```

### 2. `cleanup-petshop-data.js`
Remove petshop inventory items and associated images.

**Usage:**
```bash
node cleanup-petshop-data.js
```

### 3. `cleanup-petshop-user-pets.js`
Remove user pets that were created through the petshop module.

**Usage:**
```bash
node cleanup-petshop-user-pets.js
```

### 4. `cleanup-all-petshop-data.js`
Run all petshop cleanup operations in sequence.

**Usage:**
```bash
node cleanup-all-petshop-data.js
```

### 5. `verify-petshop-cleanup.js`
Verify that all petshop data has been removed from the database.

**Usage:**
```bash
node verify-petshop-cleanup.js
```

## Best Practices

1. **Always run dry runs first** - Most scripts default to dry run mode to prevent accidental changes
2. **Use pagination** - When dealing with hundreds of pets, always use pagination
3. **Check dependencies** - Some scripts check for related data (e.g., applications for a pet)
4. **Regular cleanup** - Use cleanup scripts periodically to maintain system health

## Error Handling

All scripts include proper error handling and will:
- Show meaningful error messages
- Close database connections properly
- Provide usage help when needed
- Handle edge cases gracefully

# Pet Registry Migration Scripts

This directory contains scripts to fix and verify PetRegistry entries for pet shop pets.

## Scripts

### 1. fixPetShopRegistry.js
Registers all pet shop inventory items in the centralized PetRegistry and updates ownership information for purchased pets.

**Run with:**
```bash
npm run migrate:petshop-registry
```

### 2. verifyPetShopRegistry.js
Verifies that all pet shop pets are properly registered and can be found in the system.

**Run with:**
```bash
npm run verify:petshop-registry
```

### 3. fixPetShopPetRegistry.js
Comprehensive migration script that fixes PetRegistry inconsistencies for pet shop pets.

**Run with:**
```bash
npm run fix:petshop-pets
```

## What These Scripts Do

### Registration Fixes
- Ensures all PetInventoryItems are registered in PetRegistry
- Sets proper source tracking (petshop)
- Maintains image references
- Sets correct status and location

### Ownership Fixes
- Updates PetRegistry for purchased pets
- Sets currentOwnerId to the buyer
- Updates currentStatus to 'owned'
- Adds ownership history records
- Sets currentLocation to 'at_owner'

### Verification
- Checks registry coverage for inventory items
- Verifies ownership accuracy for purchased pets
- Reports any inconsistencies

## When to Run

Run these scripts:
1. After deploying the pet shop fixes
2. When experiencing "Pet not found" errors
3. During routine maintenance
4. After data migrations

## Safety

All scripts are safe to run multiple times. They use upsert operations and won't duplicate data.

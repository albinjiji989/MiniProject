# Adoption System Management Scripts

This directory contains utility scripts to help manage the adoption system, especially when dealing with large numbers of pets.

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
# 📝 Bulk Add Adoption Pets Script

Automatically add 15 adoption pets with photos, documents (images), and complete compatibility profiles for AI/ML matching.

## 🎯 Features

- ✅ Add 15 pets across 4 breeds (British Shorthair, Persian Cat, German Shepherd, Golden Retriever)
- ✅ Upload photos from image URLs
- ✅ Upload documents (images, not PDFs) from URLs
- ✅ Complete compatibility profile (required for matching wizard & ML algorithms)
- ✅ Set adoption fees, gender, age, weight
- ✅ Auto-generate pet codes
- ✅ No pet names required (as per specification)
- ✅ No size field needed (calculated from compatibility profile)

## 📋 Prerequisites

1. **Manager Account**: You need a manager account created
2. **MongoDB Running**: Database must be accessible
3. **Node.js & Dependencies**: Backend dependencies installed

## 🚀 Quick Start

### Step 1: Update Configuration

Edit `backend/scripts/addAdoptionPets.js`:

```javascript
// Line 17: Set your manager email
const MANAGER_EMAIL = 'manager@example.com';  // UPDATE THIS!
```

### Step 2: Run the Script

```bash
cd backend
node scripts/addAdoptionPets.js
```

### Step 3: Verify

Visit: `http://localhost:5173/manager/adoption/pets`

## 📊 What Gets Added

### Breeds Distribution (15 Total)

1. **British Shorthair (Cat)** - 4 pets
   - Blue-Gray male, 24 months, $250
   - Silver Tabby female, 18 months, $280
   - Cream male, 36 months, $220
   - Black female, 12 months, $300

2. **Persian Cat** - 4 pets
   - White female, 30 months, $350
   - Orange Tabby male, 24 months, $320
   - Silver female, 15 months, $380
   - Chocolate male, 42 months, $290

3. **German Shepherd (Dog)** - 4 pets
   - Black and Tan male, 36 months, $400
   - Sable female, 24 months, $420
   - Black male, 60 months, $350
   - Black and Tan female, 18 months, $450

4. **Golden Retriever (Dog)** - 3 pets
   - Golden male, 30 months, $380
   - Light Golden female, 20 months, $400
   - Dark Golden male, 48 months, $340

## 📸 Photos & Documents

### Photos
All pets include 1-2 high-quality photos from Unsplash:
- Photos are automatically uploaded from URLs
- No local file management needed
- Images are stored in the Image collection

### Documents
Each pet includes 1-2 document images:
- **Documents are images (JPEG), not PDFs**
- Used as vaccination certificates, medical records, etc.
- Automatically uploaded from Unsplash URLs
- Stored in the Document collection

### Using Custom Images

You can replace the URLs in the script:

```javascript
photos: [
  'https://your-image-url.com/photo1.jpg',
  'https://your-image-url.com/photo2.jpg'
],
documents: [
  'https://your-image-url.com/doc1.jpg'  // Images, not PDFs
]
```

## 🔧 Compatibility Profile Coverage

All pets include complete compatibility profiles required for:
- ✅ Matching Wizard (`/manager/adoption/wizard/matching`)
- ✅ K-Means Clustering (Pet Personalities)
- ✅ SVD Collaborative Filtering
- ✅ XGBoost Success Prediction

### Profile Fields Included

```javascript
compatibilityProfile: {
  // Size & Energy
  size: 'small' | 'medium' | 'large',
  energyLevel: 1-5,
  exerciseNeeds: 'minimal' | 'moderate' | 'high' | 'very_high',
  
  // Training
  trainingNeeds: 'low' | 'moderate' | 'high',
  trainedLevel: 'untrained' | 'basic' | 'intermediate' | 'advanced',
  
  // Social Scores (0-10)
  childFriendlyScore: 0-10,
  petFriendlyScore: 0-10,
  strangerFriendlyScore: 0-10,
  
  // Living Requirements
  needsYard: true | false,
  canLiveInApartment: true | false,
  groomingNeeds: 'low' | 'moderate' | 'high',
  estimatedMonthlyCost: 50-300,
  
  // Behavioral
  temperamentTags: ['friendly', 'calm', ...],
  noiseLevel: 'quiet' | 'moderate' | 'vocal',
  canBeLeftAlone: true | false,
  maxHoursAlone: 0-12,
  requiresExperiencedOwner: true | false
}
```

## 📋 Pet Details Included

Each pet entry includes:

```javascript
{
  // BASIC INFO (all required)
  species: 'Cat' | 'Dog',
  breed: 'British Shorthair' | 'Persian Cat' | 'German Shepherd' | 'Golden Retriever',
  gender: 'male' | 'female',
  ageInMonths: 12-60,  // Converted to DOB automatically
  weight: 4-38,  // kg
  color: 'Blue-Gray' | 'Golden' | etc.,
  adoptionFee: 220-450,  // USD
  
  // HEALTH
  vaccinationStatus: 'up_to_date',
  healthHistory: 'Detailed health info...',
  specialNeeds: [],  // Optional array
  
  // MEDIA
  photos: ['url1', 'url2'],  // 1-2 photos
  documents: ['url1', 'url2'],  // 1-2 document images
  
  // COMPATIBILITY (complete profile)
  compatibilityProfile: { ... }  // See above
}
```

## 🔍 Sample Output

```
🚀 Starting bulk pet addition script...

📡 Connecting to MongoDB...
✅ Connected to MongoDB

👤 Looking for manager: manager@example.com...
✅ Found manager: John Doe (manager@example.com)

📋 Adding 15 pets...
════════════════════════════════════════════════════════════

📝 Adding pet: Cat - British Shorthair...
📸 Processing 2 photos...
✅ Uploaded 2 photos
📄 Processing 2 documents...
✅ Uploaded 2 documents
🎉 Successfully added: British Shorthair
   - Species: Cat
   - Breed: British Shorthair
   - Gender: male
   - Age: 24 months
   - Weight: 5.5 kg
   - Adoption Fee: $250
   - Energy Level: 2/5
   - Child Friendly: 8/10
   - Pet Code: BRI12345
   - Photos: 2
   - Documents: 2

... (14 more pets)
════════════════════════════════════════════════════════════

🎉 SUMMARY: Successfully added 15 out of 15 pets!

📊 Added pets:
   1. British Shorthair (Cat) - Code: BRI12345
   2. British Shorthair (Cat) - Code: BRI23456
   3. British Shorthair (Cat) - Code: BRI34567
   4. British Shorthair (Cat) - Code: BRI45678
   5. Persian Cat (Cat) - Code: PER56789
   6. Persian Cat (Cat) - Code: PER67890
   7. Persian Cat (Cat) - Code: PER78901
   8. Persian Cat (Cat) - Code: PER89012
   9. German Shepherd (Dog) - Code: GER90123
   10. German Shepherd (Dog) - Code: GER01234
   11. German Shepherd (Dog) - Code: GER12345
   12. German Shepherd (Dog) - Code: GER23456
   13. Golden Retriever (Dog) - Code: GOL34567
   14. Golden Retriever (Dog) - Code: GOL45678
   15. Golden Retriever (Dog) - Code: GOL56789

✅ Script completed successfully!

💡 Next steps:
   1. Visit http://localhost:5173/manager/adoption/pets to view pets
   2. Users can now see these pets in Smart Matches
   3. Once you have 30+ pets, train K-Means clustering
   4. Generate interactions to train collaborative filtering

👋 Database connection closed
```

## 🚨 Troubleshooting

### Error: Manager not found
```
Solution: Update MANAGER_EMAIL to match existing manager account
Or create manager account first via registration
```

### Error: MongoDB connection failed
```
Solution: Ensure MongoDB is running
Check MONGODB_URI in backend/.env file
Default: mongodb://localhost:27017/petconnect
```

### Photos/Documents not uploading
```
Solution: Verify URLs are accessible (test in browser)
Check internet connection
Ensure Image/Document models exist
```

### Compatibility profile validation error
```
Solution: Check all required fields are filled
Use correct enum values (see templates)
Scores must be within valid ranges
energyLevel: 1-5
Social scores: 0-10
```

## 📈 For ML Training

After adding these 15 pets:

### ✅ Immediate: K-Means Clustering
- **Status**: Ready (need 30+ pets for better results)
- **Action**: Add 15 more pets to reach 30
- **Train**: `POST /api/adoption/ml/clustering/train`

### ⏳ Later: SVD Collaborative Filtering
- **Status**: Need interactions
- **Minimum**: 100 user-pet interactions
- **Action**: Have users view/favorite pets
- **Train**: `POST /api/adoption/ml/collaborative/train`

### ⏳ Later: XGBoost Success Predictor
- **Status**: Need adoption history
- **Minimum**: 50 adoption outcomes
- **Action**: Complete adoptions with feedback
- **Train**: `POST /api/adoption/ml/success-predictor/train`

## 💡 Tips

1. **Run Script Multiple Times**: You can run this script multiple times to add more pets
2. **Update Manager Email**: Change `MANAGER_EMAIL` to your actual manager account
3. **Verify Before Running**: Test with MongoDB running: `mongo petconnect`
4. **Check Results**: Go to manager dashboard to see added pets
5. **ML Training**: Add at least 30 pets total for K-Means clustering

## 📝 Customization

To add more pets, edit the `PETS_TO_ADD` array in the script:

```javascript
const PETS_TO_ADD = [
  {
    species: 'Cat',
    breed: 'British Shorthair',
    gender: 'female',
    ageInMonths: 20,
    weight: 5.0,
    color: 'Blue',
    adoptionFee: 270,
    description: 'Your description here...',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy...',
    specialNeeds: [],
    photos: [
      'https://your-image-url.com/cat1.jpg'
    ],
    documents: [
      'https://your-image-url.com/doc1.jpg'
    ],
    compatibilityProfile: {
      // ... complete profile
    }
  }
  // Add more...
];
```

## ⚡ Quick Commands

```bash
# Run the script
node backend/scripts/addAdoptionPets.js

# Check MongoDB pets count
mongo petconnect --eval "db.adoptionpets.count()"

# View all pet codes
mongo petconnect --eval "db.adoptionpets.find({}, {petCode:1, breed:1, species:1})"

# Delete all pets (CAUTION!)
mongo petconnect --eval "db.adoptionpets.deleteMany({})"
```

## 🔗 Related Documentation

- Main System: `HYBRID_ADOPTION_RECOMMENDATION_SYSTEM.md`
- Testing Guide: `HYBRID_RECOMMENDATION_PHASE5_COMPLETE.md`
- Pet Model: `backend/modules/adoption/manager/models/AdoptionPet.js`
- Matching Wizard: `/manager/adoption/wizard/matching`

## 🎯 Script Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| 15 Pets | ✅ | 4 breeds across cats & dogs |
| No Names | ✅ | Name field left empty |
| Photos | ✅ | 1-2 images from URLs |
| Documents | ✅ | Images (not PDFs) from URLs |
| Compatibility | ✅ | Complete profiles for matching |
| Adoption Fee | ✅ | $220-$450 range |
| Auto DOB | ✅ | Calculated from ageInMonths |
| Pet Codes | ✅ | Auto-generated unique codes |
| Wizard Compatible | ✅ | Works with matching wizard |
| ML Ready | ✅ | Full compatibility profiles |

---

**Made with ❤️ for Pet Adoption AI/ML System**

**Last Updated**: March 3, 2026

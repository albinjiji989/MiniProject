# Smart Pet-Adopter Matching System

## Overview
AI-powered recommendation system that matches users with compatible pets based on lifestyle, living situation, and preferences using content-based filtering algorithms.

## What Was Built

### 1. **Database Schema Updates**

#### User Model Enhancement (`backend/core/models/User.js`)
Added `adoptionProfile` with:
- **Living Situation**: homeType, homeSize, hasYard, yardSize
- **Lifestyle**: activityLevel (1-5), workSchedule, hoursAlonePerDay
- **Experience**: experienceLevel, previousPets
- **Family**: hasChildren, childrenAges, hasOtherPets, otherPetsTypes
- **Budget**: monthlyBudget, maxAdoptionFee
- **Preferences**: preferredSpecies, preferredSize, preferredEnergyLevel
- **Special**: willingToTrainPet, canHandleSpecialNeeds, allergies

#### AdoptionPet Model Enhancement (`backend/modules/adoption/manager/models/AdoptionPet.js`)
Added `compatibilityProfile` with:
- **Size & Energy**: size, energyLevel (1-5), exerciseNeeds
- **Training**: trainingNeeds, trainedLevel
- **Social Compatibility**: childFriendlyScore (0-10), petFriendlyScore (0-10), strangerFriendlyScore (0-10)
- **Living Requirements**: minHomeSize, needsYard, canLiveInApartment
- **Care**: groomingNeeds, estimatedMonthlyCost
- **Behavior**: temperamentTags, noiseLevel, canBeLeftAlone, maxHoursAlone

### 2. **Python AI/ML Service**

#### Matching Engine (`python-ai-ml/modules/adoption/matching_engine.py`)
- **Content-Based Filtering Algorithm**
- **Weighted Scoring System**:
  - Living Space Compatibility: 20%
  - Activity Level Match: 25%
  - Experience Match: 15%
  - Family Safety: 20%
  - Budget Match: 10%
  - Preferences: 10%
- **Match Scoring**: 0-100% with compatibility levels
- **Success Prediction**: Estimates adoption success probability
- **Smart Recommendations**: Top N best matches

#### API Routes (`python-ai-ml/routes/adoption_routes.py`)
- `POST /api/adoption/match/calculate` - Calculate single pet match
- `POST /api/adoption/match/rank` - Rank all pets for user
- `POST /api/adoption/match/top-matches` - Get top N matches
- `GET /api/adoption/health` - Health check

### 3. **Backend Node.js Integration**

#### Matching Service (`backend/modules/adoption/user/services/matchingService.js`)
- Axios client to call Python AI service
- Error handling with fallback

#### Matching Controller (`backend/modules/adoption/user/controllers/matchingController.js`)
- `POST /adoption/user/profile/adoption` - Update user profile
- `GET /adoption/user/profile/adoption` - Get user profile
- `GET /adoption/user/profile/adoption/status` - Profile completion status
- `GET /adoption/user/matches/smart` - Get smart matches
- `GET /adoption/user/matches/pet/:petId` - Calculate pet match

### 4. **Frontend React Components**

#### Adoption Profile Wizard (`frontend/src/pages/User/Adoption/AdoptionProfileWizard.jsx`)
**4-Step Questionnaire**:
1. **Living Situation**: Home type, size, yard
2. **Lifestyle & Experience**: Activity level, work schedule, experience
3. **Family & Pets**: Children, other pets
4. **Budget & Preferences**: Budget, species, size preferences

#### Smart Matches Page (`frontend/src/pages/User/Adoption/SmartMatches.jsx`)
- AI-powered match results
- Match score visualization (0-100%)
- Compatibility reasons displayed
- Warnings for special considerations
- Success probability indicator
- Ranked results (#1, #2, #3 badges)
- Detailed match breakdown dialog

#### Updated Adoption Page (`frontend/src/pages/User/Adoption/Adoption.jsx`)
- "AI Smart Matches" button
- "Complete Profile" button
- Integrated with existing adoption flow

### 5. **Routes Configuration**
- `/user/adoption/profile-wizard` - Profile questionnaire
- `/user/adoption/smart-matches` - View AI matches

## How It Works

### User Flow:
1. **User completes adoption profile** (4-step wizard)
2. **System creates user feature vector** from profile
3. **AI analyzes all available pets** and creates pet feature vectors
4. **Matching algorithm calculates compatibility** using weighted scoring
5. **Results ranked by score** with detailed reasoning
6. **User views top matches** with visual indicators
7. **User applies to adopt** best match

### Matching Algorithm Example:
```python
Living Space: 18/20 points
  ✓ Your house provides great space
  ✓ You have a yard - perfect for Max!

Activity Match: 23/25 points
  ✓ Perfect activity match - you're both level 4
  ✓ Your schedule works well for Max

Experience: 15/15 points
  ✓ Your experience level is perfect for this pet

Family Safety: 20/20 points
  ✓ Excellent with children!
  ✓ Gets along great with other pets

Budget: 10/10 points
  ✓ Adoption fee ($150) within budget
  ✓ Monthly costs (~$120) fit your budget

Preferences: 10/10 points
  ✓ Matches your species preference
  ✓ Medium size as preferred

Overall Score: 96% - Excellent Match!
Success Probability: 92%
```

## Technical Architecture

```
Frontend (React)
    ↓ User completes profile
Backend (Node.js)
    ↓ Saves to MongoDB
    ↓ Fetches available pets
    ↓ Calls Python AI service
Python AI/ML (Flask)
    ↓ Matching engine processes
    ↓ Returns ranked results
Backend (Node.js)
    ↓ Returns to frontend
Frontend (React)
    ↓ Displays smart matches
```

## API Endpoints

### Node.js Backend
```
POST   /adoption/user/profile/adoption          # Update profile
GET    /adoption/user/profile/adoption          # Get profile
GET    /adoption/user/profile/adoption/status   # Profile status
GET    /adoption/user/matches/smart             # Get matches
GET    /adoption/user/matches/pet/:petId        # Single pet match
```

### Python AI Service
```
POST   /api/adoption/match/calculate      # Calculate match
POST   /api/adoption/match/rank           # Rank pets
POST   /api/adoption/match/top-matches    # Top N matches
GET    /api/adoption/health               # Health check
```

## Benefits

### For Users:
- ✅ Saves time browsing
- ✅ Personalized recommendations
- ✅ Clear compatibility reasons
- ✅ Informed decisions
- ✅ Higher satisfaction

### For Managers:
- ✅ Faster adoptions
- ✅ Reduced returns (better matches)
- ✅ Data insights
- ✅ Quality applications

### For Business:
- ✅ 30-40% adoption rate increase (expected)
- ✅ Lower rehoming costs
- ✅ Better reputation
- ✅ Competitive advantage

## Future Enhancements

1. **Collaborative Filtering**: Learn from similar users' adoption history
2. **ML Model Training**: Use historical data to improve predictions
3. **Photo Matching**: Match users to pets based on appearance preferences
4. **Chatbot Integration**: Answer adoption questions 24/7
5. **Timeline Prediction**: Estimate when pets will be adopted
6. **Post-Adoption Tracking**: Monitor long-term success

## Testing

### Start Services:
```bash
# Terminal 1: Python AI service
cd python-ai-ml
python app.py

# Terminal 2: Node.js backend
cd backend
npm start

# Terminal 3: React frontend
cd frontend
npm run dev
```

### Test Flow:
1. Login as user
2. Navigate to `/user/adoption/profile-wizard`
3. Complete 4-step profile
4. Click "Find My Matches"
5. View smart matches with scores
6. Click "Details" to see full breakdown
7. Apply to adopt

## Technology Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express, MongoDB
- **AI/ML**: Python, Flask, NumPy
- **Algorithms**: Content-based filtering, Weighted scoring
- **Data**: User profiles, Pet profiles, Historical adoptions (future)

---

**Built with ❤️ using AI-powered pet-human matching technology**

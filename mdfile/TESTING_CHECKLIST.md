# 🧪 HYBRID ML SYSTEM - TESTING CHECKLIST

## Quick Start: Test Your Implementation

### ✅ **Step 1: Verify Files Created**

Check that all files exist:

**Python ML Files:**
- [ ] `python-ai-ml/modules/adoption/collaborative_filter.py`
- [ ] `python-ai-ml/modules/adoption/success_predictor.py`
- [ ] `python-ai-ml/modules/adoption/pet_clustering.py`
- [ ] `python-ai-ml/modules/adoption/hybrid_recommender.py`
- [ ] `python-ai-ml/routes/adoption_routes.py` (updated)

**Backend Files:**
- [ ] `backend/modules/adoption/models/UserPetInteraction.js`
- [ ] `backend/modules/adoption/models/ModelPerformance.js`
- [ ] `backend/modules/adoption/models/index.js`
- [ ] `backend/modules/adoption/manager/models/AdoptionPet.js` (updated)
- [ ] `backend/modules/adoption/user/controllers/trackingController.js`
- [ ] `backend/modules/adoption/user/services/mlService.js`
- [ ] `backend/modules/adoption/user/controllers/matchingController.js` (updated)
- [ ] `backend/modules/adoption/user/routes/adoptionUserRoutes.js` (updated)

---

### ✅ **Step 2: Install Python Dependencies**

```bash
cd python-ai-ml

# Install new dependencies
pip install scikit-surprise==1.1.3
pip install xgboost==2.0.0

# Or install all requirements
pip install -r requirements.txt
```

Update `requirements.txt` if needed:
```txt
scikit-surprise==1.1.3
xgboost==2.0.0
scikit-learn==1.3.0
pandas==2.0.0
numpy==1.24.0
joblib==1.3.0
```

---

### ✅ **Step 3: Start Services**

**Terminal 1 - Python ML Service:**
```bash
cd python-ai-ml
python app.py
# Should start on http://localhost:5001
```

**Terminal 2 - Node.js Backend:**
```bash
cd backend
npm start
# Should start on http://localhost:3000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Should start on http://localhost:5173
```

---

### ✅ **Step 4: Test ML Endpoints (Python)**

**4.1 Health Check**
```bash
curl http://localhost:5001/api/adoption/health
```

Expected response:
```json
{
  "success": true,
  "message": "Adoption matching service is running"
}
```

**4.2 Test Content-Based Matching (Baseline)**
```bash
curl -X POST http://localhost:5001/api/adoption/match/top-matches \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": {
      "activityLevel": 3,
      "preferredSize": "medium",
      "experienceLevel": "intermediate",
      "hasChildren": true,
      "hasOtherPets": false,
      "livingSpace": "house_small",
      "availableTime": "moderate"
    },
    "pets": [/* array of pets */],
    "topN": 5
  }'
```

**4.3 Get ML Model Stats**
```bash
curl http://localhost:5001/api/adoption/ml/models/stats
```

Expected response (before training):
```json
{
  "success": true,
  "data": {
    "algorithm": "Hybrid Ensemble",
    "algorithm_availability": {
      "content": true,
      "collaborative": false,
      "success": false,
      "clustering": false
    }
  }
}
```

---

### ✅ **Step 5: Test Backend Integration**

**5.1 Test Hybrid Recommendations**
```bash
# First, get auth token by logging in
TOKEN="your_jwt_token_here"

curl http://localhost:3000/api/adoption/user/matches/hybrid?topN=10&algorithm=hybrid \
  -H "Authorization: Bearer $TOKEN"
```

**5.2 Test ML Stats**
```bash
curl http://localhost:3000/api/adoption/user/ml/stats \
  -H "Authorization: Bearer $TOKEN"
```

**5.3 Track an Interaction**
```bash
curl -X POST http://localhost:3000/api/adoption/user/interaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "petId": "pet_id_here",
    "interactionType": "viewed"
  }'
```

---

### ✅ **Step 6: Train ML Models (Need Data First)**

**6.1 Collect Interaction Data (1-2 weeks)**
- Users viewing pets
- Favoriting pets
- Applying for adoption
- Completing adoptions

**6.2 Train Collaborative Filter (Need 100+ interactions)**
```bash
curl -X POST http://localhost:5001/api/adoption/ml/collaborative/train \
  -H "Content-Type: application/json" \
  -d '{
    "interactions": [
      {
        "userId": "user1",
        "petId": "pet1",
        "interactionType": "viewed",
        "timestamp": "2024-01-01T10:00:00Z"
      }
      // ... more interactions
    ]
  }'
```

**6.3 Train Success Predictor (Need 50+ adoptions with outcomes)**
```bash
curl -X POST http://localhost:5001/api/adoption/ml/success-predictor/train \
  -H "Content-Type: application/json" \
  -d '{
    "adoptions": [
      {
        "userId": "user1",
        "userProfile": {/* ... */},
        "petId": "pet1",
        "petProfile": {/* ... */},
        "outcome": true  // or false if adoption failed
      }
      // ... more adoptions
    ]
  }'
```

**6.4 Train K-Means Clustering (Need 30+ pets)**
```bash
curl -X POST http://localhost:5001/api/adoption/ml/clustering/train \
  -H "Content-Type: application/json" \
  -d '{
    "pets": [
      {
        "_id": "pet1",
        "name": "Max",
        "compatibilityProfile": {
          "energyLevel": 4,
          "size": "medium",
          "trainedLevel": "basic",
          "childFriendlyScore": 8,
          "petFriendlyScore": 6,
          "noiseLevel": "moderate",
          "exerciseNeeds": "high",
          "groomingNeeds": "moderate"
        }
      }
      // ... more pets
    ]
  }'
```

---

### ✅ **Step 7: Test Hybrid Recommendations (After Training)**

**7.1 Get Hybrid Recommendations**
```bash
curl -X POST http://localhost:5001/api/adoption/ml/recommend/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userProfile": {
      "activityLevel": 3,
      "preferredSize": "medium",
      "experienceLevel": "intermediate",
      "hasChildren": true,
      "hasOtherPets": false,
      "livingSpace": "house_small",
      "availableTime": "moderate"
    },
    "availablePets": [/* pet array */],
    "topN": 10,
    "algorithm": "hybrid"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "petId": "pet123",
        "petName": "Max",
        "hybridScore": 87.5,
        "confidence": 92.3,
        "algorithmScores": {
          "content": 85,
          "collaborative": 90,
          "success": 88,
          "clustering": 87
        },
        "explanations": [
          "Excellent profile match (85%)",
          "Highly rated by similar users (4.5/5)",
          "Very high success probability (88%)",
          "Perfect match for Family Friends cluster"
        ],
        "successProbability": 0.88,
        "clusterName": "Family Friends"
      }
    ]
  }
}
```

**7.2 Compare All Algorithms**
```bash
curl -X POST http://localhost:5001/api/adoption/ml/compare-algorithms \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userProfile": {/* ... */},
    "availablePets": [/* ... */],
    "topN": 10
  }'
```

Expected response includes:
- Recommendations from each algorithm
- Agreement metrics (Jaccard similarity)
- Pairwise comparison

---

### ✅ **Step 8: Frontend Testing**

**Option 1: Quick Test (Modify Existing)**

Open `frontend/src/pages/adoption/PetListing.jsx` (or similar):

```javascript
// Change from:
const response = await axios.get('/api/adoption/user/matches/smart');

// To:
const response = await axios.get('/api/adoption/user/matches/hybrid', {
  params: { topN: 10, algorithm: 'hybrid' }
});

// Update state to use response.data.data.recommendations
```

**Option 2: Add Algorithm Selector**

```jsx
const [algorithm, setAlgorithm] = useState('hybrid');

<select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
  <option value="hybrid">🔬 Hybrid (All Algorithms)</option>
  <option value="content">📊 Content-Based</option>
  <option value="collaborative">👥 Collaborative (SVD)</option>
  <option value="success">🎯 Success Predictor (XGBoost)</option>
  <option value="clustering">🏷️ Clustering (K-Means)</option>
</select>

// Fetch with selected algorithm
const response = await axios.get('/api/adoption/user/matches/hybrid', {
  params: { topN: 10, algorithm }
});
```

---

### ✅ **Step 9: Verify Everything Works**

**Checklist:**

- [ ] Python ML service starts without errors
- [ ] Backend connects to Python service
- [ ] Health check passes
- [ ] Content-based matching works (no training needed)
- [ ] Hybrid endpoint returns results (falls back to content before training)
- [ ] Interaction tracking saves to database
- [ ] Model stats endpoint works
- [ ] After training: All 4 algorithms available
- [ ] After training: Hybrid recommendations include all scores
- [ ] Frontend displays recommendations
- [ ] Algorithm comparison works

---

### ✅ **Step 10: Research Demonstration**

**For IEEE Paper / Seminar:**

1. **Collect Metrics:**
   ```bash
   # Get model performance
   curl http://localhost:5001/api/adoption/ml/models/stats
   
   # Get cluster info
   curl http://localhost:5001/api/adoption/ml/clusters/info
   ```

2. **Run Algorithm Comparison:**
   - Use compare-algorithms endpoint
   - Generate comparison tables
   - Calculate Jaccard similarity

3. **Create Visualizations:**
   - Algorithm score bar charts
   - Cluster scatter plots (PCA)
   - Feature importance graphs (XGBoost)
   - Confusion matrix heatmaps

4. **Prepare Demo:**
   - Show single algorithm results
   - Show hybrid ensemble results
   - Explain score breakdown
   - Show confidence metric

---

## 🐛 Common Issues & Solutions

### **Issue 1: ML Service Not Available**
```
Error: ML service unavailable
```

**Solution:**
1. Check Python service is running on port 5001
2. Check `AIML_API_URL` environment variable in backend
3. Test manually: `curl http://localhost:5001/api/adoption/health`

### **Issue 2: Models Not Trained**
```json
{
  "algorithm_availability": {
    "collaborative": false,
    "success": false,
    "clustering": false
  }
}
```

**Solution:**
- Models start as untrained
- System falls back to content-based (always available)
- Train models once you have data (see Step 6)

### **Issue 3: Not Enough Training Data**
```
Error: Need at least 100 interactions for training
```

**Solution:**
- Wait for real user interactions, OR
- Generate synthetic data for testing:
  ```javascript
  // Create test interactions
  const testInteractions = [];
  for (let i = 0; i < 100; i++) {
    testInteractions.push({
      userId: `user${i % 20}`,
      petId: `pet${i % 30}`,
      interactionType: ['viewed', 'favorited', 'applied'][i % 3],
      timestamp: new Date()
    });
  }
  ```

### **Issue 4: Import Errors in Python**
```
ModuleNotFoundError: No module named 'surprise'
```

**Solution:**
```bash
pip install scikit-surprise
pip install xgboost
```

### **Issue 5: Memory Error During Training**
```
MemoryError: Unable to allocate array
```

**Solution:**
- Reduce training data size
- Lower XGBoost parameters (n_estimators=50)
- Lower K-Means max clusters (k=4)

---

## 📊 Success Metrics

**Your system is working correctly if:**

✅ All 4 algorithm files run without import errors  
✅ Flask API returns 200 OK for all endpoints  
✅ Backend successfully calls Python service  
✅ Hybrid recommendations work (even with fallback)  
✅ Interactions are tracked in MongoDB  
✅ After training: All 4 algorithm scores appear  
✅ Hybrid score is weighted combination of individual scores  
✅ Explanations are generated for each recommendation  

---

## 🎯 Next Actions

1. **Immediate:** Test Python ML service startup
2. **Day 1:** Test backend integration and interaction tracking
3. **Week 1-2:** Collect real interaction data
4. **Week 2:** Train all 4 models
5. **Week 3:** Frontend integration and algorithm comparison
6. **Week 4:** Write research paper / prepare seminar

---

## 📞 Need Help?

**Check these files for documentation:**
1. `HYBRID_ADOPTION_RECOMMENDATION_SYSTEM.md` - Full implementation guide
2. `HYBRID_SYSTEM_IMPLEMENTATION_COMPLETE.md` - Completion summary
3. `TESTING_CHECKLIST.md` - This file

**Verify implementation:**
```bash
# Count lines of code
find backend/modules/adoption python-ai-ml/modules/adoption -name "*.js" -o -name "*.py" | xargs wc -l

# Check model files
ls python-ai-ml/modules/adoption/

# Check backend files
ls backend/modules/adoption/user/services/
```

---

**Good luck with your research! 🚀🎓**

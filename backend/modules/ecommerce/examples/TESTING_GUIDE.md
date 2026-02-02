# 🧪 Testing the XAI Recommendation System

This guide provides step-by-step instructions for testing the XAI Recommendation System.

## Prerequisites

1. MongoDB is running
2. Backend server is running on port 5000
3. You have a user account with JWT token
4. Some products exist in the database
5. User has added at least one pet to their profile

## Quick Start Testing

### 1. Install Dependencies

```bash
cd backend/modules/ecommerce/examples
npm install axios
```

### 2. Update Configuration

Edit `xai-recommendation-examples.js`:
```javascript
const AUTH_TOKEN = 'YOUR_ACTUAL_JWT_TOKEN';
```

### 3. Run Examples

```bash
node xai-recommendation-examples.js
```

## Manual API Testing with cURL

### Test 1: Get Recommendations

```bash
curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 5,
  "recommendations": [
    {
      "product": { /* product details */ },
      "recommendationScore": 87.5,
      "explanation": {
        "primary": "Perfect match for your Golden Retriever",
        "secondary": ["4.5★ rating", "128 reviews"],
        "confidence": "very_high"
      },
      "featureImportance": { /* feature breakdown */ }
    }
  ]
}
```

### Test 2: Track Product View

```bash
curl -X POST "http://localhost:5000/api/ecommerce/products/PRODUCT_ID/view" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "category",
    "viewDuration": 45,
    "sessionId": "test-session-123"
  }'
```

### Test 3: Track Recommendation Interaction

```bash
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/track" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clicked",
    "sessionId": "test-session-123"
  }'
```

### Test 4: Get Analytics

```bash
curl -X GET "http://localhost:5000/api/ecommerce/recommendations/analytics?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 5: Explain Weights (Public - No Auth Required)

```bash
curl -X GET "http://localhost:5000/api/ecommerce/recommendations/explain-weights"
```

## Testing Scenarios

### Scenario 1: New User with Pet

**Setup:**
1. Create new user account
2. Add a pet (e.g., Golden Retriever)
3. No purchase history
4. No viewing history

**Expected Behavior:**
- Recommendations should prioritize pet match (high contribution)
- Popularity should be second highest contributor
- Purchase and viewing history should be 0%
- Explanation should mention pet type/breed

**Test Commands:**
```bash
# Get recommendations
curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify pet match contribution is highest
# Check explanation mentions your pet
```

### Scenario 2: User with Purchase History

**Setup:**
1. User has purchased 3+ products
2. Products are in specific categories (e.g., Dog Food, Dog Toys)
3. User has a dog

**Expected Behavior:**
- Purchase history should have significant contribution (15-25%)
- Recommendations should favor previously purchased categories
- Explanation should mention "Based on your previous purchases"

**Test Commands:**
```bash
# Get recommendations
curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check feature importance shows purchase history contribution
# Verify recommended products are in similar categories
```

### Scenario 3: User with Viewing History

**Setup:**
1. Track 5-10 product views
2. Focus on specific product types
3. Include recent views (within 7 days)

**Test Commands:**
```bash
# Track multiple product views
for i in {1..5}; do
  curl -X POST "http://localhost:5000/api/ecommerce/products/PRODUCT_ID_$i/view" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"source": "search", "viewDuration": 30, "sessionId": "test-session"}'
done

# Get recommendations
curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify viewing history contributes to score
# Check for "Based on products you've viewed" in explanation
```

### Scenario 4: Complete User Journey

**Setup:**
1. User gets recommendations
2. User clicks on a product
3. User purchases the product
4. User provides feedback

**Test Commands:**
```bash
# Step 1: Get recommendations
curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 2: Track view
curl -X POST "http://localhost:5000/api/ecommerce/products/PRODUCT_ID/view" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "recommendation", "viewDuration": 60, "sessionId": "journey-session"}'

# Step 3: Track shown
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/track" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "shown", "sessionId": "journey-session"}'

# Step 4: Track click
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/track" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "clicked", "sessionId": "journey-session"}'

# Step 5: Track purchase
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/track" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "purchased", "sessionId": "journey-session"}'

# Step 6: Provide feedback
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": 5, "comment": "Perfect recommendation!", "sessionId": "journey-session"}'

# Step 7: Check analytics
curl -X GET "http://localhost:5000/api/ecommerce/recommendations/analytics?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Testing

### Test React Component

1. Import component:
```jsx
import XAIRecommendations from './modules/ecommerce/components/XAIRecommendations';
```

2. Add to your page:
```jsx
<XAIRecommendations limit={6} showExplanations={true} />
```

3. Verify:
- [ ] Component loads without errors
- [ ] Recommendations are displayed with scores
- [ ] Confidence badges show correct colors
- [ ] Primary explanations are visible
- [ ] "Why is this recommended?" button works
- [ ] Dialog shows detailed breakdown
- [ ] Feature importance bars display correctly
- [ ] Clicking product navigates to product page

## Validation Checklist

### Backend

- [ ] Recommendations API returns 200 status
- [ ] Response includes all required fields
- [ ] Scores are between 0-100
- [ ] Feature contributions sum to ~100%
- [ ] Explanations are human-readable
- [ ] Product view tracking works
- [ ] Interaction tracking works
- [ ] Feedback submission works
- [ ] Analytics endpoint returns metrics
- [ ] Explain weights endpoint works (no auth)

### Database

- [ ] ProductView documents are created
- [ ] RecommendationLog documents are created
- [ ] Indexes are created properly
- [ ] View counts increment correctly
- [ ] Interaction fields update correctly

### XAI Principles

- [ ] Every recommendation has an explanation
- [ ] Feature importance is visible
- [ ] Methodology is transparent (explain-weights)
- [ ] Users can understand why products are recommended
- [ ] No black-box decisions
- [ ] Complete audit trail exists

## Performance Testing

### Test Load

```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -X GET "http://localhost:5000/api/ecommerce/recommendations?limit=10" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" &
done
wait
```

**Expected:**
- All requests should complete in < 2 seconds
- No errors or timeouts
- Consistent response format

### Test Database Queries

```bash
# Check query performance in MongoDB
db.recommendationlogs.find().explain("executionStats")
db.productviews.find().explain("executionStats")
```

## Error Handling Testing

### Test Invalid Token

```bash
curl -X GET "http://localhost:5000/api/ecommerce/recommendations" \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected:** 401 Unauthorized

### Test Invalid Product ID

```bash
curl -X POST "http://localhost:5000/api/ecommerce/products/invalid-id/view" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "test"}'
```

**Expected:** 400 or 404 error

### Test Missing Required Fields

```bash
curl -X POST "http://localhost:5000/api/ecommerce/recommendations/PRODUCT_ID/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** 400 Bad Request

## Troubleshooting

### No Recommendations Returned

**Possible causes:**
1. No active products in database
2. User has no pets
3. All products recently purchased
4. Stock quantity is 0

**Solution:**
- Add products to database
- Add pets to user profile
- Check product stock levels

### Low Recommendation Scores

**Possible causes:**
1. No pet profile match
2. No purchase/viewing history
3. Products don't match user's pets

**Solution:**
- This is normal for new users
- System will fall back to popular products
- Scores will improve as user interacts more

### Explanations are Generic

**Possible causes:**
1. User has minimal activity
2. Fallback recommendations are being used

**Solution:**
- Build user profile by tracking views and purchases
- Add pets to user profile

## Success Criteria

The system is working correctly if:

✅ Recommendations are returned for all users (even new ones)
✅ Scores are deterministic (same input = same output)
✅ Explanations are clear and relevant
✅ Feature importance totals ~100%
✅ Analytics track user interactions
✅ Frontend displays recommendations properly
✅ Performance is acceptable (< 2s response time)

## Next Steps After Testing

1. Monitor recommendation acceptance rates
2. Gather user feedback
3. Adjust feature weights if needed
4. Implement optional enhancements
5. Set up production monitoring

---

**Happy Testing! 🧪**

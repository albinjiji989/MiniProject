# 🚀 How to Test & Use the AI/ML Inventory Predictions

## Quick Start

### 1. Install ML Dependencies

```bash
cd python-ai-ml
pip install -r requirements.txt
```

This installs:
- ✅ Prophet (Facebook)
- ✅ XGBoost
- ✅ LightGBM
- ✅ ARIMA & Statsmodels
- ✅ Scikit-learn
- ✅ TensorFlow/Keras

### 2. Start the Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Python AI/ML:**
```bash
cd python-ai-ml
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Access the Dashboard

Open your browser:
```
http://localhost:5173/manager/ecommerce/inventory-predictions
```

---

## 🎯 What You'll See

### 1. **AI Service Status Badge**
- 🟢 **Green "AI Service Active"** = All ML models loaded
- 🟡 **Yellow "Basic Mode"** = Python service not running

### 2. **Product Cards with AI Badges**

Each product shows:
- **🤖 Ensemble AI** - Multiple models combined
- **⚡ XGBoost** - Gradient boosting ML
- **⚡ LightGBM** - Fast gradient boosting
- **📈 Prophet** - Facebook's time series model
- **📊 ARIMA** - Statistical forecasting

### 3. **Confidence Scores**
- 🟢 **85%+** confident = High accuracy
- 🟡 **70-84%** confident = Good accuracy
- ⚪ **Below 70%** = Need more data

### 4. **Anomaly Detection**
- ⚠️ **Anomaly badge** = Unusual sales pattern detected

### 5. **Expanded Card Details**

Click any product to see:

#### **AI/ML Model Information Panel** (NEW!)
- Algorithm name (e.g., "Advanced Ensemble")
- Type (e.g., "Multi-Algorithm ML Ensemble")
- Models combined (XGBoost, LightGBM, Prophet)
- Features used (Time Features, Lag Features, etc.)
- Model weights visualization
- Top important features (for XGBoost/LightGBM)
- Confidence percentage
- Data points used

---

## 🧪 Testing Scenarios

### Scenario 1: Product with Good Data (30+ days)
**Expected Behavior:**
- ✅ Uses **Advanced Ensemble** or **Prophet**
- ✅ Confidence: 85-92%
- ✅ Shows all model weights
- ✅ Accurate 30-day forecast

**How to Check:**
1. Expand product card
2. Look for "AI/ML Model Information"
3. Should show multiple models combined

### Scenario 2: New Product (< 14 days)
**Expected Behavior:**
- ✅ Uses **Linear Regression** or **Simple Average**
- ✅ Confidence: 60-75%
- ✅ Shows "NEW" badge
- ✅ Note about improving with more data

### Scenario 3: Product with Anomalies
**Expected Behavior:**
- ✅ ⚠️ **Anomaly badge** visible
- ✅ Anomaly detection details in expanded view
- ✅ Dates of unusual sales patterns

---

## 📊 API Testing

### Check ML Service Health

```bash
curl http://localhost:5001/api/inventory/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "inventory-prediction",
  "status": "healthy",
  "version": "1.0.0",
  "features": [
    "Sales Velocity Analysis",
    "AI Demand Forecasting",
    "Stockout Prediction",
    "Smart Restock Recommendations",
    "Seasonal Adjustments"
  ]
}
```

### Get Predictions for All Products

```bash
curl http://localhost:3000/api/ecommerce/manager/inventory/predictions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Analyze Single Product

```bash
curl http://localhost:5001/api/inventory/analyze/PRODUCT_ID
```

---

## 🔍 Verify Real AI/ML is Running

### Check Python Logs

When you start `python app.py`, you should see:

```
✅ Prophet library available
✅ Statsmodels library available
✅ XGBoost library available
✅ LightGBM library available
✅ Inventory Prediction API registered
```

### Check Browser Console

Open DevTools (F12) and watch network requests when loading predictions:

1. Request to `/api/ecommerce/manager/inventory/predictions`
2. Look at response JSON:
   ```json
   {
     "model_info": {
       "algorithm": "advanced_ensemble",
       "ml_models_used": ["xgboost", "lightgbm", "prophet"],
       "confidence": 92,
       "anomalies_detected": false
     },
     "demand_forecast": {
       "model_used": "advanced_ensemble",
       "model_details": {
         "name": "Advanced Ensemble",
         "type": "Multi-Algorithm ML Ensemble",
         "models": ["XGBoost", "LightGBM", "Prophet"],
         "weights": {
           "xgboost": 0.35,
           "lightgbm": 0.30,
           "prophet": 0.25
         }
       }
     }
   }
   ```

---

## 🎨 UI Features to Test

### 1. **Model Badge System**
- Different colors for different algorithms
- Icons: 🤖 (Ensemble), ⚡ (XGBoost/LightGBM), 📈 (Prophet), 📊 (ARIMA)

### 2. **Confidence Visualization**
- Green for high confidence (85%+)
- Yellow for medium (70-84%)
- Gray for low (<70%)

### 3. **AI Model Information Panel**
- Gradient blue-purple background
- Model name and type
- Feature list with badges
- Weight bars for ensemble models
- Top feature importance chart

### 4. **Anomaly Alerts**
- Orange badge on main card
- Details in expanded view
- Specific dates highlighted

---

## 🐛 Troubleshooting

### Python Service Not Starting

```bash
# Check if port 5001 is free
netstat -ano | findstr :5001

# Install dependencies again
pip install -r requirements.txt

# Check for errors
python app.py
```

### "Basic Mode" Instead of "AI Service Active"

**Cause:** Python AI/ML service not running

**Fix:**
```bash
cd python-ai-ml
python app.py
```

### Low Confidence Scores

**Cause:** Not enough sales data

**Solutions:**
1. Wait for more sales data to accumulate
2. System will improve automatically
3. Uses category averages for new products

### No XGBoost/LightGBM Models Showing

**Cause:** Libraries not installed

**Fix:**
```bash
pip install xgboost==2.0.3 lightgbm==4.1.0
```

Then restart Python service:
```bash
python app.py
```

---

## 📈 Performance Expectations

### With Real Sales Data (60+ days):
- ✅ **Advanced Ensemble** model
- ✅ 88-94% confidence
- ✅ Highly accurate forecasts
- ✅ Detailed feature importance

### With Some Data (14-59 days):
- ✅ **Prophet** or **Holt-Winters**
- ✅ 75-87% confidence
- ✅ Good forecasts
- ✅ Seasonal patterns detected

### With Limited Data (< 14 days):
- ✅ **Linear Regression**
- ✅ 60-75% confidence
- ✅ Basic trend forecasts
- ✅ Improves over time

---

## 🎯 Success Criteria

Your AI/ML system is working correctly if you see:

✅ AI Service Active badge (green)  
✅ Model names displayed (XGBoost, LightGBM, Prophet, etc.)  
✅ Confidence scores shown  
✅ Model information panel with details  
✅ Feature importance (for XGBoost/LightGBM)  
✅ Model weights (for ensemble)  
✅ Anomaly detection active  
✅ Predictions updating on refresh  

---

## 🚀 Next Steps

1. **Add Real Products**: The more products with sales history, the better predictions
2. **Monitor Accuracy**: Check predictions vs actual sales
3. **Train Model**: More data = higher accuracy
4. **Review Insights**: Use AI recommendations for restocking

---

## 📞 Need Help?

Check logs:
- **Backend**: Terminal where `npm start` is running
- **Python AI/ML**: Terminal where `python app.py` is running
- **Frontend**: Browser DevTools Console (F12)

All components must be running for full AI/ML functionality!

---

**You now have a FULLY FUNCTIONAL enterprise-grade AI/ML inventory prediction system!** 🎉

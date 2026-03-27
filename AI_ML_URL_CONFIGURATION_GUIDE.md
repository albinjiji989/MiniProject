# AI/ML Service URL Configuration Guide

## Current Status ✅

Your AI/ML service is configured to work with **BOTH localhost and hosted environments** through environment variables.

## Recent Updates (Just Fixed) 🔧

Fixed 3 hardcoded URLs that were not using environment variables:
1. ✅ `BlockchainExplorer.jsx` - Now uses `VITE_API_URL` for tampering detection
2. ✅ `WorkflowStatus.jsx` - Now uses `VITE_API_URL` for health checks
3. ✅ `pythonAIService.js` - Fixed default port from 8000 to 5001 (matching actual Python service port)

---

## Configuration Files Overview

### 1. Frontend Configuration (`frontend/.env`)

```env
# Current (Localhost)
VITE_AI_SERVICE_URL=http://localhost:5001

# For Production (Hosted)
# VITE_AI_SERVICE_URL=https://your-python-service.onrender.com
```

**Used in:** `frontend/src/services/aiService.js`
```javascript
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5001';
```

---

### 2. Backend Configuration (`backend/.env`)

```env
# Current (Localhost) - Multiple aliases for different modules
AIML_API_URL=http://localhost:5001
AI_ML_SERVICE_URL=http://localhost:5001
PYTHON_AI_SERVICE_URL=http://localhost:5001
PYTHON_ML_URL=http://localhost:5001

# For Production (Hosted)
# AIML_API_URL=https://your-python-service.onrender.com
# AI_ML_SERVICE_URL=https://your-python-service.onrender.com
# PYTHON_AI_SERVICE_URL=https://your-python-service.onrender.com
# PYTHON_ML_URL=https://your-python-service.onrender.com
```

**Backend modules using AI/ML service:**
- `backend/services/pythonAIService.js` → Uses `PYTHON_AI_SERVICE_URL`
- `backend/modules/ecommerce/services/inventoryMLService.js` → Uses `PYTHON_ML_URL`
- `backend/modules/ecommerce/user/controllers/aiRecommendationController.js` → Uses `PYTHON_ML_URL`
- `backend/modules/adoption/user/services/matchingService.js` → Uses `AI_ML_SERVICE_URL`
- `backend/modules/adoption/user/services/mlService.js` → Uses `AIML_API_URL`
- `backend/modules/adoption/services/mlRetrainService.js` → Uses `AIML_API_URL`

---

### 3. Python AI/ML Service Configuration (`python-ai-ml/.env`)

```env
# Current (Localhost)
FLASK_PORT=5001
FLASK_HOST=0.0.0.0
BACKEND_URL=http://localhost:5000

# For Production (Hosted)
# PORT=10000  # Render sets this automatically
# BACKEND_URL=https://mini-project-ebon-omega.vercel.app
```

---

## How It Works 🔄

### Localhost Development
1. **Python AI/ML Service** runs on `http://localhost:5001`
2. **Backend** connects to `http://localhost:5001` (via env variables)
3. **Frontend** connects to `http://localhost:5001` (via `VITE_AI_SERVICE_URL`)

### Production/Hosted Environment
1. **Python AI/ML Service** deployed on Render (e.g., `https://your-service.onrender.com`)
2. **Backend** connects to hosted URL (update env variables in Vercel)
3. **Frontend** connects to hosted URL (update `VITE_AI_SERVICE_URL` before build)

---

## Switching Between Environments

### For Localhost (Current Setup) ✅
**No changes needed!** Everything is already configured for localhost.

### For Production Deployment 🚀

#### Step 1: Deploy Python AI/ML Service to Render
1. Push `python-ai-ml` folder to Render
2. Set environment variables in Render Dashboard:
   ```env
   FLASK_ENV=production
   DEBUG=False
   MONGODB_URI=mongodb+srv://albinjiji2026:...
   BACKEND_URL=https://mini-project-ebon-omega.vercel.app
   FRONTEND_URL=http://mini-project-6ot9.vercel.app
   CLOUDINARY_CLOUD_NAME=dio7ilktz
   CLOUDINARY_API_KEY=142166745553413
   CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac
   ML_INTERNAL_KEY=petconnect-ml-internal-2024
   ```
3. Note the deployed URL (e.g., `https://petconnect-ai.onrender.com`)

#### Step 2: Update Backend Environment (Vercel)
In Vercel Dashboard → Environment Variables:
```env
AIML_API_URL=https://petconnect-ai.onrender.com
AI_ML_SERVICE_URL=https://petconnect-ai.onrender.com
PYTHON_AI_SERVICE_URL=https://petconnect-ai.onrender.com
PYTHON_ML_URL=https://petconnect-ai.onrender.com
```

#### Step 3: Update Frontend Environment
In `frontend/.env` (before building):
```env
VITE_AI_SERVICE_URL=https://petconnect-ai.onrender.com
```

Then rebuild and redeploy frontend.

---

## AI/ML Features Using This Service

### 1. Pet Shop Module
- **Breed Identification** (`/api/petshop/identify-breed`)
- **Species Identification** (`/api/petshop/identify-species`)
- **Breed Suggestions** (`/api/petshop/breed-suggestions`)

### 2. Adoption Module
- **Pet Identification** (`/api/adoption/identify`)
- **Smart Matching** (`/api/adoption/match/calculate`)
- **Pet Ranking** (`/api/adoption/match/rank`)
- **Top Matches** (`/api/adoption/match/top-matches`)
- **Hybrid ML Recommendations** (`/api/adoption/ml/recommend/hybrid`)

### 3. E-commerce Module
- **Inventory Predictions** (`/api/inventory/predict`)
- **AI Product Recommendations** (`/api/inventory/recommendations`)

---

## Testing Configuration

### Test Localhost Setup
```bash
# Terminal 1: Start Python AI/ML Service
cd python-ai-ml
python app.py

# Terminal 2: Start Backend
cd backend
npm start

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### Test Production URLs
Update the URLs in `.env` files and restart services.

---

## Important Notes ⚠️

1. **Environment Variables are Already Set Up** ✅
   - Frontend uses `VITE_AI_SERVICE_URL`
   - Backend uses multiple aliases (all pointing to same service)
   - Python service uses `BACKEND_URL` for callbacks

2. **Fallback to Localhost** ✅
   - All services have `|| 'http://localhost:5001'` fallback
   - Works even if env variable is not set

3. **CORS Configuration** ✅
   - Python service needs to allow frontend and backend URLs
   - Already configured in `python-ai-ml` service

4. **No Code Changes Required** ✅
   - Just update environment variables
   - Rebuild and redeploy

---

## Quick Reference

| Environment | Python AI/ML URL | Update Location |
|------------|------------------|-----------------|
| **Localhost** | `http://localhost:5001` | Already configured ✅ |
| **Production** | `https://your-service.onrender.com` | Update all `.env` files |

---

## Verification Checklist

- [ ] Python AI/ML service is running (localhost or hosted)
- [ ] Backend `.env` has correct AI service URL
- [ ] Frontend `.env` has correct `VITE_AI_SERVICE_URL`
- [ ] Python service `.env` has correct `BACKEND_URL`
- [ ] All services can communicate (test with health check)
- [ ] CORS is properly configured

---

## Health Check Endpoints

Test if services are working:

```bash
# Python AI/ML Service
curl http://localhost:5001/health

# Backend
curl http://localhost:5000/api/health

# Frontend
# Open browser: http://localhost:5173
```

---

**Status:** ✅ Your AI/ML service is properly configured for both localhost and production!

**Action Required:** When deploying to production, just update the URLs in environment variables.

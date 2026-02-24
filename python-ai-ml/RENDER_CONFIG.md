# 🚀 Render Deployment Configuration

## Your Project URLs

- **Node.js Backend:** https://mini-project-ebon-omega.vercel.app
- **Frontend:** http://mini-project-6ot9.vercel.app

---

## 📝 Render Dashboard Configuration

### **Basic Settings**

| Field | Value |
|-------|-------|
| **Name** | `petconnect-ai-ml` |
| **Language** | Python 3 |
| **Branch** | `main` |
| **Region** | Oregon (US West) |
| **Root Directory** | `python-ai-ml` |

---

### **Build & Deploy Commands**

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

Or if using Flask (current setup):
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

---

## 🔐 Environment Variables (Add in Render Dashboard)

### **Required Variables**

```
MONGODB_URI
mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

FLASK_ENV
production

DEBUG
False

BACKEND_URL
https://mini-project-ebon-omega.vercel.app

FRONTEND_URL
http://mini-project-6ot9.vercel.app
```

### **Cloudinary (Optional)**

```
CLOUDINARY_CLOUD_NAME
dio7ilktz

CLOUDINARY_API_KEY
142166745553413

CLOUDINARY_API_SECRET
CO8OAHf5RY6hPRsmsmo0nTKLqac
```

### **CORS Configuration (Optional)**

```
CORS_ORIGINS
https://mini-project-ebon-omega.vercel.app,http://mini-project-6ot9.vercel.app,https://mini-project-6ot9.vercel.app
```

### **Model Configuration (Optional - has defaults)**

```
MODEL_TYPE
MobileNetV2

CONFIDENCE_THRESHOLD
0.5

ENABLE_GPU
false

MAX_IMAGE_SIZE
1024

SAVE_IMAGES_TO_DISK
false
```

---

## 🔗 After Deployment

### **1. Get Your Render URL**
After deployment, you'll get a URL like:
```
https://petconnect-ai-ml.onrender.com
```

### **2. Update Node.js Backend**

Add to your Node.js backend environment variables (Vercel):

```bash
AI_ML_SERVICE_URL=https://petconnect-ai-ml.onrender.com
```

### **3. Test Your Deployment**

```bash
# Health check
curl https://petconnect-ai-ml.onrender.com/health

# API documentation (if using FastAPI)
https://petconnect-ai-ml.onrender.com/docs

# Test breed identification
curl -X POST https://petconnect-ai-ml.onrender.com/api/petshop/identify-breed \
  -F "image=@dog.jpg" \
  -F "top_k=5"
```

---

## 🔧 Node.js Backend Integration

### **Update Your Backend Service**

Create or update `backend/services/aiService.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');

// Use environment variable for AI service URL
const AI_ML_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:10000';

/**
 * Identify pet breed using AI/ML service
 */
async function identifyBreed(imageBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, filename);
    formData.append('top_k', 5);
    
    const response = await axios.post(
      `${AI_ML_URL}/api/petshop/identify-breed`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 seconds
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Identify species only
 */
async function identifySpecies(imageBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, filename);
    
    const response = await axios.post(
      `${AI_ML_URL}/api/petshop/identify-species`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Check AI service health
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${AI_ML_URL}/health`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('AI Service health check failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  identifyBreed,
  identifySpecies,
  checkHealth
};
```

### **Use in Your Routes**

```javascript
// backend/routes/petshop.js
const express = require('express');
const multer = require('multer');
const aiService = require('../services/aiService');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Breed identification endpoint
router.post('/identify-breed', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image provided' 
      });
    }
    
    // Call AI service
    const result = await aiService.identifyBreed(
      req.file.buffer,
      req.file.originalname
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error identifying breed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Species identification endpoint
router.post('/identify-species', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image provided' 
      });
    }
    
    const result = await aiService.identifySpecies(
      req.file.buffer,
      req.file.originalname
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error identifying species:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Health check endpoint
router.get('/ai-health', async (req, res) => {
  try {
    const health = await aiService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
```

---

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0`
- [ ] All environment variables ready
- [ ] Root directory set to `python-ai-ml`
- [ ] Build command configured
- [ ] Start command configured
- [ ] CORS origins include your frontend and backend URLs

---

## 🧪 Testing Flow

### **1. Test Locally First**

```bash
cd python-ai-ml
python app.py
```

Visit: http://localhost:10000/health

### **2. Test from Node.js Backend Locally**

Update your local backend `.env`:
```bash
AI_ML_SERVICE_URL=http://localhost:10000
```

Test the integration.

### **3. Deploy to Render**

Follow the configuration above.

### **4. Update Node.js Backend on Vercel**

Add environment variable:
```bash
AI_ML_SERVICE_URL=https://petconnect-ai-ml.onrender.com
```

Redeploy your backend.

### **5. Test Full Integration**

Frontend → Backend → AI Service → Response

---

## 🚨 Troubleshooting

### **CORS Errors**

If you get CORS errors, make sure:
1. `CORS_ORIGINS` includes your frontend URL
2. Frontend URL matches exactly (http vs https)
3. No trailing slashes in URLs

### **Connection Timeout**

If requests timeout:
1. First request after sleep takes 30-60s (free tier)
2. Increase timeout in Node.js to 60 seconds
3. Consider upgrading to Starter plan ($7/mo)

### **MongoDB Connection Failed**

1. Check `MONGODB_URI` is correct
2. Verify IP whitelist includes `0.0.0.0/0`
3. Test connection locally first

---

## 💰 Pricing

- **Free Tier**: Good for testing (sleeps after 15 min)
- **Starter ($7/mo)**: Recommended for production (no sleep)

---

## 📚 Additional Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console

---

**Your AI/ML service is ready to deploy! 🚀**

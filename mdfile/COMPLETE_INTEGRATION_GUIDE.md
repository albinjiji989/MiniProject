# 🔗 Complete Integration Guide - All 3 Services

## 📊 Your Services Overview

| Service | Production | Local | Status |
|---------|-----------|-------|--------|
| **Python AI/ML** | https://petconnect-ztg6.onrender.com | http://localhost:10000 | ✅ Live |
| **Node.js Backend** | https://mini-project-ebon-omega.vercel.app | http://localhost:5000 | ✅ Live |
| **Frontend (Flutter)** | https://mini-project-6ot9.vercel.app | http://localhost:3000 | ✅ Live |

---

## 🎯 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Flutter)                        │
│          https://mini-project-6ot9.vercel.app               │
│                                                              │
│  User uploads pet image → Sends to Backend                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST /api/petshop/identify-breed
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 NODE.JS BACKEND (Vercel)                    │
│       https://mini-project-ebon-omega.vercel.app            │
│                                                              │
│  Receives image → Forwards to AI Service → Returns result   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST /api/petshop/identify-breed
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PYTHON AI/ML SERVICE (Render)                  │
│          https://petconnect-ztg6.onrender.com               │
│                                                              │
│  Processes image → AI Model → Returns predictions           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Step 1: Update Python AI/ML Service (Render)

### **1.1 Update Environment Variables in Render**

Go to **Render Dashboard** → Your Service → **Environment** and update:

```
FRONTEND_URL
https://mini-project-6ot9.vercel.app

CORS_ORIGINS
https://mini-project-ebon-omega.vercel.app,https://mini-project-6ot9.vercel.app,http://mini-project-6ot9.vercel.app,http://localhost:3000,http://localhost:5000
```

### **1.2 Verify CORS is Working**

Your Python service already has CORS configured in `app.py` to allow:
- ✅ Production Backend: https://mini-project-ebon-omega.vercel.app
- ✅ Production Frontend: https://mini-project-6ot9.vercel.app
- ✅ Local Backend: http://localhost:5000
- ✅ Local Frontend: http://localhost:3000

---

## ✅ Step 2: Update Node.js Backend (Vercel)

### **2.1 Add AI Service URL to Vercel**

1. Go to **Vercel Dashboard** → Your Backend Project
2. **Settings** → **Environment Variables**
3. Add:
   ```
   Name: AI_ML_SERVICE_URL
   Value: https://petconnect-ztg6.onrender.com
   ```
4. Select: **Production, Preview, Development**
5. Click **Save**

### **2.2 Create AI Service Integration**

Create `backend/services/aiService.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');

// AI Service URL - works for both local and production
const AI_ML_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:10000';

console.log('🤖 AI Service URL:', AI_ML_URL);

/**
 * Identify pet breed using AI/ML service
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {number} topK - Number of predictions (default: 5)
 * @returns {Promise<Object>} AI predictions
 */
async function identifyBreed(imageBuffer, filename, topK = 5) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, filename);
    formData.append('top_k', topK);
    formData.append('upload_to_cloudinary', 'false');
    
    console.log(`📤 Sending image to AI service: ${AI_ML_URL}/api/petshop/identify-breed`);
    
    const response = await axios.post(
      `${AI_ML_URL}/api/petshop/identify-breed`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000, // 60 seconds (important for Render free tier cold starts)
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log('✅ AI service response received');
    return response.data;
    
  } catch (error) {
    console.error('❌ AI Service Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Identify species only
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Species prediction
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
        timeout: 60000
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ AI Service Error:', error.message);
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Get product recommendations based on breed
 * @param {string} breed - Pet breed
 * @param {string} species - Pet species
 * @param {number} topK - Number of recommendations
 * @returns {Promise<Object>} Product recommendations
 */
async function getBreedRecommendations(breed, species, topK = 10) {
  try {
    const response = await axios.post(
      `${AI_ML_URL}/api/recommendations/breed-recommendations`,
      {
        breed,
        species,
        top_k: topK
      },
      {
        timeout: 30000
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ AI Recommendations Error:', error.message);
    throw new Error(`AI recommendations failed: ${error.message}`);
  }
}

/**
 * Check AI service health
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${AI_ML_URL}/health`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ AI Service health check failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      url: AI_ML_URL
    };
  }
}

module.exports = {
  identifyBreed,
  identifySpecies,
  getBreedRecommendations,
  checkHealth
};
```

### **2.3 Create/Update Backend Routes**

Create `backend/routes/ai.js`:

```javascript
const express = require('express');
const multer = require('multer');
const aiService = require('../services/aiService');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/ai/identify-breed
 * Identify pet breed from image
 */
router.post('/identify-breed', upload.single('image'), async (req, res) => {
  try {
    // Validate image
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }
    
    console.log('📸 Received image:', req.file.originalname, `(${req.file.size} bytes)`);
    
    // Get top_k from request (default: 5)
    const topK = parseInt(req.body.top_k || req.query.top_k || 5);
    
    // Call AI service
    const result = await aiService.identifyBreed(
      req.file.buffer,
      req.file.originalname,
      topK
    );
    
    // Return result
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in identify-breed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/identify-species
 * Identify pet species from image
 */
router.post('/identify-species', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }
    
    const result = await aiService.identifySpecies(
      req.file.buffer,
      req.file.originalname
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in identify-species:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/recommendations
 * Get product recommendations based on breed
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { breed, species, top_k } = req.body;
    
    if (!breed || !species) {
      return res.status(400).json({
        success: false,
        error: 'Breed and species are required'
      });
    }
    
    const result = await aiService.getBreedRecommendations(
      breed,
      species,
      top_k || 10
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
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

### **2.4 Register Routes in Main App**

In `backend/app.js` or `backend/index.js`:

```javascript
const aiRoutes = require('./routes/ai');

// Register AI routes
app.use('/api/ai', aiRoutes);

console.log('✅ AI routes registered at /api/ai');
```

### **2.5 Update Backend .env**

For local development, create/update `backend/.env`:

```bash
# AI/ML Service URL
AI_ML_SERVICE_URL=http://localhost:10000

# For production (set in Vercel):
# AI_ML_SERVICE_URL=https://petconnect-ztg6.onrender.com
```

---

## ✅ Step 3: Update Frontend (Flutter)

### **3.1 Update API Service**

In your Flutter app, update the API service to call your backend:

```dart
// lib/services/ai_service.dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AIService {
  // Backend URL - works for both local and production
  static const String _baseUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'https://mini-project-ebon-omega.vercel.app',
  );
  
  // For local testing, use:
  // static const String _baseUrl = 'http://localhost:5000';
  
  /// Identify pet breed from image
  static Future<Map<String, dynamic>> identifyBreed(File imageFile) async {
    try {
      print('📤 Sending image to backend: $_baseUrl/api/ai/identify-breed');
      
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/ai/identify-breed'),
      );
      
      // Add image file
      request.files.add(
        await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
        ),
      );
      
      // Add parameters
      request.fields['top_k'] = '5';
      
      // Send request
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 60), // 60 seconds for cold starts
      );
      
      var response = await http.Response.fromStream(streamedResponse);
      
      print('✅ Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to identify breed: ${response.body}');
      }
      
    } catch (e) {
      print('❌ Error identifying breed: $e');
      rethrow;
    }
  }
  
  /// Identify pet species from image
  static Future<Map<String, dynamic>> identifySpecies(File imageFile) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/ai/identify-species'),
      );
      
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );
      
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 60),
      );
      
      var response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to identify species: ${response.body}');
      }
      
    } catch (e) {
      print('❌ Error identifying species: $e');
      rethrow;
    }
  }
  
  /// Get product recommendations based on breed
  static Future<Map<String, dynamic>> getRecommendations({
    required String breed,
    required String species,
    int topK = 10,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/ai/recommendations'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'breed': breed,
          'species': species,
          'top_k': topK,
        }),
      ).timeout(const Duration(seconds: 30));
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get recommendations: ${response.body}');
      }
      
    } catch (e) {
      print('❌ Error getting recommendations: $e');
      rethrow;
    }
  }
  
  /// Check AI service health
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/ai/health'),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Health check failed');
      }
      
    } catch (e) {
      print('❌ Health check error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }
}
```

### **3.2 Example Usage in Flutter**

```dart
// Example: Identify breed from image
import 'package:image_picker/image_picker.dart';
import 'services/ai_service.dart';

Future<void> identifyPetBreed() async {
  try {
    // Pick image
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image == null) return;
    
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: CircularProgressIndicator()),
    );
    
    // Call AI service
    final result = await AIService.identifyBreed(File(image.path));
    
    // Hide loading
    Navigator.pop(context);
    
    // Check result
    if (result['success'] == true) {
      final predictions = result['data']['predictions'];
      final primaryBreed = result['data']['primary_breed'];
      final confidence = result['data']['primary_confidence'];
      
      print('🐕 Breed: $primaryBreed (${(confidence * 100).toStringAsFixed(1)}%)');
      
      // Show results to user
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Breed Identified'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Breed: $primaryBreed'),
              Text('Confidence: ${(confidence * 100).toStringAsFixed(1)}%'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to identify breed')),
      );
    }
    
  } catch (e) {
    print('❌ Error: $e');
    Navigator.pop(context); // Hide loading
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $e')),
    );
  }
}
```

---

## ✅ Step 4: Local Development Setup

### **4.1 Python AI/ML (Local)**

```bash
cd python-ai-ml
python app.py
# Runs on: http://localhost:10000
```

### **4.2 Node.js Backend (Local)**

Create `backend/.env`:
```bash
AI_ML_SERVICE_URL=http://localhost:10000
PORT=5000
```

Run:
```bash
cd backend
npm install
npm run dev
# Runs on: http://localhost:5000
```

### **4.3 Flutter Frontend (Local)**

Update API base URL for local testing:
```dart
// In ai_service.dart, temporarily change:
static const String _baseUrl = 'http://localhost:5000';
// Or use: http://10.0.2.2:5000 for Android emulator
```

Run:
```bash
cd petconnect_app
flutter run
```

---

## ✅ Step 5: Deploy & Test

### **5.1 Deploy Backend to Vercel**

```bash
cd backend
git add .
git commit -m "Add AI service integration"
git push origin main
# Vercel auto-deploys
```

### **5.2 Test Production Integration**

```bash
# Test backend → AI service
curl -X POST https://mini-project-ebon-omega.vercel.app/api/ai/health

# Test breed identification
curl -X POST https://mini-project-ebon-omega.vercel.app/api/ai/identify-breed \
  -F "image=@dog.jpg"
```

### **5.3 Test from Flutter App**

1. Build and run Flutter app
2. Upload a pet image
3. Check if breed identification works
4. Verify results are displayed

---

## 🧪 Complete Testing Checklist

### **Python AI/ML Service:**
- [ ] Health check: https://petconnect-ztg6.onrender.com/health
- [ ] Service info: https://petconnect-ztg6.onrender.com/
- [ ] CORS allows backend and frontend

### **Node.js Backend:**
- [ ] AI health check: https://mini-project-ebon-omega.vercel.app/api/ai/health
- [ ] Environment variable `AI_ML_SERVICE_URL` set
- [ ] Routes registered at `/api/ai`

### **Frontend:**
- [ ] Can upload images
- [ ] Calls backend API
- [ ] Displays AI predictions
- [ ] Handles errors gracefully

### **Full Integration:**
- [ ] Frontend → Backend → AI Service → Response
- [ ] Works on production URLs
- [ ] Works on localhost
- [ ] Handles cold starts (60s timeout)

---

## 🚨 Troubleshooting

### **Issue: CORS Error**
**Solution:** Verify `CORS_ORIGINS` in Render includes your frontend URL

### **Issue: Timeout Error**
**Solution:** First request after sleep takes 60s (free tier). Increase timeout.

### **Issue: 404 Not Found**
**Solution:** Check route paths match exactly in backend and frontend

### **Issue: Image Upload Fails**
**Solution:** Check file size limit (10MB) and format (jpg, png, webp)

---

## 📊 Environment Variables Summary

### **Render (Python AI/ML):**
```
PYTHON_VERSION=3.11.9
MONGODB_URI=mongodb+srv://...
FLASK_ENV=production
DEBUG=False
BACKEND_URL=https://mini-project-ebon-omega.vercel.app
FRONTEND_URL=https://mini-project-6ot9.vercel.app
CORS_ORIGINS=https://mini-project-ebon-omega.vercel.app,https://mini-project-6ot9.vercel.app,...
```

### **Vercel (Node.js Backend):**
```
AI_ML_SERVICE_URL=https://petconnect-ztg6.onrender.com
MONGODB_URI=mongodb+srv://...
```

### **Local Development:**

**Python (.env):**
```
FLASK_ENV=development
DEBUG=True
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

**Backend (.env):**
```
AI_ML_SERVICE_URL=http://localhost:10000
PORT=5000
```

---

## ✅ Success Criteria

All three services are connected when:

1. ✅ Python AI/ML responds to health checks
2. ✅ Backend can call Python AI/ML service
3. ✅ Frontend can call backend
4. ✅ Image upload → AI prediction → Display result works
5. ✅ Works on both localhost and production
6. ✅ No CORS errors
7. ✅ Proper error handling

---

**Your complete integration is ready! 🎉**

Follow the steps above to connect all three services on both localhost and production!

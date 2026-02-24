# 🎯 EXACT Integration Steps - What to Add Where

## ✅ Current Status:
- ✅ Python AI/ML: **DEPLOYED** on Render (https://petconnect-ztg6.onrender.com)
- ✅ Node.js Backend: **DEPLOYED** on Vercel (https://mini-project-ebon-omega.vercel.app)
- ✅ Frontend: **DEPLOYED** on Vercel (https://mini-project-6ot9.vercel.app)
- ✅ Backend already has `pythonAIService.js` - **READY TO USE!**

---

## 📝 STEP 1: Update Backend .env Files

### **1.1 Local Development (`backend/.env`)**

Add this ONE line to your existing `backend/.env`:

```bash
# Python AI/ML Service URL (for local development)
PYTHON_AI_SERVICE_URL=http://localhost:10000
```

Your complete `backend/.env` should look like:
```bash
# Database
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dio7ilktz
CLOUDINARY_API_KEY=142166745553413
CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Python AI/ML Service URL (ADD THIS LINE)
PYTHON_AI_SERVICE_URL=http://localhost:10000
```

### **1.2 Update `backend/.env.example`**

Add this line to `.env.example` for other developers:

```bash
# Python AI/ML Service
PYTHON_AI_SERVICE_URL=http://localhost:10000
```

---

## 📝 STEP 2: Update Vercel Environment Variables (Production)

1. Go to **Vercel Dashboard** → Your Backend Project
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   ```
   Name: PYTHON_AI_SERVICE_URL
   Value: https://petconnect-ztg6.onrender.com
   ```
5. Select: **Production, Preview, Development**
6. Click **Save**
7. **Redeploy** your backend

---

## 📝 STEP 3: Update Python AI/ML .env (Already Done!)

Your `python-ai-ml/.env` already has everything needed:

```bash
# Server Configuration
FLASK_PORT=5001
FLASK_HOST=0.0.0.0
FLASK_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dio7ilktz
CLOUDINARY_API_KEY=142166745553413
CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac

# Node.js Backend Integration
BACKEND_URL=http://localhost:5000
BACKEND_API_KEY=

# Model Configuration
MODEL_TYPE=MobileNetV2
CONFIDENCE_THRESHOLD=0.5
ENABLE_GPU=false
```

**✅ No changes needed for local development!**

---

## 📝 STEP 4: Update Render Environment Variables (Production)

Go to **Render Dashboard** → Your Python Service → **Environment** and ADD/UPDATE these:

```
PYTHON_VERSION
3.11.9

MONGODB_URI
mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

FLASK_ENV
production

DEBUG
False

BACKEND_URL
https://mini-project-ebon-omega.vercel.app

FRONTEND_URL
https://mini-project-6ot9.vercel.app

CORS_ORIGINS
https://mini-project-ebon-omega.vercel.app,https://mini-project-6ot9.vercel.app,http://mini-project-6ot9.vercel.app,http://localhost:3000,http://localhost:5000

CLOUDINARY_CLOUD_NAME
dio7ilktz

CLOUDINARY_API_KEY
142166745553413

CLOUDINARY_API_SECRET
CO8OAHf5RY6hPRsmsmo0nTKLqac
```

---

## 📝 STEP 5: Use Python AI Service in Your Backend Routes

Your backend already has `pythonAIService.js` ready! Here's how to use it:

### **Example 1: In Petshop Routes**

Create or update `backend/modules/petshop/routes/ai.routes.js`:

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pythonAIService = require('../../../services/pythonAIService');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * POST /api/petshop/ai/identify-breed
 * Identify pet breed from image
 */
router.post('/identify-breed', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('📸 Identifying breed for:', req.file.originalname);

    // Call Python AI service
    const result = await pythonAIService.identifyBreed(
      req.file.buffer,
      req.file.originalname,
      5, // top_k
      false // upload_to_cloudinary
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/petshop/ai/identify-species
 * Identify pet species only
 */
router.post('/identify-species', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const result = await pythonAIService.identifySpecies(
      req.file.buffer,
      req.file.originalname
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/petshop/ai/health
 * Check Python AI service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await pythonAIService.healthCheck();
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

### **Example 2: Register Routes in Main Server**

In `backend/server.js`, add:

```javascript
// Import AI routes
const petshopAIRoutes = require('./modules/petshop/routes/ai.routes');

// Register routes
app.use('/api/petshop/ai', petshopAIRoutes);

console.log('✅ Petshop AI routes registered at /api/petshop/ai');
```

---

## 📝 STEP 6: Frontend Integration (Flutter)

### **6.1 Create AI Service in Flutter**

Create `petconnect_app/lib/services/ai_service.dart`:

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AIService {
  // Backend URL - automatically uses production or local
  static const String _baseUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'https://mini-project-ebon-omega.vercel.app',
  );
  
  // For local testing, change to:
  // static const String _baseUrl = 'http://localhost:5000';
  // Or for Android emulator: 'http://10.0.2.2:5000'
  
  /// Identify pet breed from image
  static Future<Map<String, dynamic>> identifyBreed(File imageFile) async {
    try {
      print('📤 Sending to: $_baseUrl/api/petshop/ai/identify-breed');
      
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/petshop/ai/identify-breed'),
      );
      
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );
      
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 60), // 60 seconds for cold starts
      );
      
      var response = await http.Response.fromStream(streamedResponse);
      
      print('✅ Response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed: ${response.body}');
      }
      
    } catch (e) {
      print('❌ Error: $e');
      rethrow;
    }
  }
  
  /// Identify pet species
  static Future<Map<String, dynamic>> identifySpecies(File imageFile) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/petshop/ai/identify-species'),
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
        throw Exception('Failed: ${response.body}');
      }
      
    } catch (e) {
      print('❌ Error: $e');
      rethrow;
    }
  }
  
  /// Check AI service health
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/petshop/ai/health'),
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

### **6.2 Use in Flutter Widget**

```dart
import 'package:image_picker/image_picker.dart';
import 'services/ai_service.dart';

// Example usage
Future<void> identifyPetBreed(BuildContext context) async {
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
    
    // Show results
    if (result['success'] == true) {
      final data = result['data'];
      final predictions = data['predictions'];
      final primaryBreed = data['primary_breed'];
      final confidence = data['primary_confidence'];
      
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
    }
    
  } catch (e) {
    Navigator.pop(context); // Hide loading
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $e')),
    );
  }
}
```

---

## 📊 Summary of What to Add

### **Backend (.env files):**

| File | Add This Line |
|------|---------------|
| `backend/.env` | `PYTHON_AI_SERVICE_URL=http://localhost:10000` |
| `backend/.env.example` | `PYTHON_AI_SERVICE_URL=http://localhost:10000` |

### **Vercel (Environment Variables):**

| Variable | Value |
|----------|-------|
| `PYTHON_AI_SERVICE_URL` | `https://petconnect-ztg6.onrender.com` |

### **Render (Environment Variables):**

| Variable | Value |
|----------|-------|
| `PYTHON_VERSION` | `3.11.9` |
| `BACKEND_URL` | `https://mini-project-ebon-omega.vercel.app` |
| `FRONTEND_URL` | `https://mini-project-6ot9.vercel.app` |
| `CORS_ORIGINS` | `https://mini-project-ebon-omega.vercel.app,https://mini-project-6ot9.vercel.app,...` |

### **Python (.env) - NO CHANGES NEEDED!**
Your `python-ai-ml/.env` is already correct for local development.

---

## ✅ Testing Checklist

### **1. Test Python AI Service**
```bash
curl https://petconnect-ztg6.onrender.com/health
```

### **2. Test Backend → Python Connection**
```bash
curl https://mini-project-ebon-omega.vercel.app/api/petshop/ai/health
```

### **3. Test Full Integration**
- Open Flutter app
- Upload pet image
- Check if breed is identified

---

## 🎯 What's Already Done:

- ✅ Python AI/ML service deployed on Render
- ✅ Backend has `pythonAIService.js` ready to use
- ✅ CORS configured in Python service
- ✅ All services deployed

## 🎯 What You Need to Do:

1. ✅ Add `PYTHON_AI_SERVICE_URL` to backend `.env` (1 line)
2. ✅ Add `PYTHON_AI_SERVICE_URL` to Vercel (1 variable)
3. ✅ Update Render environment variables (if not done)
4. ✅ Create AI routes in backend (copy code above)
5. ✅ Create AI service in Flutter (copy code above)
6. ✅ Test!

---

**Total Time: ~10 minutes to add everything! 🚀**

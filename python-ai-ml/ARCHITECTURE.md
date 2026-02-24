# 🏗️ System Architecture

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Flutter)                          │
│                  petconnect_app/                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Pet Shop   │  │   Adoption   │  │  E-commerce  │        │
│  │    Module    │  │    Module    │  │    Module    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE.JS BACKEND (Vercel/Render)                    │
│                      backend/                                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Express    │  │  Auth/Users  │  │   Business   │        │
│  │   Routes     │  │   Service    │  │    Logic     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         AI Service Integration Layer             │         │
│  │  (Calls Python AI/ML Service for predictions)   │         │
│  └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         PYTHON AI/ML SERVICE (Render) ⭐ THIS SERVICE           │
│                  python-ai-ml/                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │              FastAPI Application                 │         │
│  │                   app.py                         │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Breed     │  │   Species    │  │  Inventory   │        │
│  │ Identifier   │  │ Classifier   │  │  Predictor   │        │
│  │ (MobileNet)  │  │ (MobileNet)  │  │  (Prophet)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Recommender  │  │   Adoption   │  │  E-commerce  │        │
│  │   System     │  │   Matching   │  │      AI      │        │
│  │ (Sklearn)    │  │  (ML-based)  │  │  (Sklearn)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Driver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MONGODB ATLAS (Cloud)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Users     │  │    Pets      │  │   Products   │        │
│  │  Collection  │  │  Collection  │  │  Collection  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Orders     │  │  Inventory   │  │    Logs      │        │
│  │  Collection  │  │  Collection  │  │  Collection  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Example: Breed Identification

```
1. User uploads pet image in Flutter app
   │
   ▼
2. Flutter sends image to Node.js backend
   POST /api/petshop/identify-breed
   │
   ▼
3. Node.js backend forwards to Python AI/ML service
   POST https://ai-service.onrender.com/api/petshop/identify-breed
   │
   ▼
4. Python AI/ML service:
   ├─ Receives image
   ├─ Preprocesses image (resize, normalize)
   ├─ Runs MobileNetV2 model
   ├─ Gets predictions with confidence scores
   └─ Returns JSON response
   │
   ▼
5. Node.js backend receives AI predictions
   ├─ Saves to MongoDB (optional)
   ├─ Processes business logic
   └─ Returns to Flutter app
   │
   ▼
6. Flutter app displays breed predictions to user
```

---

## 🎯 Python AI/ML Service Architecture

```
python-ai-ml/
│
├── app.py (FastAPI Entry Point)
│   │
│   ├─ CORS Middleware ──────────► Allows Node.js backend
│   ├─ Route Registration ───────► Includes all API routers
│   ├─ Error Handlers ───────────► Global exception handling
│   └─ Startup Events ───────────► Initialize AI models
│
├── routes/ (API Endpoints)
│   │
│   ├─ recommendation_routes.py ─► /api/recommendations/*
│   ├─ inventory_routes.py ──────► /api/inventory/*
│   ├─ adoption_routes.py ───────► /api/adoption/*
│   └─ ecommerce_routes.py ──────► /api/ecommerce/*
│
├── modules/ (AI/ML Logic)
│   │
│   ├─ petshop/
│   │   └─ breed_identifier.py ──► MobileNetV2 breed detection
│   │
│   ├─ adoption/
│   │   └─ species_identifier.py ► Species classification
│   │
│   └─ ecommerce/
│       ├─ product_recommender.py ► ML recommendations
│       └─ inventory.py ──────────► Demand forecasting
│
├── utils/ (Helper Functions)
│   │
│   ├─ image_processor.py ───────► Image preprocessing
│   ├─ cloudinary_uploader.py ───► Cloud storage
│   └─ model_loader.py ──────────► Pickle model management
│
└── config/ (Configuration)
    │
    ├─ settings.py ──────────────► Environment variables
    └─ database.py ──────────────► MongoDB connection
```

---

## 🔐 Security & Environment Variables

```
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOCAL DEVELOPMENT (.env file)                             │
│  ├─ MONGODB_URI=mongodb://localhost:27017/petcare         │
│  ├─ DEBUG=True                                             │
│  ├─ PORT=10000                                             │
│  └─ FLASK_ENV=development                                  │
│                                                             │
│  RENDER PRODUCTION (Dashboard → Environment)               │
│  ├─ MONGODB_URI=mongodb+srv://...                         │
│  ├─ DEBUG=False                                            │
│  ├─ PORT=$PORT (auto-set by Render)                       │
│  ├─ FLASK_ENV=production                                   │
│  └─ CLOUDINARY_* (optional)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GITHUB                               │
│                   (Source Control)                          │
│                                                             │
│  Repository: your-repo/python-ai-ml/                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Git Push
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RENDER (Cloud Host)                      │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │         Automatic Build Process               │         │
│  │                                               │         │
│  │  1. Detect Python runtime                    │         │
│  │  2. Install dependencies (requirements.txt)  │         │
│  │  3. Download TensorFlow (~500MB)             │         │
│  │  4. Setup environment variables              │         │
│  │  5. Start uvicorn server                     │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │         Running Service                       │         │
│  │                                               │         │
│  │  URL: https://pet-care-ai-ml.onrender.com   │         │
│  │  Port: 10000 (internal)                      │         │
│  │  Health: /health endpoint                    │         │
│  │  Docs: /docs (Swagger UI)                    │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints Structure

```
https://your-service.onrender.com/

├── GET  /                              # Service info
├── GET  /health                        # Health check
├── GET  /docs                          # Swagger UI
├── GET  /redoc                         # ReDoc UI
│
├── /api/petshop/
│   ├── POST /identify-breed           # Breed identification
│   ├── POST /identify-species         # Species only
│   └── POST /breed-suggestions        # Filtered suggestions
│
├── /api/adoption/
│   ├── POST /identify                 # Species & breed
│   └── POST /match                    # Adoption matching
│
├── /api/recommendations/
│   ├── POST /train                    # Train model
│   ├── POST /breed-recommendations    # Breed-based
│   ├── POST /similar-products         # Similar items
│   ├── POST /personalized             # User-based
│   ├── POST /analyze-behavior         # Behavior analysis
│   └── GET  /model-status             # Model info
│
├── /api/inventory/
│   ├── GET  /analyze/{product_id}     # Single product
│   ├── GET  /analyze/all              # All products
│   ├── GET  /critical-items           # Low stock
│   ├── GET  /restock-report           # Restock needs
│   ├── GET  /forecast/{product_id}    # Demand forecast
│   └── GET  /seasonal-analysis        # Seasonal trends
│
└── /api/ecommerce/
    ├── POST /recommendations          # Product recommendations
    ├── POST /similar                  # Similar products
    └── POST /trending                 # Trending items
```

---

## 🔄 Data Flow: Image Processing

```
┌─────────────────────────────────────────────────────────────┐
│                    IMAGE UPLOAD                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Receives UploadFile                    │
│              (multipart/form-data)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Read Image to Bytes                            │
│              image_bytes = await image.read()               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Image Validation                               │
│              - Check file type (jpg, png, webp)            │
│              - Check file size (< 10MB)                    │
│              - Validate image format                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Image Preprocessing                            │
│              - Resize to 224x224                           │
│              - Normalize pixel values                       │
│              - Convert to RGB                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Model Inference                             │
│              - Load MobileNetV2 model                      │
│              - Run prediction                               │
│              - Get confidence scores                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Post-Processing                                │
│              - Sort by confidence                           │
│              - Filter by threshold                          │
│              - Format response                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional: Upload to Cloudinary                 │
│              (if upload_to_cloudinary=true)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Return JSON Response                           │
│              {                                              │
│                "success": true,                            │
│                "data": {                                   │
│                  "predictions": [...],                     │
│                  "primary_breed": "Golden Retriever",     │
│                  "confidence": 0.95                        │
│                }                                            │
│              }                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI/ML Models Used

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPUTER VISION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MobileNetV2 (TensorFlow/Keras)                           │
│  ├─ Purpose: Breed & Species Identification               │
│  ├─ Input: 224x224 RGB images                             │
│  ├─ Output: 120+ breed classifications                    │
│  ├─ Accuracy: ~85-90%                                      │
│  └─ Inference Time: 1-3 seconds                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  RECOMMENDATION SYSTEMS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Content-Based Filtering (scikit-learn)                   │
│  ├─ TF-IDF Vectorization                                  │
│  ├─ Cosine Similarity                                      │
│  └─ Breed-based recommendations                            │
│                                                             │
│  Collaborative Filtering                                   │
│  ├─ User behavior analysis                                 │
│  ├─ Purchase history patterns                              │
│  └─ Personalized recommendations                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  TIME SERIES FORECASTING                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Facebook Prophet                                          │
│  ├─ Demand forecasting                                     │
│  ├─ Seasonal trend analysis                                │
│  └─ Inventory predictions                                  │
│                                                             │
│  XGBoost / LightGBM                                        │
│  ├─ Sales velocity prediction                              │
│  ├─ Stockout risk assessment                               │
│  └─ Restock recommendations                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Microservice Benefits

```
┌─────────────────────────────────────────────────────────────┐
│              WHY SEPARATE AI/ML SERVICE?                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Independent Scaling                                     │
│     Scale AI service separately from backend               │
│                                                             │
│  ✅ Technology Flexibility                                  │
│     Use Python for AI, Node.js for business logic         │
│                                                             │
│  ✅ Easier Maintenance                                      │
│     Update AI models without touching backend              │
│                                                             │
│  ✅ Better Performance                                      │
│     Dedicated resources for ML computations                │
│                                                             │
│  ✅ Fault Isolation                                         │
│     AI service issues don't crash entire system            │
│                                                             │
│  ✅ Reusability                                             │
│     Multiple services can use same AI endpoints            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**This architecture provides a clean, scalable, production-ready system! 🚀**

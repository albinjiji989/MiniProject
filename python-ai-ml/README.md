# Pet Care AI/ML Module

## 🤖 AI-Powered Pet Breed & Species Identification

This module provides AI/ML capabilities for the Pet Care Management System using TensorFlow and MobileNetV2.

## 📁 Module Structure

```
python-ai-ml/
├── modules/
│   ├── petshop/          # Pet breed identification for petshop
│   ├── adoption/         # Species/breed identification for adoption
│   ├── veterinary/       # Medical image analysis (future)
│   ├── ecommerce/        # Product image classification (future)
│   └── temporary-care/   # Pet identification for temporary care
├── models/               # Trained AI models
├── utils/                # Shared utilities
├── config/               # Configuration files
├── tests/                # Unit tests
└── requirements.txt      # Python dependencies
```

## 🎯 Features

### Current Implementation
- **Pet Breed Identification** using MobileNetV2 (ImageNet pre-trained)
- **Species Classification** (Dog, Cat, Bird, etc.)
- **Real-time Image Processing**
- **REST API Integration** with Node.js backend

### Technology Stack
- **TensorFlow 2.x** - Deep learning framework
- **Keras Applications** - Pre-trained models
- **MobileNetV2** - Lightweight CNN model
- **Flask** - Python web framework
- **OpenCV** - Image processing
- **NumPy** - Numerical computing

## 🚀 Quick Start

### Installation

```bash
cd python-ai-ml
pip install -r requirements.txt
```

### Run the AI Service

```bash
python app.py
```

The AI service will start on `http://localhost:5001`

## 📊 Model Information

### MobileNetV2
- **Size**: ~14 MB
- **Parameters**: 3.5M
- **Accuracy**: 71.3% top-1 on ImageNet
- **Speed**: Fast inference on CPU
- **Use Case**: Perfect for mini projects and demos

### Why MobileNetV2?
✅ Lightweight and fast
✅ No GPU required
✅ Pre-trained on ImageNet (14M+ images)
✅ Widely accepted in academic projects
✅ Excellent for pet/animal recognition

## 🔌 API Endpoints

### 1. Identify Pet Breed
```http
POST /api/identify/breed
Content-Type: multipart/form-data

{
  "image": <file>
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "breed": "Golden Retriever",
        "confidence": 0.95,
        "species": "Dog"
      }
    ],
    "processingTime": "0.234s"
  }
}
```

### 2. Identify Species
```http
POST /api/identify/species
Content-Type: multipart/form-data

{
  "image": <file>
}
```

## 🎓 Academic Project Notes

This implementation is perfect for mini projects because:
1. Uses industry-standard TensorFlow/Keras
2. Implements transfer learning (pre-trained models)
3. Demonstrates CNN architecture understanding
4. Shows practical AI integration with web applications
5. Includes proper error handling and validation

## 📝 License

Part of Pet Care Management System

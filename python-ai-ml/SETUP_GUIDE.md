# AI/ML Module Setup Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Python Dependencies

```bash
cd python-ai-ml
pip install -r requirements.txt
```

**Note:** First run will download MobileNetV2 model (~14 MB) automatically.

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work fine for development).

### Step 3: Start AI Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

### Step 4: Configure Frontend

Add to `frontend/.env`:

```env
VITE_AI_SERVICE_URL=http://localhost:5001
```

### Step 5: Test the Service

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "petshop_identifier": "ready",
    "adoption_identifier": "ready"
  }
}
```

## 📦 What Gets Installed

### Core Dependencies
- **TensorFlow 2.15.0** (~500 MB) - Deep learning framework
- **Keras 2.15.0** - High-level neural networks API
- **Flask 3.0.0** - Web framework for REST API
- **OpenCV** - Image processing
- **NumPy** - Numerical computing
- **Pillow** - Image handling

### Model Download
On first run, TensorFlow will automatically download:
- **MobileNetV2 weights** (~14 MB)
- Stored in: `~/.keras/models/`

## 🔧 Troubleshooting

### Issue: TensorFlow Installation Fails

**Solution for Windows:**
```bash
pip install tensorflow-cpu==2.15.0
```

**Solution for Mac M1/M2:**
```bash
pip install tensorflow-macos==2.15.0
pip install tensorflow-metal
```

### Issue: Model Download Fails

**Solution:**
```bash
# Manually download model
python -c "from tensorflow.keras.applications import MobileNetV2; MobileNetV2(weights='imagenet')"
```

### Issue: Port 5001 Already in Use

**Solution:**
Edit `.env`:
```env
FLASK_PORT=5002
```

And update frontend `.env`:
```env
VITE_AI_SERVICE_URL=http://localhost:5002
```

## 🎯 Integration with Petshop Module

### Backend Integration (Node.js)

Create `backend/services/aiService.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

async function identifyBreed(imagePath) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));
  
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/petshop/identify-breed`,
    formData,
    { headers: formData.getHeaders() }
  );
  
  return response.data;
}

module.exports = { identifyBreed };
```

### Frontend Integration

The `AIBreedIdentifier` component is ready to use:

```jsx
import AIBreedIdentifier from '../../components/Petshop/AIBreedIdentifier';

function AddPetForm() {
  const handleBreedIdentified = (result) => {
    console.log('Identified:', result);
    // Auto-fill form fields
    setSpecies(result.species);
    setBreed(result.breed);
  };

  return (
    <div>
      <AIBreedIdentifier onBreedIdentified={handleBreedIdentified} />
      {/* Rest of your form */}
    </div>
  );
}
```

## 📊 Performance Expectations

### Processing Time
- **CPU**: 0.2 - 0.5 seconds per image
- **GPU**: 0.05 - 0.1 seconds per image

### Accuracy
- **Dog Breeds**: 70-85% accuracy
- **Cat Breeds**: 65-80% accuracy
- **Species Detection**: 90%+ accuracy

### Resource Usage
- **RAM**: ~500 MB
- **Disk**: ~600 MB (including dependencies)
- **CPU**: Low (optimized for CPU inference)

## 🎓 For Academic Presentation

### Key Points to Highlight

1. **Transfer Learning**: Using pre-trained MobileNetV2
2. **CNN Architecture**: Convolutional Neural Networks
3. **ImageNet Dataset**: 14M+ images, 1000 classes
4. **Real-time Processing**: Fast inference on CPU
5. **REST API**: Industry-standard integration

### Demo Script

1. Show the AI service running
2. Upload a pet image
3. Explain the confidence scores
4. Show how it integrates with the petshop module
5. Discuss the model architecture (MobileNetV2)

## 🔐 Production Deployment

### Security Considerations

1. Add API key authentication
2. Rate limiting
3. Input validation
4. HTTPS only
5. File size limits

### Scaling

For production with high traffic:
1. Use GPU instances (AWS EC2 with GPU)
2. Implement caching
3. Use load balancer
4. Consider batch processing

## 📚 Additional Resources

- [TensorFlow Documentation](https://www.tensorflow.org/)
- [MobileNetV2 Paper](https://arxiv.org/abs/1801.04381)
- [Keras Applications](https://keras.io/api/applications/)
- [Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)

## ✅ Verification Checklist

- [ ] Python 3.8+ installed
- [ ] All dependencies installed
- [ ] AI service starts without errors
- [ ] Health check returns success
- [ ] Frontend can connect to AI service
- [ ] Test image identification works
- [ ] Results display correctly

## 🆘 Support

If you encounter issues:
1. Check the logs in `ai_service.log`
2. Verify Python version: `python --version`
3. Check TensorFlow: `python -c "import tensorflow as tf; print(tf.__version__)"`
4. Ensure port 5001 is available

# 🚀 Quick Reference Card - AI/ML Module

## ⚡ Quick Start (3 Commands)

```bash
cd python-ai-ml
pip install -r requirements.txt
python app.py
```

Service runs on: `http://localhost:5001`

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check service status |
| `/api/petshop/identify-breed` | POST | Identify breed (top 5) |
| `/api/petshop/identify-species` | POST | Identify species only |
| `/api/petshop/breed-suggestions` | POST | Filtered suggestions |
| `/api/adoption/identify` | POST | Adoption module |

## 🧪 Test Commands

```bash
# Health check
curl http://localhost:5001/health

# Run test suite
python test_service.py

# Test with image (PowerShell)
$form = @{image = Get-Item -Path "test.jpg"}
Invoke-RestMethod -Uri "http://localhost:5001/api/petshop/identify-breed" -Method Post -Form $form
```

## 🎯 Model Specs

- **Model**: MobileNetV2
- **Size**: 14 MB
- **Parameters**: 3.5M
- **Speed**: 0.2-0.5s (CPU)
- **Accuracy**: 70-90% (common breeds)

## 💻 Frontend Usage

```javascript
import aiService from './services/aiService';

// Identify breed
const result = await aiService.identifyBreed(imageFile);
console.log(result.data.predictions[0].breed);

// Check health
const isHealthy = await aiService.checkHealth();
```

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5001 in use | Change `FLASK_PORT` in `.env` |
| TensorFlow error | `pip install tensorflow-cpu` |
| Model download fails | Check internet connection |
| Import errors | `pip install -r requirements.txt` |

## 📊 Response Format

```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "breed": "Golden Retriever",
        "species": "Dog",
        "confidence": 0.95
      }
    ],
    "processing_time": "0.234s"
  }
}
```

## 🎓 Key Concepts

- **CNN**: Convolutional Neural Network
- **Transfer Learning**: Using pre-trained model
- **ImageNet**: 14M+ image dataset
- **MobileNetV2**: Lightweight CNN architecture
- **Inference**: Making predictions

## 📁 Important Files

- `app.py` - Main application
- `requirements.txt` - Dependencies
- `config/settings.py` - Configuration
- `utils/model_loader.py` - Model management
- `modules/petshop/breed_identifier.py` - Core logic

## 🚨 Emergency Commands

```bash
# Kill process on port 5001 (Windows)
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Kill process on port 5001 (Linux/Mac)
lsof -ti:5001 | xargs kill -9

# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

## 📞 Quick Help

- **Docs**: See `SETUP_GUIDE.md`
- **Technical**: See `AI_ML_IMPLEMENTATION_GUIDE.md`
- **Summary**: See `AI_ML_MODULE_SUMMARY.md`
- **Issues**: Check `ai_service.log`

## ✅ Pre-Demo Checklist

- [ ] Service running on port 5001
- [ ] Health check passes
- [ ] Test images ready
- [ ] Frontend connected
- [ ] Backup plan prepared

---

**Need help? Check the full documentation in SETUP_GUIDE.md**

# Deployment Guide: Vercel + Railway Integration

This guide explains how to deploy your Pet Connect application with:
- **Frontend**: Vercel
- **Backend (Node.js)**: Vercel
- **Python AI/ML Service**: Railway

## Architecture

```
Frontend (Vercel) → Backend (Vercel) → Python AI (Railway)
                         ↓
                    MongoDB Atlas
```

---

## Part 1: Deploy Python AI/ML to Railway

### Step 1: Prepare Python Service

Your Python service is already configured with:
- ✅ `railway.json` - Railway configuration
- ✅ `Procfile` - Process configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `runtime.txt` - Python version

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Configure:**
   - Root Directory: `python-ai-ml`
   - Click "Deploy Now"

### Step 3: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project
CLOUDINARY_CLOUD_NAME=dio7ilktz
CLOUDINARY_API_KEY=142166745553413
CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac
FLASK_HOST=0.0.0.0
FLASK_PORT=8000
DEBUG=False
```

### Step 4: Get Railway URL

After deployment, Railway will provide a URL like:
```
https://your-app-name.railway.app
```

**Copy this URL** - you'll need it for the backend configuration.

---

## Part 2: Update Backend Configuration

### Step 1: Update Local .env

In `backend/.env`, update:

```env
PYTHON_AI_SERVICE_URL=https://your-app-name.railway.app
```

Replace `your-app-name.railway.app` with your actual Railway URL.

### Step 2: Update Vercel Environment Variables

1. Go to your **Vercel Dashboard**
2. Select your **backend project**
3. Go to **Settings → Environment Variables**
4. Add/Update:

```
PYTHON_AI_SERVICE_URL = https://your-app-name.railway.app
```

5. **Redeploy** your backend on Vercel

---

## Part 3: Test the Integration

### Test Locally First

1. **Start Python service locally:**
```bash
cd python-ai-ml
python app.py
```

2. **Start Node.js backend:**
```bash
cd backend
npm start
```

3. **Test AI endpoints:**

```bash
# Health check
curl http://localhost:5000/api/ai/health

# Test breed identification (with image)
curl -X POST http://localhost:5000/api/ai/identify-breed \
  -F "image=@path/to/dog.jpg" \
  -F "top_k=5"
```

### Test Production

Once deployed, test your production endpoints:

```bash
# Health check
curl https://your-backend.vercel.app/api/ai/health

# Test breed identification
curl -X POST https://your-backend.vercel.app/api/ai/identify-breed \
  -F "image=@path/to/dog.jpg"
```

---

## Available AI Endpoints

Your Node.js backend now has these AI endpoints:

### Image Identification
- `POST /api/ai/identify-breed` - Identify pet breed
- `POST /api/ai/identify-species` - Identify pet species
- `POST /api/ai/identify-adoption` - Identify for adoption

### Recommendations
- `GET /api/ai/adoption-recommendations/:userId` - Get adoption matches
- `GET /api/ai/ecommerce-recommendations/:userId` - Get product recommendations

### Inventory Predictions
- `GET /api/ai/inventory` - Get all inventory predictions
- `GET /api/ai/inventory/:productId` - Get specific product prediction
- `GET /api/ai/inventory/critical` - Get critical stock items

---

## Frontend Integration

In your frontend code, use the backend endpoints:

```javascript
// Example: Identify breed
const formData = new FormData();
formData.append('image', imageFile);
formData.append('top_k', 5);

const response = await fetch('https://your-backend.vercel.app/api/ai/identify-breed', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.predictions);
```

---

## Troubleshooting

### Railway Issues

**Problem**: Build fails
- Check `requirements.txt` for incompatible versions
- Railway has 8GB memory limit - TensorFlow models are large

**Problem**: Timeout errors
- Increase timeout in `railway.json` (already set to 120s)
- Consider using smaller ML models

### Vercel Backend Issues

**Problem**: Can't connect to Railway
- Verify `PYTHON_AI_SERVICE_URL` is set correctly
- Check Railway service is running
- Test Railway URL directly in browser

**Problem**: CORS errors
- Python service has CORS enabled for all origins
- Check browser console for specific errors

### Connection Issues

**Problem**: 503 Service Unavailable
- Railway service might be sleeping (free tier)
- First request after sleep takes ~30 seconds
- Consider upgrading to Railway Pro ($5/month)

---

## Cost Summary

- **Vercel**: Free tier (Frontend + Backend)
- **Railway**: 
  - Free: $5 credit/month (~500 hours)
  - Pro: $5/month (no sleep, better performance)
- **MongoDB Atlas**: Free tier (512MB)
- **Cloudinary**: Free tier (25GB storage)

**Total**: $0-5/month depending on Railway usage

---

## Next Steps

1. ✅ Deploy Python service to Railway
2. ✅ Get Railway URL
3. ✅ Update backend environment variables
4. ✅ Redeploy backend to Vercel
5. ✅ Test all AI endpoints
6. ✅ Update frontend to use AI features

---

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Vercel logs in dashboard
3. Test endpoints with Postman/curl
4. Verify all environment variables are set

Good luck with your deployment! 🚀

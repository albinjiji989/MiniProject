# 🚀 Quick Reference Card

## Deploy Python AI to Railway

```bash
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Root Directory: python-ai-ml
4. Add env vars (see below)
5. Copy Railway URL
```

## Environment Variables (Railway)

```env
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project
CLOUDINARY_CLOUD_NAME=dio7ilktz
CLOUDINARY_API_KEY=142166745553413
CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac
FLASK_HOST=0.0.0.0
FLASK_PORT=8000
DEBUG=False
```

## Update Backend (Vercel)

```bash
# In Vercel Dashboard:
Settings → Environment Variables
Add: PYTHON_AI_SERVICE_URL = https://your-app.railway.app
Redeploy
```

## Test Commands

```bash
# Test Railway
curl https://your-app.railway.app/health

# Test Backend
curl https://your-backend.vercel.app/api/ai/health

# Test with image
cd backend
node test-ai-with-image.js path/to/image.jpg
```

## AI Endpoints

```
POST /api/ai/identify-breed          - Identify pet breed
POST /api/ai/identify-species        - Identify species
POST /api/ai/identify-adoption       - Adoption matching
GET  /api/ai/adoption-recommendations/:userId
GET  /api/ai/inventory/:productId
GET  /api/ai/inventory/critical
GET  /api/ai/ecommerce-recommendations/:userId
```

## Frontend Usage

```javascript
// Upload image for breed identification
const formData = new FormData();
formData.append('image', imageFile);
formData.append('top_k', 5);

const response = await fetch('/api/ai/identify-breed', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.primary_breed);
```

## Costs

- Vercel: Free
- Railway: Free ($5 credit/month)
- MongoDB: Free
- Total: $0/month

## Support Files

- `DEPLOYMENT_GUIDE.md` - Full guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step
- `ARCHITECTURE.md` - System design
- `VERCEL_RAILWAY_SETUP.md` - Complete setup

## Troubleshooting

**503 Error**: Railway sleeping (wait 30s)
**Connection Failed**: Check PYTHON_AI_SERVICE_URL
**CORS Error**: Check browser console
**Build Failed**: Check Railway logs

---

That's it! Deploy, test, and you're live! 🎉

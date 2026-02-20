# 🚂 Railway Deployment Guide

## Quick Deploy to Railway

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Go to [Railway.app](https://railway.app)**

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**

4. **Choose your repository**

5. **Configure Project:**
   - Click on the service
   - Go to Settings
   - Set **Root Directory**: `python-ai-ml`
   - Railway will auto-detect Python and use the Procfile

6. **Add Environment Variables:**
   - Go to Variables tab
   - Add these variables:

   ```
   MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project
   CLOUDINARY_CLOUD_NAME=dio7ilktz
   CLOUDINARY_API_KEY=142166745553413
   CLOUDINARY_API_SECRET=CO8OAHf5RY6hPRsmsmo0nTKLqac
   FLASK_HOST=0.0.0.0
   FLASK_PORT=8000
   DEBUG=False
   ```

7. **Deploy:**
   - Railway will automatically deploy
   - Wait for build to complete (~5-10 minutes for first deploy)

8. **Get Your URL:**
   - Go to Settings → Domains
   - Copy the Railway-provided domain
   - Example: `https://python-ai-ml-production-xxxx.up.railway.app`

---

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Navigate to Python folder:**
   ```bash
   cd python-ai-ml
   ```

4. **Initialize Railway:**
   ```bash
   railway init
   ```

5. **Add Environment Variables:**
   ```bash
   railway variables set MONGODB_URI="mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project"
   railway variables set CLOUDINARY_CLOUD_NAME="dio7ilktz"
   railway variables set CLOUDINARY_API_KEY="142166745553413"
   railway variables set CLOUDINARY_API_SECRET="CO8OAHf5RY6hPRsmsmo0nTKLqac"
   railway variables set FLASK_HOST="0.0.0.0"
   railway variables set FLASK_PORT="8000"
   railway variables set DEBUG="False"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Get URL:**
   ```bash
   railway domain
   ```

---

## Verify Deployment

### Test Health Endpoint

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": 1234567890,
  "services": {
    "petshop_identifier": "ready",
    "adoption_identifier": "ready"
  }
}
```

### Test Breed Identification

```bash
curl https://your-app.railway.app/
```

Should return service information with available endpoints.

---

## Railway Configuration Files

Your project includes:

1. **`railway.json`** - Railway configuration
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120"
     }
   }
   ```

2. **`Procfile`** - Process configuration
   ```
   web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
   ```

3. **`requirements.txt`** - Python dependencies
   - Includes TensorFlow, Flask, and all ML libraries

4. **`runtime.txt`** - Python version
   ```
   python-3.11.7
   ```

---

## Important Notes

### Build Time
- First deployment: ~5-10 minutes (downloads TensorFlow, etc.)
- Subsequent deployments: ~2-3 minutes

### Memory Usage
- TensorFlow models are large (~500MB)
- Railway provides 8GB memory (sufficient)
- If you hit limits, consider using smaller models

### Cold Starts
- **Free tier**: Service sleeps after inactivity
- **First request after sleep**: ~30 seconds
- **Pro tier ($5/month)**: No sleep, instant responses

### Costs
- **Free tier**: $5 credit/month (~500 hours)
- **Pro tier**: $5/month (unlimited usage, no sleep)
- **Recommended**: Start with free, upgrade if needed

---

## Troubleshooting

### Build Fails

**Problem**: Out of memory during build
- Solution: Railway has 8GB, should be enough
- Check `requirements.txt` for duplicate packages

**Problem**: Python version mismatch
- Solution: Verify `runtime.txt` has `python-3.11.7`

### Runtime Errors

**Problem**: Module not found
- Solution: Check all imports are in `requirements.txt`
- Redeploy after updating requirements

**Problem**: MongoDB connection fails
- Solution: Verify `MONGODB_URI` environment variable
- Check MongoDB Atlas allows Railway IPs (allow all IPs)

**Problem**: Timeout errors
- Solution: Already set to 120s in Procfile
- Consider optimizing model loading

### Service Not Responding

**Problem**: 503 Service Unavailable
- Solution: Service might be sleeping (free tier)
- Wait 30 seconds for first request
- Consider upgrading to Pro

**Problem**: 502 Bad Gateway
- Solution: Check Railway logs for errors
- Verify app is binding to `0.0.0.0:$PORT`

---

## Monitoring

### View Logs
```bash
railway logs
```

Or in Railway dashboard: Deployments → View Logs

### Check Metrics
- Go to Railway dashboard
- View CPU, Memory, Network usage
- Monitor for issues

---

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Get Railway URL
3. ✅ Test health endpoint
4. ✅ Update backend `.env` with Railway URL
5. ✅ Redeploy backend to Vercel
6. ✅ Test full integration

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

Good luck with your deployment! 🚀

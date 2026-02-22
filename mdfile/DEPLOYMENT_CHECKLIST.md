# 🚀 Deployment Checklist

## Railway (Python AI/ML Service)

### Pre-Deployment
- [ ] Verify `python-ai-ml/requirements.txt` is complete
- [ ] Check `python-ai-ml/railway.json` exists
- [ ] Check `python-ai-ml/Procfile` exists
- [ ] Check `python-ai-ml/runtime.txt` exists

### Deployment Steps
- [ ] Go to [Railway.app](https://railway.app)
- [ ] Create new project from GitHub repo
- [ ] Set root directory to `python-ai-ml`
- [ ] Add environment variables:
  - [ ] `MONGODB_URI`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `FLASK_HOST=0.0.0.0`
  - [ ] `FLASK_PORT=8000`
  - [ ] `DEBUG=False`
- [ ] Wait for deployment to complete
- [ ] Copy Railway URL (e.g., `https://your-app.railway.app`)

### Post-Deployment
- [ ] Test Railway URL in browser: `https://your-app.railway.app/health`
- [ ] Verify response shows "healthy" status

---

## Vercel (Backend - Node.js)

### Update Configuration
- [ ] Update `backend/.env`:
  ```
  PYTHON_AI_SERVICE_URL=https://your-app.railway.app
  ```
- [ ] Commit and push changes to GitHub

### Vercel Dashboard
- [ ] Go to Vercel dashboard
- [ ] Select backend project
- [ ] Go to Settings → Environment Variables
- [ ] Add/Update:
  - [ ] `PYTHON_AI_SERVICE_URL` = `https://your-app.railway.app`
- [ ] Redeploy backend

### Test Backend
- [ ] Test health endpoint: `https://your-backend.vercel.app/api/ai/health`
- [ ] Verify it connects to Railway successfully

---

## Vercel (Frontend)

### Update Frontend
- [ ] Update API base URL to point to Vercel backend
- [ ] Update any hardcoded URLs
- [ ] Commit and push changes

### Vercel Dashboard
- [ ] Verify frontend deployment
- [ ] Test frontend can call backend AI endpoints

---

## Testing

### Local Testing (Optional)
```bash
# Terminal 1: Start Python service
cd python-ai-ml
python app.py

# Terminal 2: Start Node.js backend
cd backend
npm start

# Terminal 3: Test connection
cd backend
node test-ai-connection.js
```

### Production Testing
- [ ] Test health check:
  ```bash
  curl https://your-backend.vercel.app/api/ai/health
  ```

- [ ] Test breed identification (with image):
  ```bash
  curl -X POST https://your-backend.vercel.app/api/ai/identify-breed \
    -F "image=@path/to/dog.jpg"
  ```

- [ ] Test from frontend application

---

## Verification

- [ ] Railway service is running (check Railway dashboard)
- [ ] Backend can connect to Railway (check `/api/ai/health`)
- [ ] Frontend can call backend AI endpoints
- [ ] All environment variables are set correctly
- [ ] No CORS errors in browser console
- [ ] Image uploads work correctly
- [ ] AI predictions return results

---

## Troubleshooting

If something doesn't work:

1. **Check Railway Logs**
   - Go to Railway dashboard → Deployments → View Logs
   - Look for errors during startup

2. **Check Vercel Logs**
   - Go to Vercel dashboard → Deployments → Function Logs
   - Look for connection errors

3. **Test Railway URL Directly**
   - Open `https://your-app.railway.app/health` in browser
   - Should return JSON with "healthy" status

4. **Verify Environment Variables**
   - Railway: Check all Python env vars are set
   - Vercel: Check `PYTHON_AI_SERVICE_URL` is correct

5. **Check CORS**
   - Python service has CORS enabled for all origins
   - If issues persist, check browser console

---

## Success Criteria

✅ Railway deployment shows "Active"
✅ Railway health endpoint returns 200 OK
✅ Backend health endpoint returns 200 OK and shows Railway connection
✅ Frontend can upload images and get AI predictions
✅ No errors in browser console
✅ No errors in Railway/Vercel logs

---

## Next Steps After Deployment

1. Monitor Railway usage (free tier: $5 credit/month)
2. Consider upgrading to Railway Pro if needed ($5/month)
3. Set up monitoring/alerts for service downtime
4. Optimize ML models if response times are slow
5. Add caching for frequently requested predictions

---

## Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Your deployment guide: `DEPLOYMENT_GUIDE.md`

Good luck! 🎉

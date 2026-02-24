# 🔧 Render Deployment Troubleshooting

## ✅ **FIXED: TensorFlow Version Error**

### **Problem:**
```
ERROR: Could not find a version that satisfies the requirement tensorflow==2.15.0
```

### **Root Cause:**
- Render was using Python 3.14.3 (too new)
- TensorFlow 2.15.0 only supports Python 3.9-3.11

### **Solution Applied:**
1. ✅ Updated `runtime.txt` to `python-3.11.9`
2. ✅ Updated `requirements.txt` with compatible versions
3. ✅ Changed `opencv-python` to `opencv-python-headless` (better for production)

---

## 🚀 **Next Steps:**

### **1. Commit and Push Changes**
```bash
git add python-ai-ml/runtime.txt python-ai-ml/requirements.txt
git commit -m "Fix: Update Python to 3.11.9 for TensorFlow compatibility"
git push origin main
```

### **2. Render Will Auto-Deploy**
- Render detects the push
- Starts new build automatically
- Should succeed this time!

### **3. Monitor Build Logs**
Watch for:
- ✅ "Using Python version 3.11.9"
- ✅ "Successfully installed tensorflow-2.15.0"
- ✅ "Build succeeded"

---

## 📋 **Updated Configuration:**

### **runtime.txt**
```
python-3.11.9
```

### **Key Changes in requirements.txt:**
- `opencv-python-headless==4.9.0.80` (was opencv-python)
- `scikit-learn==1.4.0` (was 1.3.2)
- `scipy==1.12.0` (was 1.11.4)
- `flask==3.0.1` (was 3.0.0)
- `pillow==10.2.0` (was 10.1.0)

---

## 🐛 **Common Render Deployment Issues:**

### **Issue 1: Build Timeout**
**Symptom:** Build takes too long and times out

**Solution:**
- First build takes 5-10 minutes (TensorFlow is large)
- This is normal, just wait
- Subsequent builds are faster (~2-3 minutes)

---

### **Issue 2: Module Not Found**
**Symptom:** `ModuleNotFoundError: No module named 'X'`

**Solution:**
1. Check if module is in `requirements.txt`
2. Verify spelling and version
3. Push changes and redeploy

---

### **Issue 3: MongoDB Connection Failed**
**Symptom:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
1. Check `MONGODB_URI` in Render environment variables
2. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Test connection string locally first

---

### **Issue 4: Port Binding Error**
**Symptom:** Service starts but not accessible

**Solution:**
- Ensure start command uses `$PORT`
- Correct: `gunicorn app:app --bind 0.0.0.0:$PORT`
- Wrong: `gunicorn app:app --bind 0.0.0.0:5000`

---

### **Issue 5: CORS Errors**
**Symptom:** Frontend can't access API

**Solution:**
1. Check CORS configuration in `app.py`
2. Verify `CORS_ORIGINS` includes your frontend URL
3. Ensure no trailing slashes in URLs

---

### **Issue 6: Cold Start Delays (Free Tier)**
**Symptom:** First request takes 30-60 seconds

**Solution:**
- This is normal for free tier (service sleeps)
- Upgrade to Starter plan ($7/mo) for always-on
- Or use a cron job to ping every 10 minutes

---

## 🔍 **How to Debug:**

### **1. Check Build Logs**
- Go to Render Dashboard
- Click on your service
- Click "Logs" tab
- Look for errors in red

### **2. Check Runtime Logs**
- After build succeeds
- Watch for startup errors
- Check for MongoDB connection
- Verify models loading

### **3. Test Endpoints**
```bash
# Health check
curl https://your-service.onrender.com/health

# Should return:
# {"success": true, "status": "healthy", ...}
```

---

## ✅ **Verification Checklist:**

After deployment succeeds:

- [ ] Build completed without errors
- [ ] Service status shows "Live"
- [ ] Health endpoint responds: `/health`
- [ ] API docs accessible (if using FastAPI): `/docs`
- [ ] MongoDB connection working (check logs)
- [ ] Test breed identification endpoint
- [ ] CORS allows frontend requests
- [ ] Response times acceptable

---

## 📞 **Still Having Issues?**

### **Check These:**

1. **Python Version**
   - Should be 3.11.9 in logs
   - Check `runtime.txt`

2. **Environment Variables**
   - All required variables set?
   - No typos in variable names?
   - Values correct (no extra spaces)?

3. **Root Directory**
   - Set to `python-ai-ml`?
   - Files in correct location?

4. **Start Command**
   - Using `$PORT` not hardcoded port?
   - Correct app name (`app:app`)?

5. **MongoDB Atlas**
   - IP whitelist includes `0.0.0.0/0`?
   - Connection string correct?
   - Database user has permissions?

---

## 🎯 **Expected Build Output:**

```
==> Using Python version 3.11.9
==> Running build command 'pip install -r requirements.txt'...
Collecting tensorflow==2.15.0
  Downloading tensorflow-2.15.0-cp311-cp311-manylinux_2_17_x86_64.whl
...
Successfully installed tensorflow-2.15.0 keras-2.15.0 ...
==> Build succeeded ✓
==> Starting service...
🤖 Pet Care AI/ML Service Starting...
✅ MongoDB connection successful
✅ All models initialized successfully
🚀 Server starting on http://0.0.0.0:10000
```

---

## 💡 **Pro Tips:**

1. **First Deploy:** Takes 5-10 minutes (TensorFlow download)
2. **Subsequent Deploys:** 2-3 minutes (cached dependencies)
3. **Free Tier:** Service sleeps after 15 min inactivity
4. **Paid Tier:** Always-on, no cold starts
5. **Logs:** Check both build logs and runtime logs
6. **Testing:** Test locally before deploying

---

**Your deployment should work now! 🎉**

If you still see errors, check the specific error message in Render logs and refer to the solutions above.

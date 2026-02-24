# 📋 Quick Copy-Paste Guide for Render

## ⚡ Fast Method: Copy from `render-env-vars.txt`

I've created `render-env-vars.txt` with your **real credentials** ready to copy.

### **Steps:**

1. **Open the file:**
   ```
   python-ai-ml/render-env-vars.txt
   ```

2. **In Render Dashboard:**
   - Go to your service → **Environment** tab
   - Click **"Add Environment Variable"**

3. **Copy each variable:**
   - Copy the **Key** (e.g., `MONGODB_URI`)
   - Copy the **Value** (e.g., `mongodb+srv://...`)
   - Click **"Add"**
   - Repeat for all variables

---

## 📝 Variables to Add (in order):

### **1. Database (Required)**
```
Key: MONGODB_URI
Value: mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project
```

### **2. Environment (Required)**
```
Key: FLASK_ENV
Value: production

Key: DEBUG
Value: False
```

### **3. URLs (Required)**
```
Key: BACKEND_URL
Value: https://mini-project-ebon-omega.vercel.app

Key: FRONTEND_URL
Value: http://mini-project-6ot9.vercel.app
```

### **4. Cloudinary (Optional but Recommended)**
```
Key: CLOUDINARY_CLOUD_NAME
Value: dio7ilktz

Key: CLOUDINARY_API_KEY
Value: 142166745553413

Key: CLOUDINARY_API_SECRET
Value: CO8OAHf5RY6hPRsmsmo0nTKLqac
```

### **5. CORS (Optional)**
```
Key: CORS_ORIGINS
Value: https://mini-project-ebon-omega.vercel.app,http://mini-project-6ot9.vercel.app,https://mini-project-6ot9.vercel.app
```

---

## ⚠️ **IMPORTANT SECURITY NOTES:**

1. ✅ `render-env-vars.txt` is in `.gitignore` - it won't be pushed to GitHub
2. ✅ Keep this file **local only** on your computer
3. ✅ Never share this file or commit it to Git
4. ✅ `.env.example` (the template) is safe to push to GitHub

---

## 🚀 **After Adding Variables:**

1. Click **"Save Changes"** in Render
2. Render will automatically redeploy with new variables
3. Test your deployment:
   ```bash
   curl https://your-service.onrender.com/health
   ```

---

## 🔄 **If You Need to Update Variables Later:**

1. Go to Render Dashboard → Environment
2. Click on the variable you want to change
3. Update the value
4. Save (Render will redeploy automatically)

---

**That's it! Much easier than typing each one manually! 🎉**

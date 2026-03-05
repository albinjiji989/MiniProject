# 🔗 URL Configuration Guide - Where to Put Each Link

## 📍 Your Deployed URLs:

```
Python AI/ML:  https://petconnect-ztg6.onrender.com
Backend:       https://mini-project-ebon-omega.vercel.app
Frontend:      https://mini-project-6ot9.vercel.app
```

---

## 📝 1. BACKEND `.env` File

**Location:** `backend/.env`

### **What to Change:**

```bash
# CHANGE THIS LINE (Line 3):
FRONTEND_URL=http://localhost:5173
# TO (for production):
FRONTEND_URL=https://mini-project-6ot9.vercel.app

# CHANGE THIS LINE (Line 73):
PYTHON_AI_SERVICE_URL=http://localhost:8000
# TO:
PYTHON_AI_SERVICE_URL=https://petconnect-ztg6.onrender.com
```

### **Complete Updated Section:**

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://mini-project-6ot9.vercel.app  # ← CHANGED

# ... (keep everything else the same) ...

# ML Service Configuration
PYTHON_AI_SERVICE_URL=https://petconnect-ztg6.onrender.com  # ← CHANGED
```

### **For Local Development, Keep:**

```bash
FRONTEND_URL=http://localhost:5173
PYTHON_AI_SERVICE_URL=http://localhost:10000
```

**💡 TIP:** Create two `.env` files:
- `.env.local` - for local development
- `.env.production` - for production (but don't commit!)

---

## 📝 2. FRONTEND `.env` File

**Location:** `frontend/.env`

### **What to Change:**

```bash
# CHANGE THIS LINE (Line 1):
VITE_API_URL=http://localhost:5000/api
# TO (for production):
VITE_API_URL=https://mini-project-ebon-omega.vercel.app/api

# CHANGE THIS LINE (Line 2):
VITE_FRONTEND_URL=http://localhost:5173
# TO (for production):
VITE_FRONTEND_URL=https://mini-project-6ot9.vercel.app

# CHANGE THIS LINE (Line 3):
VITE_ML_SERVICE_URL=http://localhost:5001
# TO (for production):
VITE_ML_SERVICE_URL=https://petconnect-ztg6.onrender.com
```

### **Complete Updated Section:**

```bash
VITE_API_URL=https://mini-project-ebon-omega.vercel.app/api  # ← CHANGED
VITE_FRONTEND_URL=https://mini-project-6ot9.vercel.app  # ← CHANGED
VITE_ML_SERVICE_URL=https://petconnect-ztg6.onrender.com  # ← CHANGED

# Firebase Configuration (keep as is)
VITE_FIREBASE_API_KEY=AIzaSyDsytv6SE6jFfQVtLGHUZf-N5EtZr1FtwI
# ... rest stays the same
```

### **For Local Development, Keep:**

```bash
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_ML_SERVICE_URL=http://localhost:10000
```

---

## 📝 3. PYTHON AI/ML `.env` File

**Location:** `python-ai-ml/.env`

### **What to Change:**

```bash
# CHANGE THIS LINE (Line 31):
BACKEND_URL=http://localhost:5000
# TO (for production):
BACKEND_URL=https://mini-project-ebon-omega.vercel.app
```

### **Complete Updated Section:**

```bash
# Node.js Backend Integration
BACKEND_URL=https://mini-project-ebon-omega.vercel.app  # ← CHANGED
BACKEND_API_KEY=
```

### **For Local Development, Keep:**

```bash
BACKEND_URL=http://localhost:5000
```

---

## 🌐 4. VERCEL Environment Variables (Backend)

**Where:** Vercel Dashboard → Backend Project → Settings → Environment Variables

### **Add These:**

```
Name: FRONTEND_URL
Value: https://mini-project-6ot9.vercel.app

Name: PYTHON_AI_SERVICE_URL
Value: https://petconnect-ztg6.onrender.com
```

---

## 🌐 5. VERCEL Environment Variables (Frontend)

**Where:** Vercel Dashboard → Frontend Project → Settings → Environment Variables

### **Add These:**

```
Name: VITE_API_URL
Value: https://mini-project-ebon-omega.vercel.app/api

Name: VITE_FRONTEND_URL
Value: https://mini-project-6ot9.vercel.app

Name: VITE_ML_SERVICE_URL
Value: https://petconnect-ztg6.onrender.com
```

---

## 🌐 6. RENDER Environment Variables (Python AI/ML)

**Where:** Render Dashboard → Your Service → Environment

### **Add/Update These:**

```
Name: BACKEND_URL
Value: https://mini-project-ebon-omega.vercel.app

Name: FRONTEND_URL
Value: https://mini-project-6ot9.vercel.app

Name: CORS_ORIGINS
Value: https://mini-project-ebon-omega.vercel.app,https://mini-project-6ot9.vercel.app,http://mini-project-6ot9.vercel.app,http://localhost:5173,http://localhost:5000
```

---

## 📊 Quick Reference Table

| Service | File/Location | Variable Name | Local Value | Production Value |
|---------|---------------|---------------|-------------|------------------|
| **Backend** | `backend/.env` | `FRONTEND_URL` | `http://localhost:5173` | `https://mini-project-6ot9.vercel.app` |
| **Backend** | `backend/.env` | `PYTHON_AI_SERVICE_URL` | `http://localhost:10000` | `https://petconnect-ztg6.onrender.com` |
| **Frontend** | `frontend/.env` | `VITE_API_URL` | `http://localhost:5000/api` | `https://mini-project-ebon-omega.vercel.app/api` |
| **Frontend** | `frontend/.env` | `VITE_FRONTEND_URL` | `http://localhost:5173` | `https://mini-project-6ot9.vercel.app` |
| **Frontend** | `frontend/.env` | `VITE_ML_SERVICE_URL` | `http://localhost:10000` | `https://petconnect-ztg6.onrender.com` |
| **Python** | `python-ai-ml/.env` | `BACKEND_URL` | `http://localhost:5000` | `https://mini-project-ebon-omega.vercel.app` |

---

## 🎯 Step-by-Step Instructions

### **For Local Development:**

1. **Keep all `.env` files as they are** (with localhost URLs)
2. Run all services locally:
   ```bash
   # Terminal 1 - Python AI/ML
   cd python-ai-ml
   python app.py
   
   # Terminal 2 - Backend
   cd backend
   npm run dev
   
   # Terminal 3 - Frontend
   cd frontend
   npm run dev
   ```

### **For Production Deployment:**

#### **Option 1: Use Environment Variables in Hosting Platforms (Recommended)**

Don't change `.env` files. Instead, set environment variables in:
- **Vercel Dashboard** for Backend and Frontend
- **Render Dashboard** for Python AI/ML

#### **Option 2: Update `.env` Files Before Deploy**

1. **Update `backend/.env`:**
   ```bash
   FRONTEND_URL=https://mini-project-6ot9.vercel.app
   PYTHON_AI_SERVICE_URL=https://petconnect-ztg6.onrender.com
   ```

2. **Update `frontend/.env`:**
   ```bash
   VITE_API_URL=https://mini-project-ebon-omega.vercel.app/api
   VITE_FRONTEND_URL=https://mini-project-6ot9.vercel.app
   VITE_ML_SERVICE_URL=https://petconnect-ztg6.onrender.com
   ```

3. **Update `python-ai-ml/.env`:**
   ```bash
   BACKEND_URL=https://mini-project-ebon-omega.vercel.app
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Update URLs for production"
   git push origin main
   ```

---

## ⚠️ IMPORTANT NOTES:

### **1. Don't Commit Production URLs to Git**

Create separate files:
- `.env.local` - for local development (commit this)
- `.env.production` - for production (add to .gitignore)

### **2. Use Environment Variables in Hosting Platforms**

Best practice: Set URLs in hosting platform dashboards, not in `.env` files.

### **3. CORS Configuration**

Make sure Python AI/ML service allows requests from both:
- Backend: `https://mini-project-ebon-omega.vercel.app`
- Frontend: `https://mini-project-6ot9.vercel.app`

---

## ✅ Verification Checklist

After updating URLs:

- [ ] Backend can reach Python AI/ML service
- [ ] Frontend can reach Backend
- [ ] Frontend can reach Python AI/ML (if direct calls)
- [ ] No CORS errors in browser console
- [ ] All services respond to health checks
- [ ] Image upload and breed identification works

---

## 🧪 Test Commands

### **Test Backend → Python AI/ML:**
```bash
curl https://mini-project-ebon-omega.vercel.app/api/petshop/ai/health
```

### **Test Frontend → Backend:**
```bash
curl https://mini-project-ebon-omega.vercel.app/api/health
```

### **Test Python AI/ML:**
```bash
curl https://petconnect-ztg6.onrender.com/health
```

---

## 🎉 Summary

**3 Files to Update:**
1. `backend/.env` - Add Python AI/ML URL
2. `frontend/.env` - Add Backend and Python URLs
3. `python-ai-ml/.env` - Add Backend URL

**3 Hosting Platforms to Configure:**
1. Vercel (Backend) - Add environment variables
2. Vercel (Frontend) - Add environment variables
3. Render (Python) - Add environment variables

**Total Time: ~5 minutes** ⏱️

---

**That's it! All your services will be connected! 🚀**

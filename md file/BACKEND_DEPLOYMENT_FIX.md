# Backend Deployment Issue - Quick Fix

## 🔴 Problem
Your Vercel backend at `https://mini-project-ebon-omega.vercel.app` is showing:
```
FUNCTION_INVOCATION_FAILED
```

This means the backend deployment has errors.

## 🔍 Check Vercel Deployment

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your project: `mini-project-ebon-omega`
   - Click on it

2. **Check Deployment Status:**
   - Look for red ❌ or yellow ⚠️ indicators
   - Click on the latest deployment
   - Check the **Build Logs** and **Function Logs**

3. **Common Issues:**
   - Missing environment variables
   - Build errors
   - Runtime errors
   - Database connection issues

## ✅ Quick Fixes

### Fix 1: Redeploy Backend

```bash
cd D:\Second\MiniProject\backend
git add .
git commit -m "Fix deployment issues"
git push
```

Vercel will auto-deploy.

### Fix 2: Check Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, ensure these are set:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Any random string (e.g., `your-secret-key-123`)
- `NODE_ENV` - Set to `production`

**Payment:**
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

**Storage:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Firebase:**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

**Google OAuth:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Frontend URL:**
- `CLIENT_URL` - Set to `https://mini-project-ebon-omega.vercel.app`

After adding/updating variables, click **Redeploy** in Vercel.

### Fix 3: Check MongoDB Connection

Make sure your MongoDB Atlas:
1. Is accessible from anywhere (IP whitelist: `0.0.0.0/0`)
2. Has the correct connection string in `MONGODB_URI`
3. Database user has read/write permissions

### Fix 4: Check Vercel Function Logs

In Vercel Dashboard:
1. Click your project
2. Go to **Deployments** tab
3. Click latest deployment
4. Click **Functions** tab
5. Look for error messages

## 🧪 Test Backend Locally First

Before deploying, test locally:

```bash
cd D:\Second\MiniProject\backend

# Install dependencies
npm install

# Create .env file with all variables
# Copy from backend/.env

# Run locally
npm run dev
```

Test at: `http://localhost:5000/api/auth/health`

If it works locally, the issue is with Vercel deployment.

## 🔧 Alternative: Use Local Backend for Testing

While fixing Vercel, you can test with local backend:

### Step 1: Run Backend Locally
```bash
cd D:\Second\MiniProject\backend
npm run dev
```

### Step 2: Update Flutter Config
In `petconnect_app/lib/config/app_config.dart`:
```dart
// Temporary - use local backend
static const String baseUrl = 'http://10.0.2.2:5000/api'; // For emulator
// OR
static const String baseUrl = 'http://YOUR_PC_IP:5000/api'; // For physical device
```

To find your PC IP:
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

### Step 3: Update Backend CORS
In `backend/server.js`, temporarily allow all origins:
```javascript
app.use(cors({
  origin: '*', // Allow all for testing
  credentials: true,
}));
```

### Step 4: Restart Flutter App
```powershell
# Stop the app (press 'q' in terminal)
# Then run again
flutter run
```

## 📋 Deployment Checklist

Before deploying to Vercel:

- [ ] All environment variables set in Vercel
- [ ] MongoDB accessible from Vercel IPs
- [ ] `package.json` has correct start script
- [ ] No hardcoded localhost URLs in code
- [ ] CORS configured for production
- [ ] `.env` file NOT committed to git
- [ ] `vercel.json` configured correctly

## 🎯 Vercel Configuration

Make sure you have `vercel.json` in backend folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🚨 Emergency: Switch to Local Backend

If you can't fix Vercel quickly:

1. **Run backend locally:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Get your PC's IP address:**
   ```powershell
   ipconfig
   ```
   Note the IPv4 Address (e.g., `192.168.1.100`)

3. **Update Flutter config:**
   ```dart
   // lib/config/app_config.dart
   static const String baseUrl = 'http://192.168.1.100:5000/api';
   ```

4. **Make sure phone and PC are on same WiFi**

5. **Update backend CORS to allow your phone:**
   ```javascript
   // backend/server.js
   app.use(cors({
     origin: '*',
     credentials: true,
   }));
   ```

6. **Restart both backend and Flutter app**

## 📞 Get Help

If still having issues:

1. **Check Vercel Logs:**
   - Dashboard → Project → Deployments → Latest → View Function Logs

2. **Check Backend Logs:**
   - Look for error messages in deployment logs

3. **Common Error Messages:**
   - "Cannot connect to MongoDB" → Check MONGODB_URI
   - "Missing environment variable" → Add in Vercel settings
   - "Module not found" → Check package.json dependencies
   - "CORS error" → Check CORS configuration

## ✅ Success Indicators

Backend is working when:
- ✅ Vercel deployment shows green checkmark
- ✅ `curl https://mini-project-ebon-omega.vercel.app/` returns response
- ✅ Flutter app can login successfully
- ✅ No CORS errors in logs

## 🎉 Once Fixed

After fixing Vercel backend:

1. Update Flutter config back to Vercel URL:
   ```dart
   static const String baseUrl = 'https://mini-project-ebon-omega.vercel.app/api';
   ```

2. Hot restart Flutter app (press `R` in terminal)

3. Test login again

Your app should work perfectly! 🚀

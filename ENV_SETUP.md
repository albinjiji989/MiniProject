# Environment Configuration Setup

## Backend .env File
Create `backend/.env` with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

# JWT Configuration
JWT_SECRET=SecretPass
JWT_EXPIRES_IN=1d

# Email Configuration (used by backend/controllers/auth.js)
# For Gmail, use an App Password for 2FA-enabled accounts
EMAIL_USER=ss0719056@gmail.com
EMAIL_PASS=albinjiji989@gmail.com

FIREBASE_API_KEY=AIzaSyDsytv6SE6jFfQVtLGHUZf-N5EtZr1FtwI
FIREBASE_AUTH_DOMAIN=petwelfare-faa69.firebaseapp.com
FIREBASE_PROJECT_ID=petwelfare-faa69
FIREBASE_STORAGE_BUCKET=petwelfare-faa69.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=576012574310
FIREBASE_APP_ID=1:576012574310:web:2acbef8a78c3ecf78bd7a7
FIREBASE_MEASUREMENT_ID=G-RX5R98NT7R
```

## Frontend .env File
Create `frontend/.env` with the following content:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDsytv6SE6jFfQVtLGHUZf-N5EtZr1FtwI
VITE_FIREBASE_AUTH_DOMAIN=petwelfare-faa69.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=petwelfare-faa69
VITE_FIREBASE_STORAGE_BUCKET=petwelfare-faa69.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=576012574310
VITE_FIREBASE_APP_ID=1:576012574310:web:2acbef8a78c3ecf78bd7a7
VITE_FIREBASE_MEASUREMENT_ID=G-RX5R98NT7R
```

## Setup Instructions
1. Copy the backend configuration to `backend/.env`
2. Copy the frontend configuration to `frontend/.env`
3. Run `npm install` in both backend and frontend directories
4. Start the backend with `npm run dev`
5. Start the frontend with `npm run dev`

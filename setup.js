#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🐾 Pet Welfare Management System - Setup Script')
console.log('================================================\n')

// Check if we're in the right directory
if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
  console.error('❌ Error: Please run this script from the project root directory')
  process.exit(1)
}

console.log('✅ Project structure verified')

// Create .env files if they don't exist
const backendEnvPath = path.join('backend', '.env')
const frontendEnvPath = path.join('frontend', '.env')

const backendEnvContent = `# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project

# JWT Configuration
JWT_SECRET=SecretPass
JWT_EXPIRES_IN=1d

# Email Configuration
EMAIL_USER=ss0719056@gmail.com
EMAIL_PASS=albinjiji989@gmail.com

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDsytv6SE6jFfQVtLGHUZf-N5EtZr1FtwI
FIREBASE_AUTH_DOMAIN=petwelfare-faa69.firebaseapp.com
FIREBASE_PROJECT_ID=petwelfare-faa69
FIREBASE_STORAGE_BUCKET=petwelfare-faa69.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=576012574310
FIREBASE_APP_ID=1:576012574310:web:2acbef8a78c3ecf78bd7a7
FIREBASE_MEASUREMENT_ID=G-RX5R98NT7R
`

const frontendEnvContent = `VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDsytv6SE6jFfQVtLGHUZf-N5EtZr1FtwI
VITE_FIREBASE_AUTH_DOMAIN=petwelfare-faa69.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=petwelfare-faa69
VITE_FIREBASE_STORAGE_BUCKET=petwelfare-faa69.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=576012574310
VITE_FIREBASE_APP_ID=1:576012574310:web:2acbef8a78c3ecf78bd7a7
VITE_FIREBASE_MEASUREMENT_ID=G-RX5R98NT7R
`

try {
  if (!fs.existsSync(backendEnvPath)) {
    fs.writeFileSync(backendEnvPath, backendEnvContent)
    console.log('✅ Created backend/.env file')
  } else {
    console.log('ℹ️  backend/.env already exists')
  }

  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, frontendEnvContent)
    console.log('✅ Created frontend/.env file')
  } else {
    console.log('ℹ️  frontend/.env already exists')
  }
} catch (error) {
  console.error('❌ Error creating .env files:', error.message)
  console.log('📝 Please manually create the .env files using the content in ENV_SETUP.md')
}

console.log('\n🚀 Setup Instructions:')
console.log('=====================')
console.log('1. Install backend dependencies:')
console.log('   cd backend && npm install')
console.log('')
console.log('2. Install frontend dependencies:')
console.log('   cd frontend && npm install')
console.log('')
console.log('3. Start the backend server:')
console.log('   cd backend && npm run dev')
console.log('')
console.log('4. Start the frontend development server:')
console.log('   cd frontend && npm run dev')
console.log('')
console.log('5. Open your browser and visit:')
console.log('   http://localhost:5173')
console.log('')
console.log('🎉 Your Pet Welfare Management System is ready!')
console.log('')
console.log('📚 Documentation:')
console.log('- PROJECT_COMPLETE.md - Complete project overview')
console.log('- ENV_SETUP.md - Environment configuration details')
console.log('- PROJECT_STRUCTURE.md - Detailed file structure')
console.log('')
console.log('🔐 Default Admin Account:')
console.log('You can register a new account or create an admin user through the API')
console.log('')
console.log('Happy coding! 🐾')

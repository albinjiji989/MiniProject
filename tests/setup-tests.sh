#!/bin/bash

# Playwright Test Setup Script
# This script sets up the testing environment

echo "🚀 Setting up Playwright testing environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install Playwright
echo "📦 Installing Playwright..."
npm install -D @playwright/test

# Install browsers
echo "🌐 Installing browsers..."
npx playwright install

# Create .env.test file if it doesn't exist
if [ ! -f .env.test ]; then
    echo "📝 Creating .env.test file..."
    cat > .env.test << EOF
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=Test@123
TEST_MANAGER_EMAIL=manager@example.com
TEST_MANAGER_PASSWORD=Manager@123
EOF
    echo "✅ .env.test file created"
else
    echo "✅ .env.test file already exists"
fi

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend is not running. Please start the backend server:"
    echo "   cd backend && npm start"
fi

# Check if frontend is running
echo "🔍 Checking if frontend is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend is not running. Please start the frontend server:"
    echo "   cd frontend && npm run dev"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Make sure backend and frontend servers are running"
echo "   2. Seed test data: cd backend && npm run seed:test"
echo "   3. Run tests: npm test"
echo "   4. View test report: npx playwright show-report"
echo ""
echo "📖 For more information, see tests/README.md"

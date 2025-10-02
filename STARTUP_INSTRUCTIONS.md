# Pet Welfare System - Manual Startup Instructions

## Backend Server (Manual Start)

### Method 1: Command Line
```bash
cd D:\Second\MiniProject\backend
node server.js
```

### Method 2: Double-click Batch File
- Double-click `start-backend.bat` in project root

### Method 3: Using npm
```bash
cd D:\Second\MiniProject\backend
npm start
```

## Frontend Server

### Command Line
```bash
cd D:\Second\MiniProject\frontend
npm run dev
```

### Batch File
- Double-click `start-frontend.bat` in project root

## Start Both Servers
- Double-click `start-both.bat` to start both in separate windows

## Server URLs
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **API Health Check**: http://localhost:5000/api/health

## Notes
- Backend must be started manually each time
- No auto-restart - stops when you close terminal
- Frontend has hot-reload for development
- Always start backend before testing frontend features

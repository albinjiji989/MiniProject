@echo off
echo Starting Pet Welfare Full Stack Application...
echo.
echo Starting Backend Server...
cd /d "D:\Second\MiniProject\backend"
start "Backend Server" cmd /k "node server.js"

echo.
echo Starting Frontend Server...
cd /d "D:\Second\MiniProject\frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause

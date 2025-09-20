@echo off
echo Starting Pet Welfare System...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"
timeout /t 3

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3

echo.
echo ===================================
echo   Pet Welfare System Started!
echo ===================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Admin Login:
echo - Go to: http://localhost:5173/login
echo - Login as admin
echo - You will be redirected to: http://localhost:5173/admin/dashboard
echo.
echo Admin Pages Available:
echo - Dashboard:         /admin/dashboard
echo - User Management:   /admin/users
echo - Manager Management: /admin/managers
echo - Module Management: /admin/modules
echo - Data Tracking:     /admin/tracking
echo.
pause

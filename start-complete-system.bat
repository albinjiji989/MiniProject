@echo off
echo 🚀 Starting Complete Pet Welfare System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "start-system.js" (
    echo ❌ start-system.js not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start the complete system
echo Starting database, backend, and frontend...
node start-system.js --frontend

pause

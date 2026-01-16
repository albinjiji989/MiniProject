# 🐍 Virtual Environment Setup Guide

## Why Use Virtual Environment?

### ✅ Benefits:
1. **Isolated Dependencies** - No conflicts with system Python packages
2. **Version Control** - Lock specific package versions
3. **Easy Deployment** - Reproducible environment on any server
4. **Clean System** - Keep system Python clean
5. **Multiple Projects** - Different Python versions per project

### ⚠️ Without venv:
- Package conflicts with other projects
- Difficult to deploy to hosting
- System-wide package pollution
- Version mismatch issues

---

## 🚀 Setup Virtual Environment

### **Windows**

#### Step 1: Create Virtual Environment
```bash
# Navigate to python-ai-ml folder
cd python-ai-ml

# Create virtual environment
python -m venv venv
```

#### Step 2: Activate Virtual Environment
```bash
# Activate (Command Prompt)
venv\Scripts\activate

# OR Activate (PowerShell)
venv\Scripts\Activate.ps1
```

**Note:** If PowerShell gives execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Step 3: Install Dependencies
```bash
# After activation, you'll see (venv) in prompt
(venv) pip install -r requirements.txt
```

#### Step 4: Run AI Service
```bash
(venv) python app.py
```

#### Step 5: Deactivate (when done)
```bash
deactivate
```

---

### **Linux/Mac**

#### Step 1: Create Virtual Environment
```bash
cd python-ai-ml
python3 -m venv venv
```

#### Step 2: Activate Virtual Environment
```bash
source venv/bin/activate
```

#### Step 3: Install Dependencies
```bash
(venv) pip install -r requirements.txt
```

#### Step 4: Run AI Service
```bash
(venv) python app.py
```

#### Step 5: Deactivate (when done)
```bash
deactivate
```

---

## 📝 Updated Start Scripts

### **Windows - start.bat**
```batch
@echo off
echo ========================================
echo Pet Care AI/ML Service
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if venv exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully!
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if requirements are installed
python -c "import tensorflow" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting AI/ML Service...
echo.
python app.py

pause
```

### **Linux/Mac - start.sh**
```bash
#!/bin/bash

echo "========================================"
echo "Pet Care AI/ML Service"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created successfully!"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
python -c "import tensorflow" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "Starting AI/ML Service..."
echo ""
python app.py
```

---

## 🔧 Troubleshooting

### Issue 1: "python: command not found"
**Solution:**
```bash
# Windows - Use 'py' instead
py -m venv venv

# Linux/Mac - Install Python
sudo apt-get install python3 python3-venv  # Ubuntu/Debian
brew install python3                        # Mac
```

### Issue 2: "Permission denied" (Linux/Mac)
**Solution:**
```bash
chmod +x start.sh
./start.sh
```

### Issue 3: PowerShell Execution Policy Error
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 4: pip not found
**Solution:**
```bash
# Windows
python -m ensurepip --upgrade

# Linux/Mac
python3 -m ensurepip --upgrade
```

### Issue 5: TensorFlow installation fails
**Solution:**
```bash
# Windows - Use CPU version
pip install tensorflow-cpu==2.15.0

# Mac M1/M2
pip install tensorflow-macos==2.15.0
pip install tensorflow-metal
```

---

## 🌐 Hosting Deployment

### **Option 1: Heroku**

#### Step 1: Create Procfile
```bash
# File: python-ai-ml/Procfile
web: python app.py
```

#### Step 2: Create runtime.txt
```bash
# File: python-ai-ml/runtime.txt
python-3.11.0
```

#### Step 3: Update requirements.txt
```bash
# Add gunicorn for production
echo "gunicorn==21.2.0" >> requirements.txt
```

#### Step 4: Update app.py for Heroku
```python
# At the end of app.py
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
```

#### Step 5: Deploy
```bash
heroku login
heroku create your-ai-service
git add .
git commit -m "Deploy AI service"
git push heroku main
```

---

### **Option 2: AWS EC2**

#### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 2: Install Python & Dependencies
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

#### Step 3: Clone & Setup
```bash
git clone your-repo
cd python-ai-ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 4: Run with systemd
```bash
# Create service file
sudo nano /etc/systemd/system/ai-service.service
```

```ini
[Unit]
Description=Pet Care AI Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/python-ai-ml
Environment="PATH=/home/ubuntu/python-ai-ml/venv/bin"
ExecStart=/home/ubuntu/python-ai-ml/venv/bin/python app.py

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start ai-service
sudo systemctl enable ai-service
```

---

### **Option 3: Docker (Recommended for Production)**

#### Dockerfile
```dockerfile
# File: python-ai-ml/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5001

# Run application
CMD ["python", "app.py"]
```

#### docker-compose.yml
```yaml
# File: python-ai-ml/docker-compose.yml
version: '3.8'

services:
  ai-service:
    build: .
    ports:
      - "5001:5001"
    environment:
      - FLASK_ENV=production
    restart: unless-stopped
```

#### Deploy
```bash
docker-compose up -d
```

---

### **Option 4: Railway.app (Easiest)**

#### Step 1: Create railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python app.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 2: Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

## 📦 Freezing Dependencies

### Create requirements.txt from current environment
```bash
# Activate venv first
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Freeze dependencies
pip freeze > requirements.txt
```

### Install from requirements.txt
```bash
pip install -r requirements.txt
```

---

## 🔒 .gitignore for venv

Make sure your `.gitignore` includes:
```gitignore
# Virtual Environment
venv/
env/
ENV/
.venv

# Python
__pycache__/
*.py[cod]
*$py.class
*.so

# Environment
.env
.env.local

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

---

## ✅ Best Practices

### 1. Always Use Virtual Environment
```bash
# GOOD ✅
cd python-ai-ml
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# BAD ❌
pip install tensorflow  # Installs globally
```

### 2. Keep requirements.txt Updated
```bash
# After installing new packages
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update dependencies"
```

### 3. Use Specific Versions
```txt
# GOOD ✅
tensorflow==2.15.0
flask==3.0.0

# BAD ❌
tensorflow
flask
```

### 4. Separate Dev and Prod Dependencies
```txt
# requirements.txt (production)
tensorflow==2.15.0
flask==3.0.0

# requirements-dev.txt (development)
-r requirements.txt
pytest==7.4.3
black==23.12.0
```

---

## 🎯 Quick Reference

### Create venv
```bash
python -m venv venv
```

### Activate venv
```bash
# Windows CMD
venv\Scripts\activate

# Windows PowerShell
venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run service
```bash
python app.py
```

### Deactivate
```bash
deactivate
```

### Update requirements
```bash
pip freeze > requirements.txt
```

---

## 🚀 Production Checklist

- [ ] Virtual environment created
- [ ] Dependencies installed in venv
- [ ] requirements.txt up to date
- [ ] .gitignore includes venv/
- [ ] Environment variables configured
- [ ] Service runs in venv
- [ ] Deployment script uses venv
- [ ] Health check endpoint works
- [ ] Error logging configured
- [ ] Monitoring setup

---

## 📞 Support

**Common Issues:**
1. **Import errors** → Activate venv first
2. **Permission errors** → Use `sudo` or check file permissions
3. **Version conflicts** → Delete venv and recreate
4. **Slow installation** → Use `--no-cache-dir` flag

**Need Help?**
- Check Python version: `python --version`
- Check pip version: `pip --version`
- List installed packages: `pip list`
- Check venv activation: `which python` (should show venv path)

---

**Status: ✅ Virtual Environment Guide Complete!**

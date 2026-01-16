# 🚀 Deployment Guide - AI/ML Service

## Quick Answer: YES, Use Virtual Environment!

**For hosting, you MUST use virtual environment to avoid dependency conflicts and ensure reproducible deployments.**

---

## 🎯 Quick Start (Development)

### Windows
```bash
cd python-ai-ml
start.bat
```

### Linux/Mac
```bash
cd python-ai-ml
chmod +x start.sh
./start.sh
```

**The scripts now automatically:**
- ✅ Create virtual environment if not exists
- ✅ Activate virtual environment
- ✅ Install dependencies if needed
- ✅ Start the AI service

---

## 🌐 Hosting Options

### **Option 1: Render.com (Recommended - FREE)**

#### Why Render?
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in virtual environment
- ✅ Easy setup
- ✅ HTTPS included

#### Steps:

1. **Create `render.yaml`** in `python-ai-ml/`:
```yaml
services:
  - type: web
    name: petcare-ai-service
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FLASK_PORT
        value: 5001
```

2. **Push to GitHub**:
```bash
git add .
git commit -m "Add AI service"
git push origin main
```

3. **Deploy on Render**:
- Go to https://render.com
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Select `python-ai-ml` directory
- Click "Create Web Service"

4. **Get Your URL**:
```
https://petcare-ai-service.onrender.com
```

5. **Update Frontend `.env`**:
```env
VITE_AI_SERVICE_URL=https://petcare-ai-service.onrender.com
```

---

### **Option 2: Railway.app (Easy - FREE)**

#### Steps:

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login**:
```bash
railway login
```

3. **Deploy**:
```bash
cd python-ai-ml
railway init
railway up
```

4. **Get URL**:
```bash
railway domain
```

5. **Update Frontend**:
```env
VITE_AI_SERVICE_URL=https://your-service.railway.app
```

---

### **Option 3: Heroku (Popular)**

#### Steps:

1. **Create `Procfile`** in `python-ai-ml/`:
```
web: python app.py
```

2. **Create `runtime.txt`**:
```
python-3.11.0
```

3. **Update `app.py`** for Heroku port:
```python
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
```

4. **Deploy**:
```bash
heroku login
heroku create petcare-ai-service
git push heroku main
```

5. **Get URL**:
```bash
heroku open
```

---

### **Option 4: AWS EC2 (Production)**

#### Steps:

1. **Launch EC2 Instance**:
- Ubuntu 22.04 LTS
- t2.micro (free tier)
- Open port 5001

2. **Connect via SSH**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3 python3-venv python3-pip -y

# Clone repo
git clone your-repo-url
cd python-ai-ml

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test run
python app.py
```

4. **Setup as Service** (systemd):
```bash
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
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl start ai-service
sudo systemctl enable ai-service
sudo systemctl status ai-service
```

5. **Setup Nginx (Optional)**:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/ai-service
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### **Option 5: Docker (Best for Production)**

#### Create `Dockerfile` in `python-ai-ml/`:
```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5001

# Set environment
ENV FLASK_ENV=production

# Run application
CMD ["python", "app.py"]
```

#### Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  ai-service:
    build: .
    ports:
      - "5001:5001"
    environment:
      - FLASK_ENV=production
      - FLASK_PORT=5001
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
```

#### Deploy:
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔧 Environment Variables for Production

### Create `.env` file:
```env
# Server
FLASK_PORT=5001
FLASK_HOST=0.0.0.0
FLASK_ENV=production

# Model
MODEL_TYPE=MobileNetV2
MODEL_WEIGHTS=imagenet
CONFIDENCE_THRESHOLD=0.5

# Security
BACKEND_API_KEY=your-secret-key-here

# Logging
LOG_LEVEL=INFO
LOG_FILE=ai_service.log
```

### Load in app.py:
```python
from dotenv import load_dotenv
load_dotenv()
```

---

## 📊 Performance Optimization for Production

### 1. Use Gunicorn (Production Server)

Add to `requirements.txt`:
```
gunicorn==21.2.0
```

Update start command:
```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

### 2. Enable Caching

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/petshop/identify-breed', methods=['POST'])
@cache.cached(timeout=300)  # Cache for 5 minutes
def identify_breed():
    # ... your code
```

### 3. Add Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: request.remote_addr,
    default_limits=["100 per hour"]
)

@app.route('/api/petshop/identify-breed', methods=['POST'])
@limiter.limit("10 per minute")
def identify_breed():
    # ... your code
```

---

## 🔒 Security for Production

### 1. Add API Key Authentication

```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != os.getenv('BACKEND_API_KEY'):
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/petshop/identify-breed', methods=['POST'])
@require_api_key
def identify_breed():
    # ... your code
```

### 2. Enable HTTPS

Use Let's Encrypt with Nginx:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Add CORS Restrictions

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-frontend-domain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "X-API-Key"]
    }
})
```

---

## 📈 Monitoring

### 1. Health Check Endpoint

Already implemented at `/health`

### 2. Add Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_service.log'),
        logging.StreamHandler()
    ]
)
```

### 3. Error Tracking (Optional)

Add Sentry:
```bash
pip install sentry-sdk[flask]
```

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()]
)
```

---

## ✅ Pre-Deployment Checklist

- [ ] Virtual environment created and tested
- [ ] All dependencies in requirements.txt
- [ ] .env file configured (not committed to git)
- [ ] .gitignore includes venv/ and .env
- [ ] Health check endpoint works
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] CORS configured for your frontend domain
- [ ] API key authentication (if needed)
- [ ] Tested with production data
- [ ] Backup plan if service fails

---

## 🐛 Common Hosting Issues

### Issue 1: Port Already in Use
**Solution:**
```bash
# Change port in .env
FLASK_PORT=5002
```

### Issue 2: TensorFlow Too Large for Free Tier
**Solution:**
Use tensorflow-cpu:
```bash
pip uninstall tensorflow
pip install tensorflow-cpu==2.15.0
```

### Issue 3: Out of Memory
**Solution:**
- Use smaller model
- Reduce batch size
- Upgrade to paid tier
- Use Docker with memory limits

### Issue 4: Slow Cold Starts
**Solution:**
- Keep service warm with cron job
- Use paid tier with always-on
- Implement model caching

---

## 📞 Support

**Need Help?**
- Check logs: `tail -f ai_service.log`
- Test locally first: `python app.py`
- Verify venv: `which python` (should show venv path)
- Check dependencies: `pip list`

**Common Commands:**
```bash
# Check if service is running
curl http://localhost:5001/health

# View logs
tail -f ai_service.log

# Restart service (systemd)
sudo systemctl restart ai-service

# Check service status
sudo systemctl status ai-service
```

---

## 🎯 Recommended Setup

**For Development:**
- Use local venv
- Run with `start.bat` or `start.sh`

**For Production:**
- **Small Project:** Render.com (free tier)
- **Medium Project:** Railway.app or Heroku
- **Large Project:** AWS EC2 with Docker
- **Enterprise:** Kubernetes cluster

---

**Status: ✅ Ready for Deployment!**

Choose your hosting option and follow the steps above. The virtual environment will be automatically handled by the hosting platform or your deployment scripts.

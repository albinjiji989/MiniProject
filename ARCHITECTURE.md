# 🏗️ Pet Connect Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │ Flutter App  │  │   Mobile     │          │
│  │  (React)     │  │   (Dart)     │  │   Browser    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │                 │
                    │  VERCEL CDN     │
                    │  (Frontend)     │
                    │                 │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │                 │
                    │  VERCEL         │
                    │  Node.js API    │
                    │  (Backend)      │
                    │                 │
                    └────┬────────┬───┘
                         │        │
              ┌──────────┘        └──────────┐
              │                               │
     ┌────────▼────────┐           ┌─────────▼─────────┐
     │                 │           │                   │
     │  RAILWAY        │           │  MongoDB Atlas    │
     │  Python AI/ML   │           │  Database         │
     │  Service        │◄──────────┤                   │
     │                 │           │                   │
     └────────┬────────┘           └───────────────────┘
              │
     ┌────────▼────────┐
     │                 │
     │  Cloudinary     │
     │  Image Storage  │
     │                 │
     └─────────────────┘
```

---

## Component Details

### 1. Frontend (Vercel)
**Technology**: React / Next.js
**Hosting**: Vercel CDN
**URL**: `https://your-frontend.vercel.app`

**Responsibilities**:
- User interface
- Image uploads
- API requests to backend
- State management

---

### 2. Backend (Vercel)
**Technology**: Node.js + Express
**Hosting**: Vercel Serverless Functions
**URL**: `https://your-backend.vercel.app`

**Responsibilities**:
- Authentication & Authorization
- Business logic
- Database operations (MongoDB)
- Route requests to Python AI service
- File handling

**Key Routes**:
```
/api/auth/*          - Authentication
/api/users/*         - User management
/api/pets/*          - Pet management
/api/adoption/*      - Adoption system
/api/petshop/*       - Pet shop
/api/ecommerce/*     - E-commerce
/api/ai/*            - AI/ML endpoints (proxy to Railway)
```

---

### 3. Python AI/ML Service (Railway)
**Technology**: Python + Flask + TensorFlow
**Hosting**: Railway
**URL**: `https://your-app.railway.app`

**Responsibilities**:
- Pet breed identification (MobileNetV2)
- Species classification
- Adoption matching algorithms
- Inventory demand forecasting
- Product recommendations
- Image processing

**Key Endpoints**:
```
GET  /health                              - Health check
POST /api/petshop/identify-breed          - Breed identification
POST /api/petshop/identify-species        - Species identification
POST /api/adoption/identify               - Adoption matching
GET  /api/recommendations/adoption/:id    - Adoption recommendations
GET  /api/inventory/analyze/:id           - Inventory predictions
GET  /api/ecommerce/recommendations/:id   - Product recommendations
```

---

### 4. Database (MongoDB Atlas)
**Technology**: MongoDB
**Hosting**: MongoDB Atlas (Cloud)
**Connection**: All services connect via `MONGODB_URI`

**Collections**:
- users
- pets
- adoptions
- petshop_products
- ecommerce_products
- inventory
- orders
- recommendations

---

### 5. Image Storage (Cloudinary)
**Technology**: Cloudinary CDN
**Purpose**: Store and serve pet images

**Used by**:
- Backend (direct uploads)
- Python AI service (optional backup)

---

## Data Flow Examples

### Example 1: Pet Breed Identification

```
1. User uploads image in Frontend
   ↓
2. Frontend sends to Backend: POST /api/ai/identify-breed
   ↓
3. Backend forwards to Railway: POST /api/petshop/identify-breed
   ↓
4. Railway processes with TensorFlow model
   ↓
5. Railway returns predictions to Backend
   ↓
6. Backend returns to Frontend
   ↓
7. Frontend displays results to User
```

### Example 2: Adoption Recommendations

```
1. User views adoption page
   ↓
2. Frontend requests: GET /api/ai/adoption-recommendations/:userId
   ↓
3. Backend forwards to Railway
   ↓
4. Railway queries MongoDB for user preferences
   ↓
5. Railway runs ML matching algorithm
   ↓
6. Railway returns ranked pet recommendations
   ↓
7. Backend returns to Frontend
   ↓
8. Frontend displays recommended pets
```

### Example 3: Inventory Prediction

```
1. Manager views inventory dashboard
   ↓
2. Frontend requests: GET /api/ai/inventory/critical
   ↓
3. Backend forwards to Railway
   ↓
4. Railway queries MongoDB for sales history
   ↓
5. Railway runs forecasting model (Prophet/ARIMA)
   ↓
6. Railway returns restock recommendations
   ↓
7. Backend returns to Frontend
   ↓
8. Frontend displays critical items
```

---

## Environment Variables

### Backend (Vercel)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PYTHON_AI_SERVICE_URL=https://your-app.railway.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Python AI (Railway)
```env
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FLASK_HOST=0.0.0.0
FLASK_PORT=8000
DEBUG=False
```

---

## Security

### Authentication Flow
```
1. User logs in → Backend generates JWT
2. Frontend stores JWT in localStorage
3. All requests include JWT in Authorization header
4. Backend verifies JWT before processing
5. Backend forwards authenticated requests to Railway
```

### API Security
- CORS enabled for specific origins
- Rate limiting on all endpoints
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection
- Helmet security headers

---

## Scalability

### Current Setup
- **Frontend**: Auto-scales (Vercel CDN)
- **Backend**: Auto-scales (Vercel Serverless)
- **Python AI**: 2 workers (Railway)
- **Database**: Shared cluster (MongoDB Atlas)

### Scaling Options

**If traffic increases:**
1. Upgrade Railway to more workers
2. Upgrade MongoDB to dedicated cluster
3. Add Redis caching layer
4. Implement CDN for API responses
5. Use load balancer for Python service

---

## Monitoring

### Health Checks
```bash
# Frontend
curl https://your-frontend.vercel.app

# Backend
curl https://your-backend.vercel.app/api/health

# Python AI
curl https://your-app.railway.app/health
```

### Logs
- **Vercel**: Dashboard → Deployments → Function Logs
- **Railway**: Dashboard → Deployments → View Logs
- **MongoDB**: Atlas → Monitoring

---

## Cost Breakdown

| Service | Free Tier | Paid Tier | Current |
|---------|-----------|-----------|---------|
| Vercel (Frontend) | 100GB bandwidth | $20/month | Free |
| Vercel (Backend) | 100GB bandwidth | $20/month | Free |
| Railway | $5 credit/month | $5/month | Free |
| MongoDB Atlas | 512MB storage | $9/month | Free |
| Cloudinary | 25GB storage | $89/month | Free |

**Total**: $0/month (Free tier)
**Recommended**: $5/month (Railway Pro for no cold starts)

---

## Deployment Workflow

```
1. Developer pushes code to GitHub
   ↓
2. Vercel auto-deploys frontend & backend
   ↓
3. Railway auto-deploys Python service
   ↓
4. All services connect to MongoDB Atlas
   ↓
5. Health checks verify deployment
   ↓
6. Production ready! ✅
```

---

## Backup & Recovery

### Database Backups
- MongoDB Atlas: Daily automatic backups
- Retention: 7 days (free tier)

### Code Backups
- GitHub: Version control
- Vercel: Deployment history
- Railway: Deployment history

### Disaster Recovery
1. Restore MongoDB from Atlas backup
2. Redeploy from GitHub
3. Verify environment variables
4. Test all endpoints

---

## Future Enhancements

1. **Caching Layer**: Add Redis for frequently accessed data
2. **Message Queue**: Add RabbitMQ for async processing
3. **Microservices**: Split backend into smaller services
4. **GraphQL**: Replace REST with GraphQL
5. **WebSockets**: Real-time notifications
6. **CDN**: Add CloudFlare for better performance
7. **Monitoring**: Add Sentry for error tracking

---

This architecture provides a solid foundation for your Pet Connect application with room to scale as your user base grows! 🚀

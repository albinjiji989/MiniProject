# Pet Welfare Backend

Backend API for the Pet Welfare Management System built with Node.js, Express, and MongoDB.

## Features

- RESTful API design
- JWT-based authentication
- Role-based access control
- MongoDB with Mongoose ODM
- Input validation with express-validator
- Security middleware (Helmet, Rate limiting)
- File upload support with Firebase Storage
- Email notifications with Nodemailer

## API Structure

### Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Module Routes
- `/api/pets` - Pet management
- `/api/adoption` - Adoption management
- `/api/shelter` - Shelter management
- `/api/rescue` - Rescue management
- `/api/ecommerce` - E-commerce management
- `/api/pharmacy` - Pharmacy management
- `/api/boarding` - Boarding management
- `/api/temporary-care` - Temporary care management
- `/api/veterinary` - Veterinary management
- `/api/users` - User management

## Database Models

### User Model
- User authentication and profile information
- Role-based permissions
- Module assignments

### Pet Model
- Complete pet information
- Medical history tracking
- Vaccination records
- Previous owner information
- Geospatial location data

### Module-specific Models
Each management module has its own models for data persistence.

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file with the following variables:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

The API follows RESTful conventions with the following response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Validation errors (if applicable)
  ]
}
```

## Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## Security

- Helmet.js for security headers
- Input validation and sanitization
- CORS configuration
- Rate limiting
- JWT token expiration

# Pet Welfare Management System

A comprehensive centralized pet welfare management system built with Node.js, Express, MongoDB, React, and Material-UI.

## Features

### Core Modules
- **Adoption Management** - Handle pet adoption processes, applications, and follow-ups
- **Shelter Management** - Manage animal shelters, capacity, and staff
- **Street Animal Rescue Management** - Coordinate rescue operations and emergency responses
- **E-Commerce Management** - Online store for pet products and supplies
- **Pharmacy Management** - Veterinary medication and prescription management
- **Boarding Management** - Pet boarding services and room management
- **Temporary Pet Care Management** - Temporary care services and caregiver management
- **Veterinary Management** - Veterinary clinics, appointments, and medical records

### Key Features
- **Role-based Access Control** - Super admin and module-specific admins
- **Comprehensive Pet Tracking** - Complete pet history from medical records to previous owners
- **Geospatial Support** - Location-based pet and shelter management
- **Real-time Notifications** - Activity tracking and alerts
- **Responsive Design** - Mobile-friendly interface
- **Secure Authentication** - JWT-based authentication system

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Firebase Storage
- Nodemailer
- Express Validator
- Helmet (Security)
- Rate Limiting

### Frontend
- React 18
- Vite
- Material-UI (MUI)
- TailwindCSS
- React Router
- React Query
- React Hook Form
- Axios

## Project Structure

```
PetWelfare/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PetWelfare
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
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

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Pets
- `GET /api/pets` - Get all pets
- `GET /api/pets/:id` - Get pet by ID
- `POST /api/pets` - Create new pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Module-specific endpoints
Each management module has its own set of endpoints following the pattern:
- `GET /api/{module}` - List items
- `POST /api/{module}` - Create item
- `GET /api/{module}/:id` - Get item by ID
- `PUT /api/{module}/:id` - Update item
- `DELETE /api/{module}/:id` - Delete item

## User Roles

- **Super Admin** - Full system access
- **Module Admins** - Access to specific modules:
  - Adoption Admin
  - Shelter Admin
  - Rescue Admin
  - E-commerce Admin
  - Pharmacy Admin
  - Boarding Admin
  - Temporary Care Admin
  - Veterinary Admin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

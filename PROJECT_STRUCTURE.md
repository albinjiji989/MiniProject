# Pet Welfare Management System - Restructured Project Structure

## Overview
The project has been restructured to have separate folders for each management system in both backend and frontend, making it more modular and maintainable.

## Backend Structure

```
backend/
├── models/
│   ├── User.js                    # User authentication and roles
│   ├── Pet.js                     # Pet information and tracking
│   ├── adoption/
│   │   └── Adoption.js            # Adoption applications and management
│   ├── shelter/
│   │   └── Shelter.js             # Shelter information and capacity
│   ├── rescue/
│   │   └── Rescue.js              # Street animal rescue cases
│   ├── ecommerce/
│   │   ├── Product.js             # E-commerce products
│   │   └── Order.js               # E-commerce orders
│   ├── pharmacy/
│   │   ├── Medication.js          # Pharmacy medications
│   │   ├── Prescription.js        # Veterinary prescriptions
│   │   └── InventoryTransaction.js # Inventory tracking
│   ├── boarding/
│   │   ├── Boarding.js            # Pet boarding records
│   │   └── Room.js                # Boarding room management
│   ├── temporaryCare/
│   │   ├── TemporaryCare.js       # Temporary care records
│   │   └── Caregiver.js           # Caregiver profiles
│   └── veterinary/
│       ├── Veterinary.js          # Veterinary clinics
│       ├── Appointment.js         # Veterinary appointments
│       └── MedicalRecord.js       # Medical records
├── routes/
│   ├── auth.js                    # Authentication routes
│   ├── users.js                   # User management routes
│   ├── pets.js                    # Pet management routes
│   ├── adoption/
│   │   └── adoption.js            # Adoption management routes
│   ├── shelter/
│   │   └── shelter.js             # Shelter management routes
│   ├── rescue/
│   │   └── rescue.js              # Rescue management routes
│   ├── ecommerce/
│   │   └── ecommerce.js           # E-commerce management routes
│   ├── pharmacy/
│   │   └── pharmacy.js            # Pharmacy management routes
│   ├── boarding/
│   │   └── boarding.js            # Boarding management routes
│   ├── temporaryCare/
│   │   └── temporaryCare.js       # Temporary care management routes
│   └── veterinary/
│       └── veterinary.js          # Veterinary management routes
├── middleware/
│   └── auth.js                    # Authentication middleware
├── server.js                      # Main server file
└── package.json
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/                # Layout components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── UI/                    # Reusable UI components
│   │   │   └── LoadingSpinner.jsx
│   │   └── ProtectedRoute/        # Route protection
│   │       └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Auth/                  # Authentication pages
│   │   │   └── Login.jsx
│   │   ├── Dashboard/             # Main dashboard
│   │   │   └── Dashboard.jsx
│   │   ├── Pets/                  # Pet management
│   │   │   ├── Pets.jsx
│   │   │   ├── PetDetails.jsx
│   │   │   └── AddPet.jsx
│   │   ├── Adoption/              # Adoption management
│   │   │   ├── Adoption.jsx
│   │   │   ├── AdoptionDetails.jsx
│   │   │   ├── AdoptionDashboard.jsx
│   │   │   └── AdoptionApplications.jsx
│   │   ├── Shelter/               # Shelter management
│   │   │   ├── Shelter.jsx
│   │   │   └── ShelterDashboard.jsx
│   │   ├── Rescue/                # Rescue management
│   │   │   ├── Rescue.jsx
│   │   │   └── RescueDashboard.jsx
│   │   ├── Ecommerce/             # E-commerce management
│   │   │   └── Ecommerce.jsx
│   │   ├── Pharmacy/              # Pharmacy management
│   │   │   └── Pharmacy.jsx
│   │   ├── Boarding/              # Boarding management
│   │   │   └── Boarding.jsx
│   │   ├── TemporaryCare/         # Temporary care management
│   │   │   └── TemporaryCare.jsx
│   │   ├── Veterinary/            # Veterinary management
│   │   │   └── Veterinary.jsx
│   │   ├── Users/                 # User management
│   │   │   └── Users.jsx
│   │   └── Profile/               # User profile
│   │       └── Profile.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx        # Authentication context
│   ├── hooks/
│   │   └── useAuth.js             # Authentication hook
│   ├── services/
│   │   └── api.js                 # API service functions
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # App entry point
│   └── index.css                  # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Management Systems

### 1. Adoption Management
- **Backend**: `models/adoption/`, `routes/adoption/`
- **Frontend**: `pages/Adoption/`
- **Features**: Application processing, home visits, approval workflow, follow-up tracking

### 2. Shelter Management
- **Backend**: `models/shelter/`, `routes/shelter/`
- **Frontend**: `pages/Shelter/`
- **Features**: Shelter capacity, staff management, pet assignments, facility management

### 3. Street Animal Rescue Management
- **Backend**: `models/rescue/`, `routes/rescue/`
- **Frontend**: `pages/Rescue/`
- **Features**: Emergency reporting, rescue team coordination, cost tracking, medical attention

### 4. E-Commerce Management
- **Backend**: `models/ecommerce/`, `routes/ecommerce/`
- **Frontend**: `pages/Ecommerce/`
- **Features**: Product catalog, inventory management, order processing, customer management

### 5. Pharmacy Management
- **Backend**: `models/pharmacy/`, `routes/pharmacy/`
- **Frontend**: `pages/Pharmacy/`
- **Features**: Medication inventory, prescription management, stock tracking, dispensing

### 6. Boarding Management
- **Backend**: `models/boarding/`, `routes/boarding/`
- **Frontend**: `pages/Boarding/`
- **Features**: Room management, pet care tracking, health monitoring, billing

### 7. Temporary Pet Care Management
- **Backend**: `models/temporaryCare/`, `routes/temporaryCare/`
- **Frontend**: `pages/TemporaryCare/`
- **Features**: Caregiver management, care requests, daily reports, expense tracking

### 8. Veterinary Management
- **Backend**: `models/veterinary/`, `routes/veterinary/`
- **Frontend**: `pages/Veterinary/`
- **Features**: Clinic management, appointment scheduling, medical records, billing

## Benefits of This Structure

1. **Modularity**: Each management system is self-contained
2. **Scalability**: Easy to add new management systems
3. **Maintainability**: Clear separation of concerns
4. **Team Development**: Different teams can work on different modules
5. **Code Organization**: Easy to find and modify specific functionality
6. **Testing**: Each module can be tested independently

## API Endpoints Structure

Each management system has its own set of endpoints:

- **Adoption**: `/api/adoption/*`
- **Shelter**: `/api/shelter/*`
- **Rescue**: `/api/rescue/*`
- **E-commerce**: `/api/ecommerce/*`
- **Pharmacy**: `/api/pharmacy/*`
- **Boarding**: `/api/boarding/*`
- **Temporary Care**: `/api/temporary-care/*`
- **Veterinary**: `/api/veterinary/*`

## Role-Based Access Control

Each management system respects the role-based access control:
- **Super Admin**: Access to all systems
- **Module Admins**: Access only to their assigned modules
- **Module-specific routes**: Protected by `authorizeModule` middleware

This structure provides a clean, organized, and scalable foundation for the Pet Welfare Management System.

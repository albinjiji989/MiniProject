# Pet Welfare Frontend

Frontend application for the Pet Welfare Management System built with React, Vite, Material-UI, and TailwindCSS.

## Features

- Modern React 18 with hooks
- Material-UI component library
- TailwindCSS for styling
- Responsive design
- Role-based navigation
- JWT authentication
- React Query for data fetching
- Form handling with React Hook Form

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Notistack** - Notification system

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout/         # Layout components
│   ├── UI/             # UI components
│   └── ProtectedRoute/ # Route protection
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard page
│   ├── Pets/           # Pet management pages
│   └── [Module]/       # Module-specific pages
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── services/           # API services
└── App.jsx             # Main app component
```

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file with the following variables:

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

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Features

### Authentication
- Login/logout functionality
- JWT token management
- Protected routes
- User profile management

### Dashboard
- Overview statistics
- Recent activities
- Quick actions
- Module overview

### Pet Management
- Pet listing and search
- Pet details view
- Add/edit pet information
- Medical history tracking

### Module Management
Each management module includes:
- Data listing and filtering
- CRUD operations
- Role-based access control
- Responsive design

## Styling

The application uses a combination of Material-UI and TailwindCSS:

- **Material-UI** for complex components and theming
- **TailwindCSS** for utility classes and custom styling
- **Custom CSS** for specific design requirements

## State Management

- **React Context** for authentication state
- **React Query** for server state management
- **Local state** with React hooks for component state

## API Integration

All API calls are centralized in the `services/api.js` file with:
- Axios instance configuration
- Request/response interceptors
- Error handling
- Authentication token management

## Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

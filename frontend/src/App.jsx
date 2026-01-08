import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ForcePassword from './pages/Auth/ForcePassword'
import ModuleAdminRegister from './pages/Auth/ModuleAdminRegister'
import Landing from './pages/Landing/Landing'
import About from './pages/Static/About'
import Contact from './pages/Static/Contact'
import Dashboard from './pages/Dashboard/Dashboard'
import PublicUserDashboard from './pages/User/PublicUserDashboard'
import AdminRoutes from './routes/AdminRoutes'
import UserRoutes from './routes/UserRoutes'
import ManagerRoutes from './routes/ManagerRoutes'
import ProtectedRoute from './core/components/ProtectedRoute'
import StoreNameSetup from './pages/Manager/StoreNameSetup'

// E-Commerce Manager Pages
import ProductManagement from './modules/ecommerce/manager/ProductManagement'
import CategoryManagement from './modules/ecommerce/manager/CategoryManagement'
import OrderManagement from './modules/ecommerce/manager/OrderManagement'

// E-Commerce User Pages
import ProductBrowse from './modules/ecommerce/user/ProductBrowse'
import Cart from './modules/ecommerce/user/Cart'
import Checkout from './modules/ecommerce/user/Checkout'

function App() {
  const { user, loading } = useAuth()

  // Helper function to determine the redirect path
  const getRedirectPath = (user) => {
    console.log('getRedirectPath called with user:', user);
    
    if (!user) {
      console.log('No user, returning null');
      return null;
    }
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      console.log('Admin user, redirecting to admin dashboard');
      return '/admin/dashboard';
    }
    
    if (typeof user.role === 'string' && user.role.endsWith('_manager')) {
      console.log('Manager user detected:', user.role);
      // Check both the needsStoreNameSetup property and the actual storeName
      const needsStoreSetup = !user.storeName || user.storeName.trim() === '';
      console.log('Store setup check:', { needsStoreSetup, storeName: user.storeName, needsStoreNameSetup: user.needsStoreNameSetup });
      
      if (user.needsStoreNameSetup || needsStoreSetup) {
        console.log('Manager needs store setup, redirecting to store setup');
        return '/manager/store-name-setup';
      }
      
      switch (user.role) {
        case 'adoption_manager':
          console.log('Adoption manager, redirecting to adoption dashboard');
          return '/manager/adoption/dashboard';
        case 'petshop_manager':
          console.log('Petshop manager, redirecting to petshop dashboard');
          return '/manager/petshop/dashboard';
        case 'ecommerce_manager':
          console.log('Ecommerce manager, redirecting to ecommerce dashboard');
          return '/manager/ecommerce/dashboard';
        case 'pharmacy_manager':
          console.log('Pharmacy manager, redirecting to pharmacy dashboard');
          return '/manager/pharmacy/dashboard';
        case 'rescue_manager':
          console.log('Rescue manager, redirecting to rescue dashboard');
          return '/manager/rescue/dashboard';
        case 'veterinary_manager':
          console.log('Veterinary manager, redirecting to veterinary dashboard');
          return '/manager/veterinary/dashboard';
        case 'temporary_care_manager':
          console.log('Temporary care manager, redirecting to temporary care dashboard');
          return '/manager/temporary-care/dashboard';
        default:
          console.log('Unknown manager type, redirecting to general manager dashboard');
          return '/manager/dashboard';
      }
    }
    
    // Workers (staff) redirects
    if (typeof user.role === 'string' && user.role.endsWith('_worker')) {
      console.log('Worker user detected:', user.role);
      switch (user.role) {
        case 'veterinary_worker':
          console.log('Veterinary worker, redirecting to staff dashboard');
          return '/manager/veterinary/staff-dashboard';
        default:
          console.log('Other worker, redirecting to user dashboard');
          return '/User/dashboard';
      }
    }
    
    console.log('Regular user, redirecting to user dashboard');
    return '/User/dashboard';
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          loading
            ? null
            : (user
                ? <Navigate to={getRedirectPath(user)} replace />
                : <Landing />)
        } 
      />

      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route 
        path="/login" 
        element={
          user
            ? <Navigate to={getRedirectPath(user)} replace />
            : <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          loading
            ? null
            : (user
                ? <Navigate to={getRedirectPath(user)} replace />
                : <Register />)
        } 
      />
      <Route 
        path="/forgot-password" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/User/dashboard" replace />) : <ForgotPassword />} 
      />
      <Route 
        path="/force-password" 
        element={<ForcePassword />} 
      />
      <Route 
        path="/register-module-admin" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/User/dashboard" replace />) : <ModuleAdminRegister />} 
      />
      
      {/* Dashboard route - standalone with its own navigation */}
      <Route
        path="/User/dashboard"
        element={
          <ProtectedRoute>
            <PublicUserDashboard />
          </ProtectedRoute>
        }
      />
      {/* Back-compat redirect */}
      <Route path="/dashboard" element={<Navigate to="/User/dashboard" replace />} />
      
      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />
      
      {/* User protected routes */}
      <Route
        path="/User/*"
        element={
          <ProtectedRoute>
            <UserRoutes />
          </ProtectedRoute>
        }
      />
      
      {/* Manager routes */}
      <Route
        path="/manager/*"
        element={<ManagerRoutes />} />
      
      {/* Manager Store Name Setup - Outside ProtectedRoute to avoid infinite loop */}
      <Route
        path="/manager/store-name-setup"
        element={<StoreNameSetup />} />
      
      {/* E-Commerce Manager Routes */}
      <Route path="/manager/ecommerce/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
      <Route path="/manager/ecommerce/categories" element={<ProtectedRoute><CategoryManagement /></ProtectedRoute>} />
      <Route path="/manager/ecommerce/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
      
      {/* E-Commerce User Routes */}
      <Route path="/ecommerce/products" element={<ProductBrowse />} />
      <Route path="/ecommerce/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/ecommerce/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      
      {/* Compatibility routes */}
      <Route path="/manager/adoptions/*" element={<Navigate to="/manager/adoption" replace />} />
      <Route path="/User/manager/adoptions/*" element={<Navigate to="/manager/adoption" replace />} />
      
      {/* Back-compat redirects for old user paths */}
      <Route path="/pets/*" element={<Navigate to="/User/pets" replace />} />
      <Route path="/adoption/*" element={<Navigate to="/User/adoption" replace />} />
      <Route path="/petshop/*" element={<Navigate to="/User/petshop" replace />} />
      <Route path="/rescue/*" element={<Navigate to="/User/rescue" replace />} />
      <Route path="/ecommerce/*" element={<Navigate to="/User/ecommerce" replace />} />
      <Route path="/pharmacy/*" element={<Navigate to="/User/pharmacy" replace />} />
      <Route path="/temporary-care/*" element={<Navigate to="/User/temporary-care" replace />} />
      <Route path="/veterinary/*" element={<Navigate to="/User/veterinary" replace />} />
    </Routes>
  )
}

export default App
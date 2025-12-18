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

function App() {
  const { user, loading } = useAuth()

  // Helper function to determine the redirect path
  const getRedirectPath = (user) => {
    if (!user) return null;
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      return '/admin/dashboard';
    }
    
    if (typeof user.role === 'string' && user.role.endsWith('_manager')) {
      if (user.needsStoreSetup) {
        return '/manager/store-setup';
      }
      if (user.needsStoreNameSetup) {
        return '/manager/store-name-setup';
      }
      
      switch (user.role) {
        case 'adoption_manager':
          return '/manager/adoption/dashboard';
        case 'petshop_manager':
          return '/manager/petshop/dashboard';
        case 'ecommerce_manager':
          return '/manager/ecommerce/dashboard';
        case 'pharmacy_manager':
          return '/manager/pharmacy/dashboard';
        case 'rescue_manager':
          return '/manager/rescue/dashboard';
        case 'veterinary_manager':
          return '/manager/veterinary/dashboard';
        case 'temporary_care_manager':
          return '/manager/temporary-care/dashboard';
        default:
          return '/manager/dashboard';
      }
    }
    // Workers (staff) redirects
    if (typeof user.role === 'string' && user.role.endsWith('_worker')) {
      switch (user.role) {
        case 'veterinary_worker':
          return '/manager/veterinary/staff-dashboard';
        default:
          return '/User/dashboard';
      }
    }
    
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
        element={
          <ProtectedRoute>
            <ManagerRoutes />
          </ProtectedRoute>
        }
      />
      
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
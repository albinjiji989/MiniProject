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
import PublicUserDashboard from './pages/Dashboard/PublicUserDashboard'
// Admin-named dashboards removed in favor of Manager dashboards
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ManagerManagement from './pages/Admin/ManagerManagement'
import UserManagement from './pages/Admin/UserManagement'
import RoleManagement from './pages/Admin/RoleManagement'
import ModuleManagement from './pages/Admin/ModuleManagement'
import DataTracking from './pages/Admin/DataTracking'
import ShelterManagerDashboard from './modules/managers/Shelter/ShelterManagerDashboard'
import TemporaryCareManagerDashboard from './modules/managers/TemporaryCare/TemporaryCareManagerDashboard'
import EcommerceManagerDashboard from './modules/managers/Ecommerce/EcommerceManagerDashboard'
import AdoptionManagerDashboard from './modules/managers/Adoption/AdoptionManagerDashboard'
import RescueManagerDashboard from './modules/managers/Rescue/RescueManagerDashboard'
import PharmacyManagerDashboard from './modules/managers/Pharmacy/PharmacyManagerDashboard'
import VeterinaryManagerDashboard from './modules/managers/Veterinary/VeterinaryManagerDashboard'
import Pets from './pages/Pets/Pets'
import PetDetails from './pages/Pets/PetDetails'
import AddPet from './pages/Pets/AddPet'
import Adoption from './pages/Adoption/Adoption'
import AdoptionDetails from './pages/Adoption/AdoptionDetails'
import AdoptionDashboard from './pages/Adoption/AdoptionDashboard'
import AdoptionApplications from './pages/Adoption/AdoptionApplications'
import Shelter from './pages/Shelter/Shelter'
import ShelterDashboard from './pages/Shelter/ShelterDashboard'
import Rescue from './pages/Rescue/Rescue'
import RescueDashboard from './pages/Rescue/RescueDashboard'
import Ecommerce from './pages/Ecommerce/Ecommerce'
import Cart from './pages/Ecommerce/Cart'
import Orders from './pages/Ecommerce/Orders'
import ProductDetails from './pages/Ecommerce/ProductDetails'
import Pharmacy from './pages/Pharmacy/Pharmacy'
import TemporaryCare from './pages/TemporaryCare/TemporaryCare'
import Veterinary from './pages/Veterinary/Veterinary'
import RBACManagement from './pages/RBAC/RBACManagement'
import CoreManagement from './pages/Core/CoreManagement'
import Users from './pages/Users/Users'
import Profile from './pages/Profile/Profile'
import AdminManagement from './pages/Admin/AdminManagement'
import ProtectedRoute from './core/components/ProtectedRoute'
import LoadingSpinner from './components/UI/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Landing />} 
      />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route 
        path="/login" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Register />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <ForgotPassword />} 
      />
      <Route 
        path="/force-password" 
        element={<ForcePassword />} 
      />
      <Route 
        path="/register-module-admin" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <ModuleAdminRegister />} 
      />
      
      {/* Dashboard route - standalone with its own navigation */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin routes with AdminLayout */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/managers" element={<ManagerManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/tracking" element={<DataTracking />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Other protected routes with Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/pets" element={<Pets />} />
                <Route path="/pets/add" element={<AddPet />} />
                <Route path="/pets/:id" element={<PetDetails />} />
                <Route path="/adoption" element={<AdoptionDashboard />} />
                <Route path="/adoption/applications" element={<AdoptionApplications />} />
                <Route path="/adoption/:id" element={<AdoptionDetails />} />
                <Route path="/shelter" element={<ShelterDashboard />} />
                <Route path="/rescue" element={<RescueDashboard />} />
                <Route path="/ecommerce" element={<Ecommerce />} />
                <Route path="/ecommerce/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/pharmacy" element={<Pharmacy />} />
                {false && <Route path="/boarding" element={<Boarding />} />}
                <Route path="/temporary-care" element={<TemporaryCare />} />
                <Route path="/veterinary" element={<Veterinary />} />
                {false && <Route path="/donation" element={<DonationDashboard />} />}
                <Route path="/rbac" element={<RBACManagement />} />
                <Route path="/core" element={<CoreManagement />} />
                <Route path="/users" element={<Users />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin-management" element={<AdminManagement />} />
                
                {/* Module Dashboards (Admin and Manager aliases) */}
                <Route path="/dashboard/public" element={<PublicUserDashboard />} />
                <Route path="/dashboard/shelter-admin" element={<ShelterManagerDashboard />} />
                <Route path="/dashboard/shelter-manager" element={<ShelterManagerDashboard />} />
                <Route path="/dashboard/temporary-care-admin" element={<TemporaryCareManagerDashboard />} />
                <Route path="/dashboard/temporary-care-manager" element={<TemporaryCareManagerDashboard />} />
                {false && <Route path="/dashboard/donation-admin" element={<div />} />}
                <Route path="/dashboard/ecommerce-admin" element={<EcommerceManagerDashboard />} />
                <Route path="/dashboard/ecommerce-manager" element={<EcommerceManagerDashboard />} />
                <Route path="/dashboard/adoption-admin" element={<AdoptionManagerDashboard />} />
                <Route path="/dashboard/adoption-manager" element={<AdoptionManagerDashboard />} />
                <Route path="/dashboard/rescue-admin" element={<RescueManagerDashboard />} />
                <Route path="/dashboard/rescue-manager" element={<RescueManagerDashboard />} />
                <Route path="/dashboard/pharmacy-admin" element={<PharmacyManagerDashboard />} />
                <Route path="/dashboard/pharmacy-manager" element={<PharmacyManagerDashboard />} />
                {false && <Route path="/dashboard/boarding-admin" element={<div />} />}
                <Route path="/dashboard/veterinary-admin" element={<VeterinaryManagerDashboard />} />
                <Route path="/dashboard/veterinary-manager" element={<VeterinaryManagerDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

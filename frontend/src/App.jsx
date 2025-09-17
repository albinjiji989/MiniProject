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
import ShelterAdminDashboard from './pages/Dashboard/ShelterAdminDashboard'
import TemporaryCareAdminDashboard from './pages/Dashboard/TemporaryCareAdminDashboard'
import EcommerceAdminDashboard from './pages/Dashboard/EcommerceAdminDashboard'
import AdoptionAdminDashboard from './pages/Dashboard/AdoptionAdminDashboard'
import RescueAdminDashboard from './pages/Dashboard/RescueAdminDashboard'
import PharmacyAdminDashboard from './pages/Dashboard/PharmacyAdminDashboard'
import VeterinaryAdminDashboard from './pages/Dashboard/VeterinaryAdminDashboard'
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
import UserManagement from './pages/Admin/UserManagement'
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
        element={user ? <Navigate to="/dashboard" replace /> : <Landing />} 
      />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
      />
      <Route 
        path="/force-password" 
        element={<ForcePassword />} 
      />
      <Route 
        path="/register-module-admin" 
        element={user ? <Navigate to="/dashboard" replace /> : <ModuleAdminRegister />} 
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
                <Route path="/user-management" element={<UserManagement />} />
                
                {/* Module Admin Dashboards */}
                <Route path="/dashboard/public" element={<PublicUserDashboard />} />
                <Route path="/dashboard/shelter-admin" element={<ShelterAdminDashboard />} />
                <Route path="/dashboard/temporary-care-admin" element={<TemporaryCareAdminDashboard />} />
                {false && <Route path="/dashboard/donation-admin" element={<div />} />}
                <Route path="/dashboard/ecommerce-admin" element={<EcommerceAdminDashboard />} />
                <Route path="/dashboard/adoption-admin" element={<AdoptionAdminDashboard />} />
                <Route path="/dashboard/rescue-admin" element={<RescueAdminDashboard />} />
                <Route path="/dashboard/pharmacy-admin" element={<PharmacyAdminDashboard />} />
                {false && <Route path="/dashboard/boarding-admin" element={<div />} />}
                <Route path="/dashboard/veterinary-admin" element={<VeterinaryAdminDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

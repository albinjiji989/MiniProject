import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import ManagerManagement from '../pages/Admin/ManagerManagement'
import UserManagement from '../pages/Admin/UserManagement'
import RoleManagement from '../pages/Admin/RoleManagement'
import ModuleManagement from '../pages/Admin/ModuleManagement'
import PetSystemRequests from '../pages/Admin/PetSystemRequests'
import PetManagementDashboard from '../pages/Admin/PetManagement/PetManagementDashboard'
import SpeciesManagement from '../pages/Admin/SpeciesManagement'
import BreedManagement from '../pages/Admin/BreedsManagement'
import CustomBreedRequests from '../pages/Admin/CustomBreedRequests'
import PetCategories from '../pages/Admin/PetManagement/PetCategories'
import CentralizedPetDashboard from '../pages/Admin/Dashboard/CentralizedPetDashboard'
import CentralizedPetDetails from '../components/Pet/CentralizedPetDetails'
import PetManagementOverview from '../pages/Admin/PetManagement/PetManagementOverview'
import PetManagement from '../pages/Admin/PetManagement/PetManagement'
import PetForm from '../pages/Admin/PetManagement/PetForm'
import PetDetailsAdmin from '../pages/Admin/PetManagement/PetDetails'
import PetImport from '../pages/Admin/PetManagement/PetImport'
import PetRegistry from '../pages/Admin/PetManagement/PetRegistry'
import PetRegistryDetails from '../pages/Admin/PetManagement/PetRegistryDetails'
import Profile from '../pages/Profile/Profile'
import TestPage from '../pages/Admin/TestPage'
import TestDebug from '../pages/Admin/TestDebug'
import DebugPage from '../pages/Admin/DebugPage'
import TemporaryCareAdminDashboard from '../pages/Admin/TemporaryCareAdminDashboard'

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="managers" element={<ManagerManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="modules" element={<ModuleManagement />} />
        {/* Pet Management Routes */}
        <Route path="pets" element={<PetManagementDashboard />} />
        <Route path="pet-categories" element={<PetCategories />} />
        <Route path="species" element={<SpeciesManagement />} />
        <Route path="breeds" element={<BreedManagement />} />
        <Route path="custom-breed-requests" element={<CustomBreedRequests />} />
        <Route path="pet-system-requests" element={<PetSystemRequests />} />
        <Route path="pet-management" element={<PetManagementOverview />} />
        <Route path="pet-management/all" element={<PetManagement />} />
        <Route path="pet-management/add" element={<PetForm />} />
        <Route path="pet-management/import" element={<PetImport />} />
        <Route path="pet-management/:id" element={<PetDetailsAdmin />} />
        <Route path="pet-registry" element={<PetRegistry />} />
        <Route path="pet-registry/:petCode" element={<PetRegistryDetails />} />
        {/* Test route */}
        <Route path="test" element={<TestPage />} />
        <Route path="test-debug" element={<TestDebug />} />
        
        {/* Debug route to test if any route matches */}
        <Route path="debug" element={<DebugPage />} />
        <Route path="temporary-care" element={<TemporaryCareAdminDashboard />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default AdminRoutes
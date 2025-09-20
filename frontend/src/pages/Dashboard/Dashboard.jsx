import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AdminDashboard from '../Admin/AdminDashboard'
import StaffDashboard from './StaffDashboard'
import PublicUserDashboard from '../../modules/public/PublicUserDashboard'
import AdoptionManagerDashboard from '../../modules/managers/Adoption/AdoptionManagerDashboard'
import VeterinaryManagerDashboard from '../../modules/managers/Veterinary/VeterinaryManagerDashboard'
import PharmacyManagerDashboard from '../../modules/managers/Pharmacy/PharmacyManagerDashboard'
import EcommerceManagerDashboard from '../../modules/managers/Ecommerce/EcommerceManagerDashboard'
import ShelterManagerDashboard from '../../modules/managers/Shelter/ShelterManagerDashboard'
import TemporaryCareManagerDashboard from '../../modules/managers/TemporaryCare/TemporaryCareManagerDashboard'
import RescueManagerDashboard from '../../modules/managers/Rescue/RescueManagerDashboard'
import TemporaryCareWorkerDashboard from './TemporaryCareWorkerDashboard'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Route users to appropriate dashboard based on their role
  const renderDashboard = () => {
    if (!user) {
      return <div>Loading...</div>
    }

    const role = user.role

    // Admin Dashboard (formerly Super Admin)
    if (role === 'admin') {
      return <AdminDashboard />
    }

    // Specific Module Manager Dashboards
    if (role === 'shelter_manager') {
      return <ShelterManagerDashboard />
    }

    if (role === 'temporary-care_manager') {
      return <TemporaryCareManagerDashboard />
    }

    if (role === 'donation_manager') {
      return <PublicUserDashboard />
    }

    if (role === 'ecommerce_manager') {
      return <EcommerceManagerDashboard />
    }

    if (role === 'adoption_manager') {
      return <AdoptionManagerDashboard />
    }
    
    if (role === 'rescue_manager') {
      return <RescueManagerDashboard />
    }

    if (role === 'veterinary_manager') {
      return <VeterinaryManagerDashboard />
    }

    if (role === 'pharmacy_manager') {
      return <PharmacyManagerDashboard />
    }

    if (role === 'boarding_manager') {
      return <PublicUserDashboard />
    }

    // Staff/Worker Dashboards
    if (role === 'temporary_care_worker') {
      return <TemporaryCareWorkerDashboard />
    }
    if (role.includes('_worker') || role.includes('_staff')) {
      return <StaffDashboard />
    }

    // Public User Dashboard (default)
    return <PublicUserDashboard />
  }

  return renderDashboard()
}

export default Dashboard
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import StaffDashboard from './StaffDashboard'
import PublicUserDashboard from '../User/Dashboard'
import AdoptionManagerDashboard from '../../modules/managers/Adoption/AdoptionManagerDashboard'
import VeterinaryManagerDashboard from '../../modules/managers/Veterinary/VeterinaryManagerDashboard'
import PharmacyManagerDashboard from '../../modules/managers/Pharmacy/PharmacyManagerDashboard'
import EcommerceManagerDashboard from '../../modules/managers/Ecommerce/EcommerceManagerDashboard'
import PetShopManagerDashboard from '../../modules/managers/PetShop/PetShopManagerDashboard'
import TemporaryCareManagerDashboard from '../../modules/managers/TemporaryCare/TemporaryCareManagerDashboard'
import RescueManagerDashboard from '../../modules/managers/Rescue/RescueManagerDashboard'
import TemporaryCareWorkerDashboard from './TemporaryCareWorkerDashboard'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect admin users to proper admin dashboard
  React.useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
      return
    }
  }, [user, navigate])

  // Route users to appropriate dashboard based on their role
  const renderDashboard = () => {
    if (!user) {
      return <div>Loading...</div>
    }

    const role = user.role

    // Admin users should be redirected to /admin/dashboard
    if (role === 'admin') {
      return <div>Redirecting to admin dashboard...</div>
    }

    // Specific Module Manager Dashboards
    if (role === 'petshop_manager') {
      return <PetShopManagerDashboard />
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
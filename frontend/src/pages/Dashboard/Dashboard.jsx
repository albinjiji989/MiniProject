import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SuperAdminDashboard from './SuperAdminDashboard'
import StaffDashboard from './StaffDashboard'
import PublicUserDashboard from './PublicUserDashboard'
import AdoptionAdminDashboard from './AdoptionAdminDashboard'
import VeterinaryAdminDashboard from './VeterinaryAdminDashboard'
import PharmacyAdminDashboard from './PharmacyAdminDashboard'
import EcommerceAdminDashboard from './EcommerceAdminDashboard'
import ShelterAdminDashboard from './ShelterAdminDashboard'
import TemporaryCareAdminDashboard from './TemporaryCareAdminDashboard'
import RescueAdminDashboard from './RescueAdminDashboard'
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

    // Super Admin Dashboard
    if (role === 'super_admin') {
      return <SuperAdminDashboard />
    }

    // Specific Module Admin Dashboards
    if (role === 'shelter_admin') {
      return <ShelterAdminDashboard />
    }

    if (role === 'temporary_care_admin') {
      return <TemporaryCareAdminDashboard />
    }

    if (role === 'donation_admin') {
      return <PublicUserDashboard />
    }

    if (role === 'ecommerce_admin') {
      return <EcommerceAdminDashboard />
    }

    if (role === 'adoption_admin') {
      return <AdoptionAdminDashboard />
    }
    
    if (role === 'rescue_admin') {
      return <RescueAdminDashboard />
    }

    if (role === 'veterinary_admin') {
      return <VeterinaryAdminDashboard />
    }

    if (role === 'pharmacy_admin') {
      return <PharmacyAdminDashboard />
    }

    if (role === 'boarding_admin') {
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
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DashboardRedirect = () => {
  const { user, loading, token } = useAuth()

  if (loading) return null
  if (!token) return <Navigate to="/login" replace />

  const role = user?.role || ''
  
  // Direct mapping for specific manager roles
  if (role === 'adoption_manager') {
    return <Navigate to="/manager/adoption/dashboard" replace />
  }
  if (role === 'petshop_manager') {
    return <Navigate to="/manager/petshop/dashboard" replace />
  }
  if (role === 'ecommerce_manager') {
    return <Navigate to="/manager/ecommerce/dashboard" replace />
  }
  if (role === 'pharmacy_manager') {
    return <Navigate to="/manager/pharmacy/dashboard" replace />
  }
  if (role === 'rescue_manager') {
    return <Navigate to="/manager/rescue/dashboard" replace />
  }
  if (role === 'veterinary_manager') {
    return <Navigate to="/manager/veterinary/dashboard" replace />
  }
  if (role === 'temporary_care_manager' || role === 'temporary-care_manager') {
    return <Navigate to="/manager/temporary-care/dashboard" replace />
  }

  // Fallback for any other manager roles
  if (typeof role === 'string' && role.endsWith('_manager')) {
    return <Navigate to="/manager/dashboard" replace />
  }

  // Admin roles
  if (role === 'admin' || role === 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  // Default fallback
  return <Navigate to="/User/dashboard" replace />
}

export default DashboardRedirect

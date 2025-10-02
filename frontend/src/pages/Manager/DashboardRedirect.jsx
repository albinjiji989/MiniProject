import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DashboardRedirect = () => {
  const { user, loading, token } = useAuth()

  if (loading) return null
  if (!token) return <Navigate to="/login" replace />

  const role = user?.role || ''
  // Map each manager role to its landing path
  const map = {
    adoption_manager: '/manager/adoption/dashboard',
    ecommerce_manager: '/manager/ecommerce/dashboard',
    pharmacy_manager: '/manager/pharmacy/dashboard',
    rescue_manager: '/manager/rescue/dashboard',
    petshop_manager: '/manager/petshop/dashboard',
    'temporary-care_manager': '/manager/temporary-care/dashboard',
    veterinary_manager: '/manager/veterinary/dashboard',
  }

  if (role.endsWith('_manager')) {
    const target = map[role] || '/User/dashboard'
    return <Navigate to={target} replace />
  }

  // Non-manager fallback
  if (role === 'admin' || role === 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Navigate to="/User/dashboard" replace />
}

export default DashboardRedirect

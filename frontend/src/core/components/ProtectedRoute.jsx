import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth()

  // While verifying token/user, avoid redirects to prevent loops
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    )
  }

  // Only rely on in-memory token; if none, redirect to landing page
  if (!token) {
    return <Navigate to="/" replace />
  }

  // If user must change password, redirect to force password page
  if (user?.mustChangePassword) {
    return <Navigate to="/force-password" replace />
  }

  return children
}

export default ProtectedRoute
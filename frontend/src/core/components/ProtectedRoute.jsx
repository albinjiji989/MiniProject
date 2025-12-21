import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth()

  console.log('ProtectedRoute - user state:', { user, token, loading });

  // While verifying token/user, avoid redirects to prevent loops
  if (loading) {
    console.log('ProtectedRoute - still loading');
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
    console.log('ProtectedRoute - no token, redirecting to landing');
    return <Navigate to="/" replace />
  }

  // If user must change password, redirect to force password page
  if (user?.mustChangePassword) {
    console.log('ProtectedRoute - user must change password, redirecting to force password');
    return <Navigate to="/force-password" replace />
  }

  // If manager needs store setup, redirect to store setup page
  // Check both the needsStoreNameSetup property and the actual storeName
  const isModuleManager = user?.role?.endsWith('_manager');
  const needsStoreSetup = isModuleManager && (!user?.storeName || user?.storeName?.trim() === '');
  
  console.log('ProtectedRoute - store setup check:', { isModuleManager, needsStoreSetup, needsStoreNameSetup: user?.needsStoreNameSetup, storeName: user?.storeName });
  
  if (user?.needsStoreNameSetup || needsStoreSetup) {
    console.log('ProtectedRoute - manager needs store setup, redirecting to store setup');
    return <Navigate to="/manager/store-name-setup" replace />
  }
  
  // Special handling for managers to ensure they stay in the right place
  const isManagerRoute = window.location.pathname.startsWith('/manager/');
  const isManager = user?.role?.endsWith('_manager');
  
  if (isManager && isManagerRoute) {
    console.log('ProtectedRoute - manager on manager routes, allowing access');
    // Don't redirect managers away from manager routes
  }

  console.log('ProtectedRoute - allowing access to children');
  return children
}

export default ProtectedRoute
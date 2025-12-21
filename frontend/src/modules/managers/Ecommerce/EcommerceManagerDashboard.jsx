import React from 'react'
import { useAuth } from '../../../contexts/AuthContext'

const EcommerceManagerDashboard = () => {
  const { user } = useAuth()
  
  return (
    <div style={{ padding: 24 }}>
      <h2>E-commerce Manager Dashboard</h2>
      
      {/* Store Identity Badge */}
      {user?.role?.includes('manager') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ padding: '4px 12px', backgroundColor: '#e3f2fd', borderRadius: 16, fontWeight: 'bold' }}>
            Store ID: {user?.storeId || 'Pending assignment'}
          </span>
          <span style={{ padding: '4px 12px', backgroundColor: user?.storeName ? '#e8f5e9' : '#fff3e0', borderRadius: 16, fontWeight: 'bold' }}>
            Store Name: {user?.storeName || 'Not set'}
          </span>
        </div>
      )}
      
      <p>Welcome, manager. Your E-commerce tools will appear here.</p>
      <a href="/dashboard/ecommerce-manager/manage" style={{ display: 'inline-block', marginTop: 12 }}>Go to Manage</a>
    </div>
  )
}

export default EcommerceManagerDashboard



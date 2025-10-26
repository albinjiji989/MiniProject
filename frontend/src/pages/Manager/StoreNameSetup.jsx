import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, temporaryCareAPI, petShopAPI, veterinaryAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext' // Fix the import

const StoreNameSetup = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [moduleKey, setModuleKey] = useState('')
  const [pincode, setPincode] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // Get the module information from the user context
        if (!mounted) return
        const moduleKeyVal = user?.assignedModule || user?.role?.replace('_manager', '') || 'adoption'
        setModuleKey(moduleKeyVal)
        setStoreId(user?.storeId || '')
        
        // Fetch the latest store information from the API
        const moduleKeyLower = (user?.assignedModule || user?.role || '').toLowerCase()
        let storeData = null
        
        try {
          if (moduleKeyLower.includes('temporary-care')) {
            const response = await temporaryCareAPI.getMyStore()
            storeData = response.data?.data
          } else if (moduleKeyLower.includes('petshop')) {
            const response = await petShopAPI.getMyStore()
            storeData = response.data?.data
          } else if (moduleKeyLower.includes('veterinary')) {
            const response = await veterinaryAPI.managerGetMyStore()
            storeData = response.data?.data
          }
        } catch (apiError) {
          // If API call fails, fall back to user context data
          console.warn('Failed to fetch store data from API, using user context:', apiError)
        }
        
        // Use API data if available, otherwise fall back to user context
        if (storeData) {
          setStoreName(storeData.storeName || storeData.name || user?.storeName || '')
          setStoreId(storeData.storeId || storeData.id || user?.storeId || '')
        } else {
          setStoreName(user?.storeName || '')
          setStoreId(user?.storeId || '')
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load store info')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!storeName || storeName.trim().length < 3) {
      setError('Please enter a valid store name (min 3 characters).')
      return
    }
    
    // Validate pincode if provided
    if (pincode && pincode.length !== 6) {
      setError('Pincode must be exactly 6 digits.')
      return
    }
    
    if (pincode && !/^\d{6}$/.test(pincode)) {
      setError('Pincode must contain only digits.')
      return
    }
    
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')
      
      // Prepare data for update
      const updateData = { storeName: storeName.trim() }
      if (pincode) {
        updateData.pincode = pincode
      }
      
      // If module is temporary-care, use its dedicated endpoint to generate storeId and save name
      const moduleKeyLower = (user?.assignedModule || user?.role || '').toLowerCase()
      let response = null;
      if (moduleKeyLower.includes('temporary-care')) {
        response = await temporaryCareAPI.updateMyStore(updateData)
      } else if (moduleKeyLower.includes('petshop')) {
        response = await petShopAPI.updateMyStore(updateData)
      } else if (moduleKeyLower.includes('veterinary')) {
        response = await veterinaryAPI.managerUpdateMyStore(updateData)
      } else {
        response = await authAPI.updateProfile(updateData)
      }
      
      // Refresh auth state to get updated user data
      try { await refreshUser() } catch (_) {}
      
      // Show success message for veterinary managers
      if (moduleKeyLower.includes('veterinary')) {
        setSuccessMessage('Store information saved successfully. A clinic has been automatically created for your store.')
        // Wait a bit before redirecting so user can see the message
        setTimeout(() => {
          window.location.href = '/manager/dashboard'
        }, 2000)
      } else {
        // Redirect to dashboard immediately for other modules
        window.location.href = '/manager/dashboard'
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save store info')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '64px auto', padding: 24 }}>
        <h2>Setting things up…</h2>
        <p>Please wait while we load your manager profile.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Set up your Store</h1>
      <p style={{ color: '#555', marginTop: 0 }}>This is required once for module managers to continue.</p>

      <div style={{ background: '#f7f7f9', padding: 16, borderRadius: 8, marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Module</label>
            <input value={moduleKey} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', background: '#fafafa' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Store ID</label>
            <input value={storeId} readOnly placeholder="Will be generated" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', background: '#fafafa' }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Store Name</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g., Happy Paws Adoption Center"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
          <small style={{ color: '#777' }}>A unique ID will be generated automatically based on your module.</small>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Pincode (Optional)</label>
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g., 123456"
            maxLength="6"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
          <small style={{ color: '#777' }}>Enter a 6-digit pincode for your store location.</small>
        </div>
        {error && (
          <div style={{ color: '#b00020', marginTop: 8 }}>{error}</div>
        )}
        {successMessage && (
          <div style={{ color: '#006400', backgroundColor: '#f0fff0', padding: 12, borderRadius: 8, marginTop: 8 }}>
            {successMessage}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#5b8cff',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving…' : 'Save and Continue'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{ padding: '10px 14px', borderRadius: 8, background: '#eee', border: '1px solid #ddd', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreNameSetup
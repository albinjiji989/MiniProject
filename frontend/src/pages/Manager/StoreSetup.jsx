import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI, petShopAPI, authAPI, temporaryCareAPI, veterinaryAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const StoreSetup = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [moduleKey, setModuleKey] = useState('')

  // Get the correct API based on user role
  const getModuleAPI = () => {
    const role = user?.role || ''
    if (role.includes('adoption')) return adoptionAPI
    if (role.includes('petshop')) return petShopAPI
    if (role.includes('temporary-care') || role.includes('temporary_care')) return temporaryCareAPI
    if (role.includes('veterinary')) return veterinaryAPI
    return petShopAPI // fallback
  }

  // Get the correct method names based on API
  const getAPIMethod = (methodType) => {
    const moduleAPI = getModuleAPI()
    // Veterinary API uses different naming convention
    if (moduleAPI === veterinaryAPI) {
      return methodType === 'get' ? 'managerGetMyStore' : 'managerUpdateMyStore'
    }
    return methodType === 'get' ? 'getMyStore' : 'updateMyStore'
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const moduleAPI = getModuleAPI()
        const getMethod = getAPIMethod('get')
        const res = await moduleAPI[getMethod]()
        if (!mounted) return
        const data = res?.data?.data || {}
        setModuleKey(data.assignedModule || user?.assignedModule || '')
        setStoreId(data.storeId || user?.storeId || '')
        setStoreName(data.storeName || user?.storeName || '')
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Failed to load store info')
        }
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
    try {
      setSaving(true)
      setError('')
      const moduleAPI = getModuleAPI()
      const updateMethod = getAPIMethod('update')
      await moduleAPI[updateMethod]({ storeName: storeName.trim() })
      // Refresh auth state to get updated user data
      try { await refreshUser() } catch (_) {}
      // Redirect to dashboard immediately
      navigate('/manager/dashboard')

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
            placeholder="e.g., Happy Paws Pet Shop"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
          <small style={{ color: '#777' }}>A unique ID will be generated automatically based on your module.</small>
        </div>
        {error && (
          <div style={{ color: '#b00020', marginTop: 8 }}>{error}</div>
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

export default StoreSetup

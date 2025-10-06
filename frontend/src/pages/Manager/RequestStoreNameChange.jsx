import React, { useState } from 'react'
import { petShopAPI } from '../../services/api'

const RequestStoreNameChange = () => {
  const [requestedStoreName, setRequestedStoreName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!requestedStoreName || requestedStoreName.trim().length < 3) {
      setError('Please enter a valid store name (min 3 characters).')
      return
    }
    try {
      setSubmitting(true)
      await petShopAPI.requestStoreNameChange(requestedStoreName.trim(), reason.trim())
      setMessage('Request submitted to admin. You will be notified once it is reviewed.')
      setRequestedStoreName('')
      setReason('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2>Request Store Name Change</h2>
      <p style={{ color: '#555' }}>Submit a request to the admin to change your store name. Your store ID will remain the same.</p>
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>New Store Name</label>
          <input
            value={requestedStoreName}
            onChange={(e) => setRequestedStoreName(e.target.value)}
            placeholder="e.g., Happy Paws Premium"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you changing the store name?"
            rows={4}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
        {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
        {message && <div style={{ color: '#0a7b45', marginBottom: 8 }}>{message}</div>}
        <button type="submit" disabled={submitting} style={{ padding: '10px 14px', borderRadius: 8, background: '#5b8cff', color: 'white', border: 'none', fontWeight: 600 }}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}

export default RequestStoreNameChange

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { temporaryCareAPI, petsAPI } from '../../../services/api'

const RequestForm = () => {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [centers, setCenters] = useState([])
  const [pet, setPet] = useState('')
  const [storeId, setStoreId] = useState('')
  const [careType, setCareType] = useState('vacation')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [myPets, publicCenters] = await Promise.all([
          petsAPI.getPets({ mine: true }),
          temporaryCareAPI.listPublicCenters()
        ])
        if (!mounted) return
        setPets(myPets.data?.data || myPets.data || [])
        setCenters(publicCenters.data?.data?.centers || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load form data')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const validateForm = () => {
    if (!pet) {
      setError('Please select a pet')
      return false
    }
    
    if (!storeId) {
      setError('Please select a care center')
      return false
    }
    
    if (!startDate) {
      setError('Please select a start date')
      return false
    }
    
    if (!endDate) {
      setError('Please select an end date')
      return false
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start < today) {
      setError('Start date cannot be in the past')
      return false
    }
    
    if (end <= start) {
      setError('End date must be after start date')
      return false
    }
    
    // Check if booking is at least 1 day in advance
    const oneDayAdvance = new Date(today)
    oneDayAdvance.setDate(oneDayAdvance.getDate() + 1)
    if (start < oneDayAdvance) {
      setError('Booking must be at least 1 day in advance')
      return false
    }
    
    if (totalAmount && (isNaN(totalAmount) || parseFloat(totalAmount) <= 0)) {
      setError('Total amount must be a positive number')
      return false
    }
    
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSaving(true)
      setError('')
      
      const payload = { 
        pet, 
        storeId, 
        careType, 
        startDate, 
        endDate, 
        notes 
      }
      
      if (totalAmount) {
        payload.totalAmount = parseFloat(totalAmount)
      }
      
      await temporaryCareAPI.submitRequest(payload)
      navigate('/User/temporary-care')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Request Temporary Care</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Note: You must book at least 1 day in advance. Only one pet can be added at a time.
      </p>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={submit} style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Select Pet *</label>
          <select value={pet} onChange={(e) => setPet(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} required>
            <option value="">Choose your pet…</option>
            {pets.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Select Center *</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} required>
            <option value="">Choose a center…</option>
            {centers.map(c => (
              <option key={c.storeId} value={c.storeId}>{c.name} ({c.storeId})</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Start Date *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>End Date *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Care Type</label>
          <select value={careType} onChange={(e) => setCareType(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
            <option value="vacation">Vacation</option>
            <option value="emergency">Emergency</option>
            <option value="medical">Medical</option>
            <option value="temporary">Temporary</option>
            <option value="foster">Foster</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Total Amount (Optional)</label>
          <input 
            type="number" 
            value={totalAmount} 
            onChange={(e) => setTotalAmount(e.target.value)} 
            placeholder="Enter total amount (if known)" 
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} 
            min="0"
            step="0.01"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, background: '#5b8cff', color: 'white', border: 'none' }}>{saving ? 'Submitting…' : 'Submit Request'}</button>
          <button type="button" onClick={() => navigate('/User/temporary-care')} style={{ padding: '10px 14px', borderRadius: 8, background: '#eee', border: '1px solid #ddd' }}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default RequestForm
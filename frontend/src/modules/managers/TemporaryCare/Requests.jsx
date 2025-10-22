import React, { useEffect, useState } from 'react'
import { temporaryCareAPI } from '../../../services/api'

const Requests = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [decisionLoading, setDecisionLoading] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [caregivers, setCaregivers] = useState([])
  const [selectedCaregiver, setSelectedCaregiver] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const [reqs, cgs] = await Promise.all([
        temporaryCareAPI.managerListRequests({}),
        temporaryCareAPI.listCaregivers({})
      ])
      setItems(reqs.data?.data?.requests || [])
      setCaregivers(cgs.data?.data || cgs.data?.caregivers || cgs.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const decide = async (id, decision) => {
    try {
      setDecisionLoading(id)
      await temporaryCareAPI.managerDecideRequest(id, decision)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update')
    } finally {
      setDecisionLoading(null)
    }
  }

  const assign = async (id) => {
    if (!selectedCaregiver) return
    try {
      setAssigningId(id)
      await temporaryCareAPI.managerAssignRequest(id, selectedCaregiver)
      setSelectedCaregiver('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign')
    } finally {
      setAssigningId(null)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Temporary Care Requests</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      {items.length === 0 ? (
        <div>No requests yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(r => (
            <div key={r._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{r?.pet?.name || 'Pet'} · {r.careType} · {r.status}</div>
              <div style={{ color: '#555' }}>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => decide(r._id, 'approved')} disabled={decisionLoading === r._id || r.status !== 'pending'} style={{ padding: '6px 10px' }}>Approve</button>
                <button onClick={() => decide(r._id, 'declined')} disabled={decisionLoading === r._id || r.status !== 'pending'} style={{ padding: '6px 10px' }}>Decline</button>
                <span style={{ marginLeft: 12 }}>Assign to:</span>
                <select value={selectedCaregiver} onChange={(e) => setSelectedCaregiver(e.target.value)} style={{ padding: 6 }}>
                  <option value="">Choose caregiver…</option>
                  {Array.isArray(caregivers) && caregivers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button onClick={() => assign(r._id)} disabled={!selectedCaregiver || assigningId === r._id} style={{ padding: '6px 10px' }}>Assign</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Requests



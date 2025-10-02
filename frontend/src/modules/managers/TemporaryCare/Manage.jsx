import React, { useEffect, useState } from 'react'
import { temporaryCareAPI } from '../../../services/api'

const TemporaryCareManage = () => {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await temporaryCareAPI.listCareRequests()
      setRequests(res.data?.data?.requests || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editing) {
        await temporaryCareAPI.updateTemporaryCare(editing, { title: form.title })
      } else {
        await temporaryCareAPI.createTemporaryCare({ title: form.title })
      }
      setForm({ title: '' })
      setEditing(null)
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Temporary Care Management</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={onChange} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '' }) }} disabled={loading}>Cancel</button>}
        </div>
      </form>
      {loading && <div>Loading...</div>}
      <ul>
        {requests.map((r) => (
          <li key={r._id || r.id}>
            <strong>{r.title || r._id}</strong>
            <button onClick={() => { setEditing(r._id || r.id); setForm({ title: r.title || '' }) }} disabled={loading} style={{ marginLeft: 8 }}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TemporaryCareManage



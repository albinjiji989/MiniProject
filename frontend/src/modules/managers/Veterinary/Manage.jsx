import React, { useEffect, useState } from 'react'
import { veterinaryAPI } from '../../../services/api'

const VeterinaryManage = () => {
  const [clinics, setClinics] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await veterinaryAPI.getClinics()
      setClinics(res.data?.data?.clinics || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load clinics')
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
        await veterinaryAPI.updateClinic(editing, { name: form.name })
      } else {
        await veterinaryAPI.createClinic({ name: form.name })
      }
      setForm({ name: '' })
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
      <h2>Veterinary Management</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        <input name="name" placeholder="Clinic Name" value={form.name} onChange={onChange} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '' }) }} disabled={loading}>Cancel</button>}
        </div>
      </form>
      {loading && <div>Loading...</div>}
      <ul>
        {clinics.map((c) => (
          <li key={c._id || c.id}>
            <strong>{c.name}</strong>
            <button onClick={() => { setEditing(c._id || c.id); setForm({ name: c.name || '' }) }} disabled={loading} style={{ marginLeft: 8 }}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default VeterinaryManage
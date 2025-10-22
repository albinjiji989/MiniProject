import React, { useEffect, useState } from 'react'
import { temporaryCareAPI } from '../../../services/api'

const Caregivers = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await temporaryCareAPI.listCaregivers({})
      setItems(res.data?.data || res.data?.caregivers || res.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load caregivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await temporaryCareAPI.createCaregiver(form)
      setForm({ name: '', email: '', phone: '' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save caregiver')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Caregivers</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 480, marginBottom: 16 }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Caregiver'}</button>
      </form>
      <ul>
        {Array.isArray(items) && items.map(c => (
          <li key={c._id}>
            {c.name} · {c.email} · {c.phone} · {c.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Caregivers



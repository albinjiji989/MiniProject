import React, { useEffect, useState } from 'react'
import { veterinaryAPI } from '../../../services/api'

const Staff = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'assistant' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await veterinaryAPI.managerListStaff()
      setItems(res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await veterinaryAPI.managerCreateStaff(form)
      setForm({ name: '', email: '', phone: '', role: 'assistant' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create staff')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Veterinary Staff</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 520, marginBottom: 16 }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="assistant">Assistant</option>
          <option value="reception">Reception</option>
        </select>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Staff'}</button>
      </form>

      <ul>
        {Array.isArray(items) && items.map(s => (
          <li key={s._id}>{s.name} · {s.role} · {s.email} · {s.phone}</li>
        ))}
      </ul>
    </div>
  )
}

export default Staff



import React, { useEffect, useState } from 'react'
import { adoptionAPI as api } from '../../../services/api'

const AdoptionManage = () => {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ petId: '', adopterId: '', status: 'pending' })
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.getAdoptions()
      setItems(res.data?.data?.adoptions || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load adoptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      if (editingId) {
        await api.updateStatus(editingId, { status: form.status })
      } else {
        await api.createAdoption({ petId: form.petId, adopterId: form.adopterId })
      }
      setForm({ petId: '', adopterId: '', status: 'pending' })
      setEditingId(null)
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = (a) => {
    setEditingId(a._id || a.id)
    setForm({ petId: a.petId || '', adopterId: a.adopterId || '', status: a.status || 'pending' })
  }

  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Adoption Management</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        {!editingId && (
          <>
            <input name="petId" placeholder="Pet ID" value={form.petId} onChange={onChange} required />
            <input name="adopterId" placeholder="Adopter ID" value={form.adopterId} onChange={onChange} required />
          </>
        )}
        {editingId && (
          <select name="status" value={form.status} onChange={onChange}>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="completed">completed</option>
          </select>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editingId ? 'Update Status' : 'Create'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ petId: '', adopterId: '', status: 'pending' }) }} disabled={loading}>Cancel</button>}
        </div>
      </form>
      {loading && <div>Loading...</div>}
      <ul>
        {items.map((a) => (
          <li key={a._id || a.id}>
            {(a.petName || a.pet?.name || a.petId)} — {a.status}
            <button style={{ marginLeft: 8 }} onClick={() => onEdit(a)} disabled={loading}>Edit Status</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdoptionManage



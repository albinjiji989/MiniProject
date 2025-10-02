import React, { useEffect, useState } from 'react'
import { pharmacyAPI } from '../../../services/api'

const PharmacyManage = () => {
  const [meds, setMeds] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', inStock: true })
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await pharmacyAPI.getMedications()
      setMeds(res.data?.data?.medications || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load medications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const payload = { name: form.name, dosage: form.dosage, inStock: !!form.inStock }
      if (editingId) {
        await pharmacyAPI.updateMedication(editingId, payload)
      } else {
        await pharmacyAPI.createMedication(payload)
      }
      setForm({ name: '', dosage: '', inStock: true })
      setEditingId(null)
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = (m) => {
    setEditingId(m._id || m.id)
    setForm({ name: m.name || '', dosage: m.dosage || '', inStock: !!m.inStock })
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this medication?')) return
    try {
      setLoading(true)
      await pharmacyAPI.deleteMedication(id)
      await load()
    } catch (e3) {
      setError(e3?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Pharmacy Management</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="dosage" placeholder="Dosage" value={form.dosage} onChange={onChange} required />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" name="inStock" checked={!!form.inStock} onChange={onChange} /> In Stock
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', dosage: '', inStock: true }) }} disabled={loading}>Cancel</button>
          )}
        </div>
      </form>
      {loading && <div>Loading...</div>}
      <ul>
        {meds.map((m) => (
          <li key={m._id || m.id}>
            <strong>{m.name}</strong> — {m.dosage} {m.inStock ? '(in stock)' : '(out)'}
            <span style={{ marginLeft: 8 }}>
              <button onClick={() => onEdit(m)} disabled={loading}>Edit</button>
              <button onClick={() => onDelete(m._id || m.id)} disabled={loading} style={{ marginLeft: 6 }}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PharmacyManage



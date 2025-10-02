import React, { useEffect, useState } from 'react'
import { rescueAPI } from '../../../services/api'

const RescueManage = () => {
  const [rescues, setRescues] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '' })
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await rescueAPI.getRescues()
      setRescues(res.data?.data?.rescues || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load rescues')
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
      if (editingId) {
        await rescueAPI.assignRescue(editingId, { title: form.title })
      } else {
        await rescueAPI.createRescue({ title: form.title })
      }
      setForm({ title: '' })
      setEditingId(null)
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = (r) => { setEditingId(r._id || r.id); setForm({ title: r.title || '' }) }

  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Rescue Management</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={onChange} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '' }) }} disabled={loading}>Cancel</button>}
        </div>
      </form>
      {loading && <div>Loading...</div>}
      <ul>
        {rescues.map((r) => (
          <li key={r._id || r.id}>
            <strong>{r.title || r._id}</strong>
            <button onClick={() => onEdit(r)} disabled={loading} style={{ marginLeft: 8 }}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RescueManage



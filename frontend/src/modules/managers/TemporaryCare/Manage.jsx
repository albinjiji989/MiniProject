import React, { useEffect, useState } from 'react'
import { temporaryCareAPI } from '../../../services/api'

const Manage = () => {
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState({ storeId: '', storeName: '' })
  const [center, setCenter] = useState(null)
  const [name, setName] = useState('')
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [s, c] = await Promise.all([
          temporaryCareAPI.getMyStore(),
          temporaryCareAPI.getMyCenter()
        ])
        if (!mounted) return
        setStore({ storeId: s.data?.data?.storeId || '', storeName: s.data?.data?.storeName || '' })
        const centerDoc = c.data?.data?.center || null
        setCenter(centerDoc)
        setName(centerDoc?.name || '')
        setTotal(centerDoc?.capacity?.total || 0)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const saveCenter = async () => {
    try {
      setSaving(true)
      setError('')
      const payload = { name, capacity: { total: Number(total) || 0 } }
      await temporaryCareAPI.saveMyCenter(payload)
      const c = await temporaryCareAPI.getMyCenter()
      setCenter(c.data?.data?.center || null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Temporary Care Manager</h2>
      <div style={{ marginBottom: 16, color: '#555' }}>
        Store: <b>{store.storeName || 'Unnamed'}</b> ({store.storeId || 'No ID yet'})
      </div>

      <div style={{ background: '#fafafa', border: '1px solid #eee', padding: 16, borderRadius: 8, maxWidth: 640 }}>
        <h3 style={{ marginTop: 0 }}>Center Profile</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Center Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Capacity (Total)</label>
            <input value={total} onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
        </div>
        {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
        <button onClick={saveCenter} disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, background: '#5b8cff', color: '#fff', border: 'none' }}>{saving ? 'Saving…' : 'Save Center'}</button>
      </div>
    </div>
  )
}

export default Manage


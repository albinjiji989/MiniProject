import React, { useEffect, useState } from 'react'
import { ecommerceAPI } from '../../../services/api'

const emptyForm = { name: '', price: '', inStock: true }

const EcommerceManage = () => {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await ecommerceAPI.getProducts()
      setProducts(res.data?.data?.products || res.data?.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const payload = { name: form.name, price: Number(form.price) || 0, inStock: !!form.inStock }
      if (editingId) {
        await ecommerceAPI.updateProduct(editingId, payload)
      } else {
        await ecommerceAPI.createProduct(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = (p) => {
    setEditingId(p._id || p.id)
    setForm({ name: p.name || '', price: p.price ?? '', inStock: !!p.inStock })
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      setLoading(true)
      await ecommerceAPI.deleteProduct(id)
      await load()
    } catch (e3) {
      setError(e3?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>E-commerce Management</h2>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginBottom: 16 }}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="price" placeholder="Price" type="number" step="0.01" value={form.price} onChange={onChange} required />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" name="inStock" checked={!!form.inStock} onChange={onChange} /> In Stock
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} disabled={loading}>Cancel</button>
          )}
        </div>
      </form>

      {loading && <div>Loading...</div>}
      <ul style={{ paddingLeft: 16 }}>
        {products.map((p) => (
          <li key={p._id || p.id} style={{ marginBottom: 6 }}>
            <strong>{p.name}</strong> — ${p.price} {p.inStock ? '(in stock)' : '(out)'}
            <span style={{ marginLeft: 8 }}>
              <button onClick={() => onEdit(p)} disabled={loading}>Edit</button>
              <button onClick={() => onDelete(p._id || p.id)} disabled={loading} style={{ marginLeft: 6 }}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EcommerceManage



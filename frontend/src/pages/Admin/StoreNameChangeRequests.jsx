import React, { useEffect, useState } from 'react'
import { petShopAdminAPI } from '../../services/api'

const AdminStoreNameChangeRequests = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [decidingId, setDecidingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await petShopAdminAPI.listStoreNameChangeRequests({ page, limit, status: statusFilter || undefined })
      const data = res?.data?.data || {}
      setItems(data.requests || [])
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, statusFilter])

  const decide = async (id, decision) => {
    try {
      setDecidingId(id)
      await petShopAdminAPI.decideStoreNameChangeRequest(id, decision)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update request')
    } finally {
      setDecidingId(null)
    }
  }

  return (
    <div>
      <h2>Store Name Change Requests</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Status:</label>
        <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>User</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Store ID</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Current Name</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Requested Name</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map(req => (
              <tr key={req._id}>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{req.userId?.name} ({req.userId?.email})</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{req.storeId || '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{req.currentStoreName || '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{req.requestedStoreName}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{req.status}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => decide(req._id, 'approved')} disabled={decidingId===req._id} style={{ marginRight: 8, padding: '6px 10px', background: '#0ea5e9', border: 'none', color: 'white', borderRadius: 6 }}>Approve</button>
                      <button onClick={() => decide(req._id, 'declined')} disabled={decidingId===req._id} style={{ padding: '6px 10px', background: '#ef4444', border: 'none', color: 'white', borderRadius: 6 }}>Decline</button>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={(page * limit) >= total}>Next</button>
      </div>
    </div>
  )
}

export default AdminStoreNameChangeRequests

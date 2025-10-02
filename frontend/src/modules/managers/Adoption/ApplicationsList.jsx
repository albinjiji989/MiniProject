import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const ApplicationsList = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/adoption/manager/applications', { params: { status, page, limit } })
      setItems(res.data?.data?.applications || [])
      setTotal(res.data?.data?.pagination?.total || 0)
    } catch (e) {
      console.error('Load applications failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Applications</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border rounded" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>{ setPage(1); load() }}>Filter</button>
        </div>
      </div>
      {loading && <div>Loading...</div>}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(app => (
              <tr key={app._id}>
                <td className="px-6 py-4 text-sm">{app.userId?.name}<div className="text-gray-500">{app.userId?.email}</div></td>
                <td className="px-6 py-4 text-sm">{app.petId?.name}<div className="text-gray-500">{app.petId?.breed}</div></td>
                <td className="px-6 py-4 text-sm">{app.status}</td>
                <td className="px-6 py-4 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm"><button className="text-blue-600" onClick={()=>navigate(app._id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 border rounded" value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / limit))}</div>
          <button className="px-3 py-1 border rounded" disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  )
}

export default ApplicationsList

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rescueAPI } from '../../../services/api'

const RescueCases = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await rescueAPI.getRescues({ status })
      // backend likely returns { success, data } or { data: { rescues } }
      const data = res.data?.data?.rescues || res.data?.data || []
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load rescues', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rescue Cases</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border rounded" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={load}>Filter</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>navigate('new')}>Create Case</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(r => (
              <tr key={r._id}>
                <td className="px-6 py-4 text-sm">{r.pet?.name || r.petId || 'N/A'}</td>
                <td className="px-6 py-4 text-sm capitalize">{r.situation}</td>
                <td className="px-6 py-4 text-sm capitalize">{r.status || 'open'}</td>
                <td className="px-6 py-4 text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RescueCases

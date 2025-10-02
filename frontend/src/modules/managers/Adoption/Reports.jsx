import React, { useEffect, useState } from 'react'
import { apiClient } from '../../../services/api'

const Reports = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState({ startDate: '', endDate: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/adoption/manager/reports', { params: { ...range } })
      setData(res.data?.data || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Reports</h2>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border rounded" value={range.startDate} onChange={(e)=>setRange(r=>({...r, startDate: e.target.value}))} />
          <input type="date" className="px-3 py-2 border rounded" value={range.endDate} onChange={(e)=>setRange(r=>({...r, endDate: e.target.value}))} />
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={load}>Apply</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Application Status Distribution</h3>
            <div className="space-y-1">
              {(data.statusStats||[]).map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{String(s._id).replace('_',' ')}</span>
                  <span className="text-gray-700">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Revenue</h3>
            <div className="text-3xl font-bold text-emerald-600">₹{data.totalRevenue || 0}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports

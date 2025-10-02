import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const PetsList = () => {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(9)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [draftOnly, setDraftOnly] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/adoption/manager/pets', { params: { search: q, status, page, limit } })
      setPets(res.data?.data?.pets || [])
      setTotal(res.data?.data?.pagination?.total || 0)
    } catch (e) {
      console.error('Load pets failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit])

  const onDelete = async (id) => {
    if (!confirm('Delete this pet?')) return
    try {
      await apiClient.delete(`/adoption/manager/pets/${id}`)
      // Reload current page; adjust page if last item deleted
      const remaining = (total - 1) - ((page - 1) * limit)
      if (remaining <= 0 && page > 1) setPage(page - 1)
      else load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input className="px-3 py-2 border rounded" placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="px-3 py-2 border rounded" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="adopted">Adopted</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-2 py-2 border rounded">
            <input type="checkbox" checked={draftOnly} onChange={(e)=>setDraftOnly(e.target.checked)} />
            Show drafts only
          </label>
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>{ setPage(1); load() }}>Filter</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>navigate('new')}>Add Pet</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={()=>navigate('../import')}>Import CSV</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets
          .filter(pet => {
            if (!draftOnly) return true
            const isDraft = !pet.name || String(pet.name).startsWith('Unknown-') || !pet.breed || String(pet.breed).toLowerCase()==='unknown'
            return isDraft
          })
          .map(pet => (
          <div key={pet._id} className="bg-white border rounded p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <span>{pet.name}</span>
                  {pet.petCode && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{pet.petCode}</span>
                  )}
                </div>
                <div className="text-gray-600">{pet.breed} • {pet.species}</div>
              </div>
              <div className="flex items-center gap-2">
                {(!pet.name || String(pet.name).startsWith('Unknown-') || !pet.breed || String(pet.breed).toLowerCase()==='unknown') && (
                  <span className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">Draft</span>
                )}
                <span className="text-xs px-2 py-1 rounded bg-gray-100">{pet.status}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">Age: {pet.ageDisplay}</div>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>navigate(pet._id)}>View</button>
              <button className="px-3 py-1 bg-gray-600 text-white rounded" onClick={()=>navigate(pet._id + '/edit')}>Edit</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>onDelete(pet._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 border rounded" value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
          </select>
          <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / limit))}</div>
          <button className="px-3 py-1 border rounded" disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  )
}

export default PetsList

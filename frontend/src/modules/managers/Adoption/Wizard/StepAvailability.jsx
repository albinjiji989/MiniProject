import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'adopt_wizard'

export default function StepAvailability() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.availability || { availabilityStatus: 'available', adoptionFee: 0 } } catch { return { availabilityStatus: 'available', adoptionFee: 0 } }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, availability: { ...(prev.availability||{}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.availability)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    save({ [name]: name === 'adoptionFee' ? Number(value) : value })
  }

  const next = () => navigate('/manager/adoption/wizard/review')
  const back = () => navigate('/manager/adoption/wizard/health')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Availability Status</label>
          <select name="availabilityStatus" className="px-3 py-2 border rounded w-full" value={form.availabilityStatus||'available'} onChange={onChange}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="adopted">Adopted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Adoption Fee (₹)</label>
          <input name="adoptionFee" type="number" min="0" className="px-3 py-2 border rounded w-full" value={form.adoptionFee||0} onChange={onChange} />
        </div>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back}>Back</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}

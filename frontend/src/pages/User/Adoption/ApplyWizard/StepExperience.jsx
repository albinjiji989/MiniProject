import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'adopt_apply_wizard'

export default function StepExperience() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { 
      const savedData = JSON.parse(localStorage.getItem(KEY))?.experience || {}
      return { 
        adoptionReason: savedData.adoptionReason || '', 
        expectations: savedData.expectations || '', 
        petExperience: savedData.petExperience || 'none', 
        previousPets: savedData.previousPets || '' 
      }
    } catch { 
      return { adoptionReason: '', expectations: '', petExperience: 'none', previousPets: '' } 
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, experience: { ...(prev.experience || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.experience)
  }

  const onChange = (e) => save({ [e.target.name]: e.target.value || '' })

  const next = () => navigate('/User/adoption/apply/documents')
  const back = () => navigate('/User/adoption/apply/home')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Pet Experience</label>
          <select name="petExperience" className="px-3 py-2 border rounded w-full" value={form.petExperience || 'none'} onChange={onChange}>
            <option value="none">No experience</option>
            <option value="some">Some experience</option>
            <option value="extensive">Extensive experience</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Previous Pets</label>
          <input name="previousPets" className="px-3 py-2 border rounded w-full" value={form.previousPets || ''} onChange={onChange} placeholder="List previous pets if any" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Reason for Adoption</label>
          <textarea name="adoptionReason" className="px-3 py-2 border rounded w-full" rows={3} value={form.adoptionReason || ''} onChange={onChange} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Expectations</label>
          <textarea name="expectations" className="px-3 py-2 border rounded w-full" rows={3} value={form.expectations || ''} onChange={onChange} />
        </div>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back}>Back</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}
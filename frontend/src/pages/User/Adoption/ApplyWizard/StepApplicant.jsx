import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../../contexts/AuthContext'

const KEY = 'adopt_apply_wizard'

export default function StepApplicant() {
  const navigate = useNavigate()
  const { petId } = useParams()
  const { user } = useAuth()
  
  const [form, setForm] = useState(() => {
    try { 
      const savedData = JSON.parse(localStorage.getItem(KEY))?.applicant || {}
      return { 
        fullName: savedData.fullName || '', 
        email: savedData.email || '', 
        phone: savedData.phone || '', 
        petId: savedData.petId || '' 
      }
    } catch { 
      return { fullName: '', email: '', phone: '', petId: '' } 
    }
  })

  useEffect(() => {
    console.log('StepApplicant: URL petId =', petId)
    if (petId && !form.petId) {
      update({ petId })
    }
  }, [petId])

  // Prefill from logged-in user profile (editable)
  useEffect(() => {
    const prefill = () => {
      try {
        const u = user || {}
        const fullName = u.name || u.fullName || ''
        const email = u.email || ''
        const phone = u.phone || u.mobile || u.contact || ''
        const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
        const curr = prev.applicant || {}
        const patch = {}
        if (!curr.fullName && fullName) patch.fullName = fullName
        if (!curr.email && email) patch.email = email
        if (!curr.phone && phone) patch.phone = phone
        if (Object.keys(patch).length) update(patch)
      } catch (_) { /* ignore */ }
    }
    prefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const update = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, applicant: { ...(prev.applicant || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.applicant)
  }

  const onChange = (e) => update({ [e.target.name]: e.target.value || '' })
  const next = () => navigate(`/User/adoption/wizard/${petId}/home`)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Full Name</label>
          <input 
            name="fullName" 
            className="px-3 py-2 border rounded w-full" 
            value={form.fullName || ''} 
            onChange={onChange} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input 
            name="email" 
            type="email" 
            className="px-3 py-2 border rounded w-full" 
            value={form.email || ''} 
            onChange={onChange} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input 
            name="phone" 
            className="px-3 py-2 border rounded w-full" 
            value={form.phone || ''} 
            onChange={onChange} 
            required 
          />
        </div>
        {/* Pet ID is auto-captured from route; no manual input */}
        <div className="hidden">
          <input 
            name="petId" 
            value={form.petId || ''} 
            readOnly 
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}
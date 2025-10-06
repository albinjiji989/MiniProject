import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../../../services/api'

const KEY = 'adopt_apply_wizard'

export default function StepApplicant() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.applicant || { fullName:'', email:'', phone:'', petId:'' } } catch { return { fullName:'', email:'', phone:'', petId:'' } }
  })

  useEffect(() => {
    const petId = params.get('petId')
    console.log('StepApplicant: URL petId =', petId)
    if (petId && !form.petId) update({ petId })
  }, [])

  // Prefill from logged-in user profile (editable)
  useEffect(() => {
    const prefill = async () => {
      try {
        const res = await authAPI.getMe()
        const u = res?.data?.user || res?.data?.data || res?.data || {}
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
  }, [])

  const update = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, applicant: { ...(prev.applicant||{}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.applicant)
  }

  const onChange = (e) => update({ [e.target.name]: e.target.value })
  const next = () => navigate('/User/adoption/apply/home')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Full Name</label>
          <input name="fullName" className="px-3 py-2 border rounded w-full" value={form.fullName} onChange={onChange} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input name="email" type="email" className="px-3 py-2 border rounded w-full" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input name="phone" className="px-3 py-2 border rounded w-full" value={form.phone} onChange={onChange} required />
        </div>
        {/* Pet ID is auto-captured from route; no manual input */}
      </div>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}

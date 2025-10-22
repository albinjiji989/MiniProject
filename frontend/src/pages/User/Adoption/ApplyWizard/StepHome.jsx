import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'adopt_apply_wizard'

export default function StepHome() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { 
      const savedData = JSON.parse(localStorage.getItem(KEY))?.home || {}
      return { 
        address: {
          street: savedData.address?.street || '',
          city: savedData.address?.city || '',
          state: savedData.address?.state || '',
          pincode: savedData.address?.pincode || '',
          country: savedData.address?.country || ''
        }, 
        homeType: savedData.homeType || 'apartment', 
        hasGarden: !!savedData.hasGarden, 
        hasOtherPets: !!savedData.hasOtherPets, 
        otherPetsDetails: savedData.otherPetsDetails || '', 
        workSchedule: savedData.workSchedule || 'full_time', 
        timeAtHome: savedData.timeAtHome || '4_8_hours' 
      }
    } catch { 
      return { 
        address: { street: '', city: '', state: '', pincode: '', country: '' }, 
        homeType: 'apartment', 
        hasGarden: false, 
        hasOtherPets: false, 
        otherPetsDetails: '', 
        workSchedule: 'full_time', 
        timeAtHome: '4_8_hours' 
      }
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, home: { ...(prev.home || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.home)
  }

  const onAddress = (k, v) => save({ address: { ...(form.address || {}), [k]: v || '' } })
  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    save({ [name]: type === 'checkbox' ? !!checked : (value || '') })
  }

  const next = () => navigate('/User/adoption/apply/experience')
  const back = () => navigate('/User/adoption/apply/applicant')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Street</label>
          <input className="px-3 py-2 border rounded w-full" value={form.address?.street || ''} onChange={(e)=>onAddress('street', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">City</label>
          <input className="px-3 py-2 border rounded w-full" value={form.address?.city || ''} onChange={(e)=>onAddress('city', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">State</label>
          <input className="px-3 py-2 border rounded w-full" value={form.address?.state || ''} onChange={(e)=>onAddress('state', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Pincode</label>
          <input className="px-3 py-2 border rounded w-full" value={form.address?.pincode || ''} onChange={(e)=>onAddress('pincode', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Country</label>
          <input className="px-3 py-2 border rounded w-full" value={form.address?.country || ''} onChange={(e)=>onAddress('country', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Home Type</label>
          <select name="homeType" className="px-3 py-2 border rounded w-full" value={form.homeType || 'apartment'} onChange={onChange}>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="farm">Farm</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="hasGarden" name="hasGarden" type="checkbox" checked={!!form.hasGarden} onChange={onChange} />
          <label htmlFor="hasGarden" className="text-sm">Has Garden</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="hasOtherPets" name="hasOtherPets" type="checkbox" checked={!!form.hasOtherPets} onChange={onChange} />
          <label htmlFor="hasOtherPets" className="text-sm">Has Other Pets</label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Other Pets Details</label>
          <textarea className="px-3 py-2 border rounded w-full" rows={3} value={form.otherPetsDetails || ''} onChange={(e)=>onChange({ target:{ name:'otherPetsDetails', value:e.target.value || '' } })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Work Schedule</label>
          <select name="workSchedule" className="px-3 py-2 border rounded w-full" value={form.workSchedule || 'full_time'} onChange={onChange}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="work_from_home">Work from home</option>
            <option value="unemployed">Unemployed</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Time at Home</label>
          <select name="timeAtHome" className="px-3 py-2 border rounded w-full" value={form.timeAtHome || '4_8_hours'} onChange={onChange}>
            <option value="less_than_4_hours">Less than 4 hours</option>
            <option value="4_8_hours">4-8 hours</option>
            <option value="8_12_hours">8-12 hours</option>
            <option value="more_than_12_hours">More than 12 hours</option>
          </select>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back}>Back</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'adopt_wizard'

export default function StepAvailability() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { 
      const saved = JSON.parse(localStorage.getItem(KEY))?.availability || {}
      return { 
        adoptionFee: saved.adoptionFee || 0,
        availabilityStatus: 'available' // Always set to available on creation
      } 
    } catch { 
      return { 
        adoptionFee: 0,
        availabilityStatus: 'available'
      } 
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, availability: { ...(prev.availability||{}), ...patch, availabilityStatus: 'available' } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.availability)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    if (name === 'adoptionFee') {
      const feeValue = Number(value)
      if (feeValue >= 0) {
        save({ adoptionFee: feeValue })
      }
    }
  }

  const next = () => navigate('/manager/adoption/wizard/review')
  const back = () => navigate('/manager/adoption/wizard/matching')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Adoption Details</h3>
        <p className="text-sm text-blue-700">
          New pets are created with "<strong>Available</strong>" status by default. You can change their status later through the pet management interface (e.g., mark as Reserved or Adopted after processing applications).
        </p>
      </div>

      {/* Current Status Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <p className="text-sm font-medium text-green-900">Current Status</p>
            <p className="text-lg font-bold text-green-700">Available for Adoption</p>
          </div>
        </div>
      </div>

      {/* Adoption Fee Section */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Adoption Fee (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500 font-semibold">₹</span>
          <input 
            name="adoptionFee" 
            type="number" 
            min="0" 
            step="50"
            placeholder="Enter adoption fee or leave blank for no fee"
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition" 
            value={form.adoptionFee || 0} 
            onChange={onChange}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave as 0 if the pet is free for adoption</p>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-amber-900">💡 Note:</p>
        <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
          <li>Status will automatically be set to "Available" when this pet is created</li>
          <li>You can modify the status later from the pet details page</li>
          <li>Adoption fee can be updated anytime during pet management</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button 
          className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
          onClick={back}
        >
          ← Back
        </button>
        <button 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          onClick={next}
        >
          Review & Submit →
        </button>
      </div>
    </div>
  )
}

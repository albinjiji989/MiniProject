import React from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'

const STEPS = [
  { key: 'basic', label: 'Basic Info', path: '/manager/adoption/wizard/basic' },
  { key: 'health', label: 'Health & Media', path: '/manager/adoption/wizard/health' },
  { key: 'availability', label: 'Availability', path: '/manager/adoption/wizard/availability' },
  { key: 'review', label: 'Review', path: '/manager/adoption/wizard/review' },
]

export default function WizardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentIndex = Math.max(0, STEPS.findIndex(s => location.pathname.endsWith(s.key)))

  const goTo = (path) => navigate(path)

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Add Adoption Pet</h2>
      <p className="text-sm text-gray-600 mb-4">Complete each step to add a pet to the adoption center.</p>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => goTo(s.path)}
            className={`px-3 py-2 rounded border text-sm ${idx === currentIndex ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
          >
            {idx + 1}. {s.label}
          </button>
        ))}
      </div>
      <div className="bg-white border rounded p-4">
        <Outlet />
      </div>
    </div>
  )
}

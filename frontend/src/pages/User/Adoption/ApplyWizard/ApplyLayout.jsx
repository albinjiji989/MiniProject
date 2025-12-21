import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const STEPS = [
  { key: 'applicant', label: 'Applicant', path: '/User/adoption/apply' },
  { key: 'home', label: 'Home', path: '/User/adoption/apply/home' },
  { key: 'experience', label: 'Experience', path: '/User/adoption/apply/experience' },
  { key: 'documents', label: 'Documents', path: '/User/adoption/apply/documents' },
  { key: 'review', label: 'Review', path: '/User/adoption/apply/review' },
]

export default function ApplyLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const idx = Math.max(0, STEPS.findIndex(s => location.pathname.endsWith(s.key)))

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Adoption Application</h2>
      <p className="text-sm text-gray-600 mb-4">Fill in your details to apply for adoption. Use the navigation buttons at the bottom of each form to move between steps.</p>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button 
            key={s.key} 
            onClick={(e) => {
              e.preventDefault();
              // Prevent navigation through step buttons
              // Users should use Next/Previous buttons in forms
            }} 
            className={`px-3 py-2 rounded border text-sm ${i===idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300 cursor-default'}`}
            disabled={true}
          >
            {i+1}. {s.label}
          </button>
        ))}
      </div>
      <div className="bg-white border rounded p-4">
        <Outlet />
      </div>
    </div>
  )
}

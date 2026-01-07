import React from 'react'
import { Routes, Route, Outlet, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom'
import StepApplicant from './StepApplicant'
import StepHome from './StepHome'
import StepExperience from './StepExperience'
import StepDocuments from './StepDocuments'
import StepReview from './StepReview'

function WizardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { petId } = useParams()
  
  const STEPS = [
    { key: 'applicant', label: 'Applicant' },
    { key: 'home', label: 'Home' },
    { key: 'experience', label: 'Experience' },
    { key: 'documents', label: 'Documents' },
    { key: 'review', label: 'Review' },
  ]
  
  const idx = Math.max(0, STEPS.findIndex(s => location.pathname.includes(s.key)))

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

export default function ApplyWizardRouter() {
  return (
    <Routes>
      <Route path=":petId" element={<WizardLayout />}>
        <Route index element={<Navigate to="applicant" replace />} />
        <Route path="applicant" element={<StepApplicant />} />
        <Route path="home" element={<StepHome />} />
        <Route path="experience" element={<StepExperience />} />
        <Route path="documents" element={<StepDocuments />} />
        <Route path="review" element={<StepReview />} />
      </Route>
    </Routes>
  )
}

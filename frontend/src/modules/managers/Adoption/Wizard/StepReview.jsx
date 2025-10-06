import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI } from '../../../../services/api'

const KEY = 'adopt_wizard'

export default function StepReview() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const data = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
  }, [])

  const back = () => navigate('/manager/adoption/wizard/availability')

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const basic = data.basic || {}
      const health = data.health || {}
      const avail = data.availability || {}

      // Map wizard data to backend AdoptionPet model
      const toUrlArray = (arr) => {
        if (!arr) return []
        // Handle case where arr might be a stringified array
        let items = arr
        if (typeof arr === 'string') {
          try {
            items = JSON.parse(arr)
          } catch {
            return []
          }
        }
        if (!Array.isArray(items)) return []
        return items
          .map(x => (typeof x === 'string' ? x : (x && x.url) ? x.url : ''))
          .filter(u => !!u && !String(u).startsWith('blob:'))
      }
      const nameSafe = (basic.name || '').trim()
      const payload = {
        name: nameSafe || `Unknown-${(basic.species || 'pet').toString().slice(0,12)}-${Date.now()}`,
        species: basic.species || '',
        breed: basic.breed || '',
        age: Number(basic.age || 0),
        ageUnit: basic.ageUnit || 'months',
        gender: basic.gender || 'male',
        color: basic.color || 'unknown',
        weight: Number(health.weight || 0),
        healthStatus: 'good',
        vaccinationStatus: (health.vaccinationStatus && health.vaccinationStatus.length > 0) ? 'up_to_date' : 'not_vaccinated',
        temperament: 'friendly',
        description: health.healthHistory || 'N/A',
        adoptionFee: Number(avail.adoptionFee || 0),
        status: (avail.availabilityStatus || 'available').toLowerCase(),
        images: toUrlArray(health.photos).map(u => ({ url: u })),
        documents: toUrlArray(health.documents).map(u => ({ url: u })),
      }

      // Minimal validation
      if (!payload.species || !payload.breed) throw new Error('Category/Species/Breed are required')

      const res = await adoptionAPI.managerCreatePet(payload)
      const newId = res?.data?.data?._id || res?.data?.data?.id
      localStorage.removeItem(KEY)
      if (newId) navigate(`/manager/adoption/pets/${newId}`)
      else navigate('/manager/adoption/pets')
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to create pet')
    } finally {
      setSubmitting(false)
    }
  }

  const basic = data.basic || {}
  const health = data.health || {}
  const avail = data.availability || {}

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Basic Info</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Category:</strong> {basic.category || '-'}</li>
            <li><strong>Species:</strong> {basic.species || '-'}</li>
            <li><strong>Breed:</strong> {basic.breed || '-'}</li>
            <li><strong>Name:</strong> {basic.name || '-'}</li>
            <li><strong>Gender:</strong> {basic.gender || '-'}</li>
            <li><strong>Color:</strong> {basic.color || '-'}</li>
            <li><strong>Age:</strong> {basic.age || 0} {basic.ageUnit || 'months'}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Health & Media</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Vaccinations:</strong> {(health.vaccinationStatus||[]).join(', ') || '-'}</li>
            <li><strong>Weight:</strong> {health.weight || 0} kg</li>
            <li><strong>Health History:</strong> {health.healthHistory || '-'}</li>
            <li><strong>Photos:</strong> {(health.photos||[]).length}</li>
            <li><strong>Documents:</strong> {(health.documents||[]).length}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Availability</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Status:</strong> {avail.availabilityStatus || 'available'}</li>
            <li><strong>Adoption Fee:</strong> ₹{Number(avail.adoptionFee||0)}</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back} disabled={submitting}>Back</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit & Create Pet'}</button>
      </div>
    </div>
  )
}

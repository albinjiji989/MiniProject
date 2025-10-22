import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI, resolveMediaUrl } from '../../../../services/api'

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
          .map(x => {
            // Handle both direct string URLs and object URLs
            if (typeof x === 'string') return x
            if (x && x.url) return x.url
            if (x && x.backendPath) return x.backendPath
            return ''
          })
          .filter(u => !!u && !String(u).startsWith('blob:'))
      }
      
      const toMediaArray = (arr) => {
        if (!arr) return []
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
          .filter(x => {
            const url = typeof x === 'string' ? x : (x?.url || x?.backendPath)
            return url && !String(url).startsWith('blob:')
          })
          .map(x => {
            const url = typeof x === 'string' ? x : (x.url || x.backendPath)
            return {
              url,
              name: x?.name,
              type: x?.type,
              size: x?.size,
              isPrimary: x?.isPrimary || false
            }
          })
      }
      
      const nameSafe = (basic.name || '').trim()
      const imagesData = toMediaArray(health.photos)
      const docsData = toMediaArray(health.documents)
      
      console.log('📸 Photos for submission:', imagesData)
      console.log('📄 Documents for submission:', docsData)
      
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
        images: imagesData, // Now includes isPrimary flag
        documents: docsData,
      }
      
      console.log('🔍 Pet payload being submitted:', { 
        name: payload.name,
        species: payload.species,
        images: payload.images.length,
        documents: payload.documents.length
      })

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
    <div className="space-y-6">
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}
      
      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-blue-700">📋 Basic Info</h3>
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
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-green-700">🏥 Health & Media</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Vaccinations:</strong> {(health.vaccinationStatus||[]).length > 0 ? (health.vaccinationStatus||[]).join(', ') : '-'}</li>
            <li><strong>Weight:</strong> {health.weight || 0} kg</li>
            <li><strong>Health History:</strong> {(health.healthHistory || '').substring(0, 30)}{(health.healthHistory || '').length > 30 ? '...' : ''}</li>
            <li><strong>Photos:</strong> <span className="font-bold text-blue-600">{(health.photos||[]).length}</span></li>
            <li><strong>Documents:</strong> <span className="font-bold text-blue-600">{(health.documents||[]).length}</span></li>
          </ul>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-purple-700">💰 Availability</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Status:</strong> <span className="capitalize font-semibold text-purple-600">{avail.availabilityStatus || 'available'}</span></li>
            <li><strong>Adoption Fee:</strong> ₹{Number(avail.adoptionFee||0).toLocaleString()}</li>
          </ul>
        </div>
      </div>

      {/* Photos Preview */}
      {(health.photos||[]).length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-semibold mb-3 text-blue-700">📸 Photos Preview ({(health.photos||[]).length})</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {(health.photos||[]).map((photo, i) => {
              const photoUrl = typeof photo === 'string' ? photo : photo.url
              // Validate URL
              const isValidUrl = photoUrl && 
                typeof photoUrl === 'string' && 
                photoUrl.length > 10 && 
                (photoUrl.startsWith('http') || photoUrl.startsWith('/')) &&
                !photoUrl.endsWith('/')
              
              if (!isValidUrl) {
                return (
                  <div key={i} className="relative rounded-lg overflow-hidden bg-gray-200 h-20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg">📸</div>
                      <div className="text-xs text-gray-500">Invalid URL</div>
                    </div>
                  </div>
                )
              }
              
              return (
                <div key={i} className="relative rounded-lg overflow-hidden bg-gray-200 h-20">
                  <img 
                    src={resolveMediaUrl(photoUrl)}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn(`Review image failed to load: ${photoUrl}`)
                      e.currentTarget.src = '/placeholder-pet.svg'
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents Preview */}
      {(health.documents||[]).length > 0 && (
        <div className="border rounded-lg p-4 bg-green-50">
          <h4 className="font-semibold mb-3 text-green-700">📄 Documents ({(health.documents||[]).length})</h4>
          <div className="space-y-2">
            {(health.documents||[]).map((doc, i) => {
              const docName = doc.name || (typeof doc === 'string' ? doc.split('/').pop() : `Document ${i + 1}`)
              const docType = doc.type || 'document'
              const docSize = doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'
              return (
                <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                  <span className="text-lg">{docType.includes('pdf') ? '📄' : '🖼️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{docName}</p>
                    <p className="text-xs text-gray-500">{docSize} • {docType}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50" 
          onClick={back} 
          disabled={submitting}
        >
          Back
        </button>
        <button 
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50" 
          onClick={submit} 
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : '✅ Submit & Create Pet'}
        </button>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../../services/api'

const KEY = 'adopt_wizard'

const VACCINE_OPTIONS = [
  'rabies',
  'distemper',
  'parvovirus',
  'hepatitis',
  'leptospirosis',
  'parainfluenza',
  'bordetella',
]

export default function StepHealthMedia() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { 
      const saved = JSON.parse(localStorage.getItem(KEY))?.health || {}
      return {
        healthHistory: saved.healthHistory || '',
        vaccinationStatus: saved.vaccinationStatus || [],
        weight: saved.weight || '',
        photos: saved.photos || [],
        documents: saved.documents || []
      }
    } catch { 
      return {
        healthHistory: '',
        vaccinationStatus: [],
        weight: '',
        photos: [],
        documents: []
      }
    }
  })
  const [uploading, setUploading] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState({})

  const saveLocal = (nextPart) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, health: { ...(prev.health||{}), ...nextPart } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(prevForm => ({
      ...prevForm,
      ...nextPart
    }))
  }

  const toggleVaccine = (v) => {
    const has = form.vaccinationStatus?.includes(v)
    const next = has ? form.vaccinationStatus.filter(x => x !== v) : [...(form.vaccinationStatus||[]), v]
    saveLocal({ vaccinationStatus: next })
  }

  // Handle file upload for photos (upload to backend, store URL only)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not a valid image file`)
          continue
        }
        const formData = new FormData()
        formData.append('file', file)
        try {
          const up = await apiClient.post('/adoption/manager/pets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          const backendUrl = up.data?.data?.url
          console.log('✅ Photo uploaded, backend URL:', backendUrl)
          
          if (backendUrl) {
            // Use the resolveMediaUrl function to properly construct the full URL
            const fullUrl = resolveMediaUrl(backendUrl);
            
            // Validate URL before storing
            if (fullUrl && typeof fullUrl === 'string' && fullUrl.length > 10) {
              uploaded.push({ 
                url: backendUrl, // Store the relative URL for backend processing
                backendPath: backendUrl,
                name: file.name, 
                type: file.type, 
                size: file.size,
                uploadedAt: new Date().toISOString(),
                isPrimary: false
              })
              console.log('✅ Photo stored with URL:', fullUrl)
            } else {
              console.warn('Invalid URL received from backend, skipping:', backendUrl)
            }
          }
        } catch (uploadErr) {
          console.error(`❌ Failed to upload ${file.name}:`, uploadErr)
          alert(`Failed to upload ${file.name}: ${uploadErr?.response?.data?.error || uploadErr.message}`)
        }
      }
      if (uploaded.length) {
        // Set first uploaded image as primary if no primary exists
        if (form.photos && form.photos.length > 0) {
          const hasPrimary = form.photos.some(photo => photo.isPrimary)
          if (!hasPrimary && uploaded.length > 0) {
            uploaded[0].isPrimary = true
          }
        } else if (uploaded.length > 0) {
          uploaded[0].isPrimary = true
        }
        
        saveLocal({ photos: [...(form.photos||[]), ...uploaded] })
        console.log('✅ Saved photos to localStorage:', uploaded.length)
      }
    } catch (error) {
      console.error('Photo upload process failed:', error)
      alert('Failed to process photos')
    } finally {
      setUploading(false)
    }
  }

  // Handle file upload for documents (upload to backend, store URL only)
  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        // Accept both images and PDFs
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (!validTypes.includes(file.type)) {
          alert(`${file.name} is not a valid type (PDF, JPG, PNG, WebP allowed)`)
          continue
        }
        const formData = new FormData()
        formData.append('file', file)
        try {
          const up = await apiClient.post('/adoption/manager/pets/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          const backendUrl = up.data?.data?.url
          console.log('✅ Document uploaded, backend URL:', backendUrl)
          
          if (backendUrl) {
            // Use the resolveMediaUrl function to properly construct the full URL
            const fullUrl = resolveMediaUrl(backendUrl);
            
            // Validate URL before storing
            if (fullUrl && typeof fullUrl === 'string' && fullUrl.length > 10) {
              uploaded.push({ 
                url: backendUrl, // Store the relative URL for backend processing
                backendPath: backendUrl,
                name: file.name, 
                type: file.type, 
                size: file.size,
                uploadedAt: new Date().toISOString()
              })
              console.log('✅ Document stored with URL:', fullUrl)
            } else {
              console.warn('Invalid URL received from backend, skipping:', backendUrl)
            }
          }
        } catch (uploadErr) {
          console.error(`❌ Failed to upload ${file.name}:`, uploadErr)
          alert(`Failed to upload ${file.name}: ${uploadErr?.response?.data?.error || uploadErr.message}`)
        }
      }
      if (uploaded.length) {
        saveLocal({ documents: [...(form.documents||[]), ...uploaded] })
      }
    } finally {
      setUploading(false)
      e.target.value = '' // reset file input
    }
  }

  const removePhoto = (i) => {
    const photo = form.photos[i]
    if (photo?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url)
    }
    saveLocal({ photos: form.photos.filter((_, idx) => idx !== i) })
  }

  const removeDoc = (i) => {
    const doc = form.documents[i]
    if (doc?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(doc.url)
    }
    saveLocal({ documents: form.documents.filter((_, idx) => idx !== i) })
  }

  const onChange = (e) => {
    const { name, value } = e.target
    saveLocal({ [name]: value || '' })
  }

  const next = () => navigate('/manager/adoption/wizard/availability')
  const back = () => navigate('/manager/adoption/wizard/basic')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Health & Media Information</h3>
        
        {/* Health History */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Health History</label>
          <textarea 
            name="healthHistory" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            rows={4} 
            value={form.healthHistory || ''} 
            onChange={onChange} 
            placeholder="Medical notes, special needs, treatments, etc." 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vaccination Status */}
          <div>
            <label className="block text-sm font-medium mb-3">Vaccination Status</label>
            <div className="grid grid-cols-1 gap-2">
              {VACCINE_OPTIONS.map(v => (
                <label key={v} className="flex items-center gap-2 text-sm p-2 border rounded hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={form.vaccinationStatus?.includes(v) || false} 
                    onChange={() => toggleVaccine(v)}
                    className="rounded"
                  /> 
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium mb-2">Weight (kg)</label>
            <input 
              name="weight" 
              type="number" 
              min="0" 
              step="0.1" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.weight || ''} 
              onChange={onChange}
              placeholder="Enter weight in kg"
            />
          </div>
        </div>

        {/* Photos and Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2">Photos</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload" 
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </label>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF up to 10MB each</p>
            </div>
            
            {/* Photo Preview */}
            {form.photos?.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Uploaded Photos: ({form.photos.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {form.photos.map((photo, i) => {
                    const photoUrl = typeof photo === 'string' ? photo : photo.url
                    const hasError = imageLoadErrors[`photo-${i}`]
                    
                    // Validate URL to prevent loading invalid URLs
                    const isValidUrl = photoUrl && 
                      typeof photoUrl === 'string' && 
                      photoUrl.length > 10 && 
                      (photoUrl.startsWith('http') || photoUrl.startsWith('/')) &&
                      !photoUrl.endsWith('/')
                    
                    return (
                      <div key={i} className="relative border rounded-lg overflow-hidden bg-gray-100 group">
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                          {hasError || !isValidUrl ? (
                            <div className="text-center p-2">
                              <div className="text-2xl mb-1">📸</div>
                              <p className="text-xs text-gray-500">Image unavailable</p>
                            </div>
                          ) : (
                            <img 
                              src={resolveMediaUrl(photoUrl)} 
                              alt={`Pet photo ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => {
                                console.warn(`Image failed to load: ${photoUrl}`)
                                setImageLoadErrors(prev => ({ ...prev, [`photo-${i}`]: true }))
                              }}
                              onLoad={() => {
                                console.log(`Image loaded successfully: ${photoUrl}`)
                                setImageLoadErrors(prev => {
                                  const updated = { ...prev }
                                  delete updated[`photo-${i}`]
                                  return updated
                                })
                              }}
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {photo.name && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1.5 truncate">
                            {photo.name}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium mb-2">Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
                disabled={uploading}
                className="hidden"
                id="document-upload"
              />
              <label 
                htmlFor="document-upload" 
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Documents'}
              </label>
              <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB each</p>
            </div>
            
            {/* Document List */}
            {form.documents?.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Uploaded Documents: ({form.documents.length})</h4>
                <div className="space-y-2">
                  {form.documents.map((doc, i) => {
                    const docName = doc.name || (typeof doc === 'string' ? doc.split('/').pop() : `Document ${i + 1}`)
                    const docSize = doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'
                    const docType = doc.type || 'Unknown type'
                    
                    return (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                            {docType.includes('pdf') ? '📄' : docType.startsWith('image/') ? '🖼️' : '📋'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-gray-700 max-w-xs">
                              {docName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {docSize} • {docType}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(i)}
                          className="ml-2 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button 
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500" 
          onClick={back}
        >
          Back
        </button>
        <button 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onClick={next}
        >
          Next Step
        </button>
      </div>
    </div>
  )
}
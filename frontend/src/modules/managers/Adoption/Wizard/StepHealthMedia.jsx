import React, { useState } from 'react'
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
    try { return JSON.parse(localStorage.getItem(KEY))?.health || { vaccinationStatus: [], photos: [], documents: [] } } catch { return { vaccinationStatus: [], photos: [], documents: [] } }
  })
  const [uploading, setUploading] = useState(false)

  const saveLocal = (nextPart) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, health: { ...(prev.health||{}), ...nextPart } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.health)
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
        const up = await apiClient.post('/adoption/manager/pets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        const url = resolveMediaUrl(up.data?.data?.url)
        if (url) uploaded.push({ url, name: file.name, type: file.type, size: file.size })
      }
      if (uploaded.length) saveLocal({ photos: [...(form.photos||[]), ...uploaded] })
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert(error?.response?.data?.error || 'Failed to upload photos')
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
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (!validTypes.includes(file.type)) {
          alert(`${file.name} is not a valid type (PDF, JPG, PNG allowed)`) ; continue
        }
        const formData = new FormData()
        formData.append('file', file)
        const up = await apiClient.post('/adoption/manager/pets/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        const url = resolveMediaUrl(up.data?.data?.url)
        if (url) uploaded.push({ url, name: file.name, type: file.type, size: file.size })
      }
      if (uploaded.length) saveLocal({ documents: [...(form.documents||[]), ...uploaded] })
    } catch (error) {
      console.error('Document upload failed:', error)
      alert(error?.response?.data?.error || 'Failed to upload documents')
    } finally {
      setUploading(false)
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

  const onChange = (e) => saveLocal({ [e.target.name]: e.target.value })

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
            value={form.healthHistory||''} 
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
                    checked={form.vaccinationStatus?.includes(v)} 
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
              value={form.weight||''} 
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
                <h4 className="text-sm font-medium">Uploaded Photos:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="relative border rounded-lg overflow-hidden">
                      <img 
                        src={typeof photo === 'string' ? photo : photo.url} 
                        alt={`Pet photo ${i + 1}`}
                        className="w-full h-24 object-cover"
                        onError={(e)=>{ e.currentTarget.src='/placeholder-pet.svg' }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                      {photo.name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                          {photo.name}
                        </div>
                      )}
                    </div>
                  ))}
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
                <h4 className="text-sm font-medium">Uploaded Documents:</h4>
                <div className="space-y-2">
                  {form.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                          {doc.type?.includes('pdf') ? '📄' : doc.type?.startsWith('image/') ? '🖼️' : '📝'}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-32">
                            {doc.name || (typeof doc === 'string' ? doc.split('/').pop() : 'Document')}
                          </p>
                          {doc.size && (
                            <p className="text-xs text-gray-500">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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

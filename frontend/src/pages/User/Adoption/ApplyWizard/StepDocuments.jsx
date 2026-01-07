import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adoptionAPI } from '../../../../services/api'

const KEY = 'adopt_apply_wizard'

export default function StepDocuments() {
  const navigate = useNavigate()
  const { petId } = useParams()
  const [form, setForm] = useState(() => {
    try { 
      const savedData = JSON.parse(localStorage.getItem(KEY))?.documents || []
      // Convert uploadedAt strings back to Date objects
      if (Array.isArray(savedData)) {
        return savedData.map(doc => ({
          ...doc,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
        }));
      }
      return [];
    } catch { 
      return [] 
    }
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const save = (patch, replace = false) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, documents: Array.isArray(prev.documents) ? [...prev.documents] : [] }
    
    // Apply the patch
    if (Array.isArray(patch.documents)) {
      if (replace) {
        // Replace the entire documents array
        next.documents = patch.documents
      } else {
        // Append to existing documents
        next.documents = [...next.documents, ...patch.documents]
      }
    }
    
    console.log('Saving to localStorage:', next);
    localStorage.setItem(KEY, JSON.stringify(next))
    console.log('Retrieved from localStorage:', JSON.parse(localStorage.getItem(KEY)));
    setForm(next.documents)
  }

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError('')
    setUploading(true)
    const documents = []
    for (const f of files) {
      if (!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(f.type)) {
        setError('Only images or PDF files are allowed')
        continue
      }
      try {
        const res = await adoptionAPI.uploadApplicantDocument(f)
        const documentInfo = res?.data?.data
        console.log('Upload response:', res);
        if (documentInfo && documentInfo.url) {
          console.log('Adding document:', documentInfo);
          // Ensure uploadedAt is a proper Date object
          if (documentInfo.uploadedAt && typeof documentInfo.uploadedAt === 'string') {
            documentInfo.uploadedAt = new Date(documentInfo.uploadedAt);
          }
          console.log('Final document object:', documentInfo);
          documents.push(documentInfo);
        }
      } catch (err) {
        setError(err?.response?.data?.error || 'Upload failed for one or more files')
      }
    }
    if (documents.length) save({ documents: [...form, ...documents] }, false)
    setUploading(false)
    e.target.value = ''
  }
  const removeDoc = (i) => save({ documents: (form || []).filter((_, idx)=> idx !== i) }, true)

  const next = () => navigate(`/User/adoption/wizard/${petId}/review`)
  const back = () => navigate(`/User/adoption/wizard/${petId}/experience`)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Upload Documents (Images or PDF)</label>
        <input type="file" accept="image/*,application/pdf" multiple onChange={onFileChange} className="block" />
        {uploading && <div className="text-sm text-gray-600 mt-1">Uploading...</div>}
        {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
          {(form || []).map((doc, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <a href={typeof doc === 'string' ? doc : doc.url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">
                {typeof doc === 'string' ? doc : (doc.name || 'Document')}
              </a>
              <button type="button" className="text-red-600" onClick={()=>removeDoc(i)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back}>Back</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={next}>Next</button>
      </div>
    </div>
  )
}
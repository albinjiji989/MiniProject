import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI, resolveMediaUrl } from '../../../../services/api'

const KEY = 'adopt_apply_wizard'

export default function StepDocuments() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.documents || { documents: [] } } catch { return { documents: [] } }
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, documents: { ...(prev.documents||{}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.documents)
  }

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError('')
    setUploading(true)
    const urls = []
    for (const f of files) {
      if (!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(f.type)) {
        setError('Only images or PDF files are allowed')
        continue
      }
      try {
        const res = await adoptionAPI.uploadApplicantDocument(f)
        const url = res?.data?.data?.url || res?.data?.data
        if (url) urls.push(url)
      } catch (err) {
        setError(err?.response?.data?.error || 'Upload failed for one or more files')
      }
    }
    if (urls.length) save({ documents: [...(form.documents||[]), ...urls] })
    setUploading(false)
    e.target.value = ''
  }
  const removeDoc = (i) => save({ documents: (form.documents||[]).filter((_, idx)=> idx!==i) })

  const next = () => navigate('/User/adoption/apply/review')
  const back = () => navigate('/User/adoption/apply/experience')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Upload Documents (Images or PDF)</label>
        <input type="file" accept="image/*,application/pdf" multiple onChange={onFileChange} className="block" />
        {uploading && <div className="text-sm text-gray-600 mt-1">Uploading...</div>}
        {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
          {(form.documents||[]).map((u, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <a href={resolveMediaUrl(u)} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">{u}</a>
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

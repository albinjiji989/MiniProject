import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const PetProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    age: 0,
    ageUnit: 'months',
    gender: 'male',
    color: '',
    weight: 0,
    healthStatus: 'good',
    vaccinationStatus: 'not_vaccinated',
    temperament: 'friendly',
    description: '',
    adoptionFee: 0,
    name: '',
    petCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [documents, setDocuments] = useState([])
  const imgInputRef = useRef(null)
  const docInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        const p = res.data?.data || {}
        setForm(f => ({
          ...f,
          name: p.name || '',
          petCode: p.petCode || '',
          age: p.age ?? 0,
          ageUnit: p.ageUnit || 'months',
          gender: p.gender || 'male',
          color: p.color || '',
          weight: p.weight ?? 0,
          healthStatus: p.healthStatus || 'good',
          vaccinationStatus: p.vaccinationStatus || 'not_vaccinated',
          temperament: p.temperament || 'friendly',
          description: p.description || '',
          adoptionFee: p.adoptionFee ?? 0,
        }))
        // Load media (images/documents)
        try {
          const m = await apiClient.get(`/adoption/manager/pets/${id}/media`)
          const imgs = (m.data?.data?.images || []).map(x => ({ url: resolveMediaUrl(x.url || x) }))
          const docs = (m.data?.data?.documents || []).map(x => ({ url: resolveMediaUrl(x.url || x), type: x.type }))
          setImages(imgs)
          setDocuments(docs)
        } catch (_) {}
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load pet profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'age' || name === 'weight' || name === 'adoptionFee' ? Number(value) : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        age: Number(form.age) || 0,
        ageUnit: form.ageUnit,
        gender: form.gender || 'male',
        color: form.color || 'unknown',
        weight: Number(form.weight) || 0,
        healthStatus: form.healthStatus || 'good',
        vaccinationStatus: form.vaccinationStatus || 'not_vaccinated',
        temperament: form.temperament || 'friendly',
        description: form.description || 'N/A',
        adoptionFee: Number(form.adoptionFee) || 0,
      }
      await apiClient.put(`/adoption/manager/pets/${id}`, payload)
      navigate(`/manager/adoption/pets/${id}`)
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const refreshMedia = async () => {
    try {
      const m = await apiClient.get(`/adoption/manager/pets/${id}/media`)
      const imgs = (m.data?.data?.images || []).map(x => ({ url: resolveMediaUrl(x.url || x) }))
      const docs = (m.data?.data?.documents || []).map(x => ({ url: resolveMediaUrl(x.url || x), type: x.type }))
      setImages(imgs)
      setDocuments(docs)
    } catch (_) {}
  }

  const onChooseImage = () => imgInputRef.current?.click()
  const onChooseDocument = () => docInputRef.current?.click()

  const onImageSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const up = await apiClient.post('/adoption/manager/pets/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = up.data?.data?.url
      if (url) {
        await apiClient.put(`/adoption/manager/pets/${id}`, { imageIds: [{ url, isPrimary: images.length === 0 }] })
        await refreshMedia()
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Image upload failed')
    }
  }

  const onDocumentSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const up = await apiClient.post('/adoption/manager/pets/upload-document', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = up.data?.data?.url
      if (url) {
        await apiClient.put(`/adoption/manager/pets/${id}`, { documentIds: [{ url }] })
        await refreshMedia()
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Document upload failed')
    }
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-semibold mb-1">Complete Pet Profile</h2>
      <p className="text-sm text-gray-600 mb-4">Fill additional details for {form.name}{form.petCode ? ` (Code: ${form.petCode})` : ''}.</p>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Age</label>
          <div className="flex gap-2">
            <input name="age" type="number" min="0" className="px-3 py-2 border rounded w-full" value={form.age} onChange={onChange} />
            <select name="ageUnit" className="px-3 py-2 border rounded" value={form.ageUnit} onChange={onChange}>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" className="px-3 py-2 border rounded w-full" value={form.gender} onChange={onChange}>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input name="color" className="px-3 py-2 border rounded w-full" value={form.color} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input name="weight" type="number" className="px-3 py-2 border rounded w-full" value={form.weight} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
          <select name="healthStatus" className="px-3 py-2 border rounded w-full" value={form.healthStatus} onChange={onChange}>
            <option value="excellent">excellent</option>
            <option value="good">good</option>
            <option value="fair">fair</option>
            <option value="needs_attention">needs_attention</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination Status</label>
          <select name="vaccinationStatus" className="px-3 py-2 border rounded w-full" value={form.vaccinationStatus} onChange={onChange}>
            <option value="up_to_date">up_to_date</option>
            <option value="partial">partial</option>
            <option value="not_vaccinated">not_vaccinated</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
          <select name="temperament" className="px-3 py-2 border rounded w-full" value={form.temperament} onChange={onChange}>
            <option value="calm">calm</option>
            <option value="energetic">energetic</option>
            <option value="playful">playful</option>
            <option value="shy">shy</option>
            <option value="aggressive">aggressive</option>
            <option value="friendly">friendly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adoption Fee (₹)</label>
          <input name="adoptionFee" type="number" className="px-3 py-2 border rounded w-full" value={form.adoptionFee} onChange={onChange} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" className="px-3 py-2 border rounded w-full" rows={4} value={form.description} onChange={onChange} />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Save</button>
          <button type="button" className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate(-1)} disabled={loading}>Back</button>
        </div>
      </form>

      {/* Media sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Images</h3>
            <button type="button" className="px-3 py-1 text-sm border rounded" onClick={onChooseImage}>Add Images</button>
            <input type="file" accept="image/*" ref={imgInputRef} onChange={onImageSelected} style={{ display: 'none' }} />
          </div>
          {images.length === 0 ? (
            <p className="text-sm text-gray-500">No images</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <img key={idx} src={img.url} alt="pet" className="w-full h-28 object-cover rounded border" onError={(e)=>{ e.currentTarget.src='/placeholder-pet.svg' }} />
              ))}
            </div>
          )}
        </div>
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Documents</h3>
            <button type="button" className="px-3 py-1 text-sm border rounded" onClick={onChooseDocument}>Add Documents</button>
            <input type="file" accept="image/*,application/pdf" ref={docInputRef} onChange={onDocumentSelected} style={{ display: 'none' }} />
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents</p>
          ) : (
            <ul className="list-disc list-inside text-sm">
              {documents.map((d, idx) => (
                <li key={idx}><a className="text-blue-600" href={d.url} target="_blank" rel="noreferrer">Document {idx+1}</a></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetProfile
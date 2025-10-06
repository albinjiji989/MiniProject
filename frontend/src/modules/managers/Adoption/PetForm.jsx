import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const initial = { name: '', breed: '', species: '', age: 0, ageUnit: 'months', gender: 'male', color: '', weight: 0, healthStatus: 'good', vaccinationStatus: 'not_vaccinated', temperament: 'friendly', description: '', adoptionFee: 0, category: '' }

const PetForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [apiErrors, setApiErrors] = useState({
    species: '',
    breeds: '',
    petCode: '',
    submit: ''
  })
  // Media state for create flow
  const [images, setImages] = useState([]) // [{url,isPrimary,caption}]
  const [documents, setDocuments] = useState([]) // [{url}]
  const imgInputRef = useRef(null)
  const docInputRef = useRef(null)

  // Fetch species (active) and derive categories from species for manager dropdowns
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setFetchingMeta(true)
        setApiErrors(prev => ({ ...prev, species: '' }))
        let spec = []
        try {
          setDebugInfo('Fetching species from /admin/species/active...')
          const speciesActiveRes = await apiClient.get('/admin/species/active')
          spec = speciesActiveRes.data?.data || speciesActiveRes.data || []
          setDebugInfo(`Found ${spec.length} active species`)
        } catch (e1) {
          setDebugInfo(`Active species failed (${e1.response?.status}), trying all species...`)
          try {
            const speciesAllRes = await apiClient.get('/admin/species')
            spec = speciesAllRes.data?.data || speciesAllRes.data || []
            setDebugInfo(`Found ${spec.length} total species`)
          } catch (e2) {
            setApiErrors(prev => ({ ...prev, species: `Failed to fetch species: ${e2.response?.status} ${e2.response?.data?.message || e2.message}` }))
            setDebugInfo(`Species fetch failed: ${e2.response?.status} ${e2.response?.data?.message || e2.message}`)
            spec = []
          }

  // Media helpers
  const onChooseImage = () => imgInputRef.current?.click()
  const onChooseDocument = () => docInputRef.current?.click()

  const onImageSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const up = await apiClient.post('/adoption/manager/pets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = up.data?.data?.url
      if (url) setImages(prev => {
        const next = [...prev]
        next.push({ url: resolveMediaUrl(url), isPrimary: next.length === 0 })
        return next
      })
    } catch (err) {
      setError(err?.response?.data?.error || 'Image upload failed')
    }
  }

  const onDocumentSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const up = await apiClient.post('/adoption/manager/pets/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = up.data?.data?.url
      if (url) setDocuments(prev => ([...prev, { url: resolveMediaUrl(url) }]))
    } catch (err) {
      setError(err?.response?.data?.error || 'Document upload failed')
    }
  }
        }
        setSpecies(spec)
        // Derive categories from species (prefer displayName -> name -> categoryName)
        const catSet = new Map()
        for (const s of spec) {
          const catName = (s.category?.displayName || s.category?.name || s.category || '').toString().trim()
          if (catName) catSet.set(catName, catName)
        }
        setCategories(Array.from(catSet.values()).sort())
        setDebugInfo(prev => prev + ` | Categories: ${Array.from(catSet.values()).join(', ')}`)
      } catch (e) {
        setApiErrors(prev => ({ ...prev, species: `Unexpected error: ${e.message}` }))
        setDebugInfo(`Unexpected error: ${e.message}`)
      } finally {
        setFetchingMeta(false)
      }
    }
    fetchMeta()
  }, [])

  // When species list is ready, map existing form.species (name) to selectedSpeciesId (edit flow)
  useEffect(() => {
    if (!selectedSpeciesId && form.species && Array.isArray(species) && species.length) {
      const spec = species.find(s => (s.name === form.species) || (s.displayName === form.species))
      const sid = spec?._id || spec?.id || ''
      if (sid) setSelectedSpeciesId(sid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species])

  // Do not prefetch code on create; it will be generated on backend and shown after creation (edit view)

  // Load existing pet when editing
  useEffect(() => {
    const load = async () => {
      if (!isEdit) return
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        const p = res.data?.data
        const updated = {
          name: p.name || '', breed: p.breed || '', species: p.species || '', age: p.age || 0, ageUnit: p.ageUnit || 'months',
          gender: p.gender || 'male', color: p.color || '', weight: p.weight || 0, healthStatus: p.healthStatus || 'good',
          vaccinationStatus: p.vaccinationStatus || 'not_vaccinated', temperament: p.temperament || 'friendly', description: p.description || '',
          adoptionFee: p.adoptionFee || 0,
          category: p.category || '',
          petCode: p.petCode || ''
        }
        setForm(updated)
        // Try to map species name to id and load breeds for it
        // Delay until species list is loaded
        setTimeout(async () => {
          try {
            const spec = (species || []).find(s => (s.name || s.displayName) === updated.species)
            if (spec?._id) {
              setSelectedSpeciesId(spec._id)
              const brRes = await apiClient.get(`/admin/breeds/species/${spec._id}`)
              setBreeds(brRes.data?.data || [])
              // Auto-fill category from species
              const catName = (spec.category?.displayName || spec.category?.name || spec.category || '').toString()
              if (catName) setForm(f => ({ ...f, category: catName }))
            }
          } catch (_) {}
        }, 0)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load pet')
      }
    }
    load()
  }, [id, isEdit])

  // Handle cascading changes
  const onChange = (e) => {
    const { name, value } = e.target
    if (name === 'category') {
      // When category changes, clear species/breed if incompatible
      setForm(f => {
        const next = { ...f, category: value }
        // If current species is not in selected category, clear species and breed
        const inCat = (species || []).some(s => ((s.category?.displayName || s.category?.name || s.category || '').toString() === value) && (s.name === f.species || s.displayName === f.species))
        if (!inCat) { next.species = ''; next.breed = '' }
        return next
      })
      // Also reset species selection and breeds list
      setSelectedSpeciesId('')
      setBreeds([])
      return
    }
    if (name === 'species') {
      // Species select now carries speciesId as value
      const sid = value || ''
      setSelectedSpeciesId(sid)
      const spec = (species || []).find(s => (s._id || s.id) === sid)
      const speciesName = (spec?.displayName || spec?.name || '').toString()
      setForm(f => ({ ...f, species: speciesName }))
      setApiErrors(prev => ({ ...prev, breeds: '' }))
      
      if (sid) {
        setDebugInfo(prev => prev + ` | Fetching breeds for species ${speciesName} (${sid})...`)
        apiClient.get(`/admin/breeds/species/${sid}`)
          .then(brRes => {
            const breedList = brRes.data?.data || []
            setBreeds(breedList)
            setDebugInfo(prev => prev + ` | Found ${breedList.length} breeds`)
            
            // Only clear breed if it's not compatible with the new species
            setForm(f => {
              const currentBreed = f.breed
              if (currentBreed) {
                const isBreedCompatible = breedList.some(b => 
                  (b.name || b.title || '').toString() === currentBreed
                )
                if (!isBreedCompatible) {
                  return { ...f, breed: '' }
                }
              }
              return f
            })
          })
          .catch(e => {
            setBreeds([])
            setApiErrors(prev => ({ ...prev, breeds: `Breeds fetch failed: ${e.response?.status} ${e.response?.data?.message || e.message}` }))
            setDebugInfo(prev => prev + ` | Breeds error: ${e.response?.status}`)
            // Clear breed when breeds can't be fetched
            setForm(f => ({ ...f, breed: '' }))
          })
      } else {
        setBreeds([])
        // Clear breed when no species is selected
        setForm(f => ({ ...f, breed: '' }))
      }
      const catName = (spec?.category?.displayName || spec?.category?.name || spec?.category || '').toString()
      if (catName) setForm(f => ({ ...f, category: catName }))
      return
    }
    if (name === 'breed') {
      // Set breed, and only infer species/category if no species is currently selected
      setForm(f => ({ ...f, breed: value }))
      
      // Only auto-fill species if no species is currently selected
      if (!form.species && !selectedSpeciesId) {
        const b = (breeds || []).find(x => (x.name || x.title) === value)
        const sName = (b?.species?.displayName || b?.species?.name)
        if (sName) {
          setForm(f => ({ ...f, species: sName }))
          const spec = (species || []).find(s => (s.name || s.displayName) === sName)
          const catName = (spec?.category?.displayName || spec?.category?.name || spec?.category || '').toString()
          if (catName) setForm(f => ({ ...f, category: catName }))
          const sid = spec?._id || ''
          setSelectedSpeciesId(sid)
        }
      }
      return
    }
    setForm((f) => ({ ...f, [name]: name === 'age' || name === 'weight' || name === 'adoptionFee' ? Number(value) : value }))
  }
  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setApiErrors(prev => ({ ...prev, submit: '' }))
    
    try {
      // Only submit expected fields for backend AdoptionPet model
      const payload = {
        name: form.name,
        species: form.species,
        breed: form.breed,
        age: Number(form.age) || 0, // defaulted; can be updated later
        ageUnit: form.ageUnit,
        gender: form.gender || 'male',
        color: form.color || 'unknown',
        weight: Number(form.weight) || 0,
        healthStatus: form.healthStatus || 'good',
        vaccinationStatus: form.vaccinationStatus || 'not_vaccinated',
        temperament: form.temperament || 'friendly',
        description: form.description || 'N/A',
        adoptionFee: Number(form.adoptionFee) || 0,
        // include uploaded media URLs
        images: images.map(x => ({ url: x.url, isPrimary: !!x.isPrimary, caption: x.caption || '' })),
        documents: documents.map(x => ({ url: x.url })),
      }

      // Only allow editing petCode in edit mode (typically read-only anyway)
      if (isEdit && form.petCode) payload.petCode = form.petCode
      
      setDebugInfo(prev => prev + ` | Submitting: ${JSON.stringify(payload, null, 2)}`)
      
      if (!payload.name) {
        setError('Please enter Name')
        setLoading(false)
        return
      }
      if (!payload.species) {
        setError('Please select a Species')
        setLoading(false)
        return
      }
      if (!payload.breed) {
        setError('Please select or enter a Breed')
        setLoading(false)
        return
      }
      
      if (isEdit) {
        setDebugInfo(prev => prev + ` | PUT /adoption/manager/pets/${id}`)
        const res = await apiClient.put(`/adoption/manager/pets/${id}`, payload)
        setDebugInfo(prev => prev + ` | Update success: ${res.status}`)
        navigate('..')
      } else {
        setDebugInfo(prev => prev + ' | POST /adoption/manager/pets')
        const res = await apiClient.post('/adoption/manager/pets', payload)
        setDebugInfo(prev => prev + ` | Create success: ${res.status}`)
        const newId = res.data?.data?._id
        if (newId) {
          setDebugInfo(prev => prev + ` | New pet ID: ${newId}`)
          navigate(`/manager/adoption/pets/${newId}`)
        } else {
          navigate('..')
        }
      }
    } catch (e2) {
      const errorMsg = e2?.response?.data?.error || e2?.response?.data?.message || e2.message || 'Save failed'
      setError(errorMsg)
      setApiErrors(prev => ({ ...prev, submit: `${e2.response?.status}: ${errorMsg}` }))
      setDebugInfo(prev => prev + ` | Submit error: ${e2.response?.status} ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  // No code regeneration in create mode; code is generated by backend upon creation

  // When species changes, map to id and fetch breeds for that species (also handled in onChange, but keep to sync external setForm)
  useEffect(() => {
    const syncBreeds = async () => {
      try {
        const spec = (species || []).find(s => (s._id || s.id) === selectedSpeciesId)
        const sid = spec?._id || selectedSpeciesId || ''
        if (sid) {
          const brRes = await apiClient.get(`/admin/breeds/species/${sid}`)
          setBreeds(brRes.data?.data || [])
        } else {
          setBreeds([])
        }
        // ensure category reflects species
        const catName = (spec?.category?.displayName || spec?.category?.name || spec?.category || '').toString()
        if (catName && form.category !== catName) setForm(f => ({ ...f, category: catName }))
      } catch (e) {
        setBreeds([])
      }
    }
    syncBreeds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpeciesId])

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-2">{isEdit ? 'Edit Pet' : 'Add New Pet'}</h2>
      <p className="text-sm text-gray-600 mb-4">You can do a quick intake now and complete details later. Species is required; other fields can be added later.</p>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input name="name" placeholder="e.g., Bruno" className="px-3 py-2 border rounded w-full" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1">Age</label>
          <div className="flex gap-2">
            <input name="age" type="number" min="0" className="px-3 py-2 border rounded w-full" value={form.age} onChange={onChange} />
            <select name="ageUnit" className="px-3 py-2 border rounded" value={form.ageUnit} onChange={onChange}>
              <option value="years">years</option>
              <option value="months">months</option>
              <option value="weeks">weeks</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Code</label>
            <div className="flex gap-2">
              <input value={form.petCode || ''} readOnly className="px-3 py-2 border rounded w-full bg-gray-50 font-mono" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-generated unique code displayed after creation.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" className="px-3 py-2 border rounded w-full" value={form.category}
                  onChange={onChange} disabled={fetchingMeta} required>
            <option value="">Select category</option>
            {categories.map(cName => (
              <option key={cName} value={cName}>{cName}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{categories.length ? 'Select a category to filter species.' : 'No categories available. Ensure admin has configured species categories.'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <span>Species</span>
            {form.category && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">Category: {form.category}</span>
            )}
          </label>
          <select name="species" className="px-3 py-2 border rounded w-full" value={selectedSpeciesId}
                  onChange={onChange} disabled={fetchingMeta} required>
            <option value="">Select species</option>
            {species
              .filter(s => !form.category || ((s.category?.displayName || s.category?.name || s.category || '').toString() === form.category))
              .map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.name || s.title}</option>
              ))}
          </select>
          {!fetchingMeta && species.length===0 && (
            <p className="text-xs text-amber-700 mt-1">No species available. Please ensure admin has created species or try refreshing.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <select
            name="breed"
            className="px-3 py-2 border rounded w-full"
            value={form.breed}
            onChange={onChange}
            required
            disabled={breeds.length === 0}
          >
            <option value="">{breeds.length ? 'Select breed' : 'No breeds available (ask Admin to add)'}
            </option>
            {breeds.map(b => (
              <option key={b._id || b.id} value={(b.name || b.title || '').toString()}>{b.name || b.title}</option>
            ))}
          </select>
          {!fetchingMeta && selectedSpeciesId && breeds.length===0 && (
            <p className="text-xs text-amber-700 mt-1">No breeds configured for this species. Please contact Admin to add breeds.</p>
          )}
          {(form.species || form.category) && (
            <p className="text-xs text-gray-500 mt-1">Selected: {form.species ? `Species: ${form.species}` : ''}{form.species && form.category ? ' • ' : ''}{form.category ? `Category: ${form.category}` : ''}</p>
          )}
        </div>

        {isEdit && (
          <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" className="px-3 py-2 border rounded w-full" value={form.gender} onChange={onChange}>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input name="color" placeholder="e.g., Brown & White" className="px-3 py-2 border rounded w-full" value={form.color} onChange={onChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input name="weight" type="number" placeholder="e.g., 12" className="px-3 py-2 border rounded w-full" value={form.weight} onChange={onChange} />
        </div>
        <select name="healthStatus" className="px-3 py-2 border rounded" value={form.healthStatus} onChange={onChange}>
          <option value="excellent">excellent</option>
          <option value="good">good</option>
          <option value="fair">fair</option>
          <option value="needs_attention">needs_attention</option>
        </select>
        <select name="vaccinationStatus" className="px-3 py-2 border rounded" value={form.vaccinationStatus} onChange={onChange}>
          <option value="up_to_date">up_to_date</option>
          <option value="partial">partial</option>
          <option value="not_vaccinated">not_vaccinated</option>
        </select>
        <select name="temperament" className="px-3 py-2 border rounded" value={form.temperament} onChange={onChange}>
          <option value="calm">calm</option>
          <option value="energetic">energetic</option>
          <option value="playful">playful</option>
          <option value="shy">shy</option>
          <option value="aggressive">aggressive</option>
          <option value="friendly">friendly</option>
        </select>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adoption Fee (₹)</label>
              <input name="adoptionFee" type="number" placeholder="e.g., 500" className="px-3 py-2 border rounded w-full" value={form.adoptionFee} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" placeholder="Temperament, special needs, etc." className="px-3 py-2 border rounded w-full" rows={4} value={form.description} onChange={onChange} />
            </div>
          </>
        )}
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{isEdit ? 'Update' : 'Add Pet'}</button>
          <button type="button" className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate('..')} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default PetForm

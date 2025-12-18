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
        
        // Set images and documents if they exist
        if (p.images && Array.isArray(p.images)) {
          const formattedImages = p.images.map(img => ({
            url: img.url || '',
            caption: img.caption || '',
            isPrimary: !!img.isPrimary
          })).filter(img => img.url)
          setImages(formattedImages)
        }
        
        if (p.documents && Array.isArray(p.documents)) {
          const formattedDocuments = p.documents.map(doc => ({
            url: doc.url || '',
            name: doc.name || doc.url?.split('/').pop() || 'document',
            type: doc.type || 'application/pdf'
          })).filter(doc => doc.url)
          setDocuments(formattedDocuments)
        }
        
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

  // Media helpers
  const onChooseImage = () => imgInputRef.current?.click()
  const onChooseDocument = () => docInputRef.current?.click()

  // Convert file to base64
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })

  const onImageSelected = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    e.target.value = ''
    
    try {
      // Process all selected images
      const uploadedImages = []
      for (const file of files) {
        // Upload image to backend and get URL
        const formData = new FormData()
        formData.append('file', file)
        const res = await apiClient.post('/adoption/manager/pets/upload', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
        const url = resolveMediaUrl(res.data?.data?.url)
        if (url) {
          uploadedImages.push({ 
            url, 
            name: file.name, 
            type: file.type, 
            size: file.size,
            isPrimary: false
          })
        }
      }
      
      // Add uploaded images to state
      setImages(prev => {
        const next = [...prev, ...uploadedImages]
        // Set first image as primary if no primary exists
        if (next.length > 0 && !next.some(img => img.isPrimary)) {
          next[0].isPrimary = true
        }
        return next
      })
    } catch (err) {
      setError(err?.response?.data?.error || 'Image upload failed')
    }
  }

  const onDocumentSelected = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    e.target.value = ''
    
    try {
      // Process all selected documents
      const uploadedDocs = []
      for (const file of files) {
        // Upload document to backend and get URL
        const formData = new FormData()
        formData.append('file', file)
        const res = await apiClient.post('/adoption/manager/pets/upload-document', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
        const url = resolveMediaUrl(res.data?.data?.url)
        if (url) {
          uploadedDocs.push({ 
            url, 
            name: file.name, 
            type: file.type, 
            size: file.size 
          })
        }
      }
      
      // Add uploaded documents to state
      setDocuments(prev => [...prev, ...uploadedDocs])
    } catch (err) {
      setError(err?.response?.data?.error || 'Document upload failed')
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })))
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
        documents: documents.map(x => ({ url: x.url, name: x.name || x.url?.split('/').pop() || 'document', type: x.type || 'application/pdf' })),
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{isEdit ? 'Edit Pet' : 'Add New Pet'}</h2>
        <p className="text-sm text-gray-600 mb-6">You can do a quick intake now and complete details later. Species is required; other fields can be added later.</p>
        
        {apiErrors.submit && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{apiErrors.submit}</div>}
        
        {/* Image Preview Section */}
        {images.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Pet Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img.url} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-32 object-cover rounded border"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">Primary</span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white p-2 rounded text-sm transition-opacity"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded text-sm transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              name="name" 
              placeholder="e.g., Bruno" 
              className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={form.name} 
              onChange={onChange} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <div className="flex gap-3">
              <input 
                name="age" 
                type="number" 
                min="0" 
                className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={form.age} 
                onChange={onChange} 
              />
              <select 
                name="ageUnit" 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={form.ageUnit} 
                onChange={onChange}
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="weeks">Weeks</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pet Code</label>
              <div className="flex gap-3">
                <input 
                  value={form.petCode || ''} 
                  readOnly 
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full bg-gray-50 font-mono" 
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-generated unique code displayed after creation.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input 
              value={form.category || ''} 
              readOnly 
              className="px-4 py-2 border border-gray-300 rounded-lg w-full bg-gray-50" 
              disabled 
            />
            <p className="text-xs text-gray-500 mt-1">Category is derived from the selected species.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>Species</span>
              {form.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Category: {form.category}</span>
              )}
            </label>
            <select 
              name="species" 
              className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={selectedSpeciesId}
              onChange={onChange} 
              disabled={fetchingMeta} 
              required
            >
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
            <select
              name="breed"
              className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.breed}
              onChange={onChange}
              required
              disabled={breeds.length === 0}
            >
              <option value="">{breeds.length ? 'Select breed' : 'No breeds available (ask Admin to add)'}</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select 
            name="gender" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.gender} 
            onChange={onChange}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <input 
            name="color" 
            placeholder="e.g., Brown & White" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.color} 
            onChange={onChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
          <input 
            name="weight" 
            type="number" 
            placeholder="e.g., 12" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.weight} 
            onChange={onChange} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Health Status</label>
          <select 
            name="healthStatus" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.healthStatus} 
            onChange={onChange}
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="needs_attention">Needs Attention</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vaccination Status</label>
          <select 
            name="vaccinationStatus" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.vaccinationStatus} 
            onChange={onChange}
          >
            <option value="up_to_date">Up to Date</option>
            <option value="partial">Partial</option>
            <option value="not_vaccinated">Not Vaccinated</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Temperament</label>
          <select 
            name="temperament" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.temperament} 
            onChange={onChange}
          >
            <option value="calm">Calm</option>
            <option value="energetic">Energetic</option>
            <option value="playful">Playful</option>
            <option value="shy">Shy</option>
            <option value="aggressive">Aggressive</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adoption Fee (₹)</label>
          <input 
            name="adoptionFee" 
            type="number" 
            placeholder="e.g., 500" 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={form.adoptionFee} 
            onChange={onChange} 
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea 
            name="description" 
            placeholder="Temperament, special needs, etc." 
            className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            rows={4} 
            value={form.description} 
            onChange={onChange} 
          />
        </div>
          </>
        )}
          
          {/* Image Upload Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Images</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onChooseImage}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Upload Image
              </button>
              <input
                type="file"
                ref={imgInputRef}
                onChange={onImageSelected}
                accept="image/*"
                multiple
                className="hidden"
              />
              <p className="text-xs text-gray-500 self-center">
                Upload clear photos of the pet (optional but recommended)
              </p>
            </div>
            
            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Uploaded Images:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img.url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded border"
                        onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                      />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">Primary</span>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-1">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white p-1 rounded text-xs transition-opacity"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded text-xs transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Document Upload Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Documents</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onChooseDocument}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Upload Document
              </button>
              <input
                type="file"
                ref={docInputRef}
                onChange={onDocumentSelected}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                multiple
                className="hidden"
              />
              <p className="text-xs text-gray-500 self-center">
                Upload medical records, certificates, or other documents (PDF, DOC, DOCX, TXT, JPG, PNG)
              </p>
            </div>
            
            {/* Document Preview */}
            {documents.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Uploaded Documents:</h4>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
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
                        onClick={() => removeDocument(index)}
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
          
          <div className="md:col-span-2 flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? 'Saving...' : isEdit ? 'Update Pet' : 'Add Pet'}
            </button>
            <button 
              type="button" 
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={()=>navigate('..')} 
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        
          {error && <div className="md:col-span-2 mt-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
        </form>
      
        {/* Debug Info (only shown in development) */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-yellow-50 text-yellow-800 text-xs rounded">
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}
      </div>
    </div>
  )
}

export default PetForm

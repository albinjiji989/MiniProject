import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const PetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savingMedia, setSavingMedia] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)
  const [showAllDocs, setShowAllDocs] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        setPet(res.data?.data)
      } catch (e) {
        console.error('Load pet failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const extractUrl = (item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item.url === 'string') return item.url
    if (item.url && typeof item.url.url === 'string') return item.url.url
    return ''
  }

  const uploadAndLinkMedia = async (imageUrls, docUrls) => {
    try {
      // Update pet with new media URLs
      const payload = {}
      if (imageUrls.length > 0) payload.images = imageUrls
      if (docUrls.length > 0) payload.documents = docUrls
      
      if (Object.keys(payload).length === 0) return
      
      await apiClient.put(`/adoption/manager/pets/${id}`, payload)
    } catch (e) {
      console.error('Failed to link media to pet:', e)
      throw e
    }
  }

  const onAddImages = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !pet) return
    
    setSavingMedia(true)
    try {
      const newImageIds = []
      
      // Upload each image to server
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await apiClient.post('/adoption/manager/pets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        if (res.data?.data?._id) {
          newImageIds.push(res.data.data._id)
        }
      }
      
      // Get current image IDs
      const currentImageIds = (pet.imageIds || []).filter(id => typeof id === 'string' && id.length > 0)
      
      // Link all images to pet (existing + new)
      if (newImageIds.length > 0) {
        await apiClient.put(`/adoption/manager/pets/${id}`, {
          imageIds: [...currentImageIds, ...newImageIds]
        })
        
        // Reload pet to show new images
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        setPet(res.data?.data)
      }
    } catch (e) {
      console.error('Add images failed', e)
      alert('Failed to add images. Please try again.')
    } finally {
      setSavingMedia(false)
      e.target.value = ''
    }
  }

  const onAddDocuments = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !pet) return
    
    setSavingMedia(true)
    try {
      const newDocumentIds = []
      
      // Upload each document to server
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await apiClient.post('/adoption/manager/pets/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        if (res.data?.data?._id) {
          newDocumentIds.push(res.data.data._id)
        }
      }
      
      // Get current document IDs
      const currentDocumentIds = (pet.documentIds || []).filter(id => typeof id === 'string' && id.length > 0)
      
      // Link all documents to pet (existing + new)
      if (newDocumentIds.length > 0) {
        await apiClient.put(`/adoption/manager/pets/${id}`, {
          documentIds: [...currentDocumentIds, ...newDocumentIds]
        })
        
        // Reload pet to show new documents
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        setPet(res.data?.data)
      }
    } catch (e) {
      console.error('Add documents failed', e)
      alert('Failed to add documents. Please try again.')
    } finally {
      setSavingMedia(false)
      e.target.value = ''
    }
  }

  const removeImage = async (idx) => {
    if (!pet || !Array.isArray(pet.images)) return
    
    setSavingMedia(true)
    try {
      const newImages = pet.images.filter((_, i) => i !== idx)
      const imageUrls = newImages.map(img => ({ url: extractUrl(img), caption: img.caption || '' }))
      const docUrls = (pet.documents || []).map(doc => ({ url: extractUrl(doc), name: doc.name || 'document' }))
      
      await uploadAndLinkMedia(imageUrls, docUrls)
      
      // Reload pet
      const res = await apiClient.get(`/adoption/manager/pets/${id}`)
      setPet(res.data?.data)
    } catch (e) {
      console.error('Remove image failed', e)
      alert('Failed to remove image. Please try again.')
    } finally {
      setSavingMedia(false)
    }
  }

  const removeDocument = async (idx) => {
    if (!pet || !Array.isArray(pet.documents)) return
    
    setSavingMedia(true)
    try {
      const newDocs = pet.documents.filter((_, i) => i !== idx)
      const imageUrls = (pet.images || []).map(img => ({ url: extractUrl(img), caption: img.caption || '' }))
      const docUrls = newDocs.map(doc => ({ url: extractUrl(doc), name: doc.name || 'document' }))
      
      await uploadAndLinkMedia(imageUrls, docUrls)
      
      // Reload pet
      const res = await apiClient.get(`/adoption/manager/pets/${id}`)
      setPet(res.data?.data)
    } catch (e) {
      console.error('Remove document failed', e)
      alert('Failed to remove document. Please try again.')
    } finally {
      setSavingMedia(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!pet) return <div>Not found</div>

  return (
    <div className="space-y-4">
      {(!pet.age && !pet.weight && !pet.color && !pet.description) && (
        <div className="p-3 border rounded bg-amber-50 text-amber-800 flex items-center justify-between">
          <div>
            <div className="font-semibold">Profile incomplete</div>
            <div className="text-sm">Some key details are missing. Please complete the pet profile.</div>
          </div>
          <button className="px-3 py-1.5 bg-emerald-600 text-white rounded" onClick={()=>navigate('profile')}>Complete Profile</button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          <span>{(!pet.name || String(pet.name).startsWith('Unknown-')) ? 'No name' : pet.name}</span>
          {(pet.petCode || pet._id) && (
            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">{pet.petCode || pet._id}</span>
          )}
        </h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate(-1)}>Back</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>navigate('edit')}>Edit</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={()=>navigate('profile')}>Complete Profile</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Basic Info</h3>
          {pet.petCode && <div className="text-sm text-gray-700">Code: <span className="font-mono">{pet.petCode}</span></div>}
          <div className="text-sm text-gray-700">Breed: {pet.breed}</div>
          <div className="text-sm text-gray-700">Species: {pet.species}</div>
          {pet.ageDisplay && (<div className="text-sm text-gray-700">Age: {pet.ageDisplay}</div>)}
          {pet.gender && (<div className="text-sm text-gray-700">Gender: {pet.gender}</div>)}
          {pet.color && (<div className="text-sm text-gray-700">Color: {pet.color}</div>)}
          {typeof pet.weight === 'number' && pet.weight > 0 && (<div className="text-sm text-gray-700">Weight: {pet.weight} kg</div>)}
          {pet.healthStatus && (<div className="text-sm text-gray-700">Health: {pet.healthStatus}</div>)}
          {pet.vaccinationStatus && (<div className="text-sm text-gray-700">Vaccination: {pet.vaccinationStatus}</div>)}
          {pet.temperament && (<div className="text-sm text-gray-700">Temperament: {pet.temperament}</div>)}
          <div className="text-sm text-gray-700">Status: {pet.status}</div>
          {typeof pet.adoptionFee === 'number' && pet.adoptionFee > 0 && (<div className="text-sm text-gray-700">Adoption Fee: ₹{pet.adoptionFee}</div>)}
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{pet.description || '—'}</p>
        </div>
      </div>

      {/* Media Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Images</h3>
            <div className="flex items-center gap-2">
              {Array.isArray(pet.images) && pet.images.length > 0 && (
                <span className="text-xs text-gray-500">{pet.images.length} file(s)</span>
              )}
              <label className="text-xs px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer">
                {savingMedia ? 'Saving...' : 'Add Images'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={onAddImages} disabled={savingMedia} />
              </label>
            </div>
          </div>
          {Array.isArray(pet.images) && pet.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(showAllImages ? pet.images : pet.images.slice(0, 6))
                .map(extractUrl)
                .filter((u) => !!u && !String(u).startsWith('blob:'))
                .map((u, idx) => {
                const url = resolveMediaUrl(u)
                if (!url) return null
                return (
                  <div key={idx} className="border rounded overflow-hidden relative group">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img loading="lazy" src={url} alt={`Pet ${idx+1}`} className="w-full h-28 object-cover" />
                    </a>
                    <button onClick={()=>removeImage(idx)} className="absolute top-1 right-1 text-xs px-2 py-0.5 rounded bg-red-600 text-white opacity-0 group-hover:opacity-100">Remove</button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No images</div>
          )}
          {Array.isArray(pet.images) && pet.images.length > 6 && (
            <div className="mt-3">
              <button className="text-xs px-3 py-1 border rounded" onClick={()=>setShowAllImages(v=>!v)}>
                {showAllImages ? 'Show less' : `Show all (${pet.images.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Documents</h3>
            <div className="flex items-center gap-2">
              {Array.isArray(pet.documents) && pet.documents.length > 0 && (
                <span className="text-xs text-gray-500">{pet.documents.length} file(s)</span>
              )}
              <label className="text-xs px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer">
                {savingMedia ? 'Saving...' : 'Add Documents'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={onAddDocuments} disabled={savingMedia} />
              </label>
            </div>
          </div>
          {Array.isArray(pet.documents) && pet.documents.length > 0 ? (
            <div className="space-y-2">
              {(showAllDocs ? pet.documents : pet.documents.slice(0, 8))
                .map((doc) => ({ 
                  url: extractUrl(doc), 
                  name: (typeof doc === 'string' ? doc.split('/').pop() : doc?.name) || 'document',
                  type: doc?.type || (typeof doc === 'string' ? '' : doc?.url?.split('.').pop()?.toLowerCase() || '')
                }))
                .filter((d) => !!d.url && !String(d.url).startsWith('blob:'))
                .map((d, idx) => {
                const url = resolveMediaUrl(d.url)
                const name = d.name || `Document-${idx+1}`
                const isImage = d.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].some(ext => d.url?.toLowerCase().endsWith(ext))
                const isPdf = d.type === 'application/pdf' || d.url?.toLowerCase().endsWith('.pdf')
                
                if (!url) return null
                
                return (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {isImage ? (
                        <img src={url} alt={name} className="w-8 h-8 object-cover rounded" />
                      ) : isPdf ? (
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">PDF</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-600 text-xs">DOC</span>
                        </div>
                      )}
                      <div className="text-sm truncate pr-2">{name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="px-2 py-1 text-xs bg-blue-600 text-white rounded" href={url} target="_blank" rel="noopener noreferrer">
                        {isImage ? 'View' : isPdf ? 'Preview' : 'Open'}
                      </a>
                      <a className="px-2 py-1 text-xs bg-gray-700 text-white rounded" href={url} download>Download</a>
                      <button onClick={()=>removeDocument(idx)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Remove</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No documents</div>
          )}
          {Array.isArray(pet.documents) && pet.documents.length > 8 && (
            <div className="mt-3">
              <button className="text-xs px-3 py-1 border rounded" onClick={()=>setShowAllDocs(v=>!v)}>
                {showAllDocs ? 'Show less' : `Show all (${pet.documents.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetDetails
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../../services/api'
import RequestModal from '../../../../components/Common/RequestModal'

const KEY = 'adopt_wizard'

export default function StepBasicInfo() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [allSpecies, setAllSpecies] = useState([])
  const [filteredSpecies, setFilteredSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.basic || {} } catch { return {} }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, basic: { ...(prev.basic||{}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.basic)
  }

  // Load categories and species on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load categories
        let catRes
        try {
          catRes = await apiClient.get('/admin/pet-categories/active')
        } catch {
          catRes = await apiClient.get('/admin/pet-categories')
        }
        const cats = catRes.data?.data || catRes.data || []
        setCategories(cats)

        // Load all species
        let specRes
        try {
          specRes = await apiClient.get('/admin/species/active')
        } catch {
          specRes = await apiClient.get('/admin/species')
        }
        const specs = specRes.data?.data || specRes.data || []
        setAllSpecies(specs)
        setFilteredSpecies(specs)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Handle category selection
  const onCategoryChange = (e) => {
    const categoryId = e.target.value
    const category = categories.find(c => (c._id || c.id) === categoryId)
    
    save({ 
      categoryId, 
      category: category?.name || category?.displayName || '',
      speciesId: '',
      species: '',
      breed: '' 
    })

    // Filter species by category
    if (categoryId) {
      const filtered = allSpecies.filter(s => {
        // Try multiple ways species might reference category
        return (
          s.categoryId === categoryId ||
          s.category === categoryId ||
          (s.category && s.category._id === categoryId) ||
          (s.category && s.category.id === categoryId) ||
          (typeof s.category === 'string' && s.category === (category?.name || category?.displayName))
        )
      })
      setFilteredSpecies(filtered)
    } else {
      setFilteredSpecies(allSpecies)
    }
    setBreeds([])
  }

  // Handle species selection
  const onSpeciesChange = async (e) => {
    const speciesId = e.target.value
    const species = allSpecies.find(s => (s._id || s.id) === speciesId)
    
    save({ 
      species: species?.name || species?.displayName || '',
      speciesId,
      breed: '' 
    })

    // Load breeds for this species
    if (speciesId) {
      try {
        const breedRes = await apiClient.get(`/admin/breeds/species/${speciesId}`)
        const breedData = breedRes.data?.data || breedRes.data || []
        setBreeds(breedData)
      } catch (error) {
        console.error('Failed to load breeds:', error)
        setBreeds([])
      }
    } else {
      setBreeds([])
    }
  }

  const onChange = (e) => save({ [e.target.name]: e.target.value })

  const handleRequestSuccess = () => {
    // Optionally reload data here
    console.log('Request submitted successfully')
  }

  const next = () => navigate('/manager/adoption/wizard/health')

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            Request New Data
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.categoryId || ''} 
              onChange={onCategoryChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name || cat.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium mb-2">Species *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.speciesId || ''} 
              onChange={onSpeciesChange}
              disabled={!form.categoryId}
              required
            >
              <option value="">Select Species</option>
              {filteredSpecies.map(spec => (
                <option key={spec._id || spec.id} value={spec._id || spec.id}>
                  {spec.name || spec.displayName}
                </option>
              ))}
            </select>
            {!form.categoryId && <p className="text-xs text-gray-500 mt-1">Select category first</p>}
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium mb-2">Breed *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.breed || ''} 
              onChange={(e) => save({ breed: e.target.value })}
              disabled={!form.speciesId}
              required
            >
              <option value="">Select Breed</option>
              {breeds.map(breed => (
                <option key={breed._id || breed.id} value={breed.name || breed.displayName || breed._id || breed.id}>
                  {breed.name || breed.displayName || breed._id || breed.id}
                </option>
              ))}
            </select>
            {!form.speciesId && <p className="text-xs text-gray-500 mt-1">Select species first</p>}
            {form.speciesId && breeds.length === 0 && <p className="text-xs text-amber-600 mt-1">No breeds available for this species</p>}
          </div>

          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">Pet Name</label>
            <input 
              type="text"
              name="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.name || ''} 
              onChange={onChange}
              placeholder="Enter pet name (optional)"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">Gender *</label>
            <select 
              name="gender"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.gender || 'male'} 
              onChange={onChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <input 
              type="text"
              name="color"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.color || ''} 
              onChange={onChange}
              placeholder="Enter color"
            />
          </div>

          {/* Age / Date of Birth */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Age / Date of Birth</label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => save({ useAge: true })}
                  className={`px-3 py-1 rounded ${
                    form.useAge !== false
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Age
                </button>
                <button
                  type="button"
                  onClick={() => save({ useAge: false })}
                  className={`px-3 py-1 rounded ${
                    form.useAge === false
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Date of Birth
                </button>
              </div>
            </div>

            {form.useAge !== false ? (
              <div className="flex gap-2">
                <input 
                  type="number"
                  name="age"
                  min="0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={form.age || ''} 
                  onChange={onChange}
                  placeholder="0"
                />
                <select 
                  name="ageUnit"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={form.ageUnit || 'months'} 
                  onChange={onChange}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="date"
                  name="dateOfBirth"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.dateOfBirth || ''}
                  onChange={onChange}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dobEstimated"
                    checked={form.dobAccuracy === 'estimated'}
                    onChange={(e) => save({ dobAccuracy: e.target.checked ? 'estimated' : 'exact' })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="dobEstimated" className="text-sm text-gray-700">
                    Date of birth is estimated
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={next}
          disabled={!form.categoryId || !form.speciesId || !form.breed}
        >
          Next Step
        </button>
      </div>

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  )
}
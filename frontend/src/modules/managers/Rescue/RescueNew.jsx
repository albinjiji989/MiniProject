import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const RescueNew = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    pet: '',
    situation: 'emergency',
    description: '',
    longitude: '',
    latitude: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        pet: form.pet,
        situation: form.situation,
        description: form.description,
        location: { type: 'Point', coordinates: [Number(form.longitude), Number(form.latitude)] }
      }
      await apiClient.post('/rescue', payload)
      navigate('..')
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to create rescue case')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-2">Create Rescue Case</h2>
      <p className="text-sm text-gray-600 mb-4">Provide situation, pet, description and location coordinates [lon, lat].</p>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pet ID</label>
          <input name="pet" className="px-3 py-2 border rounded w-full" placeholder="Pet ObjectId" value={form.pet} onChange={onChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Situation</label>
          <select name="situation" className="px-3 py-2 border rounded w-full" value={form.situation} onChange={onChange}>
            <option value="abandoned">abandoned</option>
            <option value="injured">injured</option>
            <option value="lost">lost</option>
            <option value="abused">abused</option>
            <option value="stray">stray</option>
            <option value="emergency">emergency</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={4} className="px-3 py-2 border rounded w-full" placeholder="Brief description" value={form.description} onChange={onChange} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input name="longitude" type="number" step="any" className="px-3 py-2 border rounded w-full" value={form.longitude} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input name="latitude" type="number" step="any" className="px-3 py-2 border rounded w-full" value={form.latitude} onChange={onChange} required />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          <button type="button" className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate('..')} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default RescueNew

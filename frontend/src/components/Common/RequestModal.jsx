import React, { useState } from 'react'
import { apiClient } from '../../services/api'

export default function RequestModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'species', // 'category', 'species', 'breed'
    category: '',
    species: '',
    breed: '',
    explanation: ''
  })

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requestData = {
        type: form.type,
        explanation: form.explanation,
        requestedData: {}
      }

      // Build requested data based on type
      if (form.type === 'category') {
        requestData.requestedData = {
          name: form.category,
          displayName: form.category
        }
      } else if (form.type === 'species') {
        requestData.requestedData = {
          name: form.species,
          displayName: form.species,
          category: form.category || undefined
        }
      } else if (form.type === 'breed') {
        requestData.requestedData = {
          name: form.breed,
          displayName: form.breed,
          species: form.species,
          category: form.category || undefined
        }
      }

      await apiClient.post('/admin/pet-system-requests', requestData)
      
      onSuccess?.()
      onClose()
      
      // Reset form
      setForm({
        type: 'species',
        category: '',
        species: '',
        breed: '',
        explanation: ''
      })
      
      alert('Request submitted successfully! Admin will review it.')
    } catch (error) {
      console.error('Failed to submit request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Request New Pet Data</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Request Type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="category">Category</option>
              <option value="species">Species</option>
              <option value="breed">Breed</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category {form.type !== 'category' && '(Optional)'}
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mammals, Birds, Reptiles"
              required={form.type === 'category'}
            />
          </div>

          {/* Species */}
          {(form.type === 'species' || form.type === 'breed') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Species {form.type === 'species' ? '*' : '(Optional)'}
              </label>
              <input
                type="text"
                name="species"
                value={form.species}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Dog, Cat, Parrot"
                required={form.type === 'species'}
              />
            </div>
          )}

          {/* Breed */}
          {form.type === 'breed' && (
            <div>
              <label className="block text-sm font-medium mb-2">Breed *</label>
              <input
                type="text"
                name="breed"
                value={form.breed}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Golden Retriever, Persian, Cockatiel"
                required
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-2">Explanation/Notes</label>
            <textarea
              name="explanation"
              value={form.explanation}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please explain why you need this new category/species/breed, any specific characteristics, or additional information..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

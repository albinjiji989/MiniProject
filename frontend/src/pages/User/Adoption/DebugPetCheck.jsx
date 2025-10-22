import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI } from '../../../services/api'

export default function DebugPetCheck() {
  const navigate = useNavigate()
  const [petId, setPetId] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const checkPet = async () => {
    if (!petId.trim()) {
      setError('Please enter a pet ID')
      return
    }
    
    setChecking(true)
    setError('')
    setResult(null)
    
    try {
      const response = await adoptionAPI.getPet(petId.trim())
      if (response?.data?.data) {
        setResult({
          found: true,
          pet: response.data.data
        })
      } else {
        setResult({
          found: false,
          message: `No pet found with ID: ${petId}. This pet may have been adopted by another user, removed by the adoption manager, or the ID may be incorrect.`
        })
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setResult({
          found: false,
          message: `Pet with ID ${petId} not found. This pet may have been adopted by another user, removed by the adoption manager, or the ID may be incorrect.`
        })
      } else {
        setResult({
          found: false,
          message: `Error checking pet: ${err?.response?.data?.error || err.message}`
        })
      }
    } finally {
      setChecking(false)
    }
  }

  const checkCurrentPets = async () => {
    setChecking(true)
    setError('')
    setResult(null)
    
    try {
      const response = await adoptionAPI.listPets({ limit: 10 })
      if (response?.data?.data?.pets) {
        setResult({
          found: true,
          pets: response.data.data.pets,
          message: `Found ${response.data.data.pets.length} available pets`
        })
      } else {
        setResult({
          found: false,
          message: 'No available pets found'
        })
      }
    } catch (err) {
      setResult({
        found: false,
        message: `Error fetching pets: ${err?.response?.data?.error || err.message}`
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Adoption Pet Debug Tool</h2>
      
      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Check Specific Pet ID</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            placeholder="Enter Pet ID (e.g., 68f74a849867d88ea26b5b1b)"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={checkPet}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check Pet'}
          </button>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm mb-3">{error}</div>
        )}
      </div>
      
      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Check Current Available Pets</h3>
        <button
          onClick={checkCurrentPets}
          disabled={checking}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {checking ? 'Loading...' : 'Show Available Pets'}
        </button>
      </div>
      
      {result && (
        <div className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold mb-3">Results</h3>
          
          {result.found && result.pet ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-800">Pet Found!</div>
                <div className="mt-2">
                  <div><strong>Name:</strong> {result.pet.name}</div>
                  <div><strong>ID:</strong> {result.pet._id}</div>
                  <div><strong>Species:</strong> {result.pet.species}</div>
                  <div><strong>Breed:</strong> {result.pet.breed}</div>
                  <div><strong>Status:</strong> {result.pet.status}</div>
                  <div><strong>Active:</strong> {result.pet.isActive ? 'Yes' : 'No'}</div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/User/adoption/${result.pet._id}`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm mr-2"
                  >
                    View Pet Details
                  </button>
                  <button
                    onClick={() => navigate(`/User/adoption/apply/applicant?petId=${result.pet._id}`)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Apply for Adoption
                  </button>
                </div>
              </div>
            </div>
          ) : result.found && result.pets ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-800">{result.message}</div>
                <div className="mt-2 space-y-2">
                  {result.pets.map((pet) => (
                    <div key={pet._id} className="p-2 border border-gray-200 rounded">
                      <div className="flex justify-between">
                        <div>
                          <div><strong>{pet.name}</strong> ({pet._id})</div>
                          <div className="text-sm text-gray-600">{pet.breed} • {pet.species} • {pet.status}</div>
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/User/adoption/${pet._id}`)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-1"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/User/adoption/apply/applicant?petId=${pet._id}`)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="font-medium text-red-800">Pet Not Found</div>
              <div className="mt-1">{result.message}</div>
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-medium text-blue-800 mb-2">Available Options:</div>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
                  <li>Check if you have the correct pet ID</li>
                  <li>Look for currently available pets in the listings</li>
                  <li>Contact support if you believe this is an error</li>
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => navigate('/User/adoption')}
                  className="px-3 py-1 bg-blue-600 text-white rounded mr-2"
                >
                  Back to Pet Listings
                </button>
                <button
                  onClick={checkCurrentPets}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Show Available Pets
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={() => navigate('/User/adoption')}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          ← Back to Adoption
        </button>
      </div>
    </div>
  )
}
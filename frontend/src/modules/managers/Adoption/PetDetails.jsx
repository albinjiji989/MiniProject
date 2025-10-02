import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const PetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(false)

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
          <span>{pet.name}</span>
          {pet.petCode && (
            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">{pet.petCode}</span>
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
    </div>
  )
}

export default PetDetails

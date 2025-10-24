import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { petShopAPI } from '../../../services/api'

const TestPetDetails = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pet, setPet] = useState(null)

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true)
        console.log('Loading pet with ID:', id)
        const res = await petShopAPI.getPublicListing(id)
        console.log('Response:', res)
        setPet(res.data.data.item)
      } catch (e) {
        console.error('Error:', e)
        setError(e?.response?.data?.message || e?.message || 'Failed to load pet')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      loadPet()
    }
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!pet) return <div>No pet found</div>
  
  return (
    <div>
      <h1>Test Pet Details</h1>
      <p>ID: {id}</p>
      <p>Name: {pet.name}</p>
      <p>Species: {pet.speciesId?.name}</p>
      <p>Breed: {pet.breedId?.name}</p>
    </div>
  )
}

export default TestPetDetails
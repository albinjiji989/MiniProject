import { useState, useEffect } from 'react'
import { apiClient } from '../../../services/api'

export const usePetBirthday = (pets, dismissedPets) => {
  const [petsWithoutPreference, setPetsWithoutPreference] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check which pets don't have birthday preferences
  useEffect(() => {
    const checkPets = async () => {
      if (!pets || !Array.isArray(pets) || pets.length === 0) {
        setPetsWithoutPreference([])
        return
      }
      
      setLoading(true)
      setError('')
      
      try {
        // Get all pets with birthday preferences for current user
        const res = await apiClient.get('/pets/birthday/birthday-preferences')
        const preferences = res.data.data.preferences || {}
        
        // Filter pets that don't have preferences and aren't dismissed
        const petsToCheck = pets.filter(pet => 
          pet && pet._id && 
          !preferences[pet._id] && 
          !dismissedPets.includes(pet._id)
        )
        
        setPetsWithoutPreference(petsToCheck)
      } catch (err) {
        console.error('Error checking pet preferences:', err)
        // Fallback to checking individually if bulk check fails
        const petsToCheck = pets.filter(pet => 
          pet && pet._id && 
          !dismissedPets.includes(pet._id)
        )
        
        const petsWithoutPref = []
        
        for (const pet of petsToCheck) {
          try {
            // Check if pet has birthday preference
            await apiClient.get(`/pets/birthday/birthday-preference/${pet._id}`)
          } catch (err) {
            // If we get a 404 error, it means no preference is set
            if (err.response?.status === 404) {
              petsWithoutPref.push(pet)
            }
            // For other errors, we'll skip adding the pet to avoid issues
          }
        }
        
        setPetsWithoutPreference(petsWithoutPref)
      } finally {
        setLoading(false)
      }
    }
    
    checkPets()
  }, [pets, dismissedPets])

  return { petsWithoutPreference, loading, error }
}
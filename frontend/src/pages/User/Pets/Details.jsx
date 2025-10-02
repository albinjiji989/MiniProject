import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Card, CardContent, Button } from '@mui/material'
import { petsAPI } from '../../../services/api'

const UserPetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await petsAPI.getPet(id)
        setPet(res.data?.data || res.data?.pet || res.data)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load pet')
      }
    })()
  }, [id])

  if (error) {
    return <Container sx={{ py: 4 }}><Typography color="error">{error}</Typography></Container>
  }
  if (!pet) {
    return <Container sx={{ py: 4 }}><Typography>Loading...</Typography></Container>
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{pet.name}</Typography>
          <Box sx={{ color: 'text.secondary' }}>
            <div>Species: {pet.species?.name || pet.species || '-'}</div>
            <div>Breed: {pet.breed?.name || pet.breed || '-'}</div>
            <div>Gender: {pet.gender || '-'}</div>
            <div>Age: {pet.age ? `${pet.age} ${pet.ageUnit || ''}` : '-'}</div>
            <div>Color: {pet.color || '-'}</div>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default UserPetDetails



import React from 'react'
import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material'
import { petsAPI } from '../../services/api'

const Pets = () => {
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await petsAPI.getPets()
        setPets(res.data?.data?.pets || res.data?.data || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load pets')
      }
    })()
  }, [])

  if (error) return <Container sx={{ py: 4 }}><Typography color="error">{error}</Typography></Container>

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>My Pets</Typography>
      <Grid container spacing={2}>
        {pets.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.name}</Typography>
                <Box sx={{ color: 'text.secondary' }}>
                  <div>{p.species?.name || p.species}</div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Pets




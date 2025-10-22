import React, { useEffect, useState } from 'react'
import { Container, Typography, Card, CardContent, CircularProgress, Box, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material'
import { veterinaryAPI } from '../../../services/api'

const Patients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      // Will be implemented when API is ready
      setPatients([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Patients</Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">Patient list will appear here</Typography>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Patients

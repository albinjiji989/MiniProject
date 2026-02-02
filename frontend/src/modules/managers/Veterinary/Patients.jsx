import React, { useEffect, useState } from 'react'
import { Container, Typography, Card, CardContent, CircularProgress, Box, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material'
import { veterinaryAPI } from '../../../services/api'
import { format } from 'date-fns'

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
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : patients.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No patients found
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet Name</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Species</TableCell>
                  <TableCell>Breed</TableCell>
                  <TableCell>Last Visit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map(patient => (
                  <TableRow key={patient._id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.owner?.name}</TableCell>
                    <TableCell>{patient.species}</TableCell>
                    <TableCell>{patient.breed}</TableCell>
                    <TableCell>{patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default Patients

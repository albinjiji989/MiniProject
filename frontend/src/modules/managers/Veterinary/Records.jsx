import React, { useEffect, useState } from 'react'
import { Container, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress } from '@mui/material'
import { veterinaryAPI } from '../../../services/api'
import { format } from 'date-fns'

const Records = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const response = await veterinaryAPI.managerGetMedicalRecords()
      setRecords(response.data?.data?.records || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Medical Records</Typography>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Pet</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell>Treatment</TableCell>
              <TableCell>Veterinarian</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No medical records found</TableCell></TableRow>
            ) : (
              records.map(record => (
                <TableRow key={record._id}>
                  <TableCell>{format(new Date(record.completedAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{record.petId?.name}</TableCell>
                  <TableCell>{record.ownerId?.name}</TableCell>
                  <TableCell>{record.diagnosis}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>{record.veterinarianId?.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Container>
  )
}

export default Records

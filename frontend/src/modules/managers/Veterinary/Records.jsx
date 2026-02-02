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
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No medical records found</Typography>
              </TableCell></TableRow>
            ) : (
              records.map(record => (
                <TableRow key={record._id}>
                  <TableCell>{record.visitDate ? format(new Date(record.visitDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                  <TableCell>{record.pet?.name || 'N/A'}</TableCell>
                  <TableCell>{record.owner?.name || 'N/A'}</TableCell>
                  <TableCell>{record.diagnosis || 'N/A'}</TableCell>
                  <TableCell>{record.treatment || 'N/A'}</TableCell>
                  <TableCell>{record.staff?.name || 'N/A'}</TableCell>
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

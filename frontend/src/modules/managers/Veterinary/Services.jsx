import React, { useEffect, useState } from 'react'
import { Container, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Chip, IconButton } from '@mui/material'
import { Add, Edit, Delete, ToggleOn, ToggleOff } from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const response = await veterinaryAPI.managerGetServices()
      setServices(response.data?.data?.services || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">Services</Typography>
        <Button variant="contained" startIcon={<Add />}>Add Service</Button>
      </Box>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No services found</TableCell></TableRow>
            ) : (
              services.map(service => (
                <TableRow key={service._id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>₹{service.price}</TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell><Chip label={service.isActive ? 'Active' : 'Inactive'} color={service.isActive ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell>
                    <IconButton size="small"><Edit /></IconButton>
                    <IconButton size="small"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Container>
  )
}

export default Services

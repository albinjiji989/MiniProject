import React, { useEffect, useState } from 'react'
import {
  Container, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Tabs, Tab
} from '@mui/material'
import { Add, Edit, Delete, CheckCircle } from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'
import { format } from 'date-fns'

const Vaccinations = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    pet: '', vaccineName: '', vaccineType: 'core', scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: '', description: ''
  })
  const [completeForm, setCompleteForm] = useState({
    administeredDate: new Date().toISOString().split('T')[0], batchNumber: '', manufacturer: '',
    expiryDate: '', nextDoseDate: '', notes: '', sideEffects: ''
  })

  useEffect(() => {
    loadSchedules()
  }, [tab])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const params = {}
      if (tab === 1) params.status = 'due'
      if (tab === 2) params.status = 'overdue'
      if (tab === 3) params.status = 'completed'
      
      const response = await veterinaryAPI.managerGetVaccinations(params)
      setSchedules(response.data?.data?.schedules || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedSchedule) {
        await veterinaryAPI.managerUpdateVaccination(selectedSchedule._id, form)
      } else {
        await veterinaryAPI.managerCreateVaccination(form)
      }
      setDialogOpen(false)
      setSelectedSchedule(null)
      setForm({ pet: '', vaccineName: '', vaccineType: 'core', scheduledDate: new Date().toISOString().split('T')[0], dueDate: '', description: '' })
      loadSchedules()
    } catch (error) {
      console.error(error)
    }
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    try {
      await veterinaryAPI.managerCompleteVaccination(selectedSchedule._id, completeForm)
      setCompleteDialogOpen(false)
      setSelectedSchedule(null)
      setCompleteForm({ administeredDate: new Date().toISOString().split('T')[0], batchNumber: '', manufacturer: '', expiryDate: '', nextDoseDate: '', notes: '', sideEffects: '' })
      loadSchedules()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule)
    setForm({
      pet: schedule.pet._id,
      vaccineName: schedule.vaccineName,
      vaccineType: schedule.vaccineType,
      scheduledDate: schedule.scheduledDate.split('T')[0],
      dueDate: schedule.dueDate ? schedule.dueDate.split('T')[0] : '',
      description: schedule.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vaccination schedule?')) {
      try {
        await veterinaryAPI.managerDeleteVaccination(id)
        loadSchedules()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = { scheduled: 'info', due: 'warning', overdue: 'error', completed: 'success', cancelled: 'default' }
    return colors[status] || 'default'
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">Vaccination Schedules</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedSchedule(null); setDialogOpen(true) }}>
          Schedule Vaccination
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label="Due" />
        <Tab label="Overdue" />
        <Tab label="Completed" />
      </Tabs>

      {/* Table */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pet</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Vaccine</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No schedules found</TableCell></TableRow>
            ) : (
              schedules.map(schedule => (
                <TableRow key={schedule._id}>
                  <TableCell>{schedule.pet?.name}</TableCell>
                  <TableCell>{schedule.owner?.name}</TableCell>
                  <TableCell>{schedule.vaccineName}</TableCell>
                  <TableCell>{schedule.vaccineType}</TableCell>
                  <TableCell>{format(new Date(schedule.scheduledDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{schedule.dueDate ? format(new Date(schedule.dueDate), 'MMM dd, yyyy') : '-'}</TableCell>
                  <TableCell><Chip label={schedule.status} color={getStatusColor(schedule.status)} size="small" /></TableCell>
                  <TableCell>
                    {schedule.status !== 'completed' && (
                      <IconButton size="small" color="success" onClick={() => { setSelectedSchedule(schedule); setCompleteDialogOpen(true) }}>
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleEdit(schedule)}><Edit /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(schedule._id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selectedSchedule ? 'Edit Schedule' : 'Schedule Vaccination'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Pet ID" value={form.pet} onChange={(e) => setForm({ ...form, pet: e.target.value })} required sx={{ mt: 2 }} helperText="Enter Pet ID" />
            <TextField fullWidth label="Vaccine Name" value={form.vaccineName} onChange={(e) => setForm({ ...form, vaccineName: e.target.value })} required sx={{ mt: 2 }} />
            <TextField fullWidth select label="Vaccine Type" value={form.vaccineType} onChange={(e) => setForm({ ...form, vaccineType: e.target.value })} sx={{ mt: 2 }}>
              <MenuItem value="core">Core</MenuItem>
              <MenuItem value="non-core">Non-Core</MenuItem>
              <MenuItem value="optional">Optional</MenuItem>
            </TextField>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="date" label="Scheduled Date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="date" label="Due Date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Complete Vaccination Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleComplete}>
          <DialogTitle>Complete Vaccination: {selectedSchedule?.vaccineName}</DialogTitle>
          <DialogContent>
            <TextField fullWidth type="date" label="Administered Date" value={completeForm.administeredDate} onChange={(e) => setCompleteForm({ ...completeForm, administeredDate: e.target.value })} required sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth label="Batch Number" value={completeForm.batchNumber} onChange={(e) => setCompleteForm({ ...completeForm, batchNumber: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Manufacturer" value={completeForm.manufacturer} onChange={(e) => setCompleteForm({ ...completeForm, manufacturer: e.target.value })} />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="date" label="Expiry Date" value={completeForm.expiryDate} onChange={(e) => setCompleteForm({ ...completeForm, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="date" label="Next Dose Date" value={completeForm.nextDoseDate} onChange={(e) => setCompleteForm({ ...completeForm, nextDoseDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={2} label="Notes" value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} sx={{ mt: 2 }} />
            <TextField fullWidth multiline rows={2} label="Side Effects" value={completeForm.sideEffects} onChange={(e) => setCompleteForm({ ...completeForm, sideEffects: e.target.value })} sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">Complete Vaccination</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default Vaccinations

import React, { useEffect, useState } from 'react'
import { Container, Typography, Card, CardContent, Grid, Box, CircularProgress, TextField, Button } from '@mui/material'
import { Assessment, TrendingUp, Pets, EventAvailable, AttachMoney, Inventory2 } from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [financialReport, setFinancialReport] = useState(null)
  const [appointmentReport, setAppointmentReport] = useState(null)
  const [patientReport, setPatientReport] = useState(null)
  const [inventoryReport, setInventoryReport] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const [financial, appointments, patients, inventory] = await Promise.all([
        veterinaryAPI.managerGetFinancialReport(dateRange),
        veterinaryAPI.managerGetAppointmentAnalytics(dateRange),
        veterinaryAPI.managerGetPatientAnalytics(dateRange),
        veterinaryAPI.managerGetInventoryReport()
      ])
      setFinancialReport(financial.data?.data)
      setAppointmentReport(appointments.data?.data)
      setPatientReport(patients.data?.data)
      setInventoryReport(inventory.data?.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Reports & Analytics</Typography>
        <Box display="flex" gap={2}>
          <TextField
            type="date"
            label="Start Date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            type="date"
            label="End Date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button variant="contained" onClick={loadReports}>Generate</Button>
        </Box>
      </Box>

      {/* Financial Summary */}
      <Typography variant="h6" fontWeight="bold" mb={2}>Financial Summary</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <AttachMoney color="success" />
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">₹{financialReport?.summary?.totalRevenue || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TrendingUp color="error" />
                <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">₹{financialReport?.summary?.totalExpenses || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Assessment color="primary" />
                <Typography variant="body2" color="text.secondary">Net Profit</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color={financialReport?.summary?.netProfit >= 0 ? 'success.main' : 'error.main'}>
                ₹{financialReport?.summary?.netProfit || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="body2" color="text.secondary">Profit Margin</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">{financialReport?.summary?.profitMargin || 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Appointment Analytics */}
      <Typography variant="h6" fontWeight="bold" mb={2}>Appointment Analytics</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <EventAvailable color="primary" />
                <Typography variant="body2" color="text.secondary">Total Appointments</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">{appointmentReport?.totalAppointments || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Pets color="success" />
                <Typography variant="body2" color="text.secondary">Total Patients</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">{patientReport?.totalPatients || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="body2" color="text.secondary">Retention Rate</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">{patientReport?.retentionRate || 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inventory Summary */}
      <Typography variant="h6" fontWeight="bold" mb={2}>Inventory Summary</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Inventory2 color="primary" />
                <Typography variant="h6">Total Inventory Value</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">₹{inventoryReport?.totalValue || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Low Stock Items: {inventoryReport?.alerts?.lowStock?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expiring Soon: {inventoryReport?.alerts?.expiringSoon?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Category Breakdown</Typography>
              {inventoryReport?.categoryBreakdown?.map((cat, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{cat._id}</Typography>
                  <Typography variant="body2" fontWeight="bold">₹{cat.totalValue}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Reports

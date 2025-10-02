import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Divider, Chip } from '@mui/material'
import { petShopAdminAPI } from '../../services/api'
import { speciesAPI } from '../../services/petSystemAPI'

const StatCard = ({ title, value, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="subtitle2">
        {title}
      </Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

const Bar = ({ label, value, max }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
      <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 9999 }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 9999 }} />
      </Box>
    </Box>
  )
}

const PetShopAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState({ totalInventory: 0, inShop: 0, forSale: 0, sold: 0, totalReservations: 0 })
  const [speciesBreakdown, setSpeciesBreakdown] = useState([])
  const [speciesMap, setSpeciesMap] = useState({})
  const [salesSeries, setSalesSeries] = useState([])

  const load = async () => {
    try {
      setLoading(true)
      const [s, b, sr, sp] = await Promise.all([
        petShopAdminAPI.getSummary(),
        petShopAdminAPI.getSpeciesBreakdown(),
        petShopAdminAPI.getSalesSeries(14),
        speciesAPI.list(),
      ])
      setSummary(s?.data?.data || {})
      setSpeciesBreakdown(b?.data?.data || [])
      setSalesSeries(sr?.data?.data || [])
      const sm = {}
      const speciesArr = sp?.data?.data || sp?.data || []
      speciesArr.forEach((spc) => {
        sm[spc._id || spc.id] = spc.displayName || spc.name
      })
      setSpeciesMap(sm)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load Pet Shop analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Pet Shop Analytics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Total Inventory" value={summary.totalInventory || 0} color="primary" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="In Shop" value={summary.inShop || 0} color="info" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="For Sale" value={summary.forSale || 0} color="success" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Sold" value={summary.sold || 0} color="warning" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard title="Reservations" value={summary.totalReservations || 0} color="secondary" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Species Breakdown</Typography>
              {speciesBreakdown.length === 0 && (
                <Typography variant="body2" color="text.secondary">No data</Typography>
              )}
              {speciesBreakdown.map((row, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip size="small" label={speciesMap[row.speciesId] || row.speciesId || 'Unknown species'} />
                    <Chip size="small" color="primary" variant="outlined" label={`Total: ${row.total}`} />
                  </Box>
                  {(row.counts || []).map((c, i) => (
                    <Bar key={i} label={c.status} value={c.count} max={row.total} />
                  ))}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Sales (last 14 days)</Typography>
              {salesSeries.length === 0 && (
                <Typography variant="body2" color="text.secondary">No recent sales</Typography>
              )}
              {salesSeries.map((pt) => (
                <Box key={pt._id} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{pt._id}</Typography>
                  <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 9999 }}>
                    <Box sx={{ width: `${Math.min(pt.count * 10, 100)}%`, height: '100%', bgcolor: 'success.main', borderRadius: 9999 }} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Note: Species labels display IDs for now. We can enrich with names by joining Species on the frontend if required.
      </Typography>
    </Box>
  )
}

export default PetShopAnalytics

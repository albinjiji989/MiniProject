import React from 'react'
import { rescueAPI } from '../../services/api'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material'
import {
  Report as RescueIcon,
  Warning as UrgentIcon,
  CheckCircle as CompletedIcon,
  Assignment as AssignedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'

const RescueDashboard = () => {
  const [stats, setStats] = React.useState({ activeRescues: 0, completedRescues: 0, urgentCases: 0, totalCost: 0, rescueTeam: 0 })
  const [recentRescues, setRecentRescues] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const loadRescue = async () => {
      setLoading(true)
      setError('')
      try {
        const [listRes] = await Promise.all([
          rescueAPI.getRescues({ limit: 10 })
        ])
        const rescues = listRes.data?.data?.rescues || listRes.data?.rescues || []
        setRecentRescues(rescues.map(r => ({
          id: r._id || r.id,
          location: r.location || '-',
          situation: r.situation || r.description || '-',
          urgency: r.urgency || 'low',
          status: r.status || 'assigned',
          time: new Date(r.createdAt || Date.now()).toLocaleString()
        })))
        setStats({
          activeRescues: rescues.filter(r=>r.status==='in_progress').length,
          completedRescues: rescues.filter(r=>r.status==='completed').length,
          urgentCases: rescues.filter(r=>r.urgency==='high' || r.urgency==='critical').length,
          totalCost: 0,
          rescueTeam: 0
        })
      } catch (e) {
        setError('Failed to load rescues')
        setRecentRescues([])
      } finally {
        setLoading(false)
      }
    }
    loadRescue()
  }, [])

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <AssignedIcon />
      case 'in_progress': return <RescueIcon />
      case 'completed': return <CompletedIcon />
      default: return <RescueIcon />
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Rescue Management Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Active Rescues
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.activeRescues}
                  </Typography>
                </Box>
                <RescueIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.completedRescues}
                  </Typography>
                </Box>
                <CompletedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Urgent Cases
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.urgentCases}
                  </Typography>
                </Box>
                <UrgentIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Cost
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    ${stats.totalCost.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Rescue Team
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.rescueTeam}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Rescues */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Recent Rescue Cases
              </Typography>
              <List>
                {recentRescues.map((rescue) => (
                  <ListItem key={rescue.id} divider>
                    <ListItemIcon>
                      {getStatusIcon(rescue.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${rescue.location} - ${rescue.situation}`}
                      secondary={rescue.time}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={rescue.urgency}
                        color={getUrgencyColor(rescue.urgency)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={rescue.status}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" fullWidth>
                  Report New Rescue
                </Button>
                <Button variant="outlined" fullWidth>
                  Assign Rescue Team
                </Button>
                <Button variant="outlined" fullWidth>
                  View Emergency Cases
                </Button>
                <Button variant="outlined" fullWidth>
                  Generate Cost Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default RescueDashboard

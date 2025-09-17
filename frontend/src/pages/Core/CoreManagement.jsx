import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Settings as SettingsIcon,
  Monitor as MonitorIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const CoreManagement = () => {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [logs, setLogs] = useState([])
  const [configs, setConfigs] = useState([])
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openConfigDialog, setOpenConfigDialog] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    key: '',
    value: '',
    type: 'string',
    category: 'general',
    description: '',
    isEncrypted: false
  })

  useEffect(() => {
    fetchData()
    fetchHealth()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [logsRes, configsRes, statsRes] = await Promise.all([
        api.get('/core/logs'),
        api.get('/core/config'),
        api.get('/core/stats')
      ])
      setLogs(logsRes.data.logs)
      setConfigs(configsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchHealth = async () => {
    try {
      const response = await api.get('/core/health')
      setHealth(response.data)
    } catch (err) {
      setHealth({ status: 'unhealthy', error: err.message })
    }
  }

  const handleCreateConfig = async () => {
    try {
      await api.post('/core/config', configForm)
      setOpenConfigDialog(false)
      setConfigForm({
        key: '',
        value: '',
        type: 'string',
        category: 'general',
        description: '',
        isEncrypted: false
      })
      fetchData()
    } catch (err) {
      setError('Failed to create configuration')
    }
  }

  const handleUpdateConfig = async () => {
    try {
      await api.put(`/core/config/${selectedConfig._id}`, { value: configForm.value })
      setOpenConfigDialog(false)
      setSelectedConfig(null)
      fetchData()
    } catch (err) {
      setError('Failed to update configuration')
    }
  }

  const handleResolveLog = async (logId, resolution) => {
    try {
      await api.put(`/core/logs/${logId}/resolve`, { resolution })
      fetchData()
    } catch (err) {
      setError('Failed to resolve log')
    }
  }

  const getLogIcon = (level) => {
    const icons = {
      error: <ErrorIcon color="error" />,
      warn: <WarningIcon color="warning" />,
      info: <InfoIcon color="info" />,
      debug: <BugIcon color="action" />
    }
    return icons[level] || <InfoIcon />
  }

  const getLogColor = (level) => {
    const colors = {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default'
    }
    return colors[level] || 'default'
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`core-tabpanel-${index}`}
      aria-labelledby={`core-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Core System Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<MonitorIcon />}
          onClick={fetchHealth}
        >
          Check Health
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* System Health Status */}
      {health && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">System Health</Typography>
              <Chip
                label={health.status}
                color={health.status === 'healthy' ? 'success' : 'error'}
                icon={health.status === 'healthy' ? <CheckIcon /> : <ErrorIcon />}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
                <Typography variant="h6">
                  {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Database
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={health.database}
                    color={health.database === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="h6">
                  {Math.round(health.memory?.heapUsed / 1024 / 1024)} MB
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Environment
                </Typography>
                <Typography variant="h6">
                  <Chip label={health.environment} size="small" />
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="System Logs" icon={<BugIcon />} />
          <Tab label="Configuration" icon={<SettingsIcon />} />
          <Tab label="Statistics" icon={<MonitorIcon />} />
        </Tabs>
      </Box>

      {/* System Logs Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          System Logs
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Level</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getLogIcon(log.level)}
                      <Chip
                        label={log.level}
                        color={getLogColor(log.level)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.module} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {log.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.userId?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.resolved ? 'Resolved' : 'Open'}
                      color={log.resolved ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {!log.resolved && (
                      <Button
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleResolveLog(log._id, 'Resolved by admin')}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Configuration Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">System Configuration</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenConfigDialog(true)}
          >
            Add Config
          </Button>
        </Box>

        <Grid container spacing={2}>
          {configs.map((config) => (
            <Grid item xs={12} sm={6} md={4} key={config._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" noWrap>
                      {config.key}
                    </Typography>
                    <Chip label={config.category} size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {config.description}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {config.value}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Chip label={config.type} size="small" variant="outlined" />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedConfig(config)
                        setConfigForm({
                          key: config.key,
                          value: config.value,
                          type: config.type,
                          category: config.category,
                          description: config.description,
                          isEncrypted: config.isEncrypted
                        })
                        setOpenConfigDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          System Statistics
        </Typography>
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {stats.users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {stats.activeUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {stats.unresolvedLogs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unresolved Logs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="info.main">
                    {stats.configs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Configs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Configuration Dialog */}
      <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedConfig ? 'Edit Configuration' : 'Add New Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={configForm.key}
                onChange={(e) => setConfigForm({ ...configForm, key: e.target.value })}
                disabled={!!selectedConfig}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={configForm.type}
                  onChange={(e) => setConfigForm({ ...configForm, type: e.target.value })}
                  disabled={!!selectedConfig}
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="object">Object</MenuItem>
                  <MenuItem value="array">Array</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                multiline
                rows={3}
                value={configForm.value}
                onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={configForm.category}
                  onChange={(e) => setConfigForm({ ...configForm, category: e.target.value })}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="storage">Storage</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="notification">Notification</MenuItem>
                  <MenuItem value="api">API</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={configForm.description}
                onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedConfig ? handleUpdateConfig : handleCreateConfig}
            variant="contained"
          >
            {selectedConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CoreManagement

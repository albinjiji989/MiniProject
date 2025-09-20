import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
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
  Snackbar,
  LinearProgress,
  TablePagination,
  InputAdornment,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Pets as PetsIcon,
  Work as WorkIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { systemLogsAPI, usersAPI, managersAPI, rolesAPI, modulesAPI } from '../../services/api'

const DataTracking = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  
  // Real data states
  const [userActivities, setUserActivities] = useState([])
  const [systemStats, setSystemStats] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  
  // Pagination and filtering
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  
  // Dialog states
  const [logDetailsOpen, setLogDetailsOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  // Real data fetching
  const fetchRealData = async () => {
    try {
      setLoading(true)
      
      // Fetch system logs
      const logsResponse = await systemLogsAPI.list({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        entity: entityFilter,
        action: actionFilter
      })
      
      // Fetch user activities
      const usersResponse = await usersAPI.getUsers()
      const userActivities = usersResponse.data || []
      
      // Fetch system statistics
      const [userStats, managerStats, roleStats, moduleStats] = await Promise.all([
        usersAPI.getStats(),
        managersAPI.list(),
        rolesAPI.list(),
        modulesAPI.list()
      ])
      
      setSystemStats({
        totalUsers: userStats.data?.publicUsers || 0,
        totalManagers: Array.isArray(managerStats.data?.data?.managers) 
          ? managerStats.data.data.managers.length 
          : Array.isArray(managerStats.data?.managers) 
            ? managerStats.data.managers.length 
            : Array.isArray(managerStats.data) 
              ? managerStats.data.length 
              : 0,
        totalRoles: Array.isArray(roleStats.data?.data) 
          ? roleStats.data.data.length 
          : Array.isArray(roleStats.data) 
            ? roleStats.data.length 
            : 0,
        totalModules: Array.isArray(moduleStats.data?.data) 
          ? moduleStats.data.data.length 
          : Array.isArray(moduleStats.data) 
            ? moduleStats.data.length 
            : 0
      })
      
      // Set logs data - handle different response structures
      const logsData = Array.isArray(logsResponse.data?.data?.logs) 
        ? logsResponse.data.data.logs 
        : Array.isArray(logsResponse.data?.logs) 
          ? logsResponse.data.logs 
          : Array.isArray(logsResponse.data) 
            ? logsResponse.data 
            : []
      setLogs(logsData)
      setFilteredLogs(logsData)
      
      // Generate recent activities from logs
      const recentActivities = logsData.slice(0, 10).map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp || log.createdAt),
        action: log.action,
        entity: log.entity,
        entityName: log.entityName,
        details: log.details,
        status: log.status || 'success'
      }))
      setRecentActivities(recentActivities)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbar({
        open: true,
        message: 'Failed to fetch data from database',
        severity: 'error'
      })
      // Don't use fallback data, show empty state
      setLogs([])
      setFilteredLogs([])
      setRecentActivities([])
      setSystemStats({
        totalUsers: 0,
        totalManagers: 0,
        totalRoles: 0,
        totalModules: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    await fetchRealData()
  }

  const handleRefresh = () => {
    fetchLogs()
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [page, rowsPerPage, searchTerm, entityFilter, actionFilter, dateFilter])

  useEffect(() => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (entityFilter) {
      filtered = filtered.filter(log => log.entity === entityFilter)
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(log => 
        log.timestamp.toDateString() === filterDate.toDateString()
      )
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, entityFilter, actionFilter, dateFilter])

  const handleViewLogDetails = (log) => {
    setSelectedLog(log)
    setLogDetailsOpen(true)
    setActiveTab(0)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'user': return <PersonIcon />
      case 'pet': return <PetsIcon />
      case 'module': return <BusinessIcon />
      case 'manager': return <WorkIcon />
      case 'worker': return <WorkIcon />
      case 'adoption': return <PetsIcon />
      case 'rescue': return <PetsIcon />
      case 'shelter': return <BusinessIcon />
      default: return <HistoryIcon />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success'
      case 'updated': return 'info'
      case 'deleted': return 'error'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'status_changed': return 'warning'
      case 'assigned': return 'info'
      default: return 'default'
    }
  }

  const getEntityColor = (entity) => {
    switch (entity) {
      case 'user': return '#3b82f6'
      case 'pet': return '#22c55e'
      case 'module': return '#8b5cf6'
      case 'manager': return '#f59e0b'
      case 'worker': return '#06b6d4'
      case 'adoption': return '#06b6d4'
      case 'rescue': return '#ef4444'
      case 'shelter': return '#10b981'
      default: return '#64748b'
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading data tracking logs...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
            Data Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Track all data changes across modules, users, pets, managers, and workers with comprehensive audit trails
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <HistoryIcon sx={{ color: '#8b5cf6' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Logs: {logs.length} • Today: {logs.filter(l => l.timestamp.toDateString() === new Date().toDateString()).length} • Last Updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Action Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              Export Logs
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3b82f6', mb: 1 }}>
                      {logs.length}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.primary' }}>
                      Total Logs
                    </Typography>
                  </Box>
                  <HistoryIcon sx={{ fontSize: 40, color: '#3b82f6' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#22c55e', mb: 1 }}>
                      {logs.filter(l => l.action === 'created').length}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.primary' }}>
                      Created Today
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#22c55e' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f59e0b', mb: 1 }}>
                      {logs.filter(l => l.action === 'updated').length}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.primary' }}>
                      Updated Today
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#f59e0b' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ef4444', mb: 1 }}>
                      {logs.filter(l => l.action === 'deleted').length}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.primary' }}>
                      Deleted Today
                    </Typography>
                  </Box>
                  <PetsIcon sx={{ fontSize: 40, color: '#ef4444' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 3
        }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    label="Entity"
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                  >
                    <MenuItem value="">All Entities</MenuItem>
                    <MenuItem value="user">Users</MenuItem>
                    <MenuItem value="pet">Pets</MenuItem>
                    <MenuItem value="module">Modules</MenuItem>
                    <MenuItem value="manager">Managers</MenuItem>
                    <MenuItem value="worker">Workers</MenuItem>
                    <MenuItem value="adoption">Adoptions</MenuItem>
                    <MenuItem value="rescue">Rescues</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    label="Action"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    <MenuItem value="created">Created</MenuItem>
                    <MenuItem value="updated">Updated</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="status_changed">Status Changed</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    setSearchTerm('')
                    setEntityFilter('')
                    setActionFilter('')
                    setDateFilter('')
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1 }} />
              Data Change Logs
            </Typography>
            
            {filteredLogs.length === 0 ? (
              <Alert severity="info">No logs found matching your criteria.</Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Entity</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Entity Name</TableCell>
                        <TableCell>Performed By</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLogs
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {log.timestamp.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ 
                                p: 0.5, 
                                borderRadius: '50%', 
                                backgroundColor: `${getEntityColor(log.entity)}20`,
                                color: getEntityColor(log.entity),
                                mr: 1
                              }}>
                                {getEntityIcon(log.entity)}
                              </Box>
                              <Chip 
                                label={log.entity} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: `${getEntityColor(log.entity)}20`,
                                  color: getEntityColor(log.entity)
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.action.replace('_', ' ')} 
                              size="small" 
                              color={getActionColor(log.action)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {log.entityName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {log.entityId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.performedBy}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.ipAddress}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewLogDetails(log)}
                                sx={{ color: 'primary.main' }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={filteredLogs.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Log Details Dialog */}
      <Dialog open={logDetailsOpen} onClose={() => setLogDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Log Details - {selectedLog?.entityName}</DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Details" />
            <Tab label="Technical Info" />
          </Tabs>

          {activeTab === 0 && selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{selectedLog.timestamp.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Entity</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ 
                      p: 0.5, 
                      borderRadius: '50%', 
                      backgroundColor: `${getEntityColor(selectedLog.entity)}20`,
                      color: getEntityColor(selectedLog.entity),
                      mr: 1
                    }}>
                      {getEntityIcon(selectedLog.entity)}
                    </Box>
                    <Typography variant="body1">{selectedLog.entity}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                  <Chip 
                    label={selectedLog.action.replace('_', ' ')} 
                    color={getActionColor(selectedLog.action)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Entity Name</Typography>
                  <Typography variant="body1">{selectedLog.entityName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Performed By</Typography>
                  <Typography variant="body1">{selectedLog.performedBy}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                  <Typography variant="body1">{selectedLog.ipAddress}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Change Details</Typography>
              <pre style={{ 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                padding: '16px', 
                borderRadius: '8px',
                fontSize: '14px',
                overflow: 'auto'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Box>
          )}

          {activeTab === 2 && selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Log ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{selectedLog.id}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Entity ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{selectedLog.entityId}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Performed By ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{selectedLog.performedById}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  )
}

export default DataTracking

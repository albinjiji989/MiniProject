import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material'

const AdoptionApplications = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)

  // Mock data - replace with actual API call
  const applications = [
    {
      id: 1,
      petName: 'Buddy',
      petSpecies: 'Dog',
      petBreed: 'Golden Retriever',
      adopterName: 'John Doe',
      adopterEmail: 'john@example.com',
      adopterPhone: '123-456-7890',
      status: 'pending',
      applicationDate: '2024-01-15',
      adoptionFee: 150
    },
    {
      id: 2,
      petName: 'Whiskers',
      petSpecies: 'Cat',
      petBreed: 'Persian',
      adopterName: 'Jane Smith',
      adopterEmail: 'jane@example.com',
      adopterPhone: '123-456-7891',
      status: 'approved',
      applicationDate: '2024-01-14',
      adoptionFee: 100
    },
    {
      id: 3,
      petName: 'Charlie',
      petSpecies: 'Dog',
      petBreed: 'Labrador',
      adopterName: 'Mike Johnson',
      adopterEmail: 'mike@example.com',
      adopterPhone: '123-456-7892',
      status: 'completed',
      applicationDate: '2024-01-13',
      adoptionFee: 200
    },
  ]

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget)
  }

  const handleMenuClick = (event, application) => {
    setMenuAnchor(event.currentTarget)
    setSelectedApplication(application)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedApplication(null)
  }

  const handleViewApplication = () => {
    // Navigate to application details
    handleMenuClose()
  }

  const handleEditApplication = () => {
    // Navigate to edit application
    handleMenuClose()
  }

  const handleApproveApplication = () => {
    // Handle approval
    handleMenuClose()
  }

  const handleRejectApplication = () => {
    // Handle rejection
    handleMenuClose()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'completed': return 'info'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'approved': return 'Approved'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Adoption Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Application
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search applications by pet name, adopter name, or email..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pet</TableCell>
                <TableCell>Adopter</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Application Date</TableCell>
                <TableCell>Adoption Fee</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {application.petName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {application.petSpecies} • {application.petBreed}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {application.adopterName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {application.adopterEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {application.adopterPhone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(application.status)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {application.applicationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ${application.adoptionFee}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, application)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewApplication}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditApplication}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleApproveApplication} sx={{ color: 'success.main' }}>
          <ApproveIcon sx={{ mr: 1 }} />
          Approve
        </MenuItem>
        <MenuItem onClick={handleRejectApplication} sx={{ color: 'error.main' }}>
          <RejectIcon sx={{ mr: 1 }} />
          Reject
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem>All Status</MenuItem>
        <MenuItem>Pending</MenuItem>
        <MenuItem>Approved</MenuItem>
        <MenuItem>Completed</MenuItem>
        <MenuItem>Rejected</MenuItem>
      </Menu>
    </Box>
  )
}

export default AdoptionApplications

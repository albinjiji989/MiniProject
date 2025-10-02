import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Switch,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  LocalHospital,
  Vaccines,
  Medication,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { medicalRecordsAPI, petsAPI } from '../../../services/petSystemAPI';


const MedicalRecords = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pet, setPet] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    recordType: '',
    date: new Date(),
    description: '',
    veterinarian: '',
    clinic: '',
    cost: '',
    notes: '',
    isVaccination: false,
    vaccineName: '',
    nextDueDate: null,
    batchNumber: '',
    attachments: []
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await medicalRecordsAPI.getByPet(petId);
      setRecords(response.data?.data || response.data || []);
    } catch (err) {
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Medical Records
          {pet?.petCode && (
            <Chip label={pet.petCode} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
          )}
        </Typography>
      </Box>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Veterinarian</TableCell>
                      <TableCell>Clinic</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Vaccination</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getRecordTypeIcon(record.recordType)}
                            <Chip
                              label={record.recordType}
                              color={getRecordTypeColor(record.recordType)}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {record.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {record.veterinarian || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.clinic || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.cost ? `$${record.cost}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.isVaccination ? (
                            <Chip label="Yes" color="success" size="small" />
                          ) : (
                            <Chip label="No" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, record)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {records.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary">
                    No medical records found
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Record Dialog */}
      <Dialog open={formDialog} onClose={() => setFormDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecord ? 'Edit Medical Record' : 'Add Medical Record'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    value={formData.recordType}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordType: e.target.value }))}
                  >
                    <MenuItem value="vaccination">Vaccination</MenuItem>
                    <MenuItem value="medication">Medication</MenuItem>
                    <MenuItem value="checkup">Checkup</MenuItem>
                    <MenuItem value="surgery">Surgery</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData(prev => ({ ...prev, veterinarian: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinic: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVaccination}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVaccination: e.target.checked }))}
                    />
                  }
                  label="Is Vaccination"
                />
              </Grid>
              {formData.isVaccination && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vaccine Name"
                      value={formData.vaccineName}
                      onChange={(e) => setFormData(prev => ({ ...prev, vaccineName: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Next Due Date"
                      value={formData.nextDueDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, nextDueDate: date }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Batch Number"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRecord ? 'Update' : 'Add'} Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditRecord(selectedRecord)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Record</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Record</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Medical Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this medical record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecords;
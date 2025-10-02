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
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  History,
  Person,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { ownershipHistoryAPI, petsAPI } from '../../../services/petSystemAPI';

const OwnershipHistory = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [pet, setPet] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [formDialog, setFormDialog] = useState(false);
{{ ... }}
    transferDate: new Date(),
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadHistory();
    (async () => {
      try {
        const res = await petsAPI.getById(petId)
        setPet(res.data?.data || res.data || null)
      } catch (_) {
        setPet(null)
      }
    })()
  }, [petId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await ownershipHistoryAPI.getByPet(petId);
{{ ... }}
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Ownership History
          {pet?.petCode && (
            <Chip label={pet.petCode} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />

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
                      <TableCell>Transfer Date</TableCell>
                      <TableCell>Previous Owner</TableCell>
                      <TableCell>Current Owner</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <TransferWithinAStation sx={{ mr: 1, color: 'text.secondary' }} />
                            {formatDate(record.transferDate)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1, color: 'text.secondary' }} />
                            {record.previousOwnerId?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1, color: 'text.secondary' }} />
                            {record.currentOwnerId?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.reason}
                            color={getReasonColor(record.reason)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {record.notes || 'N/A'}
                          </Typography>
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

              {history.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary">
                    No ownership history found
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
          {editingRecord ? 'Edit Ownership Transfer' : 'Add Ownership Transfer'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Previous Owner ID"
                  value={formData.previousOwnerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousOwnerId: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Owner ID"
                  value={formData.currentOwnerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentOwnerId: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Transfer Date"
                  value={formData.transferDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, transferDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., adoption, surrender, transfer"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about the transfer..."
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRecord ? 'Update' : 'Add'} Transfer
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
          <ListItemText>Edit Transfer</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Transfer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Ownership Transfer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this ownership transfer record? This action cannot be undone.
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

export default OwnershipHistory;
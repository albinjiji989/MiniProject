import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  RateReview as FeedbackIcon,
  CalendarToday as CalendarIcon,
  Pets as PetsIcon,
  AttachMoney as MoneyIcon,
  Restaurant as FoodIcon,
  LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';

const MyApplications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getMyApplications({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setApplications(response.data?.data?.applications || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'default',
      price_determined: 'info',
      advance_paid: 'warning',
      approved: 'success',
      active_care: 'primary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'Submitted',
      price_determined: 'Price Set',
      advance_paid: 'Advance Paid',
      approved: 'Approved',
      active_care: 'Pet in Care',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status?.replace(/_/g, ' ').toUpperCase() || '';
  };

  const getUserNextAction = (app) => {
    if (app.status === 'submitted') {
      return 'Waiting for manager to set pricing';
    }
    if (app.status === 'price_determined') {
      return 'Pay 50% advance to proceed';
    }
    if (app.status === 'advance_paid') {
      if (!app.checkIn?.otp) {
        return 'Waiting for check-in OTP from manager';
      }
      return 'Give check-in OTP to manager when you arrive';
    }
    if (app.status === 'active_care') {
      if (app.paymentStatus?.final?.status !== 'completed') {
        return 'Pay final bill to schedule pickup';
      }
      if (!app.checkOut?.otp) {
        return 'Waiting for pickup OTP from manager';
      }
      return 'Give pickup OTP to manager when you arrive';
    }
    if (app.status === 'completed') {
      return 'Care completed';
    }
    if (app.status === 'cancelled') {
      return 'Application cancelled';
    }
    if (app.status === 'rejected') {
      return 'Application rejected';
    }
    return '-';
  };

  const handleViewDetails = async (appId) => {
    try {
      const response = await temporaryCareAPI.getApplicationDetails(appId);
      const app = response.data?.data?.application;
      console.log('Application details received:', app);
      console.log('Pets in application:', app?.pets);
      if (app?.pets) {
        app.pets.forEach((pet, idx) => {
          console.log(`Pet ${idx} special instructions:`, pet.specialInstructions);
        });
      }
      setSelectedApplication(app);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error loading application details:', err);
    }
  };

  const handleGenerateOTP = async (app) => {
    try {
      setOtpLoading(true);
      setSelectedApplication(app);
      const response = await temporaryCareAPI.generateHandoverOTP({
        applicationId: app._id
      });
      setGeneratedOTP(response.data?.data?.otp || '');
      setOtpDialogOpen(true);
    } catch (err) {
      console.error('Error generating OTP:', err);
      alert(err?.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelApplication = async () => {
    try {
      setCancelLoading(true);
      await temporaryCareAPI.cancelApplication(selectedApplication._id);
      setCancelDialogOpen(false);
      setDetailsDialogOpen(false);
      loadApplications();
      alert('Application cancelled successfully!');
    } catch (err) {
      console.error('Error cancelling application:', err);
      alert(err?.response?.data?.message || 'Failed to cancel application');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Temporary Care Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/User/temporary-care/apply')}
        >
          New Application
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, v) => setStatusFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Submitted" value="submitted" />
          <Tab label="Price Determined" value="price_determined" />
          <Tab label="Advance Paid" value="advance_paid" />
          <Tab label="Approved" value="approved" />
          <Tab label="Active Care" value="active_care" />
          <Tab label="Completed" value="completed" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : applications.length === 0 ? (
        <Alert severity="info">
          No applications found. <Button onClick={() => navigate('/User/temporary-care/apply')}>Create one</Button>
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application #</TableCell>
                <TableCell>Pets</TableCell>
                <TableCell>Center</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>What's Next?</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell>{app.applicationNumber}</TableCell>
                  <TableCell>
                    <Chip label={`${app.pets?.length || 0} pet(s)`} size="small" icon={<PetsIcon />} />
                  </TableCell>
                  <TableCell>{app.centerId?.name || app.centerName || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(app.startDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {new Date(app.endDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(app.status)}
                      color={getStatusColor(app.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 200 }}>
                      {getUserNextAction(app)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ₹{app.pricing?.totalAmount?.toLocaleString() || '0'}
                    </Typography>
                    {app.paymentStatus?.advance?.status === 'completed' && (
                      <Chip label="Advance ✓" size="small" color="success" sx={{ mt: 0.5 }} />
                    )}
                    {app.paymentStatus?.final?.status === 'completed' && (
                      <Chip label="Final ✓" size="small" color="success" sx={{ mt: 0.5 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {/* View Details - Always available */}
                      <IconButton size="small" onClick={() => handleViewDetails(app._id)}>
                        <ViewIcon />
                      </IconButton>
                      
                      {/* Accept/Reject Price - Only when price is set */}
                      {app.status === 'price_determined' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<PaymentIcon />}
                            onClick={() => navigate(`/User/temporary-care/applications/${app._id}/payment`)}
                          >
                            Pay Advance
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setSelectedApplication(app);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {/* Pay Final - Only when in care and final bill generated */}
                      {app.status === 'active_care' && 
                       app.paymentStatus?.final?.status === 'pending' && 
                       app.finalBill && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<PaymentIcon />}
                          onClick={() => navigate(`/User/temporary-care/applications/${app._id}/payment`)}
                        >
                          Pay Final
                        </Button>
                      )}
                      
                      {/* Feedback - Only when completed */}
                      {app.status === 'completed' && !app.feedback && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<FeedbackIcon />}
                          onClick={() => navigate(`/User/temporary-care/applications/${app._id}/feedback`)}
                        >
                          Feedback
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Application Details Dialog */}
      {selectedApplication && (
        <ApplicationDetailsDialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onUpdate={loadApplications}
          onCancel={() => setCancelDialogOpen(true)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm">
        <DialogTitle>Cancel Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this application? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
            No, Keep It
          </Button>
          <Button 
            onClick={handleCancelApplication} 
            variant="contained" 
            color="error"
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Handover Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="sm">
        <DialogTitle>Pet Handover OTP</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" gutterBottom>
              Share this OTP with the temporary care center staff to complete the handover:
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                my: 3,
                letterSpacing: 8,
                color: 'primary.main',
                fontFamily: 'monospace'
              }}
            >
              {generatedOTP}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This OTP is valid for 15 minutes. The center staff will verify this OTP to confirm pet handover.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const ApplicationDetailsDialog = ({ open, onClose, application, onUpdate, onCancel }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Application #{application.applicationNumber}
        <Chip
          label={application.status?.replace(/_/g, ' ').toUpperCase()}
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Pets</Typography>
            <Stack spacing={2}>
              {application.pets?.map((pet, idx) => {
                const petData = pet.petDetails || pet.petId || {};
                return (
                  <Card key={idx} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar 
                          src={resolveMediaUrl(petData?.profileImage || petData?.images?.[0]?.url)}
                          sx={{ width: 56, height: 56 }}
                        >
                          <PetsIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="500">{petData?.name || 'Unnamed Pet'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {petData?.speciesId?.displayName || petData?.species || 'Unknown'} • 
                            {petData?.breed || petData?.breedId?.name || 'Unknown Breed'}
                          </Typography>
                          
                          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="primary" fontWeight="600" display="block" gutterBottom>
                              Special Instructions:
                            </Typography>
                            {!pet.specialInstructions || (!pet.specialInstructions.food && !pet.specialInstructions.medicine && !pet.specialInstructions.behavior && !pet.specialInstructions.allergies && !pet.specialInstructions.otherNotes) ? (
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                No special instructions provided
                              </Typography>
                            ) : (
                              <>
                                {pet.specialInstructions.food && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    <FoodIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle', color: 'success.main' }} />
                                    <strong>Food:</strong> {pet.specialInstructions.food}
                                  </Typography>
                                )}
                                {pet.specialInstructions.medicine && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    <MedicalIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                                    <strong>Medicine:</strong> {pet.specialInstructions.medicine}
                                  </Typography>
                                )}
                                {pet.specialInstructions.behavior && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    <strong>Behavior:</strong> {pet.specialInstructions.behavior}
                                  </Typography>
                                )}
                                {pet.specialInstructions.allergies && (
                                  <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.5 }}>
                                    <strong>⚠️ Allergies:</strong> {pet.specialInstructions.allergies}
                                  </Typography>
                                )}
                                {pet.specialInstructions.otherNotes && (
                                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                    <strong>Notes:</strong> {pet.specialInstructions.otherNotes}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Center</Typography>
            <Typography>{application.centerId?.name || application.centerName || 'N/A'}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Duration</Typography>
            <Typography>
              {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {application.numberOfDays} days
            </Typography>
          </Grid>

          {application.pricing && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Pricing</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Total:</Typography>
                  <Typography>₹{application.pricing.totalAmount?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Advance:</Typography>
                  <Typography color={application.paymentStatus.advance.status === 'completed' ? 'success.main' : 'text.secondary'}>
                    ₹{application.pricing.advanceAmount?.toLocaleString()} {application.paymentStatus.advance.status === 'completed' && '✓'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Remaining:</Typography>
                  <Typography color={application.paymentStatus.final.status === 'completed' ? 'success.main' : 'text.secondary'}>
                    ₹{application.pricing.remainingAmount?.toLocaleString()} {application.paymentStatus.final.status === 'completed' && '✓'}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!['active_care', 'completed', 'cancelled', 'rejected'].includes(application.status) && (
          <Button
            variant="outlined"
            color="error"
            onClick={onCancel}
          >
            Cancel Application
          </Button>
        )}
        {application.status === 'price_determined' && application.paymentStatus.advance.status === 'pending' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
            onClick={() => {
              onClose();
              navigate(`/User/temporary-care/applications/${application._id}/payment`);
            }}
          >
            Pay Advance
          </Button>
        )}
        {application.status === 'completed' && !application.feedback && (
          <Button
            variant="outlined"
            startIcon={<FeedbackIcon />}
            onClick={() => {
              onClose();
              navigate(`/User/temporary-care/applications/${application._id}/feedback`);
            }}
          >
            Submit Feedback
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MyApplications;

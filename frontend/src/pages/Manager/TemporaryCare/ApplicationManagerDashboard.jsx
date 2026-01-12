import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  LocalHospital as MedicalIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const ApplicationManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes] = await Promise.all([
        temporaryCareAPI.managerGetDashboardStats(),
        temporaryCareAPI.managerGetApplications({ status: statusFilter === 'all' ? undefined : statusFilter })
      ]);

      setStats(statsRes.data?.data || {});
      setApplications(appsRes.data?.data?.applications || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
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

  const handleViewDetails = async (appId) => {
    try {
      const response = await temporaryCareAPI.managerGetApplicationDetails(appId);
      setSelectedApplication(response.data?.data?.application);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error loading application details:', err);
    }
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Occupancy</Typography>
            <Typography variant="h3">{stats?.occupancy?.current || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              of {stats?.occupancy?.total || 0} capacity ({stats?.occupancy?.percentage || 0}%)
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Pending Applications</Typography>
            <Typography variant="h3">{stats?.applications?.pending || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.applications?.active || 0} active
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Monthly Revenue</Typography>
            <Typography variant="h3">₹{stats?.revenue?.monthly?.toLocaleString() || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Yearly: ₹{stats?.revenue?.yearly?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderApplicationsList = () => (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          onClick={() => setStatusFilter('all')}
          color={statusFilter === 'all' ? 'primary' : 'default'}
        />
        <Chip
          label="Submitted"
          onClick={() => setStatusFilter('submitted')}
          color={statusFilter === 'submitted' ? 'primary' : 'default'}
        />
        <Chip
          label="Price Determined"
          onClick={() => setStatusFilter('price_determined')}
          color={statusFilter === 'price_determined' ? 'primary' : 'default'}
        />
        <Chip
          label="Advance Paid"
          onClick={() => setStatusFilter('advance_paid')}
          color={statusFilter === 'advance_paid' ? 'primary' : 'default'}
        />
        <Chip
          label="Approved"
          onClick={() => setStatusFilter('approved')}
          color={statusFilter === 'approved' ? 'primary' : 'default'}
        />
        <Chip
          label="Active Care"
          onClick={() => setStatusFilter('active_care')}
          color={statusFilter === 'active_care' ? 'primary' : 'default'}
        />
        <Chip
          label="Completed"
          onClick={() => setStatusFilter('completed')}
          color={statusFilter === 'completed' ? 'primary' : 'default'}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Application #</TableCell>
              <TableCell>Pets</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>{app.applicationNumber}</TableCell>
                <TableCell>
                  <Chip label={`${app.pets?.length || 0} pet(s)`} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{app.userId?.name || 'N/A'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {app.userId?.email || ''}
                  </Typography>
                </TableCell>
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
                    label={app.status?.replace(/_/g, ' ').toUpperCase()}
                    color={getStatusColor(app.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  ₹{app.pricing?.totalAmount?.toLocaleString() || '0'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleViewDetails(app._id)}>
                    <ViewIcon />
                  </IconButton>
                  {app.status === 'submitted' && (
                    <Button size="small" onClick={() => handleSetPricing(app)}>
                      Set Pricing
                    </Button>
                  )}
                  {app.status === 'advance_paid' && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="warning"
                      onClick={() => navigate(`/manager/temporary-care/applications/${app._id}`)}
                    >
                      Complete Handover
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const handleSetPricing = (app) => {
    setSelectedApplication(app);
    setDetailsDialogOpen(true);
    // This will open the details dialog where pricing can be set
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Temporary Care Application Manager
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<ListIcon />} label="Applications" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && renderDashboard()}
          {tabValue === 1 && renderApplicationsList()}
        </>
      )}

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onUpdate={loadDashboardData}
      />
    </Container>
  );
};

// Application Details Dialog Component
const ApplicationDetailsDialog = ({ open, onClose, application, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (application) {
      // Initialize pricing data if setting pricing
      if (application.status === 'submitted' && !application.pricing?.petPricing?.length) {
        const initialPricing = application.pets.map(pet => ({
          petId: pet.petId._id || pet.petId,
          petType: pet.petId.speciesId?.name || 'Dog',
          petSize: 'medium',
          baseRatePerDay: 500,
          numberOfDays: application.numberOfDays,
          baseAmount: 500 * application.numberOfDays,
          specialCareAddons: [],
          totalAmount: 500 * application.numberOfDays
        }));
        setPricingData({
          petPricing: initialPricing,
          additionalCharges: [],
          discount: { amount: 0 },
          tax: { percentage: 18 }
        });
      }
    }
  }, [application]);

  if (!application) return null;

  const handleSetPricing = async () => {
    try {
      setLoading(true);
      const subtotal = pricingData.petPricing.reduce((sum, p) => sum + p.totalAmount, 0);
      const afterDiscount = subtotal - pricingData.discount.amount;
      const taxAmount = (afterDiscount * pricingData.tax.percentage) / 100;
      const totalAmount = afterDiscount + taxAmount;
      const advanceAmount = totalAmount * 0.5;
      const remainingAmount = totalAmount - advanceAmount;

      await temporaryCareAPI.managerSetPricing(application._id, {
        petPricing: pricingData.petPricing.map(p => ({
          ...p,
          numberOfDays: application.numberOfDays
        })),
        additionalCharges: pricingData.additionalCharges,
        discount: pricingData.discount,
        tax: pricingData.tax
      });

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error setting pricing:', err);
      alert(err?.response?.data?.message || 'Failed to set pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (action, reason) => {
    try {
      setLoading(true);
      await temporaryCareAPI.managerApproveOrReject(application._id, { action, reason });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error approving/rejecting:', err);
      alert(err?.response?.data?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Application #{application.applicationNumber}
        <Chip
          label={application.status?.replace(/_/g, ' ').toUpperCase()}
          color={getStatusColor(application.status)}
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Details" />
          <Tab label="Pets" />
          <Tab label="Pricing" />
          <Tab label="Care Logs" />
          {application.status === 'submitted' && <Tab label="Set Pricing" />}
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Owner Information</Typography>
              <Typography>{application.userId?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {application.userId?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {application.userId?.phone}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Care Duration</Typography>
              <Typography>
                {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {application.numberOfDays} days
              </Typography>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            {application.pets?.map((pet, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar src={resolveMediaUrl(pet.petId?.profileImage || pet.petId?.images?.[0]?.url)} />
                    <Box flex={1}>
                      <Typography variant="h6">{pet.petId?.name || 'Unnamed Pet'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pet.petId?.speciesId?.displayName || pet.petId?.species || 'Unknown'}
                      </Typography>
                      {pet.specialInstructions && (
                        <Box sx={{ mt: 1 }}>
                          {pet.specialInstructions.food && (
                            <Typography variant="caption" display="block">
                              Food: {pet.specialInstructions.food}
                            </Typography>
                          )}
                          {pet.specialInstructions.medicine && (
                            <Typography variant="caption" display="block">
                              Medicine: {pet.specialInstructions.medicine}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 2 && application.pricing && (
          <Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pet</TableCell>
                    <TableCell>Rate/Day</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {application.pricing.petPricing?.map((petPrice, idx) => (
                    <TableRow key={idx}>
                      <TableCell>Pet {idx + 1}</TableCell>
                      <TableCell>₹{petPrice.baseRatePerDay}</TableCell>
                      <TableCell>{petPrice.numberOfDays}</TableCell>
                      <TableCell>₹{petPrice.totalAmount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total Amount:</Typography>
              <Typography variant="h6">₹{application.pricing.totalAmount?.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography>Advance (50%):</Typography>
              <Typography>₹{application.pricing.advanceAmount?.toLocaleString()}</Typography>
            </Box>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            {application.dailyCareLogs?.length > 0 ? (
              application.dailyCareLogs.map((log, idx) => (
                <Accordion key={idx}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{new Date(log.date).toLocaleDateString()}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">{log.notes}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Alert severity="info">No care logs yet</Alert>
            )}
          </Box>
        )}

        {activeTab === 4 && application.status === 'submitted' && pricingData && (
          <Box>
            <Typography variant="h6" gutterBottom>Set Pricing</Typography>
            {pricingData.petPricing.map((petPrice, idx) => {
              const pet = application.pets[idx];
              return (
                <Card key={idx} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {pet?.petId?.name || `Pet ${idx + 1}`}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Base Rate Per Day"
                          type="number"
                          value={petPrice.baseRatePerDay}
                          onChange={(e) => {
                            const newRate = parseFloat(e.target.value);
                            const newBase = newRate * application.numberOfDays;
                            setPricingData(prev => ({
                              ...prev,
                              petPricing: prev.petPricing.map((p, i) =>
                                i === idx ? { ...p, baseRatePerDay: newRate, baseAmount: newBase, totalAmount: newBase } : p
                              )
                            }));
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Total Amount"
                          value={petPrice.totalAmount}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
            <TextField
              fullWidth
              label="Tax Percentage"
              type="number"
              value={pricingData.tax.percentage}
              onChange={(e) => setPricingData(prev => ({
                ...prev,
                tax: { ...prev.tax, percentage: parseFloat(e.target.value) }
              }))}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {activeTab === 4 && application.status === 'submitted' && (
          <Button onClick={handleSetPricing} variant="contained" disabled={loading}>
            Set Pricing
          </Button>
        )}
        {application.status === 'advance_paid' && (
          <>
            <Button
              onClick={() => handleApproveReject('reject', 'Application rejected')}
              color="error"
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleApproveReject('approve')}
              variant="contained"
              color="success"
              disabled={loading}
            >
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
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

export default ApplicationManagerDashboard;

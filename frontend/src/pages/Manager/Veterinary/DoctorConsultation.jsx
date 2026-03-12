import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Pets as PetsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  MedicalServices as MedicalIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Science as ScienceIcon,
  Vaccines as VaccineIcon,
  Assignment as AssignmentIcon,
  PlayArrow as StartIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Warning as WarningIcon,
  EventAvailable as FollowUpIcon
} from '@mui/icons-material';
import { veterinaryAPI, resolveMediaUrl } from '../../../services/api';

const DoctorConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [appointment, setAppointment] = useState(null);
  const [previousRecords, setPreviousRecords] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Consultation form state
  const [consultationData, setConsultationData] = useState({
    // Symptoms & Examination
    symptoms: '',
    physicalExamination: '',
    temperature: '',
    weight: '',
    heartRate: '',
    respiratoryRate: '',
    
    // Diagnosis & Treatment
    diagnosis: '',
    treatment: '',
    notes: '',
    
    // Medications
    medications: [],
    
    // Procedures
    procedures: [],
    
    // Vaccinations
    vaccinations: [],
    
    // Lab Tests
    tests: [],
    
    // Prescriptions
    prescriptions: [],
    
    // Follow-up
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    
    // Billing
    totalCost: 0,
    paymentStatus: 'pending',
    amountPaid: 0
  });

  // Medication dialog
  const [medicationDialog, setMedicationDialog] = useState(false);
  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    route: 'oral',
    notes: ''
  });

  // Procedure dialog
  const [procedureDialog, setProcedureDialog] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState({
    name: '',
    description: '',
    cost: 0,
    notes: ''
  });

  // Test dialog
  const [testDialog, setTestDialog] = useState(false);
  const [currentTest, setCurrentTest] = useState({
    name: '',
    type: 'blood',
    result: '',
    normalRange: '',
    notes: ''
  });

  useEffect(() => {
    loadConsultation();
  }, [id]);

  const loadConsultation = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get appointment details
      const response = await veterinaryAPI.managerGetAppointmentById(id);
      const appointmentData = response.data.data?.appointment || response.data.data;
      
      if (!appointmentData) {
        throw new Error('Appointment not found');
      }
      
      setAppointment(appointmentData);
      
      // Pre-fill symptoms from appointment
      if (appointmentData.symptoms) {
        setConsultationData(prev => ({
          ...prev,
          symptoms: appointmentData.symptoms
        }));
      }
      
      // If appointment is in_progress, get consultation details
      if (appointmentData.status === 'in_progress') {
        try {
          const consultResponse = await veterinaryAPI.managerGetConsultationDetails(id);
          if (consultResponse.data.data) {
            setPreviousRecords(consultResponse.data.data.previousRecords || []);
          }
        } catch (e) {
          console.log('Could not get consultation details:', e);
        }
      }
      
      // Get previous medical records for this pet
      if (appointmentData.petId?._id) {
        try {
          const recordsResponse = await veterinaryAPI.managerGetMedicalRecordsByPet(appointmentData.petId._id);
          if (recordsResponse.data.data?.records) {
            setPreviousRecords(recordsResponse.data.data.records);
          }
        } catch (e) {
          console.log('Could not get previous records:', e);
        }
      }
      
    } catch (err) {
      console.error('Load consultation error:', err);
      setError(err.response?.data?.message || 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await veterinaryAPI.managerStartConsultation(id);
      
      if (response.data.success) {
        setSuccess('Consultation started');
        setAppointment(prev => ({ ...prev, status: 'in_progress' }));
        if (response.data.data?.previousRecords) {
          setPreviousRecords(response.data.data.previousRecords);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteConsultation = async () => {
    try {
      if (!consultationData.diagnosis.trim()) {
        setError('Diagnosis is required to complete consultation');
        return;
      }
      
      setSaving(true);
      setError('');
      
      const payload = {
        diagnosis: consultationData.diagnosis,
        treatment: consultationData.treatment,
        notes: consultationData.notes,
        medications: consultationData.medications,
        procedures: consultationData.procedures,
        vaccinations: consultationData.vaccinations,
        tests: consultationData.tests,
        prescriptions: consultationData.prescriptions,
        followUpRequired: consultationData.followUpRequired,
        followUpDate: consultationData.followUpDate || null,
        followUpNotes: consultationData.followUpNotes,
        totalCost: parseFloat(consultationData.totalCost) || 0,
        paymentStatus: consultationData.paymentStatus,
        amountPaid: parseFloat(consultationData.amountPaid) || 0
      };
      
      const response = await veterinaryAPI.managerCompleteConsultation(id, payload);
      
      if (response.data.success) {
        setSuccess('Consultation completed and medical record created!');
        setTimeout(() => {
          navigate('/manager/veterinary/appointments');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSaving(false);
    }
  };

  // Medication handlers
  const handleAddMedication = () => {
    if (currentMedication.name && currentMedication.dosage && currentMedication.frequency) {
      setConsultationData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...currentMedication }]
      }));
      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', route: 'oral', notes: '' });
      setMedicationDialog(false);
    }
  };

  const handleRemoveMedication = (index) => {
    setConsultationData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Procedure handlers
  const handleAddProcedure = () => {
    if (currentProcedure.name) {
      setConsultationData(prev => ({
        ...prev,
        procedures: [...prev.procedures, { ...currentProcedure }],
        totalCost: prev.totalCost + (parseFloat(currentProcedure.cost) || 0)
      }));
      setCurrentProcedure({ name: '', description: '', cost: 0, notes: '' });
      setProcedureDialog(false);
    }
  };

  const handleRemoveProcedure = (index) => {
    const procedure = consultationData.procedures[index];
    setConsultationData(prev => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index),
      totalCost: prev.totalCost - (parseFloat(procedure.cost) || 0)
    }));
  };

  // Test handlers
  const handleAddTest = () => {
    if (currentTest.name) {
      setConsultationData(prev => ({
        ...prev,
        tests: [...prev.tests, { ...currentTest }]
      }));
      setCurrentTest({ name: '', type: 'blood', result: '', normalRange: '', notes: '' });
      setTestDialog(false);
    }
  };

  const handleRemoveTest = (index) => {
    setConsultationData(prev => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'info',
      confirmed: 'primary',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
      pending_approval: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getPetImage = (pet) => {
    if (pet?.images?.[0]?.url) return resolveMediaUrl(pet.images[0].url);
    if (pet?.imageUrl) return resolveMediaUrl(pet.imageUrl);
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Appointment not found</Alert>
      </Container>
    );
  }

  const pet = appointment.petId;
  const owner = appointment.ownerId;
  const canStartConsultation = ['scheduled', 'confirmed'].includes(appointment.status);
  const isInProgress = appointment.status === 'in_progress';
  const isCompleted = appointment.status === 'completed';

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalIcon color="primary" />
            Doctor Consultation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Appointment #{appointment.appointmentNumber || id.slice(-8).toUpperCase()}
          </Typography>
        </Box>
        <Chip 
          label={appointment.status?.replace('_', ' ').toUpperCase()} 
          color={getStatusColor(appointment.status)}
          sx={{ fontWeight: 600 }}
        />
        {appointment.bookingType === 'emergency' && (
          <Chip icon={<WarningIcon />} label="EMERGENCY" color="error" variant="filled" />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Left Column - Patient Info */}
        <Grid item xs={12} md={4}>
          {/* Pet Card */}
          <Card sx={{ mb: 2, boxShadow: 3 }}>
            <CardHeader
              avatar={
                <Avatar 
                  src={getPetImage(pet)} 
                  sx={{ width: 64, height: 64, bgcolor: 'primary.light' }}
                >
                  <PetsIcon />
                </Avatar>
              }
              title={<Typography variant="h6" fontWeight={700}>{pet?.name || 'Unknown Pet'}</Typography>}
              subheader={`${pet?.species || ''} • ${pet?.breed || ''}`}
            />
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Age</Typography>
                  <Typography variant="body2" fontWeight={600}>{pet?.age || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Gender</Typography>
                  <Typography variant="body2" fontWeight={600}>{pet?.gender || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Weight</Typography>
                  <Typography variant="body2" fontWeight={600}>{pet?.weight ? `${pet.weight} kg` : '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Color</Typography>
                  <Typography variant="body2" fontWeight={600}>{pet?.color || '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Owner Card */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><PersonIcon /></Avatar>}
              title={<Typography variant="subtitle1" fontWeight={600}>{owner?.name || 'Unknown Owner'}</Typography>}
              subheader="Pet Owner"
            />
            <CardContent sx={{ pt: 0 }}>
              <List dense disablePadding>
                {owner?.email && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><EmailIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={owner.email} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                )}
                {owner?.phone && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={owner.phone} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Appointment Info */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'info.main' }}><CalendarIcon /></Avatar>}
              title="Appointment Details"
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="body2" color="text.secondary">Reason</Typography>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>{appointment.reason}</Typography>
              
              {appointment.symptoms && (
                <>
                  <Typography variant="body2" color="text.secondary">Initial Symptoms</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>{appointment.symptoms}</Typography>
                </>
              )}
              
              <Typography variant="body2" color="text.secondary">Date & Time</Typography>
              <Typography variant="body1">
                {appointment.appointmentDate 
                  ? new Date(appointment.appointmentDate).toLocaleDateString()
                  : 'N/A'
                } {appointment.timeSlot || ''}
              </Typography>
            </CardContent>
          </Card>

          {/* Previous Records */}
          {previousRecords.length > 0 && (
            <Card>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><HistoryIcon /></Avatar>}
                title="Previous Medical History"
              />
              <CardContent sx={{ pt: 0, maxHeight: 300, overflow: 'auto' }}>
                {previousRecords.slice(0, 5).map((record, index) => (
                  <Paper key={record._id || index} sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" fontWeight={600}>{record.diagnosis}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(record.visitDate).toLocaleDateString()} • {record.staff?.name || 'Doctor'}
                    </Typography>
                    {record.medications?.length > 0 && (
                      <Typography variant="caption" display="block" color="primary.main">
                        {record.medications.length} medication(s)
                      </Typography>
                    )}
                  </Paper>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Consultation Form */}
        <Grid item xs={12} md={8}>
          {/* Action Buttons */}
          {canStartConsultation && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  variant="contained" 
                  color="success" 
                  startIcon={<StartIcon />}
                  onClick={handleStartConsultation}
                  disabled={saving}
                >
                  Start Consultation
                </Button>
              }
            >
              Click "Start Consultation" to begin the examination
            </Alert>
          )}

          {isCompleted && (
            <Alert severity="success" sx={{ mb: 2 }}>
              This consultation has been completed and the medical record has been saved.
            </Alert>
          )}

          {/* Consultation Form */}
          <Paper sx={{ p: 3, boxShadow: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
              <Tab label="Examination" icon={<MedicalIcon />} iconPosition="start" />
              <Tab label="Medications" icon={<MedicationIcon />} iconPosition="start" />
              <Tab label="Procedures & Tests" icon={<ScienceIcon />} iconPosition="start" />
              <Tab label="Follow-up & Billing" icon={<MoneyIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab 0: Examination */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Physical Examination</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Presenting Symptoms"
                      multiline
                      rows={3}
                      value={consultationData.symptoms}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, symptoms: e.target.value }))}
                      disabled={isCompleted}
                      placeholder="Describe the symptoms presented by the patient..."
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Temperature"
                      value={consultationData.temperature}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, temperature: e.target.value }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">°F</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Weight"
                      value={consultationData.weight}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, weight: e.target.value }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Heart Rate"
                      value={consultationData.heartRate}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, heartRate: e.target.value }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Respiratory Rate"
                      value={consultationData.respiratoryRate}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">/min</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Physical Examination Notes"
                      multiline
                      rows={3}
                      value={consultationData.physicalExamination}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, physicalExamination: e.target.value }))}
                      disabled={isCompleted}
                      placeholder="Document physical examination findings..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Diagnosis & Treatment</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Diagnosis"
                      multiline
                      rows={3}
                      value={consultationData.diagnosis}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosis: e.target.value }))}
                      disabled={isCompleted}
                      placeholder="Enter primary diagnosis and any differential diagnoses..."
                      error={!consultationData.diagnosis && isInProgress}
                      helperText={!consultationData.diagnosis && isInProgress ? 'Diagnosis is required' : ''}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Treatment Plan"
                      multiline
                      rows={3}
                      value={consultationData.treatment}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, treatment: e.target.value }))}
                      disabled={isCompleted}
                      placeholder="Document the treatment plan..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={2}
                      value={consultationData.notes}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                      disabled={isCompleted}
                      placeholder="Any additional notes or observations..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 1: Medications */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Prescribed Medications</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setMedicationDialog(true)}
                    disabled={isCompleted}
                  >
                    Add Medication
                  </Button>
                </Box>

                {consultationData.medications.length === 0 ? (
                  <Alert severity="info">No medications prescribed yet</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {consultationData.medications.map((med, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle1" fontWeight={600}>{med.name}</Typography>
                              {!isCompleted && (
                                <IconButton size="small" color="error" onClick={() => handleRemoveMedication(index)}>
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {med.dosage} • {med.frequency}
                            </Typography>
                            {med.duration && (
                              <Typography variant="body2" color="text.secondary">
                                Duration: {med.duration}
                              </Typography>
                            )}
                            {med.route && (
                              <Chip label={med.route} size="small" sx={{ mt: 1 }} />
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 2: Procedures & Tests */}
            {activeTab === 2 && (
              <Box>
                {/* Procedures */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>Procedures Performed</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setProcedureDialog(true)}
                      disabled={isCompleted}
                    >
                      Add Procedure
                    </Button>
                  </Box>

                  {consultationData.procedures.length === 0 ? (
                    <Alert severity="info">No procedures recorded</Alert>
                  ) : (
                    <List>
                      {consultationData.procedures.map((proc, index) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            !isCompleted && (
                              <IconButton edge="end" color="error" onClick={() => handleRemoveProcedure(index)}>
                                <DeleteIcon />
                              </IconButton>
                            )
                          }
                        >
                          <ListItemIcon><HospitalIcon color="primary" /></ListItemIcon>
                          <ListItemText
                            primary={proc.name}
                            secondary={
                              <>
                                {proc.description && <span>{proc.description} • </span>}
                                <span style={{ color: '#2e7d32', fontWeight: 600 }}>₹{proc.cost || 0}</span>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Lab Tests */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>Lab Tests & Results</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setTestDialog(true)}
                      disabled={isCompleted}
                    >
                      Add Test
                    </Button>
                  </Box>

                  {consultationData.tests.length === 0 ? (
                    <Alert severity="info">No lab tests recorded</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {consultationData.tests.map((test, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" fontWeight={600}>{test.name}</Typography>
                                {!isCompleted && (
                                  <IconButton size="small" color="error" onClick={() => handleRemoveTest(index)}>
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </Box>
                              <Chip label={test.type} size="small" sx={{ mt: 0.5 }} />
                              {test.result && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Result: <strong>{test.result}</strong>
                                  {test.normalRange && ` (Normal: ${test.normalRange})`}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Box>
            )}

            {/* Tab 3: Follow-up & Billing */}
            {activeTab === 3 && (
              <Box>
                {/* Follow-up */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Follow-up Schedule</Typography>
                
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={consultationData.followUpRequired}
                          onChange={(e) => setConsultationData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                          disabled={isCompleted}
                        />
                      }
                      label="Follow-up appointment required"
                    />
                  </Grid>
                  {consultationData.followUpRequired && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Follow-up Date"
                          InputLabelProps={{ shrink: true }}
                          value={consultationData.followUpDate}
                          onChange={(e) => setConsultationData(prev => ({ ...prev, followUpDate: e.target.value }))}
                          disabled={isCompleted}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Follow-up Notes"
                          multiline
                          rows={2}
                          value={consultationData.followUpNotes}
                          onChange={(e) => setConsultationData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                          disabled={isCompleted}
                          placeholder="Instructions for follow-up..."
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Billing */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Billing Information</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Cost"
                      value={consultationData.totalCost}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, totalCost: e.target.value }))}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        value={consultationData.paymentStatus}
                        label="Payment Status"
                        onChange={(e) => setConsultationData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        disabled={isCompleted}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="partially_paid">Partially Paid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount Paid"
                      value={consultationData.amountPaid}
                      onChange={(e) => setConsultationData(prev => ({ ...prev, amountPaid: e.target.value }))}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      disabled={isCompleted}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Complete Consultation Button */}
            {isInProgress && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/manager/veterinary/appointments')}
                >
                  Save & Exit
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                  onClick={handleCompleteConsultation}
                  disabled={saving || !consultationData.diagnosis}
                >
                  Complete Consultation
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Medication Dialog */}
      <Dialog open={medicationDialog} onClose={() => setMedicationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Medication</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medication Name"
                value={currentMedication.name}
                onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Dosage"
                value={currentMedication.dosage}
                onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 500mg"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Frequency"
                value={currentMedication.frequency}
                onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g., Twice daily"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration"
                value={currentMedication.duration}
                onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 7 days"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Route</InputLabel>
                <Select
                  value={currentMedication.route}
                  label="Route"
                  onChange={(e) => setCurrentMedication(prev => ({ ...prev, route: e.target.value }))}
                >
                  <MenuItem value="oral">Oral</MenuItem>
                  <MenuItem value="injection">Injection</MenuItem>
                  <MenuItem value="topical">Topical</MenuItem>
                  <MenuItem value="inhalation">Inhalation</MenuItem>
                  <MenuItem value="iv">IV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={currentMedication.notes}
                onChange={(e) => setCurrentMedication(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special instructions..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicationDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMedication} variant="contained" disabled={!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency}>
            Add Medication
          </Button>
        </DialogActions>
      </Dialog>

      {/* Procedure Dialog */}
      <Dialog open={procedureDialog} onClose={() => setProcedureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Procedure</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Procedure Name"
                value={currentProcedure.name}
                onChange={(e) => setCurrentProcedure(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={currentProcedure.description}
                onChange={(e) => setCurrentProcedure(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Cost"
                value={currentProcedure.cost}
                onChange={(e) => setCurrentProcedure(prev => ({ ...prev, cost: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={currentProcedure.notes}
                onChange={(e) => setCurrentProcedure(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcedureDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProcedure} variant="contained" disabled={!currentProcedure.name}>
            Add Procedure
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Lab Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Name"
                value={currentTest.name}
                onChange={(e) => setCurrentTest(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={currentTest.type}
                  label="Test Type"
                  onChange={(e) => setCurrentTest(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="blood">Blood Test</MenuItem>
                  <MenuItem value="urine">Urine Test</MenuItem>
                  <MenuItem value="xray">X-Ray</MenuItem>
                  <MenuItem value="ultrasound">Ultrasound</MenuItem>
                  <MenuItem value="mri">MRI</MenuItem>
                  <MenuItem value="ct">CT Scan</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Normal Range"
                value={currentTest.normalRange}
                onChange={(e) => setCurrentTest(prev => ({ ...prev, normalRange: e.target.value }))}
                placeholder="e.g., 10-20 mg/dL"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Result"
                value={currentTest.result}
                onChange={(e) => setCurrentTest(prev => ({ ...prev, result: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={currentTest.notes}
                onChange={(e) => setCurrentTest(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTest} variant="contained" disabled={!currentTest.name}>
            Add Test
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorConsultation;

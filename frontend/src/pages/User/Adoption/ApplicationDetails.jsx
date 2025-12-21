import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material'
import {
  Pets as PetIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Description as DocumentIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material'

export default function UserAdoptionApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adoptionAPI.getMyRequestById(id)
      const data = res?.data?.data || res?.data
      setApp(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load application')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const payNow = async () => {
    try {
      if (!app) return
      const ok = await loadRazorpay()
      if (!ok) return alert('Payment SDK failed to load. Please check your connection.')
      const create = await adoptionAPI.createPaymentOrder(app._id || id)
      const { key, orderId, amount, currency } = create?.data?.data || {}
      if (!key || !orderId) return alert('Failed to create payment order')

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: 'Pet Adoption',
        description: `Adoption fee for ${app?.petId?.name || 'Pet'}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await adoptionAPI.verifyPayment({
              applicationId: app._id || id,
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            await load()
            alert('Payment verified successfully')
          } catch (e) {
            alert(e?.response?.data?.error || 'Payment verification failed')
          }
        },
        theme: { color: '#10b981' }
      })
      rzp.open()
    } catch (e) {
      alert(e?.response?.data?.error || 'Payment failed to start')
    }
  }

  const downloadCertificate = async () => {
    try {
      // Stream via backend to avoid redirects/CORS and force download
      // Use the correct user certificate endpoint
      const resp = await adoptionAPI.getUserCertificate(app._id || id)
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fname = (match && match[1]) ? match[1] : `certificate_${app._id || id}.pdf`
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      // Fallback to the existing method if the new endpoint fails
      try {
        const res = await adoptionAPI.getCertificate(app._id || id)
        const url = res?.data?.data?.agreementFile || res?.data?.data?.certificate?.agreementFile || res?.data?.data?.contractURL
        if (url) {
          const resolvedUrl = resolveMediaUrl(url)
          const a = document.createElement('a')
          a.href = resolvedUrl
          a.download = `certificate_${app._id || id}.pdf`
          document.body.appendChild(a)
          a.click()
          a.remove()
        } else {
          alert('Certificate not available')
        }
      } catch (fallbackError) {
        alert(e?.response?.data?.error || 'Failed to download certificate')
      }
    }
  }

  const docs = () => {
    const d1 = Array.isArray(app?.documents) ? app.documents : []
    const d2 = Array.isArray(app?.applicationData?.documents) ? app.applicationData.documents : []
    return [...d1, ...d2]
  }

  // Get current step in the adoption process
  const getCurrentStep = () => {
    if (app?.status === 'pending') return 0
    if (app?.status === 'approved' && app?.paymentStatus !== 'completed') return 1
    if (app?.status === 'approved' && app?.paymentStatus === 'completed') return 2
    if (app?.handover?.status === 'scheduled') return 3
    if (app?.handover?.status === 'completed') return 4
    return 0
  }

  // Get step status for progress indicator
  const getStepStatus = (stepIndex) => {
    const current = getCurrentStep()
    if (stepIndex < current) return 'completed'
    if (stepIndex === current) return 'active'
    return 'pending'
  }

  // Get step icon
  const getStepIcon = (stepIndex) => {
    const status = getStepStatus(stepIndex)
    if (status === 'completed') return <CheckIcon sx={{ color: 'success.main' }} />
    if (status === 'active') return <PendingIcon sx={{ color: 'primary.main' }} />
    return <PendingIcon sx={{ color: 'grey.400' }} />
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Typography>Loading application details...</Typography>
    </Box>
  )
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography color="error.main">{error}</Typography>
          <Button onClick={() => navigate('/User/adoption/applications')} sx={{ mt: 2 }}>
            Back to Applications
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
  
  if (!app) return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography>Application not found</Typography>
          <Button onClick={() => navigate('/User/adoption/applications')} sx={{ mt: 2 }}>
            Back to Applications
          </Button>
        </CardContent>
      </Card>
    </Box>
  )

  const steps = [
    {
      label: 'Application Submitted',
      description: 'Your adoption application has been submitted and is awaiting review.',
      icon: <PendingIcon />
    },
    {
      label: 'Payment Processing',
      description: 'Application approved. Please complete the adoption fee payment.',
      icon: <PaymentIcon />
    },
    {
      label: 'Certificate Generation',
      description: 'Payment completed. Adoption certificate is being generated.',
      icon: <DocumentIcon />
    },
    {
      label: 'Handover Scheduled',
      description: 'Certificate ready. Visit the adoption center to pick up your pet.',
      icon: <CalendarIcon />
    },
    {
      label: 'Adoption Completed',
      description: 'Pet ownership transferred. Congratulations on your new companion!',
      icon: <CheckIcon />
    }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Adoption Application Details
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/User/adoption/applications')}
        >
          Back to Applications
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/User/adoption')}
        >
          Back to Adoption Center
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Progress Tracker */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Adoption Process Status
              </Typography>
              <Stepper activeStep={getCurrentStep()} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label} active={getStepStatus(index) === 'active'}>
                    <StepLabel 
                      StepIconComponent={() => getStepIcon(index)}
                      sx={{ 
                        '& .MuiStepLabel-label': { 
                          fontWeight: getStepStatus(index) === 'active' ? 600 : 400,
                          color: getStepStatus(index) === 'completed' ? 'success.main' : 
                                 getStepStatus(index) === 'active' ? 'primary.main' : 'text.secondary'
                        }
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Status Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Application Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Chip
                  label={app.status === 'approved' ? 'Approved' : 
                         app.status === 'rejected' ? 'Rejected' : 
                         app.status === 'pending' ? 'Pending Review' : 
                         app.status === 'completed' ? 'Completed' : 
                         app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  color={app.status === 'approved' ? 'success' : 
                         app.status === 'rejected' ? 'error' : 
                         app.status === 'pending' ? 'warning' : 
                         app.status === 'completed' ? 'info' : 'default'}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              {app.status === 'rejected' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                    Rejection Reason
                  </Typography>
                  <Typography variant="body2">
                    {app.rejectionReason || 'No reason provided'}
                  </Typography>
                </Box>
              )}
              
              {app.status === 'approved' && app.paymentStatus !== 'completed' && (
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="success"
                    fullWidth
                    startIcon={<PaymentIcon />}
                    onClick={payNow}
                    sx={{ mb: 1 }}
                  >
                    Pay Adoption Fee (₹{app.petId?.adoptionFee || 0})
                  </Button>
                  <Typography variant="caption" color="text.secondary" align="center">
                    After payment, the adoption manager will generate your certificate
                  </Typography>
                </Box>
              )}
              
              {(app.paymentStatus === 'completed' || ['certificate_generated', 'handover_scheduled', 'handed_over', 'completed'].includes(app.status)) && (
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={downloadCertificate}
                    sx={{ mb: 1 }}
                  >
                    Download Certificate
                  </Button>
                  <Typography variant="caption" color="text.secondary" align="center">
                    Your certificate is ready for the handover process
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pet Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Pet Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
                  <PetIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{app.petId?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {app.petId?.breed} • {app.petId?.species}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoneyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Adoption Fee" 
                    secondary={`₹${app.petId?.adoptionFee || 0}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Application Date" 
                    secondary={app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'} 
                  />
                </ListItem>
              </List>
              
              {app.paymentStatus === 'completed' && app.handover?.status === 'scheduled' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="info.main" sx={{ mb: 1 }}>
                    Handover Scheduled
                  </Typography>
                  <Typography variant="body2">
                    Date: {app.handover.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'Not set'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Applicant Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Your Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Name" 
                    secondary={app.applicationData?.fullName || app.userId?.name || '-'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={app.applicationData?.email || app.userId?.email || '-'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={app.applicationData?.phone || '-'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Home Type" 
                    secondary={app.applicationData?.homeType || '-'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Work Schedule" 
                    secondary={app.applicationData?.workSchedule || '-'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Documents
              </Typography>
              
              {docs().length === 0 ? (
                <Typography color="text.secondary">No documents uploaded.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {docs().map((d, i) => {
                    const url = typeof d === 'string' ? d : (d && d.url ? d.url : '')
                    if (!url) return null
                    const name = (typeof d === 'object' && d.name) ? d.name : url.split('/').pop()
                    return (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            '&:hover': { bgcolor: 'grey.50' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DocumentIcon color="primary" />
                            <Typography variant="body2" noWrap>
                              {name}
                            </Typography>
                          </Box>
                          <IconButton 
                            size="small" 
                            href={resolveMediaUrl(url)} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Handover Information */}
        {app.handover?.status === 'scheduled' && (
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid', borderColor: 'info.main' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'info.main' }}>
                  Handover Appointment
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                    <Typography>
                      {app.handover.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    <Typography>
                      {app.handover.location?.address || 'Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                    <Typography>
                      {app.handover.location?.phone || '+91-9876543210'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Special Notes</Typography>
                    <Typography>
                      {app.handover.notes || 'None'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                    Important Information
                  </Typography>
                  <Typography variant="body2">
                    Please bring the OTP sent to your email to the adoption center. 
                    Arrive 15 minutes before your scheduled time. 
                    No pets will be released without the correct OTP.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Completion Message */}
        {app.handover?.status === 'completed' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckIcon sx={{ color: 'success.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                    Adoption Completed!
                  </Typography>
                </Box>
                <Typography sx={{ color: 'success.dark', mb: 2 }}>
                  Congratulations! Your adoption is now complete. The pet is officially yours and will appear in your dashboard under "My Pets".
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  Handover completed on {app.handoverCompletedAt ? new Date(app.handoverCompletedAt).toLocaleString() : 'recently'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
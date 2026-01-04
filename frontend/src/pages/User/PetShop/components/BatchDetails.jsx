import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Grid,
  Divider,
  Button,
  Stack,
  Chip,
  ImageList,
  ImageListItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  LinearProgress,
  Tooltip,
  Avatar,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Pets as PetsIcon,
  CalendarToday as AgeIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ShoppingCart as CartIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../../services/api';

/**
 * BatchDetails Component
 * Shows full batch details, pets in batch, and allows reservation
 */
const BatchDetails = ({ batch, onClose, onReserve }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pets, setPets] = useState([]);
  const [selectedGender, setSelectedGender] = useState('any');
  const [petsLoading, setPetsLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: details, 1: gender selection, 2: pet selection, 3: confirm
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    if (batch && step === 2) {
      loadBatchPets();
    }
  }, [batch, step, selectedGender]);

  const loadBatchPets = async () => {
    try {
      setPetsLoading(true);
      setError('');

      const params = { limit: 50, page: 1 };
      if (selectedGender !== 'any') {
        params.gender = selectedGender;
      }

      const response = await apiClient.get(`/petshop/manager/batches/${batch._id}/inventory`, {
        params
      });

      setPets(response.data.data?.pets || []);
    } catch (err) {
      console.error('Error loading pets:', err);
      setError('Failed to load pets from batch');
    } finally {
      setPetsLoading(false);
    }
  };

  const handleReserve = async (petId) => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.post(`/petshop/manager/batches/${batch._id}/reserve`, {
        gender: selectedGender
      });

      if (response.data.success) {
        // Show confirmation
        setStep(3);
        onReserve?.(response.data.data);
      }
    } catch (err) {
      console.error('Error reserving pet:', err);
      setError(err.response?.data?.message || 'Failed to reserve pet');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Batch Info', 'Select Gender', 'Choose Pet', 'Confirm'];

  // Get shop info
  const shopName = batch.shopId?.name || 'Unknown Shop';
  const shopPhone = batch.shopId?.contact?.phone || 'N/A';
  const shopEmail = batch.shopId?.contact?.email || 'N/A';

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {batch.breedId?.name} Batch
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: '500px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Progress Stepper */}
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Batch Information */}
        {step === 0 && (
          <Box>
            {/* Gallery */}
            {batch.images?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Gallery
                </Typography>
                <ImageList sx={{ width: '100%' }} cols={3} rowHeight={200}>
                  {batch.images.map((img, idx) => (
                    <ImageListItem key={idx}>
                      <img
                        src={resolveMediaUrl(img)}
                        alt={`Batch ${idx}`}
                        style={{ objectFit: 'cover', cursor: 'pointer' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}

            {/* Batch Info Grid */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Species & Breed
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {batch.speciesId?.displayName} - {batch.breedId?.name}
                    </Typography>
                    {batch.category && (
                      <Chip label={batch.category} size="small" sx={{ mr: 1 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Age Range
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AgeIcon color="primary" />
                      <Typography variant="h6">
                        {batch.ageRange?.min}-{batch.ageRange?.max} {batch.ageRange?.unit}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Available Count
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {batch.availability?.available} / {batch.counts?.total}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={((batch.counts?.total - batch.availability?.available) / batch.counts?.total) * 100}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {batch.soldPercentage}% sold
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Price Range
                    </Typography>
                    <Typography variant="h6">
                      ₹{batch.price?.min?.toLocaleString()} - ₹{batch.price?.max?.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gender Distribution */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Available by Gender
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <MaleIcon sx={{ fontSize: '2rem', color: '#2196f3', mb: 1 }} />
                      <Typography variant="h6">{batch.counts?.male || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Male
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <FemaleIcon sx={{ fontSize: '2rem', color: '#e91e63', mb: 1 }} />
                      <Typography variant="h6">{batch.counts?.female || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Female
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <PetsIcon sx={{ fontSize: '2rem', color: '#ff9800', mb: 1 }} />
                      <Typography variant="h6">{batch.counts?.unknown || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Unknown
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Shop Info */}
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Shop Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{shopName}</Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <PhoneIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                      <Typography variant="body2">{shopPhone}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <EmailIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                      <Typography variant="body2">{shopEmail}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {batch.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Description
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {batch.description}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 1: Gender Selection */}
        {step === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select Your Preference
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                Which gender would you prefer?
              </FormLabel>
              <RadioGroup
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <FormControlLabel
                  value="any"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Any (Show All Available)</Typography>
                      <Typography variant="caption" color="textSecondary">
                        We'll show you all available pets
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  value="male"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">
                        <MaleIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                        Male ({batch.counts?.male || 0} available)
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                  disabled={!batch.counts?.male}
                />
                <FormControlLabel
                  value="female"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">
                        <FemaleIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                        Female ({batch.counts?.female || 0} available)
                      </Typography>
                    </Box>
                  }
                  disabled={!batch.counts?.female}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Step 2: Pet Selection */}
        {step === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Available {selectedGender !== 'any' ? selectedGender : ''} Pets
            </Typography>

            {petsLoading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : pets.length === 0 ? (
              <Alert severity="info">
                No pets available for selected criteria
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Pet Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pets.map((pet) => (
                      <TableRow
                        key={pet._id}
                        sx={{
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedPet(pet)}
                      >
                        <TableCell>
                          <Chip label={pet.petCode} size="small" />
                        </TableCell>
                        <TableCell>{pet.name}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {pet.gender === 'Male' && <MaleIcon sx={{ fontSize: '1rem', color: '#2196f3' }} />}
                            {pet.gender === 'Female' && <FemaleIcon sx={{ fontSize: '1rem', color: '#e91e63' }} />}
                            <Typography variant="caption">{pet.gender}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {pet.age} {pet.ageUnit}
                        </TableCell>
                        <TableCell>₹{pet.price?.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPet(pet);
                              handleReserve(pet._id);
                            }}
                            disabled={loading}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: '4rem', color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Reservation Confirmed!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              The shop manager will review your reservation within 15 minutes.
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Reservation expires in 15 minutes if manager doesn't respond.
              </Typography>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step < 3 ? (
          <>
            <Button onClick={onClose}>Close</Button>
            {step > 0 && (
              <Button
                variant="outlined"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            {step < 2 && (
              <Button
                variant="contained"
                onClick={() => setStep(step + 1)}
                disabled={loading}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button
                variant="contained"
                startIcon={<CartIcon />}
                onClick={() => handleReserve()}
                disabled={loading || petsLoading || pets.length === 0}
              >
                {loading ? 'Reserving...' : 'Reserve Pet'}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onClose} variant="contained">
            Done
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default BatchDetails;

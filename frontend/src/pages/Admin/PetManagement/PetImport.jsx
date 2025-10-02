import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  FileUpload,
  FileDownload,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { petsAPI } from '../../../services/petSystemAPI';

const PetImport = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await petsAPI.importCSV(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setImportResults(response.data?.data || response.data);
      setSuccess('Pets imported successfully!');
      
      setTimeout(() => {
        navigate('/admin/pets');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import pets');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await petsAPI.downloadTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pet-import-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Import Pets from CSV
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin/pets')}
        >
          Back to Pets
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload CSV File
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Upload a CSV file containing pet data. Make sure to follow the template format.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="csv-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<FileUpload />}
                    disabled={uploading}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {uploading ? 'Uploading...' : 'Choose CSV File'}
                  </Button>
                </label>
              </Box>

              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Uploading and processing...
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={handleDownloadTemplate}
                fullWidth
              >
                Download Template
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Instructions
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Required Fields:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <li>name - Pet name</li>
                <li>speciesId - Species ID (must exist in database)</li>
                <li>breedId - Breed ID (must exist in database)</li>
                <li>gender - male, female, or unknown</li>
                <li>dateOfBirth - Date in YYYY-MM-DD format</li>
                <li>currentStatus - available, adopted, fostered, medical, deceased</li>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Optional Fields:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <li>color - Pet color</li>
                <li>size - Pet size</li>
                <li>weightKg - Weight in kilograms</li>
                <li>description - Pet description</li>
                <li>adoptionFee - Adoption fee amount</li>
                <li>location - Pet location</li>
                <li>temperament - Pet temperament</li>
                <li>specialNeeds - Special needs description</li>
                <li>storeId - Store ID</li>
                <li>storeName - Store name</li>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Make sure species and breed IDs exist in the database before importing.
                  You can check available species and breeds in their respective management pages.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Import Results */}
        {importResults && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Results
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {importResults.successful || 0}
                      </Typography>
                      <Typography variant="body2">Successful</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {importResults.failed || 0}
                      </Typography>
                      <Typography variant="body2">Failed</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {importResults.warnings || 0}
                      </Typography>
                      <Typography variant="body2">Warnings</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4">
                        {importResults.total || 0}
                      </Typography>
                      <Typography variant="body2">Total</Typography>
                    </Box>
                  </Grid>
                </Grid>

                {importResults.details && importResults.details.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Detailed Results
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>Pet Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Message</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResults.details.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>{detail.row}</TableCell>
                              <TableCell>{detail.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(detail.status)}
                                  label={detail.status}
                                  color={getStatusColor(detail.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {detail.message}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PetImport;
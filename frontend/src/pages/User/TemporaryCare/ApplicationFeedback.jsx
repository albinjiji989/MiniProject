import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  Rating,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';

const ApplicationFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    serviceRating: 5,
    staffRating: 5,
    facilityRating: 5,
    comment: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, feedbackRes] = await Promise.all([
        temporaryCareAPI.getApplicationDetails(id),
        temporaryCareAPI.getApplicationFeedback(id).catch(() => ({ data: { data: { feedback: null } } }))
      ]);

      setApplication(appRes.data?.data?.application);
      if (feedbackRes.data?.data?.feedback) {
        setFeedback(feedbackRes.data.data.feedback);
        setSuccess(true); // Feedback already submitted
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      await temporaryCareAPI.submitApplicationFeedback(id, formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/User/temporary-care/applications');
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Application not found</Alert>
      </Container>
    );
  }

  if (application.status !== 'completed') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Feedback can only be submitted for completed applications</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Submit Feedback
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Application #{application.applicationNumber}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && feedback && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
          Thank you! Your feedback has been submitted.
        </Alert>
      )}

      {success && feedback ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Your Feedback</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Overall Rating</Typography>
                <Rating value={feedback.rating} readOnly />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Service Rating</Typography>
                <Rating value={feedback.serviceRating} readOnly />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Staff Rating</Typography>
                <Rating value={feedback.staffRating} readOnly />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Facility Rating</Typography>
                <Rating value={feedback.facilityRating} readOnly />
              </Box>
              {feedback.comment && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Comment</Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">{feedback.comment}</Typography>
                  </Paper>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                Submitted on {new Date(feedback.submittedAt).toLocaleString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  How was your experience?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your feedback helps us improve our services
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Rating *
                </Typography>
                <Rating
                  value={formData.rating}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, rating: newValue }));
                  }}
                  size="large"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Service Rating
                </Typography>
                <Rating
                  value={formData.serviceRating}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, serviceRating: newValue }));
                  }}
                  size="large"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Staff Rating
                </Typography>
                <Rating
                  value={formData.staffRating}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, staffRating: newValue }));
                  }}
                  size="large"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Facility Rating
                </Typography>
                <Rating
                  value={formData.facilityRating}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, facilityRating: newValue }));
                  }}
                  size="large"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Comments (Optional)"
                  multiline
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience, suggestions, or any additional feedback..."
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || formData.rating === 0}
                    startIcon={submitting ? <CircularProgress size={20} /> : <CheckIcon />}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/User/temporary-care/applications')}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/User/temporary-care/applications')}
        >
          Back to Applications
        </Button>
      </Box>
    </Container>
  );
};

export default ApplicationFeedback;

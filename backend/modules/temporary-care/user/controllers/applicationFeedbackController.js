const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const { validationResult } = require('express-validator');

/**
 * Submit feedback for completed application
 */
const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { applicationId } = req.params;
    const { rating, comment, serviceRating, staffRating, facilityRating } = req.body;

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      userId: req.user._id,
      status: 'completed'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or not completed' });
    }

    // Check if feedback already submitted
    if (application.feedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this application' });
    }

    // Add feedback
    application.feedback = {
      rating,
      comment: comment || '',
      serviceRating: serviceRating || rating,
      staffRating: staffRating || rating,
      facilityRating: facilityRating || rating,
      submittedAt: new Date()
    };

    await application.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback: application.feedback }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get feedback for application
 */
const getFeedback = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      data: { feedback: application.feedback || null }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedback
};

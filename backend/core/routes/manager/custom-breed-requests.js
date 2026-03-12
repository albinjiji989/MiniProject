const express = require('express');
const router = express.Router();
const CustomBreedRequest = require('../../models/CustomBreedRequest');
const Species = require('../../models/Species');
const { auth } = require('../../middleware/auth');

// Get manager's own requests
router.get('/', auth, async (req, res) => {
  try {
    const requests = await CustomBreedRequest.find({ requestedBy: req.user.id })
      .populate('speciesId', 'name displayName')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching manager requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
});

// Create new request
router.post('/', auth, async (req, res) => {
  try {
    const { type, name, speciesId, description } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type and name are required'
      });
    }

    if (type === 'breed' && !speciesId) {
      return res.status(400).json({
        success: false,
        message: 'Species is required for breed requests'
      });
    }

    const requestData = {
      requestType: type,
      requestedBy: req.user.id,
      reason: description || `Requested ${type} from manager`,
      status: 'pending'
    };

    if (type === 'species') {
      requestData.speciesName = name.toLowerCase().trim();
      requestData.speciesDisplayName = name.trim();
      requestData.speciesDescription = description || '';
    } else if (type === 'breed') {
      requestData.breedName = name.trim();
      requestData.breedDescription = description || '';
      requestData.speciesId = speciesId;
    }

    const request = new CustomBreedRequest(requestData);
    await request.save();

    // Populate species info before sending response
    await request.populate('speciesId', 'name displayName');

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
});

// Get request by ID (only if owned by manager)
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await CustomBreedRequest.findOne({
      _id: req.params.id,
      requestedBy: req.user.id
    }).populate('speciesId', 'name displayName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
});

module.exports = router;

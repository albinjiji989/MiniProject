const express = require('express');
const router = express.Router();
const CustomBreedRequest = require('../../core/models/CustomBreedRequest');
const Species = require('../../core/models/Species');
const Breed = require('../../core/models/Breed');
const { auth, authorize } = require('../../middleware/auth');

// Get all custom breed requests
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status, 
      requestType, 
      priority,
      category 
    } = req.query;
    
    const query = {};

    if (search) {
      query.$or = [
        { speciesName: { $regex: search, $options: 'i' } },
        { speciesDisplayName: { $regex: search, $options: 'i' } },
        { breedName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (requestType) {
      query.requestType = requestType;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    const requests = await CustomBreedRequest.find(query)
      .populate('requester', 'name email phone')
      .populate('reviewer', 'name email')
      .populate('createdSpecies', 'name displayName')
      .populate('createdBreed', 'name')
      .sort({ priority: -1, submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomBreedRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching custom breed requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom breed requests',
      error: error.message
    });
  }
});

// Get pending requests
router.get('/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const requests = await CustomBreedRequest.findPending();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
});

// Get request by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const request = await CustomBreedRequest.findById(req.params.id)
      .populate('requester', 'name email phone')
      .populate('reviewer', 'name email')
      .populate('createdSpecies', 'name displayName')
      .populate('createdBreed', 'name');

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

// Approve request
router.patch('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const request = await CustomBreedRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending' && request.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    let createdRecord = null;

    if (request.requestType === 'species') {
      // Create new species
      const species = new Species({
        name: request.speciesName,
        displayName: request.speciesDisplayName,
        description: request.speciesDescription,
        icon: request.speciesIcon,
        createdBy: req.user.id
      });

      await species.save();
      createdRecord = species;
      request.createdSpeciesId = species._id;
    } else if (request.requestType === 'breed') {
      // Create new breed
      const breed = new Breed({
        name: request.breedName,
        speciesId: request.speciesId,
        description: request.breedDescription,
        size: request.breedSize,
        temperament: request.breedTemperament,
        groomingNeeds: request.breedGroomingNeeds,
        exerciseNeeds: request.breedExerciseNeeds,
        createdBy: req.user.id
      });

      await breed.save();
      createdRecord = breed;
      request.createdBreedId = breed._id;
    }

    await request.approve(req.user.id, adminNotes);

    res.json({
      success: true,
      message: 'Request approved successfully',
      data: {
        request,
        createdRecord
      }
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message
    });
  }
});

// Reject request
router.patch('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;
    const request = await CustomBreedRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending' && request.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    await request.reject(req.user.id, rejectionReason, adminNotes);

    res.json({
      success: true,
      message: 'Request rejected successfully',
      data: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
});

// Mark as under review
router.patch('/:id/review', auth, authorize('admin'), async (req, res) => {
  try {
    const request = await CustomBreedRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not in pending status'
      });
    }

    await request.markUnderReview(req.user.id);

    res.json({
      success: true,
      message: 'Request marked as under review',
      data: request
    });
  } catch (error) {
    console.error('Error marking request as under review:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking request as under review',
      error: error.message
    });
  }
});

// Set priority
router.patch('/:id/priority', auth, authorize('admin'), async (req, res) => {
  try {
    const { priority } = req.body;
    const request = await CustomBreedRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    await request.setPriority(priority);

    res.json({
      success: true,
      message: 'Priority updated successfully',
      data: request
    });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating priority',
      error: error.message
    });
  }
});

// Get request statistics
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalRequests = await CustomBreedRequest.countDocuments();
    const pendingRequests = await CustomBreedRequest.countDocuments({ status: 'pending' });
    const underReviewRequests = await CustomBreedRequest.countDocuments({ status: 'under_review' });
    const approvedRequests = await CustomBreedRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await CustomBreedRequest.countDocuments({ status: 'rejected' });

    // Requests by type
    const requestsByType = await CustomBreedRequest.aggregate([
      { $group: { _id: '$requestType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Requests by priority
    const requestsByPriority = await CustomBreedRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRequests = await CustomBreedRequest.countDocuments({
      submittedAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        total: totalRequests,
        pending: pendingRequests,
        underReview: underReviewRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        byType: requestsByType,
        byPriority: requestsByPriority,
        recent: recentRequests
      }
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request statistics',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const petshopBlockchainService = require('../services/petshopBlockchainService');
const { auth } = require('../../../../core/middleware/auth');

/**
 * Get pet's complete blockchain history
 * Public endpoint - anyone can verify
 */
router.get('/pet/:petCode', async (req, res) => {
  try {
    const { petCode } = req.params;
    const history = await petshopBlockchainService.getPetHistory(petCode);
    
    res.json({
      success: true,
      data: {
        petCode,
        totalEvents: history.length,
        history
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching blockchain history',
      error: error.message 
    });
  }
});

/**
 * Verify blockchain integrity
 * Public endpoint - transparency
 */
router.get('/verify', async (req, res) => {
  try {
    const result = await petshopBlockchainService.verifyChain();
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying blockchain',
      error: error.message 
    });
  }
});

/**
 * Verify specific pet/batch chain
 */
router.get('/verify/:field/:value', async (req, res) => {
  const { field, value } = req.params;
  try {
    const result = await petshopBlockchainService.verifyChain(field, value);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get verification certificate for a pet
 * Public endpoint - buyers can verify authenticity
 */
router.get('/certificate/:petCode', async (req, res) => {
  try {
    const { petCode } = req.params;
    const certificate = await petshopBlockchainService.getVerificationCertificate(petCode);
    
    if (certificate.error) {
      return res.status(404).json({
        success: false,
        message: certificate.error
      });
    }
    
    res.json({ 
      success: true, 
      data: certificate 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating certificate',
      error: error.message 
    });
  }
});

/**
 * Get blockchain statistics
 * Manager only
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await petshopBlockchainService.getStats();
    
    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching stats',
      error: error.message 
    });
  }
});

/**
 * Get blockchain history by field (backward compatibility)
 */
router.get('/history/:field/:value', async (req, res) => {
  const { field, value } = req.params;
  try {
    const history = await petshopBlockchainService.getHistoryByField(field, value);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Add a blockchain event (for internal use, not public)
 */
router.post('/event', async (req, res) => {
  const { eventType, eventData, documentHashes } = req.body;
  try {
    const block = await petshopBlockchainService.addBlock(eventType, eventData, documentHashes);
    res.status(201).json({ success: true, block });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

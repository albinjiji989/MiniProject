const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchainService');

// Get blockchain history for a pet
router.get('/pet/:petId', async (req, res) => {
  try {
    const history = await BlockchainService.getPetHistory(req.params.petId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify the blockchain chain
router.get('/verify', async (req, res) => {
  try {
    const valid = await BlockchainService.verifyChain();
    res.json({ success: true, valid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get blockchain statistics and analytics
router.get('/stats', async (req, res) => {
  try {
    const stats = await BlockchainService.getBlockchainStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify a specific block
router.get('/block/:blockId', async (req, res) => {
  try {
    const result = await BlockchainService.verifyBlock(req.params.blockId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

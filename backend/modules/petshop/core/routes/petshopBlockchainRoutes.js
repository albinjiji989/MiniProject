const express = require('express');
const router = express.Router();
const petshopBlockchainService = require('../core/services/petshopBlockchainService');

// Add a blockchain event (for internal use, not public)
router.post('/blockchain/event', async (req, res) => {
  const { eventType, eventData, documentHashes } = req.body;
  try {
    const block = await petshopBlockchainService.addBlock(eventType, eventData, documentHashes);
    res.status(201).json({ success: true, block });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get blockchain history for a pet, batch, or user
router.get('/blockchain/history/:field/:value', async (req, res) => {
  const { field, value } = req.params;
  try {
    const history = await petshopBlockchainService.getHistoryByField(field, value);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify hash-chain integrity for a pet or batch
router.get('/blockchain/verify/:field/:value', async (req, res) => {
  const { field, value } = req.params;
  try {
    const valid = await petshopBlockchainService.verifyChain(field, value);
    res.json({ success: true, valid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

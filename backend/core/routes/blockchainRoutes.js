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

// ═══════════════════════════════════════════════════════════════
// TAMPER SIMULATION ROUTES (Research Demo & Testing Only)
// These routes let you deliberately corrupt the chain and then
// verify that the system detects every type of attack.
// ═══════════════════════════════════════════════════════════════

// Detailed chain verification with error report (shows exactly what's wrong)
router.get('/verify/detailed', async (req, res) => {
  try {
    const result = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack 1: Tamper block data
router.post('/tamper/data', async (req, res) => {
  try {
    const { blockIndex, newData } = req.body;
    if (blockIndex === undefined || !newData) {
      return res.status(400).json({ success: false, error: 'blockIndex and newData are required' });
    }
    const result = await BlockchainService.tamperBlockData(blockIndex, newData);
    const verification = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, tamper: result, verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack 2: Tamper block hash
router.post('/tamper/hash', async (req, res) => {
  try {
    const { blockIndex } = req.body;
    if (blockIndex === undefined) {
      return res.status(400).json({ success: false, error: 'blockIndex is required' });
    }
    const result = await BlockchainService.tamperBlockHash(blockIndex);
    const verification = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, tamper: result, verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack 3: Break chain linkage
router.post('/tamper/link', async (req, res) => {
  try {
    const { blockIndex } = req.body;
    if (blockIndex === undefined) {
      return res.status(400).json({ success: false, error: 'blockIndex is required' });
    }
    const result = await BlockchainService.tamperChainLink(blockIndex);
    const verification = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, tamper: result, verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack 4: Tamper merkle root
router.post('/tamper/merkle', async (req, res) => {
  try {
    const { blockIndex } = req.body;
    if (blockIndex === undefined) {
      return res.status(400).json({ success: false, error: 'blockIndex is required' });
    }
    const result = await BlockchainService.tamperMerkleRoot(blockIndex);
    const verification = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, tamper: result, verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack 5: Bypass proof-of-work
router.post('/tamper/pow', async (req, res) => {
  try {
    const { blockIndex } = req.body;
    if (blockIndex === undefined) {
      return res.status(400).json({ success: false, error: 'blockIndex is required' });
    }
    const result = await BlockchainService.tamperProofOfWork(blockIndex);
    const verification = await BlockchainService.verifyChainDetailed();
    res.json({ success: true, tamper: result, verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Repair chain after tampering demo
router.post('/repair', async (req, res) => {
  try {
    const result = await BlockchainService.repairChain();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

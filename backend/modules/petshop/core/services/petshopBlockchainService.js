// Blockchain service for petshop module
const crypto = require('crypto');
const PetshopBlockchainBlock = require('../models/PetshopBlockchainBlock');

// Helper to calculate SHA256 hash
function calculateBlockHash(blockData) {
  return crypto.createHash('sha256').update(JSON.stringify(blockData)).digest('hex');
}

// Get latest block
async function getLatestBlock() {
  return await PetshopBlockchainBlock.findOne().sort({ timestamp: -1 });
}

// Add a new block to the blockchain ledger
async function addBlock(eventType, eventData, documentHashes = []) {
  const previousBlock = await getLatestBlock();
  const previousHash = previousBlock ? previousBlock.blockHash : 'GENESIS';
  const blockData = {
    previousHash,
    timestamp: new Date(),
    eventType,
    eventData,
    documentHashes,
  };
  const blockHash = calculateBlockHash(blockData);
  const block = new PetshopBlockchainBlock({ ...blockData, blockHash });
  await block.save();
  return block;
}

// Get blockchain history for a pet, batch, or user
async function getHistoryByField(field, value) {
  return await PetshopBlockchainBlock.find({ [`eventData.${field}`]: value }).sort({ timestamp: 1 });
}

// Verify hash-chain integrity for a pet or batch
async function verifyChain(field, value) {
  const blocks = await getHistoryByField(field, value);
  let prevHash = 'GENESIS';
  for (const block of blocks) {
    const { blockHash, ...blockData } = block.toObject();
    const calculatedHash = calculateBlockHash(blockData);
    if (block.blockHash !== calculatedHash || block.previousHash !== prevHash) {
      return false;
    }
    prevHash = block.blockHash;
  }
  return true;
}

module.exports = {
  addBlock,
  getHistoryByField,
  verifyChain,
};

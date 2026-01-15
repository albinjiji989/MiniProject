// Blockchain ledger model for petshop module (MongoDB, hash-chain)
const mongoose = require('mongoose');

const PetshopBlockchainBlockSchema = new mongoose.Schema({
  blockHash: { type: String, required: true },
  previousHash: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  eventType: { type: String, required: true }, // e.g., pet_created, batch_created, status_changed, reserved, sold
  eventData: { type: Object, required: true }, // petId, batchId, userId, status, etc.
  documentHashes: [{ type: String }], // optional
});

module.exports = mongoose.model('PetshopBlockchainBlock', PetshopBlockchainBlockSchema, 'petshop_blockchain_ledger');

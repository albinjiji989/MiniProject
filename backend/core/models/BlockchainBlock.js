const mongoose = require('mongoose');

const BlockchainBlockSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true }, // Ensure no duplicate indices
  timestamp: { type: Date, default: Date.now, immutable: true }, // Immutable timestamp
  eventType: { type: String, required: true }, // e.g., PET_CREATED, APPLICATION_APPROVED, etc.
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // adopter or actor
  data: { type: Object, required: true }, // event-specific data
  previousHash: { type: String, required: true },
  hash: { type: String, required: true, unique: true }, // Ensure unique hash
  nonce: { type: Number, default: 0 }, // Proof-of-work nonce
  merkleRoot: { type: String }, // Merkle tree root for data integrity
  signature: { type: String }, // Digital signature for authenticity
  difficulty: { type: Number, default: 2 }, // Mining difficulty when block was created
}, { 
  collection: 'blockchain_blocks',
  timestamps: false // Disable automatic timestamps, use custom timestamp field
});

module.exports = mongoose.model('BlockchainBlock', BlockchainBlockSchema);
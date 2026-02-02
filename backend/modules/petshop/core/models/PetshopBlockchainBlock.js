// Blockchain ledger model for petshop module (MongoDB, hash-chain with SHA-256)
const mongoose = require('mongoose');
const crypto = require('crypto');

const PetshopBlockchainBlockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'PET_ADDED_TO_INVENTORY',
      'PET_RESERVED',
      'RESERVATION_PAYMENT',
      'FULL_PAYMENT_COMPLETED',
      'HANDOVER_OTP_GENERATED',
      'HANDOVER_COMPLETED',
      'HANDOVER_SCHEDULED',
      'OWNERSHIP_TRANSFERRED',
      'WARRANTY_STARTED',
      'SALE_FINALIZED',
      'APPLICATION_APPROVED',
      'APPLICATION_REJECTED',
      'APPLICATION_SUBMITTED',
      'pet_added',
      'pet_created',
      'stock_created',
      'stock_updated',
      'stock_released',
      'batch_created',
      'pet_reserved',
      'reservation_confirmed',
      'reservation_released',
      'pet_sold',
      'batch_published',
      'order_created',
      'order_updated',
      'order_submitted',
      'order_received',
      'pet_status_changed',
      'pet_removed_from_sale',
      'petCode_generated',
      'payment_direct_buy_initiated',
      'payment_order_created',
      'payment_successful',
      'ownership_transferred',
      'registry_ownership_transfer',
      'review_created',
      'review_updated'
    ]
  },
  
  // Pet Information
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetInventoryItem'
  },
  petCode: {
    type: String
  },
  
  // Participants
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Event Data (flexible for different event types)
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Document Hashes (optional)
  documentHashes: [{
    type: String
  }],
  
  // Blockchain Fields (SHA-256 Implementation - Same as Adoption)
  previousHash: {
    type: String,
    required: true
  },
  blockHash: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    default: 0
  },
  merkleRoot: {
    type: String,
    required: true
  },
  signature: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    default: 2
  }
}, {
  timestamps: true
});

// SHA-256 Hash Calculation (Same as Adoption)
PetshopBlockchainBlockSchema.methods.calculateHash = function() {
  return crypto
    .createHash('sha256')
    .update(
      this.index +
      this.timestamp +
      this.eventType +
      (this.petCode || '') +
      JSON.stringify(this.eventData || this.data || {}) +
      this.previousHash +
      this.nonce
    )
    .digest('hex');
};

// Mine Block - Proof of Work (Same as Adoption)
PetshopBlockchainBlockSchema.methods.mineBlock = function(difficulty) {
  while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
    this.nonce++;
    this.hash = this.calculateHash();
  }
  console.log(`✅ PetShop Block mined: ${this.hash} (nonce: ${this.nonce})`);
};

// Calculate Merkle Root (Same as Adoption)
PetshopBlockchainBlockSchema.methods.calculateMerkleRoot = function() {
  const data = JSON.stringify(this.eventData || this.data || {});
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Create Digital Signature (Same as Adoption)
PetshopBlockchainBlockSchema.methods.createSignature = function() {
  const dataToSign = this.hash + this.timestamp + this.eventType;
  return crypto.createHash('sha256').update(dataToSign).digest('hex');
};

// Index for faster queries
PetshopBlockchainBlockSchema.index({ petCode: 1 });
PetshopBlockchainBlockSchema.index({ index: 1 });
PetshopBlockchainBlockSchema.index({ eventType: 1 });
PetshopBlockchainBlockSchema.index({ 'eventData.petId': 1 });
PetshopBlockchainBlockSchema.index({ 'eventData.batchId': 1 });

module.exports = mongoose.model('PetshopBlockchainBlock', PetshopBlockchainBlockSchema, 'petshop_blockchain_ledger');

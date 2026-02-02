// Blockchain service for petshop module with SHA-256 and Proof of Work
const crypto = require('crypto');
const PetshopBlockchainBlock = require('../models/PetshopBlockchainBlock');

/**
 * Add new block to PetShop blockchain with SHA-256 and Proof of Work
 * Same implementation as Adoption blockchain
 */
async function addBlock(eventType, eventData, documentHashes = []) {
  try {
    // Get the last block
    const lastBlock = await PetshopBlockchainBlock.findOne()
      .sort({ index: -1 })
      .limit(1);
    
    const index = lastBlock ? lastBlock.index + 1 : 0;
    const previousHash = lastBlock ? (lastBlock.hash || lastBlock.blockHash) : '0';
    
    console.log(`🔗 Creating PetShop block #${index} for event: ${eventType}`);
    
    // Extract petCode and petId from eventData if available
    const petCode = eventData.petCode || eventData.petId?.toString() || '';
    const petId = eventData.petId || null;
    const userId = eventData.userId || null;
    const managerId = eventData.managedBy || eventData.createdBy || null;
    
    // Create new block
    const block = new PetshopBlockchainBlock({
      index,
      timestamp: new Date(),
      eventType,
      petId,
      petCode,
      userId,
      managerId,
      eventData,
      data: eventData, // Keep both for compatibility
      documentHashes,
      previousHash,
      difficulty: 2
    });
    
    // Calculate merkle root
    block.merkleRoot = block.calculateMerkleRoot();
    
    // Calculate initial hash
    block.hash = block.calculateHash();
    block.blockHash = block.hash; // Keep both for compatibility
    
    // Mine the block (Proof of Work with SHA-256)
    block.mineBlock(block.difficulty);
    block.blockHash = block.hash; // Update blockHash after mining
    
    // Create signature
    block.signature = block.createSignature();
    
    // Save to database
    await block.save();
    
    console.log(`✅ PetShop Block #${index} added successfully with SHA-256`);
    return block;
    
  } catch (error) {
    console.error('❌ Error adding block to PetShop blockchain:', error);
    throw error;
  }
}

/**
 * Get blockchain history for a specific field
 */
async function getHistoryByField(field, value) {
  try {
    const query = {};
    
    // Support both direct fields and nested eventData fields
    if (field === 'petId' || field === 'petCode' || field === 'userId') {
      query[field] = value;
    } else {
      query[`eventData.${field}`] = value;
    }
    
    return await PetshopBlockchainBlock.find(query).sort({ timestamp: 1 });
  } catch (error) {
    console.error('❌ Error getting blockchain history:', error);
    throw error;
  }
}

/**
 * Get pet history by petCode
 */
async function getPetHistory(petCode) {
  try {
    const blocks = await PetshopBlockchainBlock.find({
      $or: [
        { petCode: petCode },
        { 'eventData.petCode': petCode }
      ]
    })
    .sort({ index: 1 })
    .populate('userId', 'name email')
    .populate('managerId', 'name email');
    
    return blocks.map(block => ({
      index: block.index,
      timestamp: block.timestamp,
      eventType: block.eventType,
      data: block.eventData || block.data,
      hash: block.hash || block.blockHash,
      previousHash: block.previousHash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot,
      signature: block.signature,
      verified: true
    }));
  } catch (error) {
    console.error('❌ Error getting pet history:', error);
    throw error;
  }
}

/**
 * Verify blockchain integrity with SHA-256
 */
async function verifyChain(field = null, value = null) {
  try {
    let blocks;
    
    if (field && value) {
      blocks = await getHistoryByField(field, value);
    } else {
      blocks = await PetshopBlockchainBlock.find().sort({ index: 1 });
    }
    
    if (blocks.length === 0) {
      return {
        isValid: true,
        message: 'No blocks in chain',
        totalBlocks: 0
      };
    }
    
    let isValid = true;
    let invalidBlocks = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Verify hash
      const calculatedHash = block.calculateHash();
      if (block.hash !== calculatedHash && block.blockHash !== calculatedHash) {
        isValid = false;
        invalidBlocks.push({
          index: block.index,
          reason: 'Hash mismatch'
        });
      }
      
      // Verify chain link (except genesis block)
      if (i > 0) {
        const prevBlock = blocks[i - 1];
        const prevHash = prevBlock.hash || prevBlock.blockHash;
        if (block.previousHash !== prevHash) {
          isValid = false;
          invalidBlocks.push({
            index: block.index,
            reason: 'Chain link broken'
          });
        }
      }
      
      // Verify proof of work
      if (!block.hash.startsWith('0'.repeat(block.difficulty))) {
        isValid = false;
        invalidBlocks.push({
          index: block.index,
          reason: 'Invalid proof of work'
        });
      }
    }
    
    return {
      isValid,
      totalBlocks: blocks.length,
      invalidBlocks,
      message: isValid ? 'Blockchain is valid' : 'Blockchain has been tampered with'
    };
    
  } catch (error) {
    console.error('❌ Error verifying blockchain:', error);
    throw error;
  }
}

/**
 * Get verification certificate for a pet
 */
async function getVerificationCertificate(petCode) {
  try {
    const history = await getPetHistory(petCode);
    
    if (history.length === 0) {
      return {
        error: 'No blockchain records found for this pet'
      };
    }
    
    const verification = await verifyChain('petCode', petCode);
    
    return {
      petCode,
      isVerified: verification.isValid,
      totalEvents: history.length,
      firstEvent: history[0],
      latestEvent: history[history.length - 1],
      verificationDate: new Date(),
      blockchainIntegrity: verification.message,
      certificate: {
        id: crypto.createHash('sha256').update(petCode + Date.now()).digest('hex'),
        issuedAt: new Date(),
        algorithm: 'SHA-256',
        proofOfWork: 'Difficulty 2',
        status: verification.isValid ? 'VERIFIED' : 'INVALID'
      }
    };
  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    throw error;
  }
}

/**
 * Get blockchain statistics
 */
async function getStats() {
  try {
    const totalBlocks = await PetshopBlockchainBlock.countDocuments();
    const latestBlock = await PetshopBlockchainBlock.findOne().sort({ index: -1 });
    
    const eventTypes = await PetshopBlockchainBlock.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    return {
      totalBlocks,
      latestBlock: latestBlock ? {
        index: latestBlock.index,
        timestamp: latestBlock.timestamp,
        eventType: latestBlock.eventType,
        hash: latestBlock.hash || latestBlock.blockHash
      } : null,
      eventTypes,
      algorithm: 'SHA-256',
      difficulty: 2,
      proofOfWork: 'Enabled'
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw error;
  }
}

module.exports = {
  addBlock,
  getHistoryByField,
  getPetHistory,
  verifyChain,
  getVerificationCertificate,
  getStats
};

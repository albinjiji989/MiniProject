const BlockchainBlock = require('../models/BlockchainBlock');
const crypto = require('crypto');

class BlockchainService {
  // Difficulty level for proof-of-work (number of leading zeros required)
  static DIFFICULTY = 2; // Start with 2, increase for more security

  static async getLastBlock() {
    return BlockchainBlock.findOne().sort({ index: -1 });
  }

  static calculateHash({ index, timestamp, eventType, petId, userId, data, previousHash, nonce = 0 }) {
    const blockString = `${index}${timestamp}${eventType}${petId}${userId}${JSON.stringify(data)}${previousHash}${nonce}`;
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  // Proof-of-Work: Mine block with required difficulty
  static mineBlock({ index, timestamp, eventType, petId, userId, data, previousHash }) {
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(this.DIFFICULTY); // e.g., '00' for difficulty 2

    // Keep trying until hash starts with required zeros
    while (!hash.startsWith(target)) {
      nonce++;
      hash = this.calculateHash({ index, timestamp, eventType, petId, userId, data, previousHash, nonce });
    }

    return { hash, nonce };
  }

  // Create Merkle root from transaction data (for batch verification)
  static createMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) return '';
    if (transactions.length === 1) {
      return crypto.createHash('sha256').update(JSON.stringify(transactions[0])).digest('hex');
    }

    const hashes = transactions.map(tx => 
      crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex')
    );

    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Duplicate last hash if odd number
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        newHashes.push(combined);
      }
      hashes.length = 0;
      hashes.push(...newHashes);
    }

    return hashes[0];
  }

  // Generate digital signature for block (simulated - in production use private keys)
  static generateSignature(userId, blockData) {
    const signatureString = `${userId}${JSON.stringify(blockData)}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  static async addBlock({ eventType, petId, userId, data, signature = null }) {
    const lastBlock = await this.getLastBlock();
    const index = lastBlock ? lastBlock.index + 1 : 0;
    const previousHash = lastBlock ? lastBlock.hash : '0';
    const timestamp = new Date();

    // Mine block with proof-of-work
    const { hash, nonce } = this.mineBlock({ 
      index, 
      timestamp, 
      eventType, 
      petId, 
      userId, 
      data, 
      previousHash 
    });

    // Create merkle root for data integrity
    const merkleRoot = this.createMerkleRoot([{ eventType, petId, userId, data }]);

    // Generate or use provided signature
    const blockSignature = signature || this.generateSignature(userId, { eventType, petId, data });

    const block = new BlockchainBlock({
      index,
      timestamp,
      eventType,
      petId,
      userId,
      data,
      previousHash,
      hash,
      nonce,
      merkleRoot,
      signature: blockSignature,
      difficulty: this.DIFFICULTY,
    });
    await block.save();

    console.log(`✅ Blockchain: Mined block ${index} with nonce ${nonce} (difficulty ${this.DIFFICULTY})`);
    return block;
  }

  static async getPetHistory(petId) {
    return BlockchainBlock.find({ petId }).sort({ index: 1 });
  }

  static async verifyChain() {
    const blocks = await BlockchainBlock.find().sort({ index: 1 });
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Verify hash with nonce
      const expectedHash = this.calculateHash({
        index: block.index,
        timestamp: block.timestamp,
        eventType: block.eventType,
        petId: block.petId,
        userId: block.userId,
        data: block.data,
        previousHash: block.previousHash,
        nonce: block.nonce || 0,
      });
      
      // Check if hash matches
      if (block.hash !== expectedHash) {
        console.error(`❌ Block ${block.index} has invalid hash`);
        return false;
      }
      
      // Check proof-of-work (hash starts with required zeros)
      const difficulty = block.difficulty || this.DIFFICULTY;
      const target = '0'.repeat(difficulty);
      if (!block.hash.startsWith(target)) {
        console.error(`❌ Block ${block.index} does not meet difficulty requirement`);
        return false;
      }
      
      // Check chain linkage
      if (i > 0) {
        const prev = blocks[i - 1];
        if (block.previousHash !== prev.hash) {
          console.error(`❌ Block ${block.index} has invalid previousHash`);
          return false;
        }
      }
      
      // Verify merkle root if present
      if (block.merkleRoot) {
        const expectedMerkle = this.createMerkleRoot([{
          eventType: block.eventType,
          petId: block.petId,
          userId: block.userId,
          data: block.data,
        }]);
        if (block.merkleRoot !== expectedMerkle) {
          console.error(`❌ Block ${block.index} has invalid merkle root`);
          return false;
        }
      }
    }
    
    console.log(`✅ Blockchain verified: ${blocks.length} blocks`);
    return true;
  }

  // Get blockchain statistics
  static async getBlockchainStats() {
    const blocks = await BlockchainBlock.find().sort({ index: 1 });
    const totalBlocks = blocks.length;
    const isValid = await this.verifyChain();
    
    const eventTypeCounts = {};
    blocks.forEach(block => {
      eventTypeCounts[block.eventType] = (eventTypeCounts[block.eventType] || 0) + 1;
    });
    
    return {
      totalBlocks,
      isValid,
      difficulty: this.DIFFICULTY,
      eventTypeCounts,
      firstBlock: blocks[0] ? blocks[0].timestamp : null,
      lastBlock: blocks[totalBlocks - 1] ? blocks[totalBlocks - 1].timestamp : null,
    };
  }

  // Verify a specific block
  static async verifyBlock(blockId) {
    const block = await BlockchainBlock.findById(blockId);
    if (!block) return { valid: false, error: 'Block not found' };
    
    const expectedHash = this.calculateHash({
      index: block.index,
      timestamp: block.timestamp,
      eventType: block.eventType,
      petId: block.petId,
      userId: block.userId,
      data: block.data,
      previousHash: block.previousHash,
      nonce: block.nonce || 0,
    });
    
    if (block.hash !== expectedHash) {
      return { valid: false, error: 'Hash mismatch' };
    }
    
    const difficulty = block.difficulty || this.DIFFICULTY;
    const target = '0'.repeat(difficulty);
    if (!block.hash.startsWith(target)) {
      return { valid: false, error: 'Difficulty not met' };
    }
    
    return { valid: true, block };
  }
}

module.exports = BlockchainService;

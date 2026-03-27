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

  // ═══════════════════════════════════════════════════════════════
  // TAMPER SIMULATION METHODS (For Research Demo & Testing Only)
  // These methods intentionally corrupt the chain to prove that
  // the verification system detects every type of attack.
  // ═══════════════════════════════════════════════════════════════

  /**
   * Attack 1: DATA TAMPERING
   * Simulates an attacker modifying the data inside a block
   * (e.g., changing pet owner, adoption status, etc.)
   * Detection: Hash recalculation won't match stored hash
   */
  static async tamperBlockData(blockIndex, newData) {
    const block = await BlockchainBlock.findOne({ index: blockIndex });
    if (!block) throw new Error(`Block ${blockIndex} not found`);

    const originalData = { ...block.data };
    // Directly modify data in DB (bypassing hash recalculation)
    await BlockchainBlock.updateOne(
      { index: blockIndex },
      { $set: { data: newData } }
    );

    return {
      attack: 'DATA_TAMPERING',
      blockIndex,
      originalData,
      tamperedData: newData,
      message: `Block ${blockIndex} data modified. Chain verification should now FAIL with "invalid hash".`,
    };
  }

  /**
   * Attack 2: HASH TAMPERING
   * Simulates an attacker changing a block's hash directly
   * Detection: Next block's previousHash won't match this block's new hash
   */
  static async tamperBlockHash(blockIndex) {
    const block = await BlockchainBlock.findOne({ index: blockIndex });
    if (!block) throw new Error(`Block ${blockIndex} not found`);

    const originalHash = block.hash;
    const fakeHash = '00' + crypto.randomBytes(30).toString('hex'); // still starts with '00' to pass PoW check

    await BlockchainBlock.updateOne(
      { index: blockIndex },
      { $set: { hash: fakeHash } }
    );

    return {
      attack: 'HASH_TAMPERING',
      blockIndex,
      originalHash,
      tamperedHash: fakeHash,
      message: `Block ${blockIndex} hash replaced. Chain verification should FAIL with "invalid hash" (recalculation mismatch) and next block's chain linkage will break.`,
    };
  }

  /**
   * Attack 3: CHAIN LINKAGE BREAK
   * Simulates an attacker breaking the previousHash link between blocks
   * Detection: Block's previousHash won't match the actual previous block's hash
   */
  static async tamperChainLink(blockIndex) {
    if (blockIndex === 0) throw new Error('Cannot break link on genesis block');
    const block = await BlockchainBlock.findOne({ index: blockIndex });
    if (!block) throw new Error(`Block ${blockIndex} not found`);

    const originalPrevHash = block.previousHash;
    const fakePrevHash = crypto.randomBytes(32).toString('hex');

    await BlockchainBlock.updateOne(
      { index: blockIndex },
      { $set: { previousHash: fakePrevHash } }
    );

    return {
      attack: 'CHAIN_LINKAGE_BREAK',
      blockIndex,
      originalPreviousHash: originalPrevHash,
      tamperedPreviousHash: fakePrevHash,
      message: `Block ${blockIndex} previousHash broken. Chain verification should FAIL with "invalid previousHash" and "invalid hash".`,
    };
  }

  /**
   * Attack 4: MERKLE ROOT TAMPERING
   * Simulates an attacker altering the merkle root without changing data
   * Detection: Merkle root recalculation won't match stored value
   */
  static async tamperMerkleRoot(blockIndex) {
    const block = await BlockchainBlock.findOne({ index: blockIndex });
    if (!block) throw new Error(`Block ${blockIndex} not found`);

    const originalMerkle = block.merkleRoot;
    const fakeMerkle = crypto.randomBytes(32).toString('hex');

    await BlockchainBlock.updateOne(
      { index: blockIndex },
      { $set: { merkleRoot: fakeMerkle } }
    );

    return {
      attack: 'MERKLE_ROOT_TAMPERING',
      blockIndex,
      originalMerkleRoot: originalMerkle,
      tamperedMerkleRoot: fakeMerkle,
      message: `Block ${blockIndex} merkle root altered. Chain verification should FAIL with "invalid merkle root".`,
    };
  }

  /**
   * Attack 5: PROOF-OF-WORK BYPASS
   * Simulates an attacker inserting a block without proper mining
   * Detection: Hash won't start with required number of leading zeros
   */
  static async tamperProofOfWork(blockIndex) {
    const block = await BlockchainBlock.findOne({ index: blockIndex });
    if (!block) throw new Error(`Block ${blockIndex} not found`);

    const originalHash = block.hash;
    // Create a valid SHA-256 hash that does NOT meet difficulty (no leading zeros)
    const invalidHash = 'ff' + crypto.randomBytes(30).toString('hex');

    await BlockchainBlock.updateOne(
      { index: blockIndex },
      { $set: { hash: invalidHash, nonce: 0 } }
    );

    return {
      attack: 'POW_BYPASS',
      blockIndex,
      originalHash,
      tamperedHash: invalidHash,
      message: `Block ${blockIndex} hash replaced with unmined hash. Chain verification should FAIL with "does not meet difficulty requirement".`,
    };
  }

  /**
   * Full chain verification with detailed error report
   * Returns exactly which blocks failed and why — useful for demo
   */
  static async verifyChainDetailed() {
    const blocks = await BlockchainBlock.find().sort({ index: 1 });
    const errors = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockErrors = [];

      // 1. Verify hash integrity
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
        blockErrors.push({
          type: 'HASH_MISMATCH',
          message: 'Stored hash does not match recalculated hash',
          storedHash: block.hash,
          expectedHash,
        });
      }

      // 2. Verify proof-of-work
      const difficulty = block.difficulty || this.DIFFICULTY;
      const target = '0'.repeat(difficulty);
      if (!block.hash.startsWith(target)) {
        blockErrors.push({
          type: 'POW_INVALID',
          message: `Hash does not start with ${difficulty} leading zeros`,
          hash: block.hash,
          requiredPrefix: target,
        });
      }

      // 3. Verify chain linkage
      if (i > 0) {
        const prev = blocks[i - 1];
        if (block.previousHash !== prev.hash) {
          blockErrors.push({
            type: 'CHAIN_BROKEN',
            message: 'previousHash does not match previous block hash',
            storedPreviousHash: block.previousHash,
            actualPreviousHash: prev.hash,
          });
        }
      }

      // 4. Verify merkle root
      if (block.merkleRoot) {
        const expectedMerkle = this.createMerkleRoot([{
          eventType: block.eventType,
          petId: block.petId,
          userId: block.userId,
          data: block.data,
        }]);
        if (block.merkleRoot !== expectedMerkle) {
          blockErrors.push({
            type: 'MERKLE_INVALID',
            message: 'Merkle root does not match recalculated value',
            storedMerkle: block.merkleRoot,
            expectedMerkle,
          });
        }
      }

      if (blockErrors.length > 0) {
        errors.push({ blockIndex: block.index, blockId: block._id, errors: blockErrors });
      }
    }

    return {
      valid: errors.length === 0,
      totalBlocks: blocks.length,
      corruptedBlocks: errors.length,
      errors,
      message: errors.length === 0
        ? `✅ All ${blocks.length} blocks verified successfully`
        : `❌ ${errors.length} corrupted block(s) detected out of ${blocks.length}`,
    };
  }

  /**
   * Rebuild/repair the entire chain (re-mine all blocks in order)
   * Use after tampering demo to restore chain integrity
   */
  static async repairChain() {
    const blocks = await BlockchainBlock.find().sort({ index: 1 });
    let repaired = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const previousHash = i === 0 ? '0' : blocks[i - 1].hash;

      // Recalculate merkle root
      const merkleRoot = this.createMerkleRoot([{
        eventType: block.eventType,
        petId: block.petId,
        userId: block.userId,
        data: block.data,
      }]);

      // Re-mine the block
      const { hash, nonce } = this.mineBlock({
        index: block.index,
        timestamp: block.timestamp,
        eventType: block.eventType,
        petId: block.petId,
        userId: block.userId,
        data: block.data,
        previousHash,
      });

      // Update the block
      await BlockchainBlock.updateOne(
        { _id: block._id },
        { $set: { hash, nonce, previousHash, merkleRoot, difficulty: this.DIFFICULTY } }
      );

      // Update local reference so next block can link correctly
      blocks[i].hash = hash;
      blocks[i].previousHash = previousHash;
      repaired++;
    }

    const isValid = await this.verifyChain();
    return {
      repaired,
      totalBlocks: blocks.length,
      isValid,
      message: `🔧 Repaired ${repaired} blocks. Chain is now ${isValid ? 'VALID ✅' : 'STILL INVALID ❌'}`,
    };
  }
  /**
   * Detect tampering by comparing blockchain data with MongoDB data
   * Returns discrepancies for each pet
   */
  static async detectAllTampering() {
    try {
      const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
      const blocks = await BlockchainBlock.find().sort({ index: 1 });

      // Group blocks by petId
      const petBlocksMap = {};
      blocks.forEach(block => {
        if (block.petId) {
          const petIdStr = block.petId.toString();
          if (!petBlocksMap[petIdStr]) {
            petBlocksMap[petIdStr] = [];
          }
          petBlocksMap[petIdStr].push(block);
        }
      });

      const tamperingResults = [];

      console.log(`🔍 Total pets with blockchain: ${Object.keys(petBlocksMap).length}`);

      // Check each pet for tampering
      for (const [petIdStr, petBlocks] of Object.entries(petBlocksMap)) {
        const pet = await AdoptionPet.findById(petIdStr);
        if (!pet) {
          console.log(`⚠️ Pet ${petIdStr} not found in MongoDB`);
          continue;
        }

        const createdBlock = petBlocks.find(b => b.eventType === 'PET_CREATED');
        const paymentBlock = petBlocks.find(b => b.eventType === 'PAYMENT_COMPLETED');

        if (!createdBlock) {
          console.log(`⚠️ Pet ${pet.petCode} has no PET_CREATED block`);
          continue;
        }

        const discrepancies = [];

        // Debug logging
        console.log(`🔍 Checking pet ${pet.petCode}:`, {
          blockchainFee: createdBlock.data.adoptionFee,
          mongoFee: pet.adoptionFee,
          blockchainFeeType: typeof createdBlock.data.adoptionFee,
          mongoFeeType: typeof pet.adoptionFee,
          areEqual: createdBlock.data.adoptionFee === pet.adoptionFee,
          blockData: createdBlock.data
        });

        // Check adoptionFee tampering (convert both to numbers for comparison)
        const blockchainFee = Number(createdBlock.data.adoptionFee);
        const mongoFee = Number(pet.adoptionFee);
        
        if (!isNaN(blockchainFee) && !isNaN(mongoFee) && blockchainFee !== mongoFee) {
          const feeChangeEvent = petBlocks.find(b => b.eventType === 'PET_ADOPTIONFEE_CHANGED' || b.eventType === 'PET_FEE_CHANGED');

          if (!feeChangeEvent) {
            discrepancies.push({
              field: 'adoptionFee',
              blockchainValue: blockchainFee,
              currentValue: mongoFee,
              difference: blockchainFee - mongoFee,
              missingEvent: 'PET_FEE_CHANGED',
              severity: 'high'
            });
            console.log(`🚨 TAMPERING DETECTED for ${pet.petCode}: Fee changed from ${blockchainFee} to ${mongoFee}`);
          }
        }

        // Check breed tampering
        if (createdBlock.data.breed && createdBlock.data.breed !== pet.breed) {
          const breedChangeEvent = petBlocks.find(b => b.eventType === 'PET_BREED_CHANGED');
          if (!breedChangeEvent) {
            discrepancies.push({
              field: 'breed',
              blockchainValue: createdBlock.data.breed,
              currentValue: pet.breed,
              missingEvent: 'PET_BREED_CHANGED',
              severity: 'medium'
            });
          }
        }

        // Check payment discrepancy
        if (paymentBlock && createdBlock.data.adoptionFee !== undefined) {
          const paidAmount = paymentBlock.data.amount || 0;
          const originalFee = createdBlock.data.adoptionFee || 0;

          if (paidAmount !== originalFee) {
            discrepancies.push({
              field: 'payment',
              blockchainValue: originalFee,
              currentValue: paidAmount,
              difference: originalFee - paidAmount,
              missingEvent: 'FEE_MISMATCH',
              severity: 'critical',
              description: `User paid $${paidAmount} but original fee was $${originalFee}`
            });
          }
        }

        if (discrepancies.length > 0) {
          tamperingResults.push({
            petId: pet._id,
            petCode: pet.petCode,
            petName: pet.name,
            breed: pet.breed,
            species: pet.species,
            status: pet.status,
            discrepancies,
            blockCount: petBlocks.length,
            createdBlock: {
              index: createdBlock.index,
              timestamp: createdBlock.timestamp,
              data: createdBlock.data
            },
            paymentBlock: paymentBlock ? {
              index: paymentBlock.index,
              timestamp: paymentBlock.timestamp,
              data: paymentBlock.data
            } : null
          });
        }
      }

      return {
        totalPetsChecked: Object.keys(petBlocksMap).length,
        tamperedPets: tamperingResults.length,
        tamperingResults,
        checkedAt: new Date()
      };
    } catch (err) {
      console.error('Tampering detection error:', err);
      throw err;
    }
  }
}

module.exports = BlockchainService;

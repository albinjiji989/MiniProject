const mongoose = require('mongoose');
const BlockchainBlock = require('../models/BlockchainBlock');
const BlockchainService = require('../services/blockchainService');

// ═══════════════════════════════════════════════════════════════════════
// BLOCKCHAIN TAMPER DETECTION TEST SUITE
// Research Demo: "Lightweight Blockchain-Based Audit Trail for
//                 Transparent Pet Adoption Systems"
//
// This test suite proves that the blockchain detects ALL 5 attack types:
//   1. Data Tampering        → Hash mismatch
//   2. Hash Tampering        → Hash recalculation fails + chain breaks
//   3. Chain Linkage Break   → previousHash mismatch
//   4. Merkle Root Tampering → Merkle root recalculation fails
//   5. Proof-of-Work Bypass  → Difficulty requirement not met
// ═══════════════════════════════════════════════════════════════════════

describe('Blockchain Tamper Detection', () => {
  const testPetId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_blockchain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await BlockchainBlock.deleteMany({});
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────
  // SETUP: Build a valid 4-block chain before each test group
  // ─────────────────────────────────────────────────────────
  async function buildValidChain() {
    await BlockchainBlock.deleteMany({});

    const events = [
      { eventType: 'PET_CREATED', data: { name: 'Buddy', breed: 'Golden Retriever', age: 2 } },
      { eventType: 'APPLICATION_SUBMITTED', data: { applicantName: 'John Doe', reason: 'Love dogs' } },
      { eventType: 'APPLICATION_APPROVED', data: { approvedBy: 'Admin', status: 'approved' } },
      { eventType: 'ADOPTION_COMPLETED', data: { adoptedBy: 'John Doe', date: '2026-03-05' } },
    ];

    for (const event of events) {
      await BlockchainService.addBlock({
        eventType: event.eventType,
        petId: testPetId,
        userId: testUserId,
        data: event.data,
      });
    }
  }

  // ═══════════════════════════════════
  // TEST GROUP 1: Valid Chain Baseline
  // ═══════════════════════════════════
  describe('Baseline: Valid chain passes all checks', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should have exactly 4 blocks in the chain', async () => {
      const blocks = await BlockchainBlock.find().sort({ index: 1 });
      expect(blocks.length).toBe(4);
    });

    it('should verify chain as VALID (no tampering)', async () => {
      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(true);
    });

    it('should return detailed verification with zero errors', async () => {
      const result = await BlockchainService.verifyChainDetailed();
      expect(result.valid).toBe(true);
      expect(result.corruptedBlocks).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('every block hash should start with leading zeros (PoW)', async () => {
      const blocks = await BlockchainBlock.find().sort({ index: 1 });
      const target = '0'.repeat(BlockchainService.DIFFICULTY);
      blocks.forEach(block => {
        expect(block.hash.startsWith(target)).toBe(true);
      });
    });

    it('every block should link to the previous block hash', async () => {
      const blocks = await BlockchainBlock.find().sort({ index: 1 });
      expect(blocks[0].previousHash).toBe('0'); // Genesis block
      for (let i = 1; i < blocks.length; i++) {
        expect(blocks[i].previousHash).toBe(blocks[i - 1].hash);
      }
    });
  });

  // ═══════════════════════════════════════════
  // TEST GROUP 2: Attack 1 — DATA TAMPERING
  // Scenario: Attacker changes pet data in DB
  // ═══════════════════════════════════════════
  describe('Attack 1: Data Tampering', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect when block data is modified', async () => {
      // Tamper: Change pet name from "Buddy" to "STOLEN_PET"
      const result = await BlockchainService.tamperBlockData(0, {
        name: 'STOLEN_PET',
        breed: 'Unknown',
        age: 5,
      });
      expect(result.attack).toBe('DATA_TAMPERING');
      expect(result.originalData.name).toBe('Buddy');

      // Verify: Chain should now be INVALID
      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(false);
    });

    it('should report HASH_MISMATCH in detailed verification', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);
      expect(detail.corruptedBlocks).toBeGreaterThanOrEqual(1);

      // Block 0 should have hash mismatch error
      const block0Errors = detail.errors.find(e => e.blockIndex === 0);
      expect(block0Errors).toBeDefined();
      const hashError = block0Errors.errors.find(e => e.type === 'HASH_MISMATCH');
      expect(hashError).toBeDefined();
      expect(hashError.message).toContain('recalculated hash');
    });

    it('should repair and restore chain validity after tampering', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);

      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // TEST GROUP 3: Attack 2 — HASH TAMPERING
  // Scenario: Attacker replaces a block's hash
  // ═══════════════════════════════════════════
  describe('Attack 2: Hash Tampering', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect when a block hash is replaced', async () => {
      const result = await BlockchainService.tamperBlockHash(1);
      expect(result.attack).toBe('HASH_TAMPERING');
      expect(result.tamperedHash).not.toBe(result.originalHash);

      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(false);
    });

    it('should report HASH_MISMATCH in detailed verification', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);

      // Block 1 should show hash mismatch
      const block1Errors = detail.errors.find(e => e.blockIndex === 1);
      expect(block1Errors).toBeDefined();
      expect(block1Errors.errors.some(e => e.type === 'HASH_MISMATCH')).toBe(true);
    });

    it('should also break chain linkage of next block', async () => {
      const detail = await BlockchainService.verifyChainDetailed();

      // Block 2 should show broken chain (its previousHash doesn't match block 1's new hash)
      const block2Errors = detail.errors.find(e => e.blockIndex === 2);
      expect(block2Errors).toBeDefined();
      expect(block2Errors.errors.some(e => e.type === 'CHAIN_BROKEN')).toBe(true);
    });

    it('should repair chain after hash tampering', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // TEST GROUP 4: Attack 3 — CHAIN LINKAGE BREAK
  // Scenario: Attacker modifies previousHash field
  // ═══════════════════════════════════════════════
  describe('Attack 3: Chain Linkage Break', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect when previousHash is modified', async () => {
      const result = await BlockchainService.tamperChainLink(2);
      expect(result.attack).toBe('CHAIN_LINKAGE_BREAK');

      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(false);
    });

    it('should report both HASH_MISMATCH and CHAIN_BROKEN', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);

      const block2Errors = detail.errors.find(e => e.blockIndex === 2);
      expect(block2Errors).toBeDefined();

      // previousHash changed → hash recalculation also changes → both errors
      expect(block2Errors.errors.some(e => e.type === 'HASH_MISMATCH')).toBe(true);
      expect(block2Errors.errors.some(e => e.type === 'CHAIN_BROKEN')).toBe(true);
    });

    it('should not allow tampering genesis block link', async () => {
      await expect(BlockchainService.tamperChainLink(0))
        .rejects.toThrow('Cannot break link on genesis block');
    });

    it('should repair chain after linkage tampering', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);
    });
  });

  // ════════════════════════════════════════════════
  // TEST GROUP 5: Attack 4 — MERKLE ROOT TAMPERING
  // Scenario: Attacker alters merkle root value
  // ════════════════════════════════════════════════
  describe('Attack 4: Merkle Root Tampering', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect when merkle root is altered', async () => {
      const result = await BlockchainService.tamperMerkleRoot(1);
      expect(result.attack).toBe('MERKLE_ROOT_TAMPERING');
      expect(result.tamperedMerkleRoot).not.toBe(result.originalMerkleRoot);

      // Note: verifyChain() catches this via merkle root check
      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);
    });

    it('should report MERKLE_INVALID error type', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      const block1Errors = detail.errors.find(e => e.blockIndex === 1);
      expect(block1Errors).toBeDefined();
      expect(block1Errors.errors.some(e => e.type === 'MERKLE_INVALID')).toBe(true);
    });

    it('should repair chain after merkle tampering', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════
  // TEST GROUP 6: Attack 5 — PROOF-OF-WORK BYPASS
  // Scenario: Attacker inserts unmined block (no PoW)
  // ════════════════════════════════════════════════════
  describe('Attack 5: Proof-of-Work Bypass', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect when hash does not meet difficulty', async () => {
      const result = await BlockchainService.tamperProofOfWork(3);
      expect(result.attack).toBe('POW_BYPASS');
      expect(result.tamperedHash.startsWith('ff')).toBe(true); // starts with 'ff', not '00'

      const isValid = await BlockchainService.verifyChain();
      expect(isValid).toBe(false);
    });

    it('should report POW_INVALID in detailed verification', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);

      const block3Errors = detail.errors.find(e => e.blockIndex === 3);
      expect(block3Errors).toBeDefined();
      expect(block3Errors.errors.some(e => e.type === 'POW_INVALID')).toBe(true);
    });

    it('should also report HASH_MISMATCH (hash changed)', async () => {
      const detail = await BlockchainService.verifyChainDetailed();
      const block3Errors = detail.errors.find(e => e.blockIndex === 3);
      expect(block3Errors.errors.some(e => e.type === 'HASH_MISMATCH')).toBe(true);
    });

    it('should repair chain after PoW bypass', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════
  // TEST GROUP 7: MULTI-BLOCK TAMPERING (Cascade Attack)
  // Scenario: Attacker tampers multiple blocks at once
  // ════════════════════════════════════════════════════════
  describe('Cascade Attack: Multiple blocks tampered', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('should detect tampering across multiple blocks', async () => {
      // Tamper block 0 data AND block 2 merkle root
      await BlockchainService.tamperBlockData(0, { name: 'FAKE_PET', breed: 'Fake' });
      await BlockchainService.tamperMerkleRoot(2);

      const detail = await BlockchainService.verifyChainDetailed();
      expect(detail.valid).toBe(false);
      expect(detail.corruptedBlocks).toBeGreaterThanOrEqual(2);
    });

    it('should list all corrupted blocks individually', async () => {
      const detail = await BlockchainService.verifyChainDetailed();

      const corruptedIndices = detail.errors.map(e => e.blockIndex);
      expect(corruptedIndices).toContain(0); // data tampered
      expect(corruptedIndices).toContain(2); // merkle tampered
    });

    it('should repair entire chain in one operation', async () => {
      const repair = await BlockchainService.repairChain();
      expect(repair.isValid).toBe(true);
      expect(repair.repaired).toBe(4); // all 4 blocks re-mined
    });
  });

  // ════════════════════════════════════════════════════
  // TEST GROUP 8: CRYPTOGRAPHIC PROPERTIES
  // Verify SHA-256, PoW, and Merkle tree correctness
  // ════════════════════════════════════════════════════
  describe('Cryptographic Properties', () => {
    beforeAll(async () => {
      await buildValidChain();
    });

    it('all hashes should be valid SHA-256 (64 hex chars)', async () => {
      const blocks = await BlockchainBlock.find();
      blocks.forEach(block => {
        expect(block.hash).toMatch(/^[0-9a-f]{64}$/);
      });
    });

    it('all merkle roots should be valid SHA-256', async () => {
      const blocks = await BlockchainBlock.find();
      blocks.forEach(block => {
        if (block.merkleRoot) {
          expect(block.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
        }
      });
    });

    it('changing even 1 character of data should produce completely different hash', async () => {
      const block = await BlockchainBlock.findOne({ index: 0 });

      const hash1 = BlockchainService.calculateHash({
        index: block.index, timestamp: block.timestamp,
        eventType: block.eventType, petId: block.petId,
        userId: block.userId, data: { name: 'Buddy' },
        previousHash: block.previousHash, nonce: block.nonce,
      });

      const hash2 = BlockchainService.calculateHash({
        index: block.index, timestamp: block.timestamp,
        eventType: block.eventType, petId: block.petId,
        userId: block.userId, data: { name: 'Buddi' }, // 1 char different!
        previousHash: block.previousHash, nonce: block.nonce,
      });

      expect(hash1).not.toBe(hash2);
      // Avalanche effect: hashes should be completely different
      let diffCount = 0;
      for (let i = 0; i < 64; i++) {
        if (hash1[i] !== hash2[i]) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(20); // At least ~30% chars differ
    });

    it('nonce should be greater than 0 (proof mining happened)', async () => {
      const blocks = await BlockchainBlock.find();
      blocks.forEach(block => {
        expect(block.nonce).toBeGreaterThan(0);
      });
    });
  });
});

const request = require('supertest');
const app = require('../../server');
const mongoose = require('mongoose');
const BlockchainBlock = require('../models/BlockchainBlock');

describe('Blockchain Adoption API', () => {
  let petId;

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_blockchain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Create a test block
    const block = await BlockchainBlock.create({
      index: 0,
      timestamp: new Date(),
      eventType: 'pet_created',
      petId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      data: { name: 'Test Pet' },
      previousHash: '0',
      hash: 'testhash',
    });
    petId = block.petId;
  });

  afterAll(async () => {
    await BlockchainBlock.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return blockchain history for a pet', async () => {
    const res = await request(app).get(`/api/blockchain/pet/${petId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should verify blockchain chain', async () => {
    const res = await request(app).get('/api/blockchain/verify');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.valid).toBe('boolean');
  });
});

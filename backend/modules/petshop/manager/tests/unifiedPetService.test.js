const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
const PetStock = require('../models/PetStock');
const PetBatch = require('../models/PetBatch');
const PetInventoryItem = require('../models/PetInventoryItem');

let mongo; 

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await PetStock.deleteMany({});
  await PetBatch.deleteMany({});
  await PetInventoryItem.deleteMany({});
});

test('generatePetsFromStock creates batch and links pets', async () => {
  const stock = new PetStock({
    name: 'Test Stock',
    speciesId: new mongoose.Types.ObjectId(),
    breedId: new mongoose.Types.ObjectId(),
    age: 3,
    ageUnit: 'months',
    maleCount: 2,
    femaleCount: 1,
    price: 1000,
    storeId: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId()
  });
  await stock.save();

  const user = { id: stock.createdBy, storeId: stock.storeId };

  const result = await UnifiedPetService.generatePetsFromStock(stock._id, 2, 1, user);

  expect(result).toHaveProperty('generatedPets');
  expect(Array.isArray(result.generatedPets)).toBe(true);
  expect(result.generatedPets.length).toBe(3);

  // Verify batch returned
  expect(result).toHaveProperty('batch');
  const batch = await PetBatch.findById(result.batch._id);
  expect(batch).not.toBeNull();
  expect(batch.counts.total).toBe(3);
  expect(batch.counts.male).toBe(2);
  expect(batch.counts.female).toBe(1);

  // Verify pets have batchId set
  const pets = await PetInventoryItem.find({ _id: { $in: result.generatedPets.map(p => p._id) } });
  expect(pets.length).toBe(3);
  pets.forEach(p => {
    expect(p.batchId.toString()).toBe(batch._id.toString());
  });

  // Verify stock updated
  const updatedStock = await PetStock.findById(stock._id);
  expect(updatedStock.maleCount).toBe(0);
  expect(updatedStock.femaleCount).toBe(0);
});
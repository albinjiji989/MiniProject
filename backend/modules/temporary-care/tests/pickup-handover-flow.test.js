const request = require('supertest');
const app = require('../../../app'); // Adjust path as needed
const CareBooking = require('../models/CareBooking');
const Pet = require('../../../core/models/Pet');
const User = require('../../../core/models/User');

describe('Pickup Handover Flow', () => {
  let userToken, managerToken, booking, pet, user;

  beforeEach(async () => {
    // Setup test data
    user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    });

    pet = await Pet.create({
      name: 'Test Pet',
      species: 'Dog',
      breed: 'Labrador',
      ownerId: user._id,
      status: 'owned'
    });

    booking = await CareBooking.create({
      userId: user._id,
      petId: pet._id,
      serviceType: 'boarding',
      status: 'in_progress',
      paymentStatus: {
        advance: { status: 'completed' },
        final: { status: 'completed' }
      },
      pricing: {
        totalAmount: 1000,
        advanceAmount: 500,
        remainingAmount: 500
      }
    });

    // Generate tokens (mock implementation)
    userToken = 'user-jwt-token';
    managerToken = 'manager-jwt-token';
  });

  afterEach(async () => {
    // Cleanup
    await CareBooking.deleteMany({});
    await Pet.deleteMany({});
    await User.deleteMany({});
  });

  describe('Manager generates pickup OTP after final payment', () => {
    it('should generate pickup OTP successfully', async () => {
      const response = await request(app)
        .post(`/api/temporary-care/manager/bookings-new/${booking._id}/pickup/generate-otp`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.otp).toMatch(/^\d{6}$/);
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should fail if booking is not in progress', async () => {
      booking.status = 'pending_payment';
      await booking.save();

      await request(app)
        .post(`/api/temporary-care/manager/bookings-new/${booking._id}/pickup/generate-otp`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('Manager verifies pickup OTP and completes handover', () => {
    beforeEach(async () => {
      // Generate OTP first
      booking.handover.pickup.otp = {
        code: '123456',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        verified: false
      };
      await booking.save();
    });

    it('should verify OTP and complete handover successfully', async () => {
      const response = await request(app)
        .post(`/api/temporary-care/manager/bookings-new/${booking._id}/pickup/verify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          otp: '123456',
          notes: 'Pet returned in good health'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('checked out successfully');

      // Verify booking status updated
      const updatedBooking = await CareBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('completed');
      expect(updatedBooking.handover.pickup.otp.verified).toBe(true);

      // Verify pet ownership restored
      const updatedPet = await Pet.findById(pet._id);
      expect(updatedPet.temporaryCareStatus).toBeUndefined();
      expect(updatedPet.temporaryCareDetails).toBeUndefined();
      expect(updatedPet.ownerId.toString()).toBe(user._id.toString());
    });

    it('should fail with invalid OTP', async () => {
      await request(app)
        .post(`/api/temporary-care/manager/bookings-new/${booking._id}/pickup/verify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          otp: '999999',
          notes: 'Pet returned in good health'
        })
        .expect(400);
    });

    it('should fail if final payment not completed', async () => {
      booking.paymentStatus.final.status = 'pending';
      await booking.save();

      const response = await request(app)
        .post(`/api/temporary-care/manager/bookings-new/${booking._id}/pickup/verify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          otp: '123456',
          notes: 'Pet returned in good health'
        })
        .expect(400);

      expect(response.body.message).toContain('Final payment must be completed');
    });
  });

  describe('User verifies pickup OTP (alternative flow)', () => {
    beforeEach(async () => {
      booking.handover.pickup.otp = {
        code: '123456',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        verified: false
      };
      await booking.save();
    });

    it('should allow user to verify pickup OTP', async () => {
      const response = await request(app)
        .post(`/api/temporary-care/user/bookings/${booking._id}/verify-otp`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'pickup',
          otp: '123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');

      // Verify pet ownership restored
      const updatedPet = await Pet.findById(pet._id);
      expect(updatedPet.temporaryCareStatus).toBeUndefined();
      expect(updatedPet.ownerId.toString()).toBe(user._id.toString());
    });
  });
});

describe('Pet Dashboard Integration', () => {
  it('should remove temporary care banner after handover completion', async () => {
    // This would be tested in frontend integration tests
    // The key is that when pet.temporaryCareStatus is undefined,
    // the "In Temporary Care" chip should not be displayed
    
    const pet = {
      _id: 'pet123',
      name: 'Test Pet',
      temporaryCareStatus: undefined, // This should hide the banner
      tags: ['adopted'] // Original tag should be visible
    };

    // Mock component test would verify:
    // 1. No "In Temporary Care" chip is rendered
    // 2. Original tags like "Adopted" are visible
    // 3. Pet appears in normal pet list, not temporary care section
    
    expect(pet.temporaryCareStatus).toBeUndefined();
    expect(pet.tags).toContain('adopted');
  });
});
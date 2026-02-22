/**
 * Test data generators
 */

export class TestDataGenerator {
  /**
   * Generate random user data
   */
  static generateUser() {
    const timestamp = Date.now();
    return {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'Test@123456',
      phone: `98765${String(timestamp).slice(-5)}`,
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456',
        country: 'India'
      }
    };
  }

  /**
   * Generate product data
   */
  static generateProduct() {
    const timestamp = Date.now();
    return {
      name: `Test Product ${timestamp}`,
      description: 'This is a test product for automated testing',
      price: Math.floor(Math.random() * 1000) + 100,
      category: 'Dog Food',
      stock: Math.floor(Math.random() * 100) + 10,
      sku: `SKU${timestamp}`,
      brand: 'Test Brand',
      weight: '1kg',
      petType: 'Dog',
      isActive: true,
      isFeatured: false,
    };
  }

  /**
   * Generate pet data
   */
  static generatePet() {
    const timestamp = Date.now();
    const species = ['Dog', 'Cat', 'Bird', 'Rabbit'];
    const breeds = {
      Dog: ['Golden Retriever', 'Labrador', 'German Shepherd'],
      Cat: ['Persian', 'Siamese', 'Maine Coon'],
      Bird: ['Parrot', 'Cockatiel', 'Budgie'],
      Rabbit: ['Dutch', 'Lionhead', 'Mini Lop']
    };
    
    const selectedSpecies = species[Math.floor(Math.random() * species.length)];
    const selectedBreed = breeds[selectedSpecies][Math.floor(Math.random() * breeds[selectedSpecies].length)];

    return {
      name: `Test Pet ${timestamp}`,
      species: selectedSpecies,
      breed: selectedBreed,
      age: Math.floor(Math.random() * 10) + 1,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      color: 'Brown',
      weight: Math.floor(Math.random() * 20) + 5,
      description: 'Test pet for automated testing',
    };
  }

  /**
   * Generate booking data
   */
  static generateBooking(petId, serviceTypeId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2); // 2 days from now
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5); // 5 days duration

    return {
      petId,
      serviceTypeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      locationType: 'facility',
      specialRequirements: 'Test booking - automated test',
    };
  }

  /**
   * Generate temporary care application data
   */
  static generateApplication(petIds, centerId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 3);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    return {
      pets: petIds.map(petId => ({
        petId,
        specialRequirements: 'Test requirements'
      })),
      centerId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '9876543210',
        relationship: 'Friend'
      }
    };
  }

  /**
   * Generate review data
   */
  static generateReview(productId) {
    const ratings = [1, 2, 3, 4, 5];
    const comments = [
      'Great product! Highly recommended.',
      'Good quality, my pet loves it.',
      'Average product, nothing special.',
      'Not satisfied with the quality.',
      'Excellent! Will buy again.'
    ];

    return {
      productId,
      rating: ratings[Math.floor(Math.random() * ratings.length)],
      comment: comments[Math.floor(Math.random() * comments.length)],
      title: 'Test Review',
    };
  }

  /**
   * Generate address data
   */
  static generateAddress() {
    return {
      fullName: 'Test User',
      phone: '9876543210',
      addressLine1: '123 Test Street',
      addressLine2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      addressType: 'home',
      isDefault: true,
    };
  }

  /**
   * Generate order data
   */
  static generateOrder(items, addressId) {
    return {
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity || 1,
        price: item.price
      })),
      shippingAddressId: addressId,
      paymentMethod: 'razorpay',
      couponCode: null,
    };
  }

  /**
   * Generate caregiver data
   */
  static generateCaregiver() {
    const timestamp = Date.now();
    return {
      name: `Test Caregiver ${timestamp}`,
      email: `caregiver${timestamp}@example.com`,
      phone: `98765${String(timestamp).slice(-5)}`,
      specialization: ['Dog Care', 'Cat Care'],
      experience: Math.floor(Math.random() * 10) + 1,
      isActive: true,
    };
  }

  /**
   * Generate care activity data
   */
  static generateCareActivity(temporaryCareId) {
    const activityTypes = ['feeding', 'bathing', 'walking', 'medication', 'playtime', 'health_check'];
    
    return {
      temporaryCareId,
      activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      notes: 'Test activity logged by automated test',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate random OTP
   */
  static generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Generate payment data
   */
  static generatePaymentData(amount) {
    return {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
  }
}

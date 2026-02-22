/**
 * Page Object Model for Temporary Care Module
 */

export class TemporaryCarePage {
  constructor(page) {
    this.page = page;
  }

  // Navigation
  async navigateToHome() {
    await this.page.goto('/temporary-care');
  }

  async navigateToBrowseFacilities() {
    await this.page.goto('/user/temporary-care/facilities');
  }

  async navigateToMyBookings() {
    await this.page.goto('/user/temporary-care/bookings');
  }

  async navigateToMyApplications() {
    await this.page.goto('/user/temporary-care/applications');
  }

  // Browse Facilities
  async getFacilities() {
    return await this.page.locator('[data-testid="facility-card"]').all();
  }

  async viewFacilityDetails(index = 0) {
    const facilities = await this.getFacilities();
    await facilities[index].click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterFacilitiesByLocation(city) {
    await this.page.fill('input[name="location"]', city);
    await this.page.click('button:has-text("Search")');
    await this.page.waitForLoadState('networkidle');
  }

  // Booking Flow
  async startBooking() {
    await this.page.click('button:has-text("Book Now")');
    await this.page.waitForLoadState('networkidle');
  }

  async selectPet(petName) {
    await this.page.click(`text="${petName}"`);
  }

  async selectServiceType(serviceType) {
    await this.page.click(`text="${serviceType}"`);
  }

  async selectDates(startDate, endDate) {
    await this.page.fill('input[name="startDate"]', startDate);
    await this.page.fill('input[name="endDate"]', endDate);
  }

  async calculatePrice() {
    await this.page.click('button:has-text("Calculate Price")');
    await this.page.waitForTimeout(1000);
  }

  async getEstimatedPrice() {
    const priceText = await this.page.locator('[data-testid="estimated-price"]').textContent();
    return parseFloat(priceText.replace(/[^0-9.]/g, ''));
  }

  async confirmBooking() {
    await this.page.click('button:has-text("Confirm Booking")');
    await this.page.waitForLoadState('networkidle');
  }

  // Application Flow (Multi-Pet)
  async startApplication() {
    await this.page.click('button:has-text("Submit Application")');
    await this.page.waitForLoadState('networkidle');
  }

  async selectMultiplePets(petNames) {
    for (const petName of petNames) {
      await this.page.click(`input[type="checkbox"][value="${petName}"]`);
    }
  }

  async selectFacility(facilityName) {
    await this.page.click(`text="${facilityName}"`);
  }

  async fillEmergencyContact(contactData) {
    await this.page.fill('input[name="emergencyContactName"]', contactData.name);
    await this.page.fill('input[name="emergencyContactPhone"]', contactData.phone);
    await this.page.fill('input[name="emergencyContactRelationship"]', contactData.relationship);
  }

  async submitApplication() {
    await this.page.click('button:has-text("Submit Application")');
    await this.page.waitForLoadState('networkidle');
  }

  // Booking Management
  async getBookings() {
    return await this.page.locator('[data-testid="booking-item"]').all();
  }

  async viewBookingDetails(bookingId) {
    await this.page.goto(`/user/temporary-care/bookings/${bookingId}`);
  }

  async cancelBooking(reason) {
    await this.page.click('button:has-text("Cancel Booking")');
    await this.page.fill('textarea[name="reason"]', reason);
    await this.page.click('button:has-text("Confirm Cancellation")');
    await this.page.waitForTimeout(1000);
  }

  // Application Management
  async getApplications() {
    return await this.page.locator('[data-testid="application-item"]').all();
  }

  async viewApplicationDetails(applicationId) {
    await this.page.goto(`/user/temporary-care/applications/${applicationId}`);
  }

  async approvePricing() {
    await this.page.click('button:has-text("Approve Pricing")');
    await this.page.click('button:has-text("Confirm")');
    await this.page.waitForTimeout(1000);
  }

  async rejectPricing(reason) {
    await this.page.click('button:has-text("Reject Pricing")');
    await this.page.fill('textarea[name="reason"]', reason);
    await this.page.click('button:has-text("Submit")');
    await this.page.waitForTimeout(1000);
  }

  // Payment
  async makeAdvancePayment() {
    await this.page.click('button:has-text("Pay Advance")');
    await this.page.waitForLoadState('networkidle');
  }

  async makeFinalPayment() {
    await this.page.click('button:has-text("Pay Final Amount")');
    await this.page.waitForLoadState('networkidle');
  }

  async completeRazorpayPayment() {
    // Wait for Razorpay modal
    await this.page.waitForSelector('.razorpay-container', { timeout: 10000 });
    
    // In test mode, Razorpay provides test cards
    // This is a simplified version - actual implementation depends on test environment
    await this.page.fill('input[name="card[number]"]', '4111111111111111');
    await this.page.fill('input[name="card[expiry]"]', '12/25');
    await this.page.fill('input[name="card[cvv]"]', '123');
    await this.page.click('button:has-text("Pay")');
    
    await this.page.waitForLoadState('networkidle');
  }

  async getPaymentHistory() {
    return await this.page.locator('[data-testid="payment-item"]').all();
  }

  // OTP Verification
  async enterOTP(otp) {
    const otpDigits = otp.split('');
    for (let i = 0; i < otpDigits.length; i++) {
      await this.page.fill(`input[name="otp-${i}"]`, otpDigits[i]);
    }
  }

  async verifyOTP() {
    await this.page.click('button:has-text("Verify OTP")');
    await this.page.waitForTimeout(1000);
  }

  async verifyDropOffOTP(otp) {
    await this.enterOTP(otp);
    await this.verifyOTP();
  }

  async verifyPickupOTP(otp) {
    await this.enterOTP(otp);
    await this.verifyOTP();
  }

  // Care Activities
  async viewCareActivities() {
    await this.page.click('button:has-text("View Activities")');
    await this.page.waitForLoadState('networkidle');
  }

  async getCareActivities() {
    return await this.page.locator('[data-testid="activity-item"]').all();
  }

  async viewActivityDetails(index = 0) {
    const activities = await this.getCareActivities();
    await activities[index].click();
  }

  // Reviews & Feedback
  async submitReview(reviewData) {
    await this.page.click('button:has-text("Submit Review")');
    
    // Overall rating
    await this.page.click(`[data-rating="${reviewData.overall}"]`);
    
    // Service rating
    if (reviewData.service) {
      await this.page.click(`[data-service-rating="${reviewData.service}"]`);
    }
    
    // Staff rating
    if (reviewData.staff) {
      await this.page.click(`[data-staff-rating="${reviewData.staff}"]`);
    }
    
    // Facility rating
    if (reviewData.facility) {
      await this.page.click(`[data-facility-rating="${reviewData.facility}"]`);
    }
    
    // Comment
    await this.page.fill('textarea[name="comment"]', reviewData.comment);
    
    // Would recommend
    if (reviewData.wouldRecommend) {
      await this.page.click('input[name="wouldRecommend"]');
    }
    
    await this.page.click('button:has-text("Submit Review")');
    await this.page.waitForTimeout(1000);
  }

  // Timeline
  async viewBookingTimeline() {
    await this.page.click('button:has-text("View Timeline")');
    await this.page.waitForLoadState('networkidle');
  }

  async getTimelineEvents() {
    return await this.page.locator('[data-testid="timeline-event"]').all();
  }

  // Assertions
  async expectBookingCreated() {
    await this.page.waitForSelector('text="Booking Created Successfully"');
  }

  async expectApplicationSubmitted() {
    await this.page.waitForSelector('text="Application Submitted"');
  }

  async expectPaymentSuccess() {
    await this.page.waitForSelector('text="Payment Successful"');
  }

  async expectOTPVerified() {
    await this.page.waitForSelector('text="OTP Verified"');
  }
}

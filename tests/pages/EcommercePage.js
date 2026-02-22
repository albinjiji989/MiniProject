/**
 * Page Object Model for Ecommerce Module
 */

export class EcommercePage {
  constructor(page) {
    this.page = page;
  }

  // Navigation
  async navigateToHome() {
    await this.page.goto('/ecommerce');
  }

  async navigateToProducts() {
    await this.page.goto('/ecommerce/products');
  }

  async navigateToCart() {
    await this.page.goto('/ecommerce/cart');
  }

  async navigateToCheckout() {
    await this.page.goto('/ecommerce/checkout');
  }

  async navigateToOrders() {
    await this.page.goto('/user/orders');
  }

  // Product Browsing
  async searchProduct(query) {
    await this.page.fill('input[placeholder*="Search"]', query);
    await this.page.press('input[placeholder*="Search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category) {
    await this.page.click(`text="${category}"`);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByPriceRange(min, max) {
    await this.page.fill('input[name="minPrice"]', String(min));
    await this.page.fill('input[name="maxPrice"]', String(max));
    await this.page.click('button:has-text("Apply")');
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(option) {
    await this.page.selectOption('select[name="sort"]', option);
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCards() {
    return await this.page.locator('[data-testid="product-card"]').all();
  }

  async clickProduct(index = 0) {
    const products = await this.getProductCards();
    await products[index].click();
    await this.page.waitForLoadState('networkidle');
  }

  // Product Details
  async getProductName() {
    return await this.page.locator('[data-testid="product-name"]').textContent();
  }

  async getProductPrice() {
    const priceText = await this.page.locator('[data-testid="product-price"]').textContent();
    return parseFloat(priceText.replace(/[^0-9.]/g, ''));
  }

  async getProductRating() {
    return await this.page.locator('[data-testid="product-rating"]').textContent();
  }

  async selectQuantity(quantity) {
    await this.page.selectOption('select[name="quantity"]', String(quantity));
  }

  // Cart Operations
  async addToCart() {
    await this.page.click('button:has-text("Add to Cart")');
    await this.page.waitForTimeout(1000); // Wait for cart update
  }

  async getCartItemCount() {
    const badge = await this.page.locator('[data-testid="cart-badge"]').textContent();
    return parseInt(badge) || 0;
  }

  async updateCartItemQuantity(itemIndex, quantity) {
    const items = await this.page.locator('[data-testid="cart-item"]').all();
    await items[itemIndex].locator('input[name="quantity"]').fill(String(quantity));
    await this.page.click('button:has-text("Update")');
    await this.page.waitForTimeout(1000);
  }

  async removeCartItem(itemIndex) {
    const items = await this.page.locator('[data-testid="cart-item"]').all();
    await items[itemIndex].locator('button:has-text("Remove")').click();
    await this.page.waitForTimeout(1000);
  }

  async clearCart() {
    await this.page.click('button:has-text("Clear Cart")');
    await this.page.click('button:has-text("Confirm")'); // Confirmation dialog
    await this.page.waitForTimeout(1000);
  }

  async getCartTotal() {
    const totalText = await this.page.locator('[data-testid="cart-total"]').textContent();
    return parseFloat(totalText.replace(/[^0-9.]/g, ''));
  }

  // Wishlist Operations
  async addToWishlist() {
    await this.page.click('button[aria-label="Add to Wishlist"]');
    await this.page.waitForTimeout(1000);
  }

  async navigateToWishlist() {
    await this.page.goto('/user/wishlist');
  }

  async removeFromWishlist(itemIndex) {
    const items = await this.page.locator('[data-testid="wishlist-item"]').all();
    await items[itemIndex].locator('button:has-text("Remove")').click();
    await this.page.waitForTimeout(1000);
  }

  // Checkout Process
  async proceedToCheckout() {
    await this.page.click('button:has-text("Proceed to Checkout")');
    await this.page.waitForLoadState('networkidle');
  }

  async selectShippingAddress(addressIndex = 0) {
    const addresses = await this.page.locator('[data-testid="address-option"]').all();
    await addresses[addressIndex].click();
  }

  async addNewAddress(addressData) {
    await this.page.click('button:has-text("Add New Address")');
    await this.page.fill('input[name="fullName"]', addressData.fullName);
    await this.page.fill('input[name="phone"]', addressData.phone);
    await this.page.fill('input[name="addressLine1"]', addressData.addressLine1);
    await this.page.fill('input[name="city"]', addressData.city);
    await this.page.fill('input[name="state"]', addressData.state);
    await this.page.fill('input[name="pincode"]', addressData.pincode);
    await this.page.click('button:has-text("Save Address")');
    await this.page.waitForTimeout(1000);
  }

  async selectPaymentMethod(method) {
    await this.page.click(`input[value="${method}"]`);
  }

  async placeOrder() {
    await this.page.click('button:has-text("Place Order")');
    await this.page.waitForLoadState('networkidle');
  }

  async placeOrderCOD() {
    await this.selectPaymentMethod('cod');
    await this.placeOrder();
  }

  // Reviews
  async writeReview(rating, comment) {
    await this.page.click('button:has-text("Write Review")');
    await this.page.click(`[data-rating="${rating}"]`);
    await this.page.fill('textarea[name="comment"]', comment);
    await this.page.click('button:has-text("Submit Review")');
    await this.page.waitForTimeout(1000);
  }

  async getReviews() {
    return await this.page.locator('[data-testid="review-item"]').all();
  }

  // AI Recommendations
  async navigateToRecommendations() {
    await this.page.goto('/ecommerce/recommendations');
  }

  async getRecommendations() {
    return await this.page.locator('[data-testid="recommendation-item"]').all();
  }

  async viewRecommendationExplanation(index = 0) {
    const recommendations = await this.getRecommendations();
    await recommendations[index].locator('button:has-text("Why")').click();
    await this.page.waitForTimeout(500);
  }

  // Orders
  async viewOrderDetails(orderId) {
    await this.page.goto(`/user/orders/${orderId}`);
  }

  async cancelOrder(orderId) {
    await this.viewOrderDetails(orderId);
    await this.page.click('button:has-text("Cancel Order")');
    await this.page.click('button:has-text("Confirm")');
    await this.page.waitForTimeout(1000);
  }

  // Assertions
  async expectProductInCart(productName) {
    await this.page.waitForSelector(`text="${productName}"`);
  }

  async expectCartEmpty() {
    await this.page.waitForSelector('text="Your cart is empty"');
  }

  async expectOrderSuccess() {
    await this.page.waitForSelector('text="Order Placed Successfully"');
  }
}

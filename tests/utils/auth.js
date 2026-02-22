/**
 * Authentication utilities for Playwright tests
 */

export class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Login as a regular user
   */
  async loginAsUser(email = 'albinjiji17@gmail.com', password = 'Albin@123') {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Fill email - Material-UI TextField with label
    await this.page.fill('input[type="email"]', email);
    
    // Fill password
    await this.page.fill('input[type="password"]', password);
    
    // Click submit button
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await this.page.waitForURL(/\/dashboard|\/user|\/User/, { timeout: 15000 });
    
    // Store auth token
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return token;
  }

  /**
   * Login as ecommerce manager
   */
  async loginAsEcommerceManager(email = 'albinjiji005@gmail.com', password = 'Albin@123') {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Fill email
    await this.page.fill('input[type="email"]', email);
    
    // Fill password
    await this.page.fill('input[type="password"]', password);
    
    // Click submit button
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL(/\/manager/, { timeout: 15000 });
    
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return token;
  }

  /**
   * Login as temporary care manager
   */
  async loginAsTemporaryCareManager(email = 'albinjiji003@gmail.com', password = 'Albin@123') {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Fill email
    await this.page.fill('input[type="email"]', email);
    
    // Fill password
    await this.page.fill('input[type="password"]', password);
    
    // Click submit button
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL(/\/manager/, { timeout: 15000 });
    
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return token;
  }

  /**
   * Login as admin
   */
  async loginAsAdmin(email = 'admin@example.com', password = 'Admin@123') {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL(/\/admin/, { timeout: 10000 });
    
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return token;
  }

  /**
   * Register new user
   */
  async registerUser(userData = {}) {
    const defaultData = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'Test@123',
      phone: '9876543210',
    };

    const data = { ...defaultData, ...userData };

    await this.page.goto('/register');
    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="email"]', data.email);
    await this.page.fill('input[name="password"]', data.password);
    await this.page.fill('input[name="phone"]', data.phone);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL(/\/dashboard|\/user/, { timeout: 10000 });
    
    return data;
  }

  /**
   * Logout current user
   */
  async logout() {
    // Try to find and click logout button
    const logoutButton = this.page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    }
    
    // Clear storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await this.page.goto('/');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return !!token;
  }

  /**
   * Get current user info from token
   */
  async getCurrentUser() {
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    if (!token) return null;

    // Decode JWT token (simple base64 decode)
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
  }
}

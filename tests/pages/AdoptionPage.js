/**
 * Page Object Model for Adoption Module
 */

export class AdoptionPage {
  constructor(page) {
    this.page = page;
  }

  // Navigation
  async navigateToAdoption() {
    await this.page.goto('/adoption');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAdoptionFromDashboard() {
    // Try to find adoption link in sidebar first
    const sidebarAdoption = this.page.locator('nav a:has-text("Adoption"), .sidebar a:has-text("Adoption")').first();
    
    if (await sidebarAdoption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sidebarAdoption.click();
    } else {
      // Try to find adoption card/button in dashboard
      const dashboardAdoption = this.page.locator('button:has-text("Adoption"), a:has-text("Adoption"), [data-testid="adoption-module"]').first();
      await dashboardAdoption.click();
    }
    
    await this.page.waitForLoadState('networkidle');
  }

  // Smart Matching
  async findProfileCompleteCard() {
    // Look for the profile complete card with various possible selectors
    const cardSelectors = [
      'text="Profile Complete! View Your Top Matches"',
      '[data-testid="profile-complete-card"]',
      '.profile-complete-card',
      'div:has-text("Profile Complete")',
      'div:has-text("View Your Top Matches")',
      'div:has-text("AI-powered recommendations")'
    ];

    for (const selector of cardSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        return element;
      }
    }
    
    throw new Error('Profile Complete card not found');
  }

  async clickViewMatches() {
    // First try to find the profile complete card
    const profileCard = await this.findProfileCompleteCard();
    
    // Look for "View Matches" button within or near the card
    const viewMatchesSelectors = [
      'button:has-text("View Matches")',
      'a:has-text("View Matches")',
      '[data-testid="view-matches-btn"]',
      'button:has-text("View Your Top Matches")',
      'button:has-text("See AI-powered recommendations")'
    ];

    for (const selector of viewMatchesSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
        await this.page.waitForLoadState('networkidle');
        return;
      }
    }

    // If specific button not found, try clicking on the card itself
    await profileCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSmartMatches() {
    // Wait for smart matches to load
    await this.page.waitForSelector('[data-testid="smart-matches"], .smart-matches, .match-results', { timeout: 15000 });
  }

  async getSmartMatches() {
    await this.waitForSmartMatches();
    
    const matchSelectors = [
      '[data-testid="match-item"]',
      '.match-item',
      '.pet-match',
      '[data-testid="pet-card"]',
      '.adoption-match'
    ];

    for (const selector of matchSelectors) {
      const matches = await this.page.locator(selector).all();
      if (matches.length > 0) {
        return matches;
      }
    }
    
    return [];
  }

  async getMatchDetails(matchIndex = 0) {
    const matches = await this.getSmartMatches();
    if (matches.length === 0) {
      throw new Error('No matches found');
    }

    const match = matches[matchIndex];
    
    const details = {
      name: await this.getTextContent(match, '[data-testid="pet-name"], .pet-name, h3, h4'),
      breed: await this.getTextContent(match, '[data-testid="pet-breed"], .pet-breed, .breed'),
      age: await this.getTextContent(match, '[data-testid="pet-age"], .pet-age, .age'),
      location: await this.getTextContent(match, '[data-testid="pet-location"], .pet-location, .location'),
      matchPercentage: await this.getTextContent(match, '[data-testid="match-percentage"], .match-percentage, .percentage'),
      description: await this.getTextContent(match, '[data-testid="pet-description"], .pet-description, .description, p')
    };

    return details;
  }

  async getTextContent(parent, selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorList) {
      try {
        const element = parent.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          return await element.textContent();
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  async clickMatchDetails(matchIndex = 0) {
    const matches = await this.getSmartMatches();
    await matches[matchIndex].click();
    await this.page.waitForLoadState('networkidle');
  }

  // AI Recommendations verification
  async verifyAIRecommendations() {
    // Check if AI-powered recommendations are displayed
    const aiIndicators = [
      'text="AI-powered"',
      'text="Smart Match"',
      'text="Recommended"',
      '[data-testid="ai-recommendation"]',
      '.ai-powered',
      '.smart-match'
    ];

    for (const indicator of aiIndicators) {
      if (await this.page.locator(indicator).isVisible({ timeout: 2000 }).catch(() => false)) {
        return true;
      }
    }
    
    return false;
  }

  async getRecommendationReason(matchIndex = 0) {
    const matches = await this.getSmartMatches();
    const match = matches[matchIndex];
    
    const reasonSelectors = [
      '[data-testid="match-reason"]',
      '.match-reason',
      '.recommendation-reason',
      '.why-matched'
    ];

    return await this.getTextContent(match, reasonSelectors);
  }

  // Profile and preferences
  async navigateToProfile() {
    await this.page.goto('/user/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async updatePreferences(preferences = {}) {
    await this.navigateToProfile();
    
    if (preferences.petType) {
      await this.page.selectOption('select[name="preferredPetType"]', preferences.petType);
    }
    
    if (preferences.size) {
      await this.page.selectOption('select[name="preferredSize"]', preferences.size);
    }
    
    if (preferences.age) {
      await this.page.selectOption('select[name="preferredAge"]', preferences.age);
    }
    
    if (preferences.activityLevel) {
      await this.page.selectOption('select[name="activityLevel"]', preferences.activityLevel);
    }
    
    await this.page.click('button:has-text("Save Preferences")');
    await this.page.waitForTimeout(2000);
  }

  // Assertions
  async expectProfileComplete() {
    await this.page.waitForSelector('text="Profile Complete"', { timeout: 10000 });
  }

  async expectSmartMatchesVisible() {
    await this.page.waitForSelector('[data-testid="smart-matches"], .smart-matches, .match-results', { timeout: 15000 });
  }

  async expectMatchesFound() {
    const matches = await this.getSmartMatches();
    if (matches.length === 0) {
      throw new Error('No smart matches found');
    }
    return matches.length;
  }

  async expectAIRecommendations() {
    const hasAI = await this.verifyAIRecommendations();
    if (!hasAI) {
      throw new Error('AI-powered recommendations not found');
    }
  }
}
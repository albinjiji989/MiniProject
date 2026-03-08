/**
 * Content-Based Pet Matching Algorithm
 * Pure Node.js implementation - NO Python dependency
 * Uses weighted feature matching based on research-backed compatibility factors
 * Algorithm: Weighted Multi-Criteria Decision Analysis (MCDA)
 */

class ContentBasedMatcher {
  constructor() {
    // Research-backed weights for compatibility factors
    this.weights = {
      living_space: 0.20,        // Home size, yard, apartment suitability
      activity_compatibility: 0.25, // Energy levels, exercise needs, work schedule
      experience_match: 0.15,    // Owner experience vs pet training needs
      family_safety: 0.20,       // Child safety, other pets, behavioral scores
      budget: 0.10,             // Adoption fee, monthly costs
      preferences: 0.10          // Species, size, energy preferences
    };
  }

  /**
   * Calculate compatibility score between user and pet
   * @returns {Object} Score breakdown with reasons and warnings
   */
  calculateMatchScore(user, pet) {
    const scores = {};
    const reasons = [];
    const warnings = [];

    const adoptionProfile = user.adoptionProfile || {};
    const compatProfile = pet.compatibilityProfile || {};

    // 1. Living Space Compatibility (20 points)
    const [livingScore, livingReasons] = this._scoreLivingSpace(adoptionProfile, compatProfile, pet);
    scores.living_space = livingScore;
    reasons.push(...livingReasons);

    // 2. Activity Level Match (25 points)
    const [activityScore, activityReasons] = this._scoreActivityMatch(adoptionProfile, compatProfile, pet);
    scores.activity = activityScore;
    reasons.push(...activityReasons);

    // 3. Experience Match (15 points)
    const [expScore, expReasons] = this._scoreExperience(adoptionProfile, compatProfile, pet);
    scores.experience = expScore;
    reasons.push(...expReasons);

    // 4. Family Safety (20 points)
    const [familyScore, familyReasons, familyWarnings] = this._scoreFamilyCompatibility(adoptionProfile, compatProfile, pet);
    scores.family = familyScore;
    reasons.push(...familyReasons);
    warnings.push(...familyWarnings);

    // 5. Budget Match (10 points)
    const [budgetScore, budgetReasons] = this._scoreBudget(adoptionProfile, pet, compatProfile);
    scores.budget = budgetScore;
    reasons.push(...budgetReasons);

    // 6. Preference Match (10 points)
    const [prefScore, prefReasons] = this._scorePreferences(adoptionProfile, compatProfile, pet);
    scores.preferences = prefScore;
    reasons.push(...prefReasons);

    // Calculate weighted total
    const totalScore = Math.round(scores.living_space + scores.activity + scores.experience + scores.family + scores.budget + scores.preferences);

    // Determine compatibility level
    let compatibility, color;
    if (totalScore >= 85) {
      compatibility = "Excellent Match";
      color = "green";
    } else if (totalScore >= 70) {
      compatibility = "Great Match";
      color = "blue";
    } else if (totalScore >= 55) {
      compatibility = "Good Match";
      color = "yellow";
    } else {
      compatibility = "Fair Match";
      color = "orange";
    }

    return {
      overall_score: totalScore,
      compatibility_level: compatibility,
      color: color,
      score_breakdown: scores,
      // FIX #8: Increased cap from 5 to 8 reasons. Warnings are sorted to the front
      // so critical safety concerns are always visible, not cut off.
      match_reasons: [
        ...reasons.filter(r => r.startsWith('⚠️') || r.startsWith('❌')),
        ...reasons.filter(r => !r.startsWith('⚠️') && !r.startsWith('❌'))
      ].slice(0, 8),
      warnings: warnings,
      success_probability: this._predictSuccessProbability(totalScore, adoptionProfile, compatProfile, pet)
    };
  }

  _scoreLivingSpace(user, compat, pet) {
    let score = 0;
    const reasons = [];
    const maxScore = 20;

    // Check if compatibility profile exists
    if (!compat || Object.keys(compat).length === 0) {
      reasons.push("⚠️ Pet compatibility profile incomplete - neutral scoring applied");
      return [10, reasons];
    }

    const homeType = user.homeType;
    const homeSize = user.homeSize || 0;
    const hasYard = user.hasYard || false;

    const petSize = compat.size;
    const needsYard = compat.needsYard;
    const canApartment = compat.canLiveInApartment;
    const minHomeSize = compat.minHomeSize || 0;

    // Home type compatibility
    if (homeType === 'apartment') {
      if (canApartment && petSize === 'small') {
        score += 10;
        reasons.push(`✓ ${pet.breed || pet.name} is perfect for apartment living`);
      } else if (canApartment && petSize === 'medium') {
        score += 7;
        reasons.push(`✓ ${pet.breed || pet.name} can adapt to apartment life`);
      } else if (!canApartment) {
        score += 2;
        reasons.push(`⚠️ ${pet.breed || pet.name} may struggle in apartments`);
      }
    } else if (homeType === 'house' || homeType === 'farm') {
      score += 10;
      reasons.push(`✓ Your ${homeType} provides great space for ${pet.name}`);
    }

    // Yard requirement
    if (needsYard) {
      if (hasYard) {
        score += 10;
        reasons.push(`✓ You have a yard - perfect for ${pet.name}!`);
      } else {
        score += 3;
        reasons.push(`⚠️ ${pet.name} really needs outdoor space`);
      }
    } else {
      score += 10;
    }

    // Home size check
    if (homeSize && homeSize >= minHomeSize) {
      reasons.push(`✓ Your home size (${homeSize} sq ft) is adequate`);
    } else if (minHomeSize > 0 && homeSize < minHomeSize) {
      score = score * 0.8;
    }

    return [Math.min(score, maxScore), reasons];
  }

  _scoreActivityMatch(user, compat, pet) {
    let score = 0;
    const reasons = [];
    const maxScore = 25;

    if (!compat || Object.keys(compat).length === 0) {
      return [12, ["⚠️ Pet activity profile incomplete"]];
    }

    const userActivity = user.activityLevel || 3;
    const petEnergy = compat.energyLevel;
    const hoursAlone = user.hoursAlonePerDay || 8;
    const maxHoursAlone = compat.maxHoursAlone || 8;
    const canBeAlone = compat.canBeLeftAlone !== false; // Default true

    // Activity level match (most important factor - 15 points)
    const activityDiff = Math.abs(userActivity - petEnergy);
    if (activityDiff === 0) {
      score += 15;
      reasons.push(`✓ Perfect activity match - both level ${userActivity}`);
    } else if (activityDiff === 1) {
      score += 12;
      reasons.push(`✓ Great activity compatibility`);
    } else if (activityDiff === 2) {
      score += 8;
      reasons.push(`~ Activity levels mostly aligned`);
    } else {
      score += 4;
      reasons.push(`⚠️ Different activity levels may require adjustment`);
    }

    // Alone time compatibility (10 points)
    if (!canBeAlone && hoursAlone > 4) {
      score += 2;
      reasons.push(`⚠️ ${pet.name} cannot be left alone for ${hoursAlone} hours`);
    } else if (hoursAlone <= maxHoursAlone) {
      score += 10;
      reasons.push(`✓ Your schedule works well for ${pet.name}`);
    } else {
      score += 5;
      reasons.push(`~ ${pet.name} may need a pet sitter sometimes`);
    }

    return [Math.min(score, maxScore), reasons];
  }

  _scoreExperience(user, compat, pet) {
    let score = 0;
    const reasons = [];
    const maxScore = 15;

    if (!compat || Object.keys(compat).length === 0) {
      return [7, ["⚠️ Pet experience requirements not set"]];
    }

    const experience = user.experienceLevel || 'first_time';
    const requiresExp = compat.requiresExperiencedOwner || false;
    const trainingNeeds = compat.trainingNeeds || 'low';
    const willingToTrain = user.willingToTrainPet !== false; // Default true

    const expLevels = { first_time: 1, some_experience: 2, experienced: 3, expert: 4 };
    const userExpLevel = expLevels[experience] || 1;

    // Experience requirement
    if (requiresExp) {
      if (userExpLevel >= 3) {
        score += 10;
        reasons.push(`✓ Your experience level is perfect for ${pet.name}`);
      } else if (userExpLevel === 2) {
        score += 5;
        reasons.push(`~ ${pet.name} may be challenging but manageable`);
      } else {
        score += 2;
        reasons.push(`⚠️ ${pet.name} needs an experienced owner`);
      }
    } else {
      score += 10;
      reasons.push(`✓ Great for your experience level`);
    }

    // Training needs
    if (trainingNeeds === 'high') {
      if (willingToTrain && userExpLevel >= 2) {
        score += 5;
        reasons.push(`✓ You're ready to train ${pet.name}`);
      } else if (willingToTrain) {
        score += 3;
      } else {
        score += 1;
        reasons.push(`⚠️ ${pet.name} needs training commitment`);
      }
    } else {
      score += 5;
    }

    return [Math.min(score, maxScore), reasons];
  }

  _scoreFamilyCompatibility(user, compat, pet) {
    let score = 0;
    const reasons = [];
    const warnings = [];
    const maxScore = 20;

    if (!compat || Object.keys(compat).length === 0) {
      return [10, ["⚠️ Pet family compatibility not set"], []];
    }

    const hasChildren = user.hasChildren || false;
    const childrenAges = user.childrenAges || [];
    const hasOtherPets = user.hasOtherPets || false;

    const childFriendly = compat.childFriendlyScore || 5;
    const petFriendly = compat.petFriendlyScore || 5;

    // CRITICAL: Check for aggressive/dangerous behavior
    const temperamentTags = pet.temperamentTags || [];
    console.log(`      [AGGRESSION CHECK] ${pet.name} temperament:`, temperamentTags);
    
    const hasAggressiveTags = temperamentTags.some(tag => 
      tag.toLowerCase().includes('aggressive') || 
      tag.toLowerCase().includes('bites') ||
      tag.toLowerCase().includes('dangerous') ||
      tag.toLowerCase().includes('attack')
    );

    if (hasAggressiveTags) {
      console.log(`      [AGGRESSIVE PET DETECTED] ${pet.name} - Applying -30 penalty`);
      warnings.push(`⚠️ CAUTION: ${pet.name} has aggressive behavior - NOT RECOMMENDED`);
      score = Math.max(0, score - 30); // HEAVY penalty to prevent "Best Match"
    }

    // Children compatibility
    if (hasChildren) {
      const youngest = childrenAges.length > 0 ? Math.min(...childrenAges) : 0;
      
      if (childFriendly >= 8) {
        score += 10;
        reasons.push(`✓ ${pet.name} is excellent with children!`);
      } else if (childFriendly >= 6) {
        score += 7;
        reasons.push(`✓ ${pet.name} is good with children`);
      } else if (childFriendly >= 4) {
        score += 4;
        reasons.push(`~ Supervision needed with young children`);
        if (youngest < 5) {
          warnings.push(`⚠️ Careful supervision required - young children present`);
        }
      } else {
        score += 1;
        warnings.push(`❌ NOT RECOMMENDED for homes with children`);
      }
    } else {
      score += 10;
    }

    // Other pets compatibility
    if (hasOtherPets) {
      if (petFriendly >= 8) {
        score += 10;
        reasons.push(`✓ ${pet.name} gets along great with other pets`);
      } else if (petFriendly >= 6) {
        score += 7;
        reasons.push(`✓ Can live with other pets`);
      } else if (petFriendly >= 4) {
        score += 4;
        reasons.push(`~ Slow introduction to other pets recommended`);
      } else {
        score += 1;
        warnings.push(`⚠️ ${pet.name} prefers to be the only pet`);
      }
    } else {
      score += 10;
    }

    return [Math.min(score, maxScore), reasons, warnings];
  }

  _scoreBudget(user, pet, compat) {
    let score = 0;
    const reasons = [];
    const maxScore = 10;

    if (!compat || Object.keys(compat).length === 0) {
      return [5, ["⚠️ Pet cost information not set"]];
    }

    const monthlyBudget = user.monthlyBudget;
    const maxAdoptionFee = user.maxAdoptionFee;
    const adoptionFee = pet.adoptionFee || 0;

    // FIX #9: Use breed-specific ongoing cost estimates instead of a single generic value.
    // High-maintenance breeds have significantly higher real monthly costs.
    const BREED_MONTHLY_COSTS = {
      // High-maintenance dogs
      'golden retriever': 250, 'labrador retriever': 200, 'german shepherd': 200,
      'husky': 220, 'siberian husky': 220, 'border collie': 180,
      'poodle': 300, 'standard poodle': 300, 'miniature poodle': 250,
      'shih tzu': 280, 'maltese': 260, 'bichon frise': 270,
      'great dane': 350, 'saint bernard': 380, 'newfoundland': 360,
      // High-maintenance cats
      'persian': 300, 'persian cat': 300, 'persian cats': 300,
      'maine coon': 220, 'british shorthair': 200,
      'bengal': 250, 'ragdoll': 230, 'savannah': 400,
      // Indian breeds (lower cost)
      'indian pariah': 80, 'indian spitz': 90, 'kombai': 85, 'mudhol hound': 85,
      'rajapalayam': 90, 'chippiparai': 85, 'indian street cat': 70
    };

    const breedKey = (pet.breed || '').toLowerCase().trim();
    const breedCost = BREED_MONTHLY_COSTS[breedKey] || compat.estimatedMonthlyCost || 100;

    // Adoption fee check
    if (maxAdoptionFee != null) {
      if (adoptionFee <= maxAdoptionFee) {
        score += 5;
        reasons.push(`✓ Adoption fee ($${adoptionFee}) within budget`);
      } else {
        score += 1;
        reasons.push(`⚠️ Adoption fee ($${adoptionFee}) above your max ($${maxAdoptionFee})`);
      }
    } else {
      score += 5;
    }

    // Monthly cost check
    if (monthlyBudget != null) {
      if (breedCost <= monthlyBudget) {
        score += 5;
        reasons.push(`✓ Estimated monthly cost (~$${breedCost}) fits your budget`);
      } else if (breedCost <= monthlyBudget * 1.2) {
        score += 3;
        reasons.push(`~ Monthly costs (~$${breedCost}) slightly above your budget ($${monthlyBudget})`);
      } else {
        score += 1;
        // FIX #9: Explicit breed-specific cost warning instead of generic message
        reasons.push(`⚠️ ${pet.breed || 'This pet'} estimated monthly cost ~$${breedCost} may strain your $${monthlyBudget} budget`);
      }
    } else {
      score += 5;
    }

    return [Math.min(score, maxScore), reasons];
  }

  _scorePreferences(user, compat, pet) {
    let score = 0;
    const reasons = [];
    const maxScore = 10;

    if (!compat || Object.keys(compat).length === 0) {
      return [5, ["⚠️ Pet preferences not set"]];
    }

    const preferredSpecies = user.preferredSpecies || [];
    const preferredSize = user.preferredSize || [];
    const preferredEnergy = user.preferredEnergyLevel;

    const petSpecies = (pet.species || '').toLowerCase();
    const petSize = compat.size;
    const petEnergy = compat.energyLevel;

    // Species preference
    if (preferredSpecies.length > 0) {
      if (preferredSpecies.map(s => s.toLowerCase()).includes(petSpecies)) {
        score += 4;
        reasons.push(`✓ Matches your species preference`);
      } else {
        score += 1;
      }
    } else {
      score += 4;
    }

    // Size preference
    if (preferredSize.length > 0) {
      if (preferredSize.includes(petSize)) {
        score += 3;
        reasons.push(`✓ ${petSize ? petSize.charAt(0).toUpperCase() + petSize.slice(1) : 'Unknown'} size as preferred`);
      } else {
        score += 1;
      }
    } else {
      score += 3;
    }

    // Energy preference
    if (preferredEnergy != null) {
      const energyDiff = Math.abs(preferredEnergy - petEnergy);
      if (energyDiff <= 1) {
        score += 3;
        reasons.push(`✓ Energy level matches preference`);
      } else {
        score += 1;
      }
    } else {
      score += 3;
    }

    return [Math.min(score, maxScore), reasons];
  }

  _predictSuccessProbability(matchScore, userProfile, compatProfile, pet) {
    let probability = matchScore;

    // Adjust for risk factors
    if (userProfile.experienceLevel === 'first_time' && compatProfile.requiresExperiencedOwner) {
      probability *= 0.85;
    }

    if (userProfile.profileComplete) {
      probability *= 1.05;
    }

    return Math.min(Math.round(probability), 100);
  }

  /**
   * Rank multiple pets for a user
   */
  rankPetsForUser(user, pets) {
    console.log('\n🔍 CONTENT-BASED MATCHER DEBUG:');
    console.log(`User: ${user.name || 'Unknown'}`);
    console.log(`Activity: ${user.adoptionProfile?.activityLevel || 'Not set'}`);
    console.log(`Home: ${user.adoptionProfile?.homeType || 'Not set'}`);
    console.log(`Pets to score: ${pets.length}\n`);
    
    if (!user.adoptionProfile) {
      console.error('❌ ERROR: User has no adoption profile!');
      console.error('   User must complete profile at /user/adoption/profile-wizard');
      // Return pets with low default scores
      return pets.map(pet => ({
        ...pet,
        match_score: 50,
        matchScore: 50,
        hybridScore: 50,
        match_details: {
          overall_score: 50,
          compatibility_level: 'Fair Match',
          warnings: ['⚠️ Complete your adoption profile for accurate scoring'],
          match_reasons: ['Profile incomplete - using default scoring'],
          score_breakdown: {}  
        }
      }));
    }
    
    const scoredPets = pets.map(pet => {
      try {
        const matchResult = this.calculateMatchScore(user, pet);
        
        console.log(`🐾 ${pet.name || 'Unnamed'} (${pet.species || 'Unknown'} ${pet.breed || 'Unknown'}):`);
        console.log(`   Score: ${matchResult.overall_score}/100 (${matchResult.compatibility_level})`);
        console.log(`   Temperament: ${(pet.temperamentTags || []).join(', ') || 'None'}`);
        console.log(`   Warnings: ${matchResult.warnings.length > 0 ? matchResult.warnings.join('; ') : 'None'}`);
        console.log(`   Breakdown: Living=${matchResult.score_breakdown.living_space}, Activity=${matchResult.score_breakdown.activity}, Family=${matchResult.score_breakdown.family}\n`);
        
        return {
          ...pet,
          match_score: matchResult.overall_score,
          matchScore: matchResult.overall_score,
          hybridScore: matchResult.overall_score,
          match_details: matchResult,
          // Ensure these are included for frontend
          name: pet.name || 'Lovely Pet',
          species: pet.species || 'Pet',
          breed: pet.breed || 'Unknown Breed'
        };
      } catch (error) {
        console.error(`❌ Error scoring ${pet.name}:`, error.message);
        return {
          ...pet,
          match_score: 30,
          matchScore: 30,
          hybridScore: 30,
          match_details: {
            overall_score: 30,
            compatibility_level: 'Fair Match',
            warnings: ['Error calculating compatibility'],
            match_reasons: [],
            score_breakdown: {}
          }
        };
      }
    });

    // Sort by match score (highest first)
    scoredPets.sort((a, b) => b.match_score - a.match_score);

    console.log(`\n⭐ TOP 5 RANKED PETS:`);
    scoredPets.slice(0, 5).forEach((pet, i) => {
      const badge = i === 0 && pet.match_score >= 85 ? '🏆 BEST MATCH' : '';
      console.log(`   ${i+1}. ${pet.name}: ${pet.match_score}/100 ${badge}`);
    });
    console.log('');

    return scoredPets;
  }

  /**
   * Get top N best matches
   */
  getTopMatches(user, pets, topN = 10) {
    const ranked = this.rankPetsForUser(user, pets);
    return ranked.slice(0, topN);
  }
}

module.exports = new ContentBasedMatcher();

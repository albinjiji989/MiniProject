/**
 * ML Retrain Service
 * 
 * Handles automatic retraining of ML models when enough real adoption
 * data has accumulated. Implements FIFO replacement of synthetic data
 * with real data, so models gradually improve over time.
 * 
 * SMART RETRAIN TRIGGERS:
 * 1. Milestone-based: At 5, 10, 25, 50, 100, 200, 500 real records
 * 2. Time-based: Weekly retrain if new real data exists since last retrain
 * 3. Negative feedback spike: Retrain when rejection/cancel ratio exceeds threshold
 * 4. Data drift: Retrain when recent outcomes differ significantly from training distribution
 * 
 * Flow:
 * 1. Adoption completes → MLTrainingData record created (real)
 * 2. checkIfRetrainNeeded() evaluates all triggers
 * 3. If triggered → triggerRetrain() fetches real data, calls Python
 * 4. Python replaces synthetic data with real data (FIFO) and retrains all models
 */

const axios = require('axios');
const MLTrainingData = require('../../models/MLTrainingData');
const AdoptionPet = require('../../manager/models/AdoptionPet');

const ML_SERVICE_URL = process.env.AIML_API_URL || 'http://localhost:5001';

// Retrain configuration
const RETRAIN_CONFIG = {
  // Milestone thresholds (retrain when real data count reaches these)
  milestones: [5, 10, 25, 50, 100, 200, 500],
  
  // Time-based: minimum days between scheduled retrains
  timeBased: {
    minDaysBetweenRetrains: 7,   // Don't retrain more than weekly
    minNewDataForTimeRetrain: 2   // At least 2 new real records needed
  },
  
  // Negative feedback spike detection
  negativeFeedback: {
    windowDays: 14,               // Look at last 14 days of data
    negativeRatioThreshold: 0.5,  // If >50% of recent outcomes are negative, retrain
    minSamplesForDetection: 4     // Need at least 4 recent samples to evaluate
  },
  
  // Data drift detection
  dataDrift: {
    windowDays: 30,               // Compare last 30 days vs. training data
    driftThreshold: 0.3,          // 30% shift in key feature distributions triggers retrain
    minSamplesForDrift: 8         // Need at least 8 samples to detect drift
  },
  
  // New breed/species detection
  newBreed: {
    minNewPetsForRetrain: 3,      // Retrain K-Means after 3+ pets with unseen breeds added
    lookbackDays: 7               // Check new pets added in last 7 days
  }
};

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 120000, // 2 minutes for retrain
  headers: { 'Content-Type': 'application/json' }
});

// Track last retrain time — cached in-memory, persisted in ModelPerformance DB.
// On server restart, lazily rehydrated from DB on first access.
let _retrainCache = { time: null, dataCount: 0, loaded: false };

/**
 * Get last retrain info (from cache if available, otherwise from DB).
 * Survives server restarts by falling back to ModelPerformance records.
 */
async function _getLastRetrainInfo() {
  if (_retrainCache.loaded) {
    return { time: _retrainCache.time, dataCount: _retrainCache.dataCount };
  }
  
  try {
    const ModelPerformance = require('../../models/ModelPerformance');
    const latest = await ModelPerformance.findOne({ modelType: 'hybrid' })
      .sort({ trainedDate: -1 })
      .select('trainedDate trainingDataCount')
      .lean();
    
    if (latest) {
      _retrainCache.time = latest.trainedDate;
      _retrainCache.dataCount = latest.trainingDataCount || 0;
    }
    _retrainCache.loaded = true;
  } catch (e) {
    console.warn('[RetrainService] Failed to load retrain history from DB:', e.message);
  }
  
  return { time: _retrainCache.time, dataCount: _retrainCache.dataCount };
}

/**
 * Update retrain tracking (both in-memory cache and DB).
 */
function _updateRetrainCache(time, dataCount) {
  _retrainCache = { time, dataCount, loaded: true };
}

// Debounce for new-breed retrains: prevent bulk pet imports from triggering many retrains
let newBreedRetrainCooldownUntil = null;
const NEW_BREED_RETRAIN_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Smart retrain check - evaluates ALL retrain triggers
 * Called after each new real data point (adoption, rejection, cancellation)
 * 
 * @param {number} realDataCount - Current count of real records
 * @param {string} triggerEvent - What caused this check (adoption/rejection/cancellation)
 * @returns {Object} { shouldRetrain, reason, ... }
 */
async function checkIfRetrainNeeded(realDataCount, triggerEvent = 'adoption') {
  try {
    const reasons = [];
    
    // === TRIGGER 1: Milestone-based ===
    if (RETRAIN_CONFIG.milestones.includes(realDataCount)) {
      reasons.push(`Milestone reached: ${realDataCount} real records`);
    }
    
    // === TRIGGER 2: Time-based ===
    const timeTrigger = await _checkTimeTrigger(realDataCount);
    if (timeTrigger.triggered) {
      reasons.push(timeTrigger.reason);
    }
    
    // === TRIGGER 3: Negative feedback spike ===
    const negativeTrigger = await _checkNegativeFeedbackSpike();
    if (negativeTrigger.triggered) {
      reasons.push(negativeTrigger.reason);
    }
    
    // === TRIGGER 4: Data drift ===
    const driftTrigger = await _checkDataDrift();
    if (driftTrigger.triggered) {
      reasons.push(driftTrigger.reason);
    }
    
    // === TRIGGER 5: New breed/species detection ===
    const newBreedTrigger = await _checkNewBreeds();
    if (newBreedTrigger.triggered) {
      reasons.push(newBreedTrigger.reason);
    }
    
    const shouldRetrain = reasons.length > 0;
    
    if (shouldRetrain) {
      console.log(`🧠 Smart Retrain Check: TRIGGERED by ${reasons.join(' + ')}`);
    } else {
      console.log(`🧠 Smart Retrain Check: No retrain needed (${realDataCount} records, event: ${triggerEvent})`);
    }
    
    return {
      shouldRetrain,
      reasons,
      realDataCount,
      triggerEvent,
      checks: {
        milestone: RETRAIN_CONFIG.milestones.includes(realDataCount),
        timeBased: timeTrigger,
        negativeFeedback: negativeTrigger,
        dataDrift: driftTrigger,
        newBreed: newBreedTrigger
      }
    };
  } catch (err) {
    console.error('Smart retrain check failed:', err?.message);
    // Fall back to milestone-only logic
    return {
      shouldRetrain: RETRAIN_CONFIG.milestones.includes(realDataCount),
      reasons: RETRAIN_CONFIG.milestones.includes(realDataCount) 
        ? [`Milestone: ${realDataCount} records (fallback)`] : [],
      realDataCount
    };
  }
}

/**
 * Check if enough time has passed since last retrain AND new data exists
 */
async function _checkTimeTrigger(currentCount) {
  const cfg = RETRAIN_CONFIG.timeBased;
  
  // Get last retrain date from persisted cache (DB-backed)
  const retrainInfo = await _getLastRetrainInfo();
  const lastRetrain = retrainInfo.time;
  const lastDataCount = retrainInfo.dataCount;
  
  if (!lastRetrain) {
    return { triggered: false, reason: 'No previous retrain found' };
  }
  
  const daysSinceRetrain = (Date.now() - new Date(lastRetrain).getTime()) / (1000 * 60 * 60 * 24);
  const newDataSinceRetrain = currentCount - lastDataCount;
  
  if (daysSinceRetrain >= cfg.minDaysBetweenRetrains && newDataSinceRetrain >= cfg.minNewDataForTimeRetrain) {
    return {
      triggered: true,
      reason: `Time-based: ${Math.floor(daysSinceRetrain)} days since last retrain, ${newDataSinceRetrain} new records`
    };
  }
  
  return {
    triggered: false,
    daysSinceRetrain: Math.floor(daysSinceRetrain),
    newDataSinceRetrain
  };
}

/**
 * Detect spike in negative feedback (rejections/cancellations)
 * If recent negative ratio exceeds threshold, models may be recommending poorly
 */
async function _checkNegativeFeedbackSpike() {
  const cfg = RETRAIN_CONFIG.negativeFeedback;
  
  const windowStart = new Date(Date.now() - cfg.windowDays * 24 * 60 * 60 * 1000);
  
  const recentData = await MLTrainingData.find({
    dataType: 'real',
    createdAt: { $gte: windowStart }
  }).select('outcome successfulAdoption').lean();
  
  if (recentData.length < cfg.minSamplesForDetection) {
    return { triggered: false, reason: `Insufficient data (${recentData.length}/${cfg.minSamplesForDetection})` };
  }
  
  const negativeCount = recentData.filter(d => !d.successfulAdoption).length;
  const negativeRatio = negativeCount / recentData.length;
  
  if (negativeRatio >= cfg.negativeRatioThreshold) {
    return {
      triggered: true,
      reason: `Negative feedback spike: ${(negativeRatio * 100).toFixed(0)}% negative (${negativeCount}/${recentData.length}) in last ${cfg.windowDays} days`
    };
  }
  
  return {
    triggered: false,
    negativeRatio: (negativeRatio * 100).toFixed(1) + '%',
    threshold: (cfg.negativeRatioThreshold * 100) + '%'
  };
}

/**
 * Detect data drift - compare distribution of recent data vs overall training data
 * Checks if user/pet profiles in recent adoptions differ significantly from training data
 */
async function _checkDataDrift() {
  const cfg = RETRAIN_CONFIG.dataDrift;
  
  const windowStart = new Date(Date.now() - cfg.windowDays * 24 * 60 * 60 * 1000);
  
  // Get recent real data
  const recentData = await MLTrainingData.find({
    dataType: 'real',
    createdAt: { $gte: windowStart }
  }).select('userProfileSnapshot petProfileSnapshot').lean();
  
  if (recentData.length < cfg.minSamplesForDrift) {
    return { triggered: false, reason: `Insufficient data for drift detection (${recentData.length}/${cfg.minSamplesForDrift})` };
  }
  
  // Get all historical real data (excluding recent window)
  const historicalData = await MLTrainingData.find({
    dataType: 'real',
    createdAt: { $lt: windowStart }
  }).select('userProfileSnapshot').lean();
  
  if (historicalData.length < cfg.minSamplesForDrift) {
    return { triggered: false, reason: 'Insufficient historical data for comparison' };
  }
  
  // Compare key feature distributions
  // Check: homeType distribution, experienceLevel distribution, hasChildren ratio
  const recentFeatures = _extractKeyFeatures(recentData);
  const historicalFeatures = _extractKeyFeatures(historicalData);
  
  // Calculate distribution shift using simple ratio comparison
  let totalDrift = 0;
  let featureCount = 0;
  const driftDetails = {};
  
  for (const feature of Object.keys(recentFeatures)) {
    const recentDist = recentFeatures[feature];
    const histDist = historicalFeatures[feature];
    
    if (!recentDist || !histDist) continue;
    
    // Calculate Jensen-Shannon divergence approximation (simplified)
    let drift = 0;
    const allKeys = new Set([...Object.keys(recentDist), ...Object.keys(histDist)]);
    for (const key of allKeys) {
      const p = (recentDist[key] || 0);
      const q = (histDist[key] || 0);
      drift += Math.abs(p - q);
    }
    drift /= 2; // Normalize to [0, 1]
    
    driftDetails[feature] = { drift: drift.toFixed(3), recent: recentDist, historical: histDist };
    totalDrift += drift;
    featureCount++;
  }
  
  const avgDrift = featureCount > 0 ? totalDrift / featureCount : 0;
  
  if (avgDrift >= cfg.driftThreshold) {
    return {
      triggered: true,
      reason: `Data drift detected: ${(avgDrift * 100).toFixed(0)}% avg shift in user features (threshold: ${cfg.driftThreshold * 100}%)`,
      details: driftDetails
    };
  }
  
  return {
    triggered: false,
    avgDrift: (avgDrift * 100).toFixed(1) + '%',
    threshold: (cfg.driftThreshold * 100) + '%'
  };
}

/**
 * Detect new breeds/species that weren't in the original training data.
 * When admin adds pets with previously unseen breeds, K-Means should retrain
 * so cluster definitions incorporate the new feature patterns.
 * 
 * NOTE: ML is breed-agnostic (uses features not breed names), so new breeds
 * won't break anything. But retraining improves cluster quality by incorporating
 * the new feature distributions that new breeds bring.
 */
async function _checkNewBreeds() {
  const cfg = RETRAIN_CONFIG.newBreed;
  const lookbackStart = new Date(Date.now() - cfg.lookbackDays * 24 * 60 * 60 * 1000);
  
  try {
    // Get breeds that appeared in training data
    const trainedBreeds = await MLTrainingData.distinct('petProfileSnapshot.breed', {
      dataType: 'real'
    });
    
    // Get breeds from recently added pets
    const recentPets = await AdoptionPet.find({
      createdAt: { $gte: lookbackStart },
      isActive: true,
      isDeleted: { $ne: true },
      'compatibilityProfile.energyLevel': { $exists: true }
    }).select('breed species').lean();
    
    if (recentPets.length === 0) {
      return { triggered: false, reason: 'No recent pets added' };
    }
    
    // Find breeds in recent pets that aren't in training data
    const trainedBreedSet = new Set(trainedBreeds.filter(Boolean).map(b => b.toLowerCase()));
    const newBreedPets = recentPets.filter(p => 
      p.breed && !trainedBreedSet.has(p.breed.toLowerCase())
    );
    
    const uniqueNewBreeds = [...new Set(newBreedPets.map(p => p.breed))];
    
    if (newBreedPets.length >= cfg.minNewPetsForRetrain && uniqueNewBreeds.length > 0) {
      return {
        triggered: true,
        reason: `New breeds detected: ${uniqueNewBreeds.join(', ')} (${newBreedPets.length} new pets). K-Means retrain recommended.`,
        newBreeds: uniqueNewBreeds,
        newPetCount: newBreedPets.length
      };
    }
    
    return {
      triggered: false,
      newBreeds: uniqueNewBreeds,
      newPetCount: newBreedPets.length,
      threshold: cfg.minNewPetsForRetrain
    };
  } catch (e) {
    return { triggered: false, reason: `New breed check failed: ${e.message}` };
  }
}

/**
 * Check if a specific pet has a breed not seen in training data.
 * Called from createPet to provide early warning and schedule retrain.
 * 
 * @param {string} breed - The breed of the newly created pet
 * @returns {Object} { isNew, breed, message }
 */
async function checkNewBreedAdded(breed) {
  if (!breed) return { isNew: false };
  
  try {
    const trainedBreeds = await MLTrainingData.distinct('petProfileSnapshot.breed', {
      dataType: 'real'
    });
    
    const trainedBreedSet = new Set(trainedBreeds.filter(Boolean).map(b => b.toLowerCase()));
    const isNew = !trainedBreedSet.has(breed.toLowerCase());
    
    if (isNew) {
      console.log(`🆕 New breed detected: "${breed}" — not in training data. ML will cluster by features, not breed name.`);
      
      // Count how many new-breed pets exist now
      const newBreedCount = await AdoptionPet.countDocuments({
        breed: breed,
        isActive: true,
        isDeleted: { $ne: true }
      });
      
      if (newBreedCount >= RETRAIN_CONFIG.newBreed.minNewPetsForRetrain) {
        // Debounce: skip if a new-breed retrain was already triggered recently
        if (newBreedRetrainCooldownUntil && Date.now() < newBreedRetrainCooldownUntil) {
          console.log(`⏳ New-breed retrain debounced — cooldown until ${new Date(newBreedRetrainCooldownUntil).toISOString()}`);
          return { isNew, breed, message: `New breed "${breed}" — retrain debounced (cooldown active)` };
        }
        
        console.log(`🧠 Enough new-breed pets (${newBreedCount}). Auto-triggering retrain...`);
        newBreedRetrainCooldownUntil = Date.now() + NEW_BREED_RETRAIN_COOLDOWN_MS;
        const realCount = await MLTrainingData.countDocuments({ dataType: 'real' });
        // Trigger in background (don't await — don't block pet creation)
        triggerRetrain(realCount, `New breed "${breed}" added (${newBreedCount} pets)`).catch(e => {
          console.warn('Background retrain for new breed failed:', e?.message);
        });
      }
    }
    
    return { isNew, breed, message: isNew ? `New breed "${breed}" — ML uses features, not breed names` : 'Known breed' };
  } catch (e) {
    return { isNew: false, error: e.message };
  }
}

/**
 * Extract key feature distributions from training data for drift comparison
 */
function _extractKeyFeatures(dataArray) {
  const features = {
    homeType: {},
    experienceLevel: {},
    hasChildren: { true: 0, false: 0 }
  };
  
  const total = dataArray.length;
  if (total === 0) return features;
  
  for (const d of dataArray) {
    const profile = d.userProfileSnapshot || {};
    
    // homeType distribution
    const ht = profile.homeType || 'unknown';
    features.homeType[ht] = (features.homeType[ht] || 0) + 1;
    
    // experienceLevel distribution
    const el = profile.experienceLevel || 'unknown';
    features.experienceLevel[el] = (features.experienceLevel[el] || 0) + 1;
    
    // hasChildren ratio
    const hc = Boolean(profile.hasChildren).toString();
    features.hasChildren[hc] = (features.hasChildren[hc] || 0) + 1;
  }
  
  // Normalize to proportions
  for (const feature of Object.keys(features)) {
    for (const key of Object.keys(features[feature])) {
      features[feature][key] = features[feature][key] / total;
    }
  }
  
  return features;
}

/**
 * Trigger model retraining with real adoption data
 * Called automatically when checkIfRetrainNeeded() returns true
 * 
 * @param {number} realDataCount - Current count of real adoption records
 * @param {string} reason - Why retraining was triggered
 * @returns {Object} Retrain results from Python service
 */
async function triggerRetrain(realDataCount, reason = 'milestone') {
  console.log(`🧠 ML Retrain Service: Starting retrain with ${realDataCount} real records (reason: ${reason})...`);
  
  try {
    // Get all real training data from MongoDB
    const trainingData = await MLTrainingData.find({ dataType: 'real' })
      .sort({ createdAt: -1 })
      .lean();
    
    if (!trainingData || trainingData.length === 0) {
      console.log('⚠️ No real training data found, skipping retrain');
      return { success: false, message: 'No real data available' };
    }

    // Format data for Python service
    const formattedData = {
      realDataCount: trainingData.length,
      
      // SVD interactions from real adoptions
      svdInteractions: trainingData.map(d => ({
        userId: d.userId.toString(),
        petId: d.petId.toString(),
        interactionType: d.outcome === 'adopted' ? 'adopted' : 
                         d.outcome === 'returned' ? 'returned' : 'applied',
        implicitRating: d.implicitRating || (d.outcome === 'adopted' ? 5 : 0),
        timestamp: d.adoptionDate ? new Date(d.adoptionDate).toISOString() : new Date().toISOString()
      })),

      // XGBoost records from real adoptions
      xgboostRecords: trainingData.map(d => ({
        userProfile: _normalizeUserProfile(d.userProfileSnapshot || {}),
        petProfile: _normalizePetProfile(d.petProfileSnapshot || {}),
        matchScore: d.matchScore || 50,
        successfulAdoption: d.successfulAdoption !== false
      })),

      // K-Means pet profiles from real adoptions
      kmeansProfiles: trainingData.map(d => ({
        _id: d.petId.toString(),
        name: d.petProfileSnapshot?.name || 'Unknown',
        species: d.petProfileSnapshot?.species || 'Dog',
        breed: d.petProfileSnapshot?.breed || 'Mixed',
        compatibilityProfile: _normalizePetProfile(d.petProfileSnapshot || {})
      }))
    };

    // Call Python retrain endpoint
    const response = await client.post('/api/adoption/ml/retrain-with-real-data', formattedData);
    
    if (response.data?.success) {
      console.log(`✅ ML Retrain successful! Results:`, JSON.stringify(response.data.data, null, 2));
      
      // Update tracking cache (persists across checks; DB record created below)
      _updateRetrainCache(new Date(), realDataCount);
      
      // Update ModelPerformance record with comparison to previous model
      try {
        const ModelPerformance = require('../../models/ModelPerformance');
        
        // Fetch previous model's metrics for comparison
        const previousModel = await ModelPerformance.findOne({ modelType: 'hybrid' })
          .sort({ trainedDate: -1 })
          .select('version metrics trainedDate trainingDataCount')
          .lean();
        
        const newMetrics = response.data.data?.metrics || {};
        
        // Build comparison object
        let comparison = null;
        if (previousModel && previousModel.metrics) {
          const prev = previousModel.metrics;
          comparison = {
            previousVersion: previousModel.version,
            previousTrainedDate: previousModel.trainedDate,
            previousDataCount: previousModel.trainingDataCount || 0,
            changes: {}
          };
          
          // Compare common metric keys (accuracy, silhouette, rmse, etc.)
          const metricKeys = new Set([
            ...Object.keys(prev),
            ...Object.keys(newMetrics)
          ]);
          
          for (const key of metricKeys) {
            const oldVal = typeof prev[key] === 'number' ? prev[key] : null;
            const newVal = typeof newMetrics[key] === 'number' ? newMetrics[key] : null;
            if (oldVal !== null && newVal !== null) {
              const delta = newVal - oldVal;
              const pctChange = oldVal !== 0 ? ((delta / Math.abs(oldVal)) * 100) : 0;
              comparison.changes[key] = {
                previous: Math.round(oldVal * 1000) / 1000,
                current: Math.round(newVal * 1000) / 1000,
                delta: Math.round(delta * 1000) / 1000,
                percentChange: Math.round(pctChange * 10) / 10,
                improved: key === 'rmse' ? delta < 0 : delta > 0  // Lower RMSE = better
              };
            }
          }
          
          const improvementCount = Object.values(comparison.changes).filter(c => c.improved).length;
          const totalCompared = Object.keys(comparison.changes).length;
          comparison.summary = totalCompared > 0
            ? `${improvementCount}/${totalCompared} metrics improved`
            : 'No comparable metrics';
          
          console.log(`📊 Model comparison: ${comparison.summary}`);
          for (const [k, v] of Object.entries(comparison.changes)) {
            const arrow = v.improved ? '📈' : '📉';
            console.log(`   ${arrow} ${k}: ${v.previous} → ${v.current} (${v.delta >= 0 ? '+' : ''}${v.delta}, ${v.percentChange >= 0 ? '+' : ''}${v.percentChange}%)`);
          }
        }
        
        await ModelPerformance.create({
          modelType: 'hybrid',
          version: `retrain_r${realDataCount}_${Date.now()}`,
          trainedDate: new Date(),
          trainingDataCount: realDataCount,
          metrics: newMetrics,
          trainingNotes: `Auto-retrain: ${reason}${comparison ? ` | ${comparison.summary}` : ''}`,
          ...(comparison ? { modelComparison: comparison } : {})
        });
      } catch (mpErr) {
        console.warn('ModelPerformance tracking failed:', mpErr?.message);
      }
      
      return response.data;
    } else {
      console.warn('ML Retrain returned failure:', response.data?.message);
      return response.data;
    }
    
  } catch (err) {
    console.error('ML Retrain failed:', err?.message || err);
    // Don't throw - this is a background task
    return { success: false, error: err?.message || 'Retrain failed' };
  }
}

/**
 * Normalize user profile for Python consumption
 * Handles MongoDB-specific data types (arrays, ObjectIds)
 */
function _normalizeUserProfile(profile) {
  return {
    homeType: profile.homeType || 'house',
    homeSize: Number(profile.homeSize) || 1000,
    hasYard: Boolean(profile.hasYard),
    yardSize: profile.yardSize || 'none',
    activityLevel: Number(profile.activityLevel) || 3,
    workSchedule: profile.workSchedule || 'full_time',
    hoursAlonePerDay: Number(profile.hoursAlonePerDay) || 8,
    experienceLevel: profile.experienceLevel || 'beginner',
    // Convert previousPets array to count for XGBoost
    previousPets: Array.isArray(profile.previousPets) ? profile.previousPets.length : Number(profile.previousPets) || 0,
    hasChildren: Boolean(profile.hasChildren),
    hasOtherPets: Boolean(profile.hasOtherPets),
    monthlyBudget: Number(profile.monthlyBudget) || 100,
    maxAdoptionFee: Number(profile.maxAdoptionFee) || 500,
    // Keep preferredSize as array for hybrid recommender, first element for XGBoost
    preferredSize: Array.isArray(profile.preferredSize) && profile.preferredSize.length > 0 
      ? profile.preferredSize[0] : (profile.preferredSize || 'medium'),
    preferredSpecies: profile.preferredSpecies || 'Dog'
  };
}

/**
 * Normalize pet profile for Python consumption
 */
function _normalizePetProfile(profile) {
  return {
    energyLevel: Number(profile.energyLevel) || 3,
    size: profile.size || 'medium',
    trainedLevel: profile.trainedLevel || 'basic',
    childFriendlyScore: Number(profile.childFriendlyScore) || 5,
    petFriendlyScore: Number(profile.petFriendlyScore) || 5,
    noiseLevel: profile.noiseLevel || 'moderate',
    exerciseNeeds: profile.exerciseNeeds || 'moderate',
    groomingNeeds: profile.groomingNeeds || 'moderate',
    canLiveInApartment: profile.canLiveInApartment !== false,
    needsYard: Boolean(profile.needsYard),
    canBeLeftAlone: profile.canBeLeftAlone !== false,
    maxHoursAlone: Number(profile.maxHoursAlone) || 6,
    estimatedMonthlyCost: Number(profile.estimatedMonthlyCost) || 100,
    strangerFriendlyScore: Number(profile.strangerFriendlyScore) || 5,
    temperamentTags: Array.isArray(profile.temperamentTags) ? profile.temperamentTags : []
  };
}

/**
 * Manually trigger retraining (for admin/testing)
 */
async function manualRetrain() {
  const realCount = await MLTrainingData.countDocuments({ dataType: 'real' });
  console.log(`🧠 Manual retrain requested. Real data count: ${realCount}`);
  return triggerRetrain(realCount, 'manual');
}

/**
 * Get training data statistics including smart trigger status
 */
async function getTrainingStats() {
  const counts = await MLTrainingData.getDataCounts();
  const latestReal = await MLTrainingData.findOne({ dataType: 'real' })
    .sort({ createdAt: -1 })
    .select('createdAt outcome')
    .lean();
  
  // Check current trigger status
  let triggerStatus = {};
  try {
    triggerStatus = await checkIfRetrainNeeded(counts.real || 0, 'status_check');
  } catch (e) {
    triggerStatus = { error: e.message };
  }
  
  // Fetch persisted retrain info (DB-backed, survives restarts)
  const retrainInfo = await _getLastRetrainInfo();
  
  return {
    realDataCount: counts.real || 0,
    syntheticDataCount: counts.synthetic || 0,
    totalDataCount: (counts.real || 0) + (counts.synthetic || 0),
    lastRealDataDate: latestReal?.createdAt || null,
    nextRetrainThreshold: _getNextThreshold(counts.real || 0),
    dataReplacementProgress: counts.real > 0 
      ? `${Math.min(100, Math.round((counts.real / 150) * 100))}% real data` 
      : '0% (all synthetic)',
    smartRetrain: {
      config: RETRAIN_CONFIG,
      currentStatus: triggerStatus,
      lastRetrainTime: retrainInfo.time,
      lastRetrainDataCount: retrainInfo.dataCount
    }
  };
}

function _getNextThreshold(currentCount) {
  const thresholds = RETRAIN_CONFIG.milestones;
  return thresholds.find(t => t > currentCount) || 'All thresholds reached';
}

module.exports = {
  triggerRetrain,
  checkIfRetrainNeeded,
  checkNewBreedAdded,
  manualRetrain,
  getTrainingStats,
  RETRAIN_CONFIG
};

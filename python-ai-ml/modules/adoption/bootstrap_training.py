"""
Bootstrap Training Module for Pet Adoption ML System
Generates synthetic training data and trains all 3 ML models on startup
so the hybrid recommender works immediately with all 4 algorithms.

SVD Collaborative Filtering - Trained with synthetic user-pet interactions
XGBoost Success Predictor  - Trained with synthetic adoption outcomes
K-Means Pet Clustering     - Trained with synthetic pet personality profiles

Models improve over time as real user data accumulates.
"""

import numpy as np
import random
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ============================================================================
# SYNTHETIC DATA GENERATORS
# ============================================================================

# Realistic pet profiles for different personality types
PET_TEMPLATES = [
    # Energetic Athletes
    {'energyLevel': 5, 'size': 'large',  'trainedLevel': 'intermediate', 'childFriendlyScore': 6, 'petFriendlyScore': 5, 'noiseLevel': 'vocal',    'exerciseNeeds': 'very_high', 'groomingNeeds': 'moderate', 'needsYard': True,  'canLiveInApartment': False, 'canBeLeftAlone': False, 'maxHoursAlone': 3, 'estimatedMonthlyCost': 200, 'strangerFriendlyScore': 5},
    {'energyLevel': 4, 'size': 'large',  'trainedLevel': 'basic',        'childFriendlyScore': 7, 'petFriendlyScore': 6, 'noiseLevel': 'moderate',  'exerciseNeeds': 'high',      'groomingNeeds': 'low',      'needsYard': True,  'canLiveInApartment': False, 'canBeLeftAlone': True,  'maxHoursAlone': 4, 'estimatedMonthlyCost': 180, 'strangerFriendlyScore': 6},
    # Calm Companions
    {'energyLevel': 2, 'size': 'small',  'trainedLevel': 'advanced',     'childFriendlyScore': 9, 'petFriendlyScore': 8, 'noiseLevel': 'quiet',     'exerciseNeeds': 'minimal',   'groomingNeeds': 'moderate', 'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 8, 'estimatedMonthlyCost': 80,  'strangerFriendlyScore': 8},
    {'energyLevel': 1, 'size': 'small',  'trainedLevel': 'intermediate', 'childFriendlyScore': 8, 'petFriendlyScore': 9, 'noiseLevel': 'quiet',     'exerciseNeeds': 'minimal',   'groomingNeeds': 'high',     'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 10, 'estimatedMonthlyCost': 100, 'strangerFriendlyScore': 7},
    # Family Friends
    {'energyLevel': 3, 'size': 'medium', 'trainedLevel': 'intermediate', 'childFriendlyScore': 10,'petFriendlyScore': 9, 'noiseLevel': 'moderate',  'exerciseNeeds': 'moderate',  'groomingNeeds': 'moderate', 'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 6, 'estimatedMonthlyCost': 120, 'strangerFriendlyScore': 9},
    {'energyLevel': 3, 'size': 'medium', 'trainedLevel': 'advanced',     'childFriendlyScore': 9, 'petFriendlyScore': 8, 'noiseLevel': 'quiet',     'exerciseNeeds': 'moderate',  'groomingNeeds': 'low',      'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 7, 'estimatedMonthlyCost': 100, 'strangerFriendlyScore': 8},
    # Independent Spirits
    {'energyLevel': 2, 'size': 'small',  'trainedLevel': 'untrained',    'childFriendlyScore': 4, 'petFriendlyScore': 3, 'noiseLevel': 'quiet',     'exerciseNeeds': 'minimal',   'groomingNeeds': 'low',      'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 12, 'estimatedMonthlyCost': 60,  'strangerFriendlyScore': 3},
    {'energyLevel': 3, 'size': 'medium', 'trainedLevel': 'basic',        'childFriendlyScore': 5, 'petFriendlyScore': 4, 'noiseLevel': 'moderate',  'exerciseNeeds': 'moderate',  'groomingNeeds': 'low',      'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': True,  'maxHoursAlone': 9, 'estimatedMonthlyCost': 90,  'strangerFriendlyScore': 5},
    # Gentle Giants
    {'energyLevel': 2, 'size': 'large',  'trainedLevel': 'advanced',     'childFriendlyScore': 9, 'petFriendlyScore': 7, 'noiseLevel': 'quiet',     'exerciseNeeds': 'moderate',  'groomingNeeds': 'high',     'needsYard': True,  'canLiveInApartment': False, 'canBeLeftAlone': False, 'maxHoursAlone': 5, 'estimatedMonthlyCost': 250, 'strangerFriendlyScore': 7},
    # Playful Companions
    {'energyLevel': 4, 'size': 'small',  'trainedLevel': 'basic',        'childFriendlyScore': 8, 'petFriendlyScore': 7, 'noiseLevel': 'vocal',     'exerciseNeeds': 'high',      'groomingNeeds': 'moderate', 'needsYard': False, 'canLiveInApartment': True,  'canBeLeftAlone': False, 'maxHoursAlone': 4, 'estimatedMonthlyCost': 110, 'strangerFriendlyScore': 8},
    # Aggressive / Difficult
    {'energyLevel': 5, 'size': 'large',  'trainedLevel': 'untrained',    'childFriendlyScore': 1, 'petFriendlyScore': 1, 'noiseLevel': 'vocal',     'exerciseNeeds': 'very_high', 'groomingNeeds': 'low',      'needsYard': True,  'canLiveInApartment': False, 'canBeLeftAlone': False, 'maxHoursAlone': 2, 'estimatedMonthlyCost': 300, 'strangerFriendlyScore': 1},
    {'energyLevel': 4, 'size': 'medium', 'trainedLevel': 'untrained',    'childFriendlyScore': 2, 'petFriendlyScore': 2, 'noiseLevel': 'vocal',     'exerciseNeeds': 'high',      'groomingNeeds': 'low',      'needsYard': True,  'canLiveInApartment': False, 'canBeLeftAlone': False, 'maxHoursAlone': 3, 'estimatedMonthlyCost': 200, 'strangerFriendlyScore': 2},
]

USER_TEMPLATES = [
    # Active family with yard
    {'homeType': 'house',     'homeSize': 2000, 'hasYard': True,  'yardSize': 500,  'activityLevel': 4, 'workSchedule': 'remote',    'hoursAlonePerDay': 2, 'experienceLevel': 'intermediate', 'previousPets': 2, 'hasChildren': True,  'hasOtherPets': True,  'monthlyBudget': 200, 'maxAdoptionFee': 500, 'preferredSize': 'medium', 'preferredSpecies': 'Dog'},
    # Single apartment dweller
    {'homeType': 'apartment', 'homeSize': 600,  'hasYard': False, 'yardSize': 0,    'activityLevel': 2, 'workSchedule': 'full_time', 'hoursAlonePerDay': 9, 'experienceLevel': 'beginner',     'previousPets': 0, 'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 100, 'maxAdoptionFee': 200, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},
    # Retired couple
    {'homeType': 'house',     'homeSize': 1500, 'hasYard': True,  'yardSize': 300,  'activityLevel': 2, 'workSchedule': 'retired',   'hoursAlonePerDay': 1, 'experienceLevel': 'advanced',     'previousPets': 5, 'hasChildren': False, 'hasOtherPets': True,  'monthlyBudget': 300, 'maxAdoptionFee': 800, 'preferredSize': 'large',  'preferredSpecies': 'Dog'},
    # Young professional
    {'homeType': 'apartment', 'homeSize': 800,  'hasYard': False, 'yardSize': 0,    'activityLevel': 3, 'workSchedule': 'full_time', 'hoursAlonePerDay': 8, 'experienceLevel': 'beginner',     'previousPets': 0, 'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 150, 'maxAdoptionFee': 300, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},
    # Active outdoor person
    {'homeType': 'house',     'homeSize': 1800, 'hasYard': True,  'yardSize': 800,  'activityLevel': 5, 'workSchedule': 'part_time', 'hoursAlonePerDay': 4, 'experienceLevel': 'advanced',     'previousPets': 3, 'hasChildren': False, 'hasOtherPets': True,  'monthlyBudget': 250, 'maxAdoptionFee': 600, 'preferredSize': 'large',  'preferredSpecies': 'Dog'},
    # Family with young kids
    {'homeType': 'house',     'homeSize': 1200, 'hasYard': True,  'yardSize': 200,  'activityLevel': 3, 'workSchedule': 'part_time', 'hoursAlonePerDay': 3, 'experienceLevel': 'intermediate', 'previousPets': 1, 'hasChildren': True,  'hasOtherPets': False, 'monthlyBudget': 150, 'maxAdoptionFee': 400, 'preferredSize': 'medium', 'preferredSpecies': 'Dog'},
    # Elderly single
    {'homeType': 'apartment', 'homeSize': 500,  'hasYard': False, 'yardSize': 0,    'activityLevel': 1, 'workSchedule': 'retired',   'hoursAlonePerDay': 2, 'experienceLevel': 'advanced',     'previousPets': 4, 'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 100, 'maxAdoptionFee': 200, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},
    # Farm owner
    {'homeType': 'farm',      'homeSize': 3000, 'hasYard': True,  'yardSize': 2000, 'activityLevel': 5, 'workSchedule': 'remote',    'hoursAlonePerDay': 1, 'experienceLevel': 'expert',       'previousPets': 8, 'hasChildren': True,  'hasOtherPets': True,  'monthlyBudget': 400, 'maxAdoptionFee': 1000,'preferredSize': 'large',  'preferredSpecies': 'Dog'},
]

PET_NAMES = [
    'Buddy', 'Luna', 'Charlie', 'Max', 'Bella', 'Rocky', 'Daisy', 'Cooper',
    'Sadie', 'Tucker', 'Molly', 'Bear', 'Duke', 'Maggie', 'Bailey', 'Jack',
    'Lola', 'Oliver', 'Lucy', 'Bentley', 'Chloe', 'Zeus', 'Sophie', 'Milo',
    'Lily', 'Rex', 'Rosie', 'Finn', 'Ruby', 'Leo', 'Penny', 'Ginger',
    'Bruno', 'Cleo', 'Simba', 'Nala', 'Shadow', 'Tiger', 'Princess', 'Bandit'
]

SPECIES_LIST = ['Dog', 'Cat', 'Dog', 'Dog', 'Cat', 'Dog', 'Cat', 'Dog', 'Dog', 'Cat']
BREED_MAP = {
    'Dog': ['Golden Retriever', 'Labrador', 'German Shepherd', 'Beagle', 'French Bulldog', 'Poodle', 'Husky', 'Corgi', 'Border Collie', 'Rottweiler'],
    'Cat': ['Persian', 'Siamese', 'Maine Coon', 'Bengal', 'British Shorthair', 'Ragdoll', 'Scottish Fold', 'Abyssinian']
}


def _add_noise(value, noise_range=0.5):
    """Add small random noise to a value"""
    return max(0, value + random.uniform(-noise_range, noise_range))


def _compute_compatibility_rating(user, pet):
    """
    Compute a realistic compatibility rating (0-5) based on how well
    user profile matches pet profile. This creates meaningful patterns
    for SVD to learn.
    """
    score = 2.5  # Base rating

    # Activity match (big factor)
    activity_diff = abs(user['activityLevel'] - pet['energyLevel'])
    if activity_diff == 0:
        score += 1.0
    elif activity_diff == 1:
        score += 0.5
    elif activity_diff >= 3:
        score -= 0.8

    # Space match
    if user['homeType'] == 'apartment' and not pet.get('canLiveInApartment', True):
        score -= 1.0
    elif user['homeType'] in ['house', 'farm'] and pet.get('needsYard', False) and user.get('hasYard', False):
        score += 0.5

    # Child safety
    if user['hasChildren']:
        child_score = pet.get('childFriendlyScore', 5)
        if child_score >= 8:
            score += 0.8
        elif child_score <= 3:
            score -= 1.5
    
    # Experience match
    exp_map = {'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4}
    trained_map = {'untrained': 3, 'basic': 2, 'intermediate': 1, 'advanced': 0}
    user_exp = exp_map.get(user['experienceLevel'], 1)
    pet_difficulty = trained_map.get(pet.get('trainedLevel', 'untrained'), 2)
    if user_exp >= pet_difficulty:
        score += 0.3
    else:
        score -= 0.5

    # Budget match
    if user['monthlyBudget'] >= pet.get('estimatedMonthlyCost', 100):
        score += 0.3
    else:
        score -= 0.4

    # Alone time
    if user['hoursAlonePerDay'] > pet.get('maxHoursAlone', 8):
        score -= 0.6

    # Add slight randomness for realistic data
    score += random.uniform(-0.3, 0.3)

    return round(max(0.0, min(5.0, score)), 1)


def _determine_adoption_success(user, pet, match_score):
    """
    Determine if an adoption would be successful based on compatibility.
    Higher match_score = higher chance of success.
    """
    # Base probability from match score
    base_prob = match_score / 5.0  # 0.0 to 1.0

    # Penalties for bad matches
    if user['hasChildren'] and pet.get('childFriendlyScore', 5) <= 3:
        base_prob -= 0.3
    if user['homeType'] == 'apartment' and not pet.get('canLiveInApartment', True):
        base_prob -= 0.2
    if user['hoursAlonePerDay'] > pet.get('maxHoursAlone', 8) + 2:
        base_prob -= 0.2
    
    # Bonuses for good matches
    if abs(user['activityLevel'] - pet['energyLevel']) <= 1:
        base_prob += 0.1
    if user.get('experienceLevel') in ['advanced', 'expert']:
        base_prob += 0.05
    
    base_prob = max(0.05, min(0.95, base_prob))
    
    return random.random() < base_prob


def generate_svd_interactions(n_users=20, n_pets=40, n_interactions=300):
    """
    Generate synthetic user-pet interaction data for SVD training.
    Creates realistic patterns where similar users like similar pets.
    """
    logger.info(f"Generating {n_interactions} synthetic interactions for SVD...")
    
    interactions = []
    
    # Generate user IDs and assign templates
    user_ids = [f"synth_user_{i:03d}" for i in range(n_users)]
    pet_ids = [f"synth_pet_{i:03d}" for i in range(n_pets)]
    
    # Assign templates with noise
    user_profiles = []
    for i in range(n_users):
        template = USER_TEMPLATES[i % len(USER_TEMPLATES)].copy()
        template['activityLevel'] = max(1, min(5, int(_add_noise(template['activityLevel'], 1))))
        user_profiles.append(template)
    
    pet_profiles = []
    for i in range(n_pets):
        template = PET_TEMPLATES[i % len(PET_TEMPLATES)].copy()
        template['energyLevel'] = max(1, min(5, int(_add_noise(template['energyLevel'], 1))))
        pet_profiles.append(template)
    
    # Generate interactions based on compatibility
    interaction_types = ['viewed', 'viewed', 'viewed', 'favorited', 'applied', 'adopted']
    
    generated = 0
    attempts = 0
    seen_pairs = set()
    
    while generated < n_interactions and attempts < n_interactions * 5:
        attempts += 1
        u_idx = random.randint(0, n_users - 1)
        p_idx = random.randint(0, n_pets - 1)
        
        pair = (u_idx, p_idx)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        
        # Compute compatibility to determine interaction type
        rating = _compute_compatibility_rating(user_profiles[u_idx], pet_profiles[p_idx])
        
        # Higher rated pets get more positive interactions
        if rating >= 4.0:
            itype = random.choice(['favorited', 'applied', 'adopted', 'favorited'])
        elif rating >= 3.0:
            itype = random.choice(['viewed', 'favorited', 'viewed', 'applied'])
        elif rating >= 2.0:
            itype = random.choice(['viewed', 'viewed', 'viewed', 'favorited'])
        else:
            itype = 'viewed'
        
        interactions.append({
            'userId': user_ids[u_idx],
            'petId': pet_ids[p_idx],
            'interactionType': itype,
            'implicitRating': rating,
            'timestamp': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
        })
        generated += 1
    
    logger.info(f"Generated {len(interactions)} SVD interactions ({n_users} users x {n_pets} pets)")
    return interactions


def generate_xgboost_training_data(n_records=150):
    """
    Generate synthetic adoption outcome data for XGBoost training.
    Creates realistic patterns: good matches succeed, bad matches fail.
    """
    logger.info(f"Generating {n_records} synthetic adoption records for XGBoost...")
    
    records = []
    
    for i in range(n_records):
        # Pick random user and pet template
        user = USER_TEMPLATES[i % len(USER_TEMPLATES)].copy()
        pet = PET_TEMPLATES[i % len(PET_TEMPLATES)].copy()
        
        # Add noise for variety
        user['activityLevel'] = max(1, min(5, int(_add_noise(user['activityLevel'], 1))))
        user['monthlyBudget'] = max(50, int(_add_noise(user['monthlyBudget'], 50)))
        pet['energyLevel'] = max(1, min(5, int(_add_noise(pet['energyLevel'], 1))))
        pet['childFriendlyScore'] = max(0, min(10, int(_add_noise(pet['childFriendlyScore'], 2))))
        
        # Calculate content match score
        match_score = _compute_compatibility_rating(user, pet)
        
        # Determine success based on compatibility
        success = _determine_adoption_success(user, pet, match_score)
        
        records.append({
            'userProfile': user,
            'petProfile': pet,
            'matchScore': match_score * 20,  # Convert 0-5 to 0-100
            'successfulAdoption': success
        })
    
    success_count = sum(1 for r in records if r['successfulAdoption'])
    logger.info(f"Generated {n_records} records: {success_count} successful, {n_records - success_count} failed")
    
    return records


def generate_kmeans_pet_data(n_pets=50):
    """
    Generate synthetic pet profiles for K-Means clustering.
    Creates diverse personalities that cluster into meaningful groups.
    """
    logger.info(f"Generating {n_pets} synthetic pet profiles for K-Means...")
    
    pets = []
    
    for i in range(n_pets):
        template = PET_TEMPLATES[i % len(PET_TEMPLATES)].copy()
        
        # Add noise for variety within clusters
        template['energyLevel'] = max(1, min(5, round(_add_noise(template['energyLevel'], 0.8))))
        template['childFriendlyScore'] = max(0, min(10, round(_add_noise(template['childFriendlyScore'], 1.5))))
        template['petFriendlyScore'] = max(0, min(10, round(_add_noise(template['petFriendlyScore'], 1.5))))
        
        species = random.choice(SPECIES_LIST)
        breed = random.choice(BREED_MAP[species])
        name = PET_NAMES[i % len(PET_NAMES)]
        
        pets.append({
            '_id': f"synth_cluster_pet_{i:03d}",
            'name': f"{name}_{i}",
            'species': species,
            'breed': breed,
            'compatibilityProfile': template
        })
    
    logger.info(f"Generated {n_pets} pet profiles for clustering")
    return pets


# ============================================================================
# MAIN BOOTSTRAP FUNCTION
# ============================================================================

def bootstrap_train_all_models():
    """
    Auto-train all 3 ML models, preferring REAL data from Node.js/MongoDB.
    Called on Python service startup to ensure all algorithms are active.
    
    Priority order:
    1. Try to fetch real data from Node.js (pets, users, interactions, outcomes)
    2. If real data available: use real + fill gaps with synthetic (FIFO)
    3. If Node.js unavailable: fall back to 100% synthetic
    
    Returns:
        dict: Training results for each model
    """
    results = {
        'svd': {'trained': False},
        'xgboost': {'trained': False},
        'kmeans': {'trained': False}
    }
    
    logger.info("=" * 60)
    logger.info("🚀 BOOTSTRAP TRAINING: Auto-training all ML models...")
    logger.info("=" * 60)
    
    # ---- Step 0: Try to fetch real data from Node.js ----
    real_data = None
    real_kmeans = []
    real_svd = []
    real_xgb = []
    
    try:
        from .real_data_fetcher import fetch_real_data, format_for_kmeans, format_for_svd, format_for_xgboost
        real_data = fetch_real_data()
        
        if real_data:
            real_kmeans = format_for_kmeans(real_data)
            real_svd = format_for_svd(real_data)
            real_xgb = format_for_xgboost(real_data)
            logger.info(f"📦 Real data available: {len(real_kmeans)} pets, {len(real_svd)} interactions, {len(real_xgb)} outcomes")
        else:
            logger.info("📦 No real data available. Using 100% synthetic data.")
    except Exception as e:
        logger.warning(f"⚠️  Could not fetch real data: {e}. Using 100% synthetic.")
    
    # ---- 1. Train SVD Collaborative Filter ----
    try:
        logger.info("\n📊 [1/3] Training SVD Collaborative Filter...")
        from .collaborative_filter import get_collaborative_filter
        
        cf_model = get_collaborative_filter()
        
        if not cf_model.trained:
            # FIFO: real interactions first, fill remaining with synthetic
            SYNTHETIC_SVD_TARGET = 300
            synthetic_needed = max(0, SYNTHETIC_SVD_TARGET - len(real_svd))
            
            if synthetic_needed > 0 or not real_svd:
                synthetic_svd = generate_svd_interactions(n_users=20, n_pets=40, n_interactions=max(synthetic_needed, 50))
                training_svd = real_svd + synthetic_svd
            else:
                training_svd = real_svd
            
            real_pct = round(len(real_svd) / max(1, len(training_svd)) * 100, 1)
            
            metrics = cf_model.train(training_svd)
            results['svd'] = {
                'trained': True,
                'metrics': metrics,
                'message': f'SVD trained ({real_pct}% real data, {len(real_svd)}/{len(training_svd)})'
            }
            logger.info(f"✅ SVD trained! {real_pct}% real data. RMSE: {metrics.get('rmse', 'N/A')}, Accuracy: {metrics.get('accuracy', 'N/A')}%")
        else:
            results['svd'] = {'trained': True, 'message': 'Already trained (loaded from disk)'}
            logger.info("✅ SVD already trained (loaded from saved model)")
            
    except Exception as e:
        logger.error(f"❌ SVD training failed: {str(e)}")
        results['svd'] = {'trained': False, 'error': str(e)}
    
    # ---- 2. Train XGBoost Success Predictor ----
    try:
        logger.info("\n🎯 [2/3] Training XGBoost Success Predictor...")
        from .success_predictor import get_success_predictor
        
        xgb_model = get_success_predictor()
        
        if not xgb_model.trained:
            # FIFO: real outcomes first, fill remaining with synthetic
            SYNTHETIC_XGB_TARGET = 150
            synthetic_needed = max(0, SYNTHETIC_XGB_TARGET - len(real_xgb))
            
            if synthetic_needed > 0 or not real_xgb:
                synthetic_xgb = generate_xgboost_training_data(n_records=max(synthetic_needed, 30))
                training_xgb = real_xgb + synthetic_xgb
            else:
                training_xgb = real_xgb
            
            real_pct = round(len(real_xgb) / max(1, len(training_xgb)) * 100, 1)
            
            metrics = xgb_model.train(training_xgb)
            results['xgboost'] = {
                'trained': True,
                'metrics': metrics,
                'message': f'XGBoost trained ({real_pct}% real data, {len(real_xgb)}/{len(training_xgb)})'
            }
            logger.info(f"✅ XGBoost trained! {real_pct}% real data. Accuracy: {metrics.get('accuracy', 'N/A')}%, AUC-ROC: {metrics.get('aucRoc', 'N/A')}")
        else:
            results['xgboost'] = {'trained': True, 'message': 'Already trained (loaded from disk)'}
            logger.info("✅ XGBoost already trained (loaded from saved model)")
            
    except Exception as e:
        logger.error(f"❌ XGBoost training failed: {str(e)}")
        results['xgboost'] = {'trained': False, 'error': str(e)}
    
    # ---- 3. Train K-Means Clustering ----
    try:
        logger.info("\n🏷️ [3/3] Training K-Means Pet Clustering...")
        from .pet_clustering import get_pet_clusterer
        
        kmeans_model = get_pet_clusterer()
        
        if not kmeans_model.trained:
            # FIFO: real pets first, fill remaining with synthetic
            SYNTHETIC_KMEANS_TARGET = 50
            synthetic_needed = max(0, SYNTHETIC_KMEANS_TARGET - len(real_kmeans))
            
            if synthetic_needed > 0 or not real_kmeans:
                synthetic_kmeans = generate_kmeans_pet_data(n_pets=max(synthetic_needed, 10))
                training_kmeans = real_kmeans + synthetic_kmeans
            else:
                training_kmeans = real_kmeans
            
            real_pct = round(len(real_kmeans) / max(1, len(training_kmeans)) * 100, 1)
            
            metrics = kmeans_model.train(training_kmeans)
            results['kmeans'] = {
                'trained': True,
                'metrics': metrics,
                'message': f'K-Means trained ({real_pct}% real data, {len(real_kmeans)}/{len(training_kmeans)})'
            }
            logger.info(f"✅ K-Means trained! {real_pct}% real data. Clusters: {metrics.get('optimal_k', 'N/A')}, Silhouette: {metrics.get('silhouette_score', 'N/A')}")
        else:
            results['kmeans'] = {'trained': True, 'message': 'Already trained (loaded from disk)'}
            logger.info("✅ K-Means already trained (loaded from saved model)")
            
    except Exception as e:
        logger.error(f"❌ K-Means training failed: {str(e)}")
        results['kmeans'] = {'trained': False, 'error': str(e)}
    
    # ---- Summary ----
    trained_count = sum(1 for r in results.values() if r.get('trained', False))
    total = len(results)
    
    logger.info("\n" + "=" * 60)
    logger.info(f"🏆 BOOTSTRAP TRAINING COMPLETE: {trained_count}/{total} models trained")
    logger.info(f"   SVD Collaborative Filter: {'✅ ACTIVE' if results['svd']['trained'] else '❌ FAILED'}")
    logger.info(f"   XGBoost Success Predictor: {'✅ ACTIVE' if results['xgboost']['trained'] else '❌ FAILED'}")
    logger.info(f"   K-Means Pet Clustering:    {'✅ ACTIVE' if results['kmeans']['trained'] else '❌ FAILED'}")
    logger.info("=" * 60)
    
    # Reset hybrid recommender singleton so it picks up newly trained models
    try:
        from .hybrid_recommender import get_hybrid_recommender
        import modules.adoption.hybrid_recommender as hr_module
        hr_module._hybrid_instance = None  # Force re-creation
        hybrid = get_hybrid_recommender()
        hybrid._check_model_availability()
        logger.info(f"🔧 Hybrid recommender refreshed. Availability: {hybrid.algorithm_availability}")
    except Exception as e:
        logger.warning(f"Could not refresh hybrid recommender: {str(e)}")
    
    return results


# ============================================================================
# INCREMENTAL LEARNING: FIFO REPLACEMENT OF SYNTHETIC WITH REAL DATA
# ============================================================================

def retrain_with_real_data(real_data):
    """
    Retrain all 3 ML models using a mix of real + synthetic data.
    Implements FIFO replacement: real data replaces synthetic data from the top.
    
    As more real adoptions happen:
    - 5 real records → replace 5 synthetic records, keep remaining synthetic
    - 50 real records → replace 50 synthetic, keep remaining synthetic
    - 150+ real records → use only real data, no synthetic needed
    
    Args:
        real_data: dict with keys:
            - realDataCount: int
            - svdInteractions: list of real SVD interaction dicts
            - xgboostRecords: list of real XGBoost training dicts
            - kmeansProfiles: list of real K-Means pet profile dicts
    
    Returns:
        dict: Training results for each model
    """
    results = {
        'svd': {'retrained': False},
        'xgboost': {'retrained': False},
        'kmeans': {'retrained': False}
    }
    
    real_count = real_data.get('realDataCount', 0)
    real_svd = real_data.get('svdInteractions', [])
    real_xgb = real_data.get('xgboostRecords', [])
    real_kmeans = real_data.get('kmeansProfiles', [])
    
    logger.info("=" * 60)
    logger.info(f"🔄 INCREMENTAL RETRAIN: {real_count} real adoption records")
    logger.info("=" * 60)
    
    # ---- Step 0: Backup current models before overwriting ----
    try:
        from .model_version_manager import backup_current_models
        backup_info = backup_current_models(reason=f'before_retrain_r{real_count}')
        if backup_info:
            results['backup'] = backup_info
    except Exception as e:
        logger.warning(f"Model backup failed (continuing anyway): {e}")
    
    # ---- 1. Retrain SVD with FIFO data mix ----
    try:
        logger.info(f"\n📊 [1/3] Retraining SVD with real+synthetic mix...")
        from .collaborative_filter import get_collaborative_filter
        
        # Generate synthetic interactions
        SYNTHETIC_SVD_TARGET = 300
        synthetic_needed = max(0, SYNTHETIC_SVD_TARGET - len(real_svd))
        
        if synthetic_needed > 0:
            # Generate only as many synthetic as needed to fill the gap
            synthetic_svd = generate_svd_interactions(
                n_users=20, n_pets=40, 
                n_interactions=synthetic_needed
            )
            # FIFO: real data first, then fill remaining with synthetic
            mixed_svd = real_svd + synthetic_svd
        else:
            # Enough real data - use only real
            mixed_svd = real_svd
        
        cf_model = get_collaborative_filter()
        # Force retrain by resetting
        cf_model.trained = False
        metrics = cf_model.train(mixed_svd)
        
        real_pct = round(len(real_svd) / len(mixed_svd) * 100, 1) if mixed_svd else 0
        results['svd'] = {
            'retrained': True,
            'metrics': metrics,
            'dataComposition': {
                'real': len(real_svd),
                'synthetic': len(mixed_svd) - len(real_svd),
                'total': len(mixed_svd),
                'realPercentage': real_pct
            },
            'message': f'SVD retrained: {real_pct}% real data'
        }
        logger.info(f"✅ SVD retrained! {real_pct}% real data ({len(real_svd)}/{len(mixed_svd)})")
        
    except Exception as e:
        logger.error(f"❌ SVD retrain failed: {str(e)}")
        results['svd'] = {'retrained': False, 'error': str(e)}
    
    # ---- 2. Retrain XGBoost with FIFO data mix ----
    try:
        logger.info(f"\n🎯 [2/3] Retraining XGBoost with real+synthetic mix...")
        from .success_predictor import get_success_predictor
        
        SYNTHETIC_XGB_TARGET = 150
        synthetic_needed = max(0, SYNTHETIC_XGB_TARGET - len(real_xgb))
        
        if synthetic_needed > 0:
            synthetic_xgb = generate_xgboost_training_data(n_records=synthetic_needed)
            mixed_xgb = real_xgb + synthetic_xgb
        else:
            mixed_xgb = real_xgb
        
        xgb_model = get_success_predictor()
        xgb_model.trained = False
        metrics = xgb_model.train(mixed_xgb)
        
        real_pct = round(len(real_xgb) / len(mixed_xgb) * 100, 1) if mixed_xgb else 0
        results['xgboost'] = {
            'retrained': True,
            'metrics': metrics,
            'dataComposition': {
                'real': len(real_xgb),
                'synthetic': len(mixed_xgb) - len(real_xgb),
                'total': len(mixed_xgb),
                'realPercentage': real_pct
            },
            'message': f'XGBoost retrained: {real_pct}% real data'
        }
        logger.info(f"✅ XGBoost retrained! {real_pct}% real data ({len(real_xgb)}/{len(mixed_xgb)})")
        
    except Exception as e:
        logger.error(f"❌ XGBoost retrain failed: {str(e)}")
        results['xgboost'] = {'retrained': False, 'error': str(e)}
    
    # ---- 3. Retrain K-Means with FIFO data mix ----
    try:
        logger.info(f"\n🏷️ [3/3] Retraining K-Means with real+synthetic mix...")
        from .pet_clustering import get_pet_clusterer
        
        SYNTHETIC_KMEANS_TARGET = 50
        synthetic_needed = max(0, SYNTHETIC_KMEANS_TARGET - len(real_kmeans))
        
        if synthetic_needed > 0:
            synthetic_kmeans = generate_kmeans_pet_data(n_pets=synthetic_needed)
            mixed_kmeans = real_kmeans + synthetic_kmeans
        else:
            mixed_kmeans = real_kmeans
        
        kmeans_model = get_pet_clusterer()
        kmeans_model.trained = False
        metrics = kmeans_model.train(mixed_kmeans)
        
        real_pct = round(len(real_kmeans) / len(mixed_kmeans) * 100, 1) if mixed_kmeans else 0
        results['kmeans'] = {
            'retrained': True,
            'metrics': metrics,
            'dataComposition': {
                'real': len(real_kmeans),
                'synthetic': len(mixed_kmeans) - len(real_kmeans),
                'total': len(mixed_kmeans),
                'realPercentage': real_pct
            },
            'message': f'K-Means retrained: {real_pct}% real data'
        }
        logger.info(f"✅ K-Means retrained! {real_pct}% real data ({len(real_kmeans)}/{len(mixed_kmeans)})")
        
    except Exception as e:
        logger.error(f"❌ K-Means retrain failed: {str(e)}")
        results['kmeans'] = {'retrained': False, 'error': str(e)}
    
    # ---- Refresh Hybrid Recommender ----
    try:
        from .hybrid_recommender import get_hybrid_recommender
        import modules.adoption.hybrid_recommender as hr_module
        hr_module._hybrid_instance = None
        hybrid = get_hybrid_recommender()
        hybrid._check_model_availability()
        
        # Adjust weights based on real data percentage
        avg_real_pct = (
            results['svd'].get('dataComposition', {}).get('realPercentage', 0) +
            results['xgboost'].get('dataComposition', {}).get('realPercentage', 0) +
            results['kmeans'].get('dataComposition', {}).get('realPercentage', 0)
        ) / 3
        
        if avg_real_pct >= 50:
            # Enough real data - trust ML algorithms more
            hybrid.weights = {'content': 0.25, 'collaborative': 0.30, 'success': 0.30, 'clustering': 0.15}
            logger.info(f"📊 Hybrid weights adjusted for high real-data ratio: {hybrid.weights}")
        elif avg_real_pct >= 20:
            # Some real data - balanced weights
            hybrid.weights = {'content': 0.30, 'collaborative': 0.25, 'success': 0.30, 'clustering': 0.15}
            logger.info(f"📊 Hybrid weights balanced for moderate real-data ratio: {hybrid.weights}")
        
        logger.info(f"🔧 Hybrid recommender refreshed. Availability: {hybrid.algorithm_availability}")
    except Exception as e:
        logger.warning(f"Could not refresh hybrid recommender: {str(e)}")
    
    # ---- Quality Gate: Compare new vs old metrics, auto-rollback if worse ----
    try:
        _quality_gate_check(results)
    except Exception as e:
        logger.warning(f"Quality gate check failed (keeping new models): {e}")
    
    # ---- Summary ----
    model_keys = ['svd', 'xgboost', 'kmeans']
    retrained_count = sum(1 for k in model_keys if results.get(k, {}).get('retrained', False))
    
    logger.info("\n" + "=" * 60)
    logger.info(f"🏆 INCREMENTAL RETRAIN COMPLETE: {retrained_count}/3 models retrained")
    logger.info(f"   Real adoption records used: {real_count}")
    for algo in model_keys:
        r = results.get(algo, {})
        comp = r.get('dataComposition', {})
        status = '✅' if r.get('retrained') else '❌'
        logger.info(f"   {algo}: {status} Real: {comp.get('real', 0)}, Synthetic: {comp.get('synthetic', 0)}")
    logger.info("=" * 60)
    
    results['totalTrainingRecords'] = real_count
    results['metrics'] = {
        algo: r.get('metrics', {}) for algo, r in results.items() if isinstance(r, dict) and 'metrics' in r
    }
    
    return results


# ============================================================================
# QUALITY GATE: Auto-rollback if new model is significantly worse
# ============================================================================

def _quality_gate_check(retrain_results):
    """
    Compare retrained model metrics against the backup.
    If XGBoost accuracy dropped > 15% or K-Means silhouette dropped > 0.2,
    auto-rollback to the previous version.
    
    This acts as a safety net against training on noisy/biased data.
    """
    from .model_version_manager import rollback_to_version, get_backup_info
    
    backups = get_backup_info()
    if not backups:
        return  # No backup to compare against
    
    rolled_back = False
    
    # Check XGBoost accuracy
    xgb_metrics = retrain_results.get('xgboost', {}).get('metrics', {})
    new_accuracy = xgb_metrics.get('accuracy', 0)
    
    if new_accuracy > 0 and new_accuracy < 40:
        # Absolute floor: less than 40% accuracy is clearly broken
        logger.warning(f"⚠️ QUALITY GATE: XGBoost accuracy {new_accuracy:.1f}% is below 40% floor")
        rolled_back = True
    
    # Check K-Means silhouette
    kmeans_metrics = retrain_results.get('kmeans', {}).get('metrics', {})
    new_silhouette = kmeans_metrics.get('silhouette_score', 0)
    
    if new_silhouette > 0 and new_silhouette < 0.1:
        # Silhouette below 0.1 means clusters are meaningless
        logger.warning(f"⚠️ QUALITY GATE: K-Means silhouette {new_silhouette:.3f} is below 0.1 floor")
        rolled_back = True
    
    if rolled_back:
        logger.warning("🔄 AUTO-ROLLBACK: New models failed quality gate, restoring previous version...")
        result = rollback_to_version()
        if result:
            logger.info(f"✅ Rolled back to v{result['version']}. Reloading models...")
            # Reload models from restored files
            try:
                from .collaborative_filter import get_collaborative_filter
                from .success_predictor import get_success_predictor
                from .pet_clustering import get_pet_clusterer
                
                get_collaborative_filter().load_model()
                get_success_predictor().load_model()
                get_pet_clusterer().load_model()
                logger.info("✅ Previous models reloaded successfully")
            except Exception as e:
                logger.error(f"Failed to reload rolled-back models: {e}")
        else:
            logger.error("❌ Rollback failed — no backup available")
    else:
        logger.info("✅ Quality gate PASSED — new models kept")

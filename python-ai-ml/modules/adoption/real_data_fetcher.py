"""
Real Data Fetcher for ML Bootstrap Training

On Python startup, calls Node.js internal endpoint to get real data from MongoDB:
  GET http://localhost:5000/api/adoption/internal/ml-seed-data

Returns real pets, users, interactions, and adoption outcomes so ML models
can train on ACTUAL data instead of 100% synthetic data.

Falls back gracefully if Node.js is not available.
"""

import urllib.request
import json
import logging
import os
import time

logger = logging.getLogger(__name__)

NODE_BASE_URL = os.environ.get('NODE_API_URL', 'http://localhost:5000')
SEED_DATA_ENDPOINT = f"{NODE_BASE_URL}/api/adoption/internal/ml-seed-data"
ML_INTERNAL_KEY = os.environ.get('ML_INTERNAL_KEY', 'petconnect-ml-internal-2024')
TIMEOUT_SECONDS = 10
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # seconds: 2, 4, 8


def fetch_real_data():
    """
    Fetch real data from Node.js MongoDB endpoint with retry + backoff.
    
    Retries up to MAX_RETRIES times with exponential backoff if Node.js
    isn't ready yet (common when Python starts before Node.js).
    
    Returns:
        dict with keys: pets, users, interactions, adoptionOutcomes, counts
        OR None if Node.js is unavailable after all retries
    """
    last_error = None
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"📡 Fetching real data from Node.js (attempt {attempt}/{MAX_RETRIES}): {SEED_DATA_ENDPOINT}")
            
            req = urllib.request.Request(
                SEED_DATA_ENDPOINT,
                headers={
                    'Accept': 'application/json',
                    'X-Internal-Key': ML_INTERNAL_KEY
                }
            )
            
            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
                raw = response.read().decode('utf-8')
                result = json.loads(raw)
            
            if not result.get('success'):
                logger.warning("Node.js returned success=false")
                return None
            
            data = result.get('data', {})
            counts = data.get('counts', {})
            
            logger.info(
                f"✅ Real data fetched: "
                f"{counts.get('pets', 0)} pets, "
                f"{counts.get('users', 0)} users, "
                f"{counts.get('interactions', 0)} interactions, "
                f"{counts.get('adoptionOutcomes', 0)} adoption outcomes"
            )
            
            return data
        
        except urllib.error.URLError as e:
            last_error = e
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF_BASE ** attempt
                logger.info(f"⏳ Node.js not ready, retrying in {wait}s... ({e})")
                time.sleep(wait)
            else:
                logger.warning(f"⚠️  Node.js not available after {MAX_RETRIES} attempts ({e}). Will use synthetic data.")
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF_BASE ** attempt
                logger.info(f"⏳ Fetch failed, retrying in {wait}s... ({e})")
                time.sleep(wait)
            else:
                logger.warning(f"⚠️  Failed to fetch real data after {MAX_RETRIES} attempts: {e}. Will use synthetic data.")
    
    return None


def format_for_kmeans(real_data):
    """
    Format real pet data for K-Means training.
    
    Args:
        real_data: dict from fetch_real_data()
    
    Returns:
        list of pet dicts suitable for pet_clustering.train()
    """
    pets = real_data.get('pets', [])
    if not pets:
        return []
    
    formatted = []
    for p in pets:
        cp = p.get('compatibilityProfile', {})
        formatted.append({
            '_id': p.get('_id', 'unknown'),
            'name': p.get('name', 'Unknown'),
            'species': p.get('species', 'Dog'),
            'breed': p.get('breed', 'Mixed'),
            'compatibilityProfile': {
                'energyLevel': cp.get('energyLevel', 3),
                'size': cp.get('size', 'medium'),
                'trainedLevel': cp.get('trainedLevel', 'basic'),
                'childFriendlyScore': cp.get('childFriendlyScore', 5),
                'petFriendlyScore': cp.get('petFriendlyScore', 5),
                'noiseLevel': cp.get('noiseLevel', 'moderate'),
                'exerciseNeeds': cp.get('exerciseNeeds', 'moderate'),
                'groomingNeeds': cp.get('groomingNeeds', 'moderate'),
                'canLiveInApartment': cp.get('canLiveInApartment', True),
                'needsYard': cp.get('needsYard', False),
                'canBeLeftAlone': cp.get('canBeLeftAlone', True),
                'maxHoursAlone': cp.get('maxHoursAlone', 6),
                'estimatedMonthlyCost': cp.get('estimatedMonthlyCost', 100),
                'strangerFriendlyScore': cp.get('strangerFriendlyScore', 5),
            }
        })
    
    logger.info(f"   Formatted {len(formatted)} real pets for K-Means")
    return formatted


def format_for_svd(real_data):
    """
    Format real interaction data for SVD training.
    
    Args:
        real_data: dict from fetch_real_data()
    
    Returns:
        list of interaction dicts suitable for collaborative_filter.train()
    """
    interactions = real_data.get('interactions', [])
    if not interactions:
        return []
    
    formatted = []
    for i in interactions:
        formatted.append({
            'userId': i.get('userId', ''),
            'petId': i.get('petId', ''),
            'interactionType': i.get('interactionType', 'viewed'),
            'implicitRating': float(i.get('implicitRating', 1)),
            'timestamp': i.get('timestamp', '')
        })
    
    logger.info(f"   Formatted {len(formatted)} real interactions for SVD")
    return formatted


def format_for_xgboost(real_data):
    """
    Format real adoption outcome data for XGBoost training.
    
    Args:
        real_data: dict from fetch_real_data()
    
    Returns:
        list of training dicts suitable for success_predictor.train()
    """
    outcomes = real_data.get('adoptionOutcomes', [])
    if not outcomes:
        return []
    
    formatted = []
    for o in outcomes:
        formatted.append({
            'userProfile': o.get('userProfile', {}),
            'petProfile': o.get('petProfile', {}),
            'matchScore': float(o.get('matchScore', 50)),
            'successfulAdoption': bool(o.get('successfulAdoption', True))
        })
    
    logger.info(f"   Formatted {len(formatted)} real adoption outcomes for XGBoost")
    return formatted

"""
PetFinder Data Loader
=====================
Loads the PetFinder.my dataset, imputes all missing personality traits
using breed_traits_lookup.py, and outputs records compatible with:
  - XGBoost SuccessPredictor training (success_predictor.py)
  - K-Means PetClusterer training (pet_clustering.py)

Dataset: petfinder-adoption-prediction/train/train.csv
         14,993 real shelter pet records with adoption outcomes.

Usage:
    from modules.adoption.petfinder_data_loader import PetFinderDataLoader
    loader = PetFinderDataLoader()
    xgb_records  = loader.get_xgboost_records()
    kmeans_pets  = loader.get_kmeans_pets()
"""

import os
import random
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Optional

from .breed_traits_lookup import impute_traits, get_traits_batch, MATURITY_SIZE_MAP

logger = logging.getLogger(__name__)

# ============================================================================
# PATHS
# ============================================================================

_HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PETFINDER_DIR = os.path.join(_HERE, 'petfinder-adoption-prediction')
TRAIN_CSV     = os.path.join(PETFINDER_DIR, 'train', 'train.csv')
BREED_CSV     = os.path.join(PETFINDER_DIR, 'breed_labels.csv')


# ============================================================================
# USER ARCHETYPE PROFILES (calibrated to PetFinder adoption patterns)
# Used to pair with pets for XGBoost success prediction training
# Real data shows: 50% adoption within 30 days → users are somewhat selective
# ============================================================================

USER_ARCHETYPES = [
    # Active family with yard (Dog adopters)
    {'homeType': 'house',     'homeSize': 2000, 'hasYard': True,  'yardSize': 500,
     'activityLevel': 4, 'workSchedule': 'remote',    'hoursAlonePerDay': 2,
     'experienceLevel': 'intermediate', 'previousPets': 2,
     'hasChildren': True,  'hasOtherPets': True,  'monthlyBudget': 200,
     'maxAdoptionFee': 500, 'preferredSize': 'medium', 'preferredSpecies': 'Dog'},

    # Single apartment dweller (Cat adopter)
    {'homeType': 'apartment', 'homeSize': 600,  'hasYard': False, 'yardSize': 0,
     'activityLevel': 2, 'workSchedule': 'full_time', 'hoursAlonePerDay': 9,
     'experienceLevel': 'beginner',     'previousPets': 0,
     'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 100,
     'maxAdoptionFee': 200, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},

    # Retired couple (both)
    {'homeType': 'house',     'homeSize': 1500, 'hasYard': True,  'yardSize': 300,
     'activityLevel': 2, 'workSchedule': 'retired',   'hoursAlonePerDay': 1,
     'experienceLevel': 'advanced',     'previousPets': 5,
     'hasChildren': False, 'hasOtherPets': True,  'monthlyBudget': 250,
     'maxAdoptionFee': 600, 'preferredSize': 'medium', 'preferredSpecies': 'Dog'},

    # Young professional (Cat/small dog)
    {'homeType': 'apartment', 'homeSize': 800,  'hasYard': False, 'yardSize': 0,
     'activityLevel': 3, 'workSchedule': 'full_time', 'hoursAlonePerDay': 8,
     'experienceLevel': 'beginner',     'previousPets': 0,
     'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 150,
     'maxAdoptionFee': 300, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},

    # Active outdoor person (large dog)
    {'homeType': 'house',     'homeSize': 1800, 'hasYard': True,  'yardSize': 800,
     'activityLevel': 5, 'workSchedule': 'part_time', 'hoursAlonePerDay': 4,
     'experienceLevel': 'advanced',     'previousPets': 3,
     'hasChildren': False, 'hasOtherPets': True,  'monthlyBudget': 300,
     'maxAdoptionFee': 700, 'preferredSize': 'large',  'preferredSpecies': 'Dog'},

    # Family with young kids (medium gentle dog)
    {'homeType': 'house',     'homeSize': 1200, 'hasYard': True,  'yardSize': 200,
     'activityLevel': 3, 'workSchedule': 'part_time', 'hoursAlonePerDay': 3,
     'experienceLevel': 'intermediate', 'previousPets': 1,
     'hasChildren': True,  'hasOtherPets': False, 'monthlyBudget': 150,
     'maxAdoptionFee': 400, 'preferredSize': 'medium', 'preferredSpecies': 'Dog'},

    # Elderly single (small quiet pet)
    {'homeType': 'apartment', 'homeSize': 500,  'hasYard': False, 'yardSize': 0,
     'activityLevel': 1, 'workSchedule': 'retired',   'hoursAlonePerDay': 2,
     'experienceLevel': 'advanced',     'previousPets': 4,
     'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 100,
     'maxAdoptionFee': 200, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},

    # First-time owner wanting easy cat
    {'homeType': 'apartment', 'homeSize': 700,  'hasYard': False, 'yardSize': 0,
     'activityLevel': 2, 'workSchedule': 'full_time', 'hoursAlonePerDay': 8,
     'experienceLevel': 'beginner',     'previousPets': 0,
     'hasChildren': False, 'hasOtherPets': False, 'monthlyBudget': 80,
     'maxAdoptionFee': 150, 'preferredSize': 'small',  'preferredSpecies': 'Cat'},
]


# ============================================================================
# HEALTH SCORE MAPPING (PetFinder Health field)
# 1=Healthy, 2=Minor Injury, 3=Serious Injury, 0=NA
# ============================================================================

HEALTH_SCORE_MAP = {1: 1.0, 2: 0.7, 3: 0.4, 0: 0.8}
VACCINATED_SCORE = {1: 1.0, 2: 0.5, 3: 0.7, 0: 0.6}  # 1=Yes, 2=No, 3=NotSure
STERILIZED_SCORE = {1: 1.0, 2: 0.6, 3: 0.7, 0: 0.6}


# ============================================================================
# ADOPTION SPEED → SUCCESS LABEL
# Speed 0,1,2 = adopted within 30 days → success=True (real interest seen)
# Speed 3,4   = 31-100+ days or never   → success=False
# Distribution: True=7537 (50.3%), False=7456 (49.7%) — nearly balanced!
# ============================================================================

def _speed_to_success(speed: int) -> bool:
    return speed <= 2


# ============================================================================
# COMPATIBILITY SCORE (user ↔ pet match)
# Mirrors _compute_compatibility_rating in bootstrap_training.py
# Needed to generate realistic XGBoost training labels
# ============================================================================

def _compute_compatibility(user: dict, pet_traits: dict, pet_info: dict) -> float:
    """Score 0-100 for how well a user matches a pet's real traits."""
    score = 50.0  # Base

    # Activity / energy match
    user_activity = user['activityLevel']       # 1-5
    pet_energy    = pet_traits['energyLevel']   # 1-5
    diff = abs(user_activity - pet_energy)
    score += (2 - diff) * 6   # +12 for perfect match, -6 for diff=2, -18 for diff=3

    # Space constraints
    species = 'Dog' if pet_info.get('Type', 1) == 1 else 'Cat'
    if user['homeType'] == 'apartment':
        if not pet_traits.get('canLiveInApartment', True):
            score -= 15
        if pet_traits.get('size') == 'large':
            score -= 10
    elif user.get('hasYard') and pet_traits.get('needsYard', False):
        score += 8   # Good match — yard dog in house with yard

    # Child safety
    if user['hasChildren']:
        child_score = pet_traits.get('childFriendlyScore', 5)
        if child_score >= 8:
            score += 12
        elif child_score <= 3:
            score -= 20
        elif child_score <= 5:
            score -= 8

    # Other pets
    if user['hasOtherPets']:
        pet_fr = pet_traits.get('petFriendlyScore', 5)
        if pet_fr >= 8:
            score += 8
        elif pet_fr <= 3:
            score -= 12

    # Budget match
    monthly_cost = pet_traits.get('estimatedMonthlyCost', 120)
    if user['monthlyBudget'] >= monthly_cost:
        score += 5
    else:
        overage = monthly_cost - user['monthlyBudget']
        score -= min(15, overage / 10)

    # Work schedule / alone time
    hours_alone    = user['hoursAlonePerDay']
    max_alone      = pet_traits.get('maxHoursAlone', 8)
    can_be_alone   = pet_traits.get('canBeLeftAlone', True)
    if hours_alone > max_alone + 2 and not can_be_alone:
        score -= 15
    elif hours_alone <= max_alone:
        score += 5

    # Experience vs difficulty
    exp_map  = {'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4}
    diff_map = {'untrained': 3, 'basic': 2, 'intermediate': 1, 'advanced': 0}
    u_exp    = exp_map.get(user['experienceLevel'], 1)
    p_diff   = diff_map.get(pet_traits.get('trainedLevel', 'basic'), 2)
    if u_exp >= p_diff:
        score += 5
    else:
        score -= 8 * (p_diff - u_exp)

    # Adoption fee
    adoption_fee = pet_info.get('Fee', 0)
    if adoption_fee <= user['maxAdoptionFee']:
        score += 3
    else:
        score -= 10

    # Preferred species alignment
    pref_species = user.get('preferredSpecies', '')
    if pref_species and pref_species == species:
        score += 10

    # Health bonus
    health = pet_info.get('Health', 1)
    score += HEALTH_SCORE_MAP.get(health, 0.8) * 5
    if pet_info.get('Vaccinated', 3) == 1:
        score += 3

    # Noise level for apartment dwellers
    noise = pet_traits.get('noiseLevel', 'moderate')
    if user['homeType'] == 'apartment' and noise == 'vocal':
        score -= 8

    return round(max(0, min(100, score + random.gauss(0, 3))), 1)


# ============================================================================
# MAIN DATA LOADER CLASS
# ============================================================================

class PetFinderDataLoader:
    """
    Load and transform PetFinder dataset into formats compatible with
    the existing XGBoost and K-Means training pipelines.
    """

    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = dataset_path or TRAIN_CSV
        self.breed_csv    = BREED_CSV
        self._df          = None
        self._breeds      = None
        self._traits_list = None
        self._loaded      = False

    def _load(self):
        """Load and validate the CSVs."""
        if self._loaded:
            return

        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(
                f"PetFinder dataset not found at: {self.dataset_path}\n"
                f"Expected in: {PETFINDER_DIR}"
            )

        logger.info(f"📂 Loading PetFinder dataset from {self.dataset_path}")
        self._df     = pd.read_csv(self.dataset_path)
        self._breeds = pd.read_csv(self.breed_csv) if os.path.exists(self.breed_csv) else pd.DataFrame()

        logger.info(f"✅ Loaded {len(self._df):,} pet records, {len(self._df.columns)} columns")

        # Impute all missing traits in batch
        logger.info("🔬 Imputing personality traits from breed lookup...")
        self._traits_list = get_traits_batch(self._df)
        logger.info(f"✅ Imputed traits for all {len(self._traits_list):,} pets")

        self._loaded = True

    def get_dataframe(self) -> pd.DataFrame:
        """Return the raw PetFinder DataFrame (all 24 columns)."""
        self._load()
        return self._df.copy()

    # =========================================================================
    # XGBOOST RECORDS
    # =========================================================================

    def get_xgboost_records(self, n_user_samples: int = 3) -> List[Dict]:
        """
        Generate XGBoost training records.

        Each real pet is paired with multiple randomly-selected user archetypes.
        Success label = AdoptionSpeed <= 2 AND compatibility score is high.

        Args:
            n_user_samples: How many user archetypes to pair per pet (default 3)
                            → 14,993 × 3 = ~45,000 training records

        Returns:
            List of dicts matching SuccessPredictor training format
        """
        self._load()
        records = []

        for i, (_, row) in enumerate(self._df.iterrows()):
            pet_traits = self._traits_list[i]
            pet_info   = row.to_dict()

            # Real adoption outcome
            actual_speed   = int(row.get('AdoptionSpeed', 4))
            was_adopted    = _speed_to_success(actual_speed)

            # Health multiplier (reduces success probability for unhealthy pets)
            health_mult = HEALTH_SCORE_MAP.get(int(row.get('Health', 1)), 0.8)

            for _ in range(n_user_samples):
                user = random.choice(USER_ARCHETYPES).copy()

                # Add small noise to user profile for variety
                user['activityLevel']    = max(1, min(5, user['activityLevel'] + random.randint(-1, 1)))
                user['monthlyBudget']    = max(50, user['monthlyBudget'] + random.randint(-30, 30))
                user['hoursAlonePerDay'] = max(0, min(12, user['hoursAlonePerDay'] + random.randint(-1, 1)))

                # Compatibility score
                match_score = _compute_compatibility(user, pet_traits, pet_info)

                # Final success label — real adoption + good compatibility
                # If pet was adopted fast, high-compat users would succeed
                # If pet was NOT adopted, low-compat users would struggle
                if was_adopted:
                    success = match_score >= 40  # Generous if actually adopted
                else:
                    success = match_score >= 65  # Requires strong match if hard to adopt

                # Apply health penalty probabilistically
                if health_mult < 0.8 and random.random() > health_mult:
                    success = False

                records.append({
                    'userProfile': {
                        'homeType':         user['homeType'],
                        'homeSize':         user['homeSize'],
                        'hasYard':          user['hasYard'],
                        'activityLevel':    user['activityLevel'],
                        'workSchedule':     user['workSchedule'],
                        'hoursAlonePerDay': user['hoursAlonePerDay'],
                        'experienceLevel':  user['experienceLevel'],
                        'previousPets':     user['previousPets'],
                        'hasChildren':      user['hasChildren'],
                        'hasOtherPets':     user['hasOtherPets'],
                        'monthlyBudget':    user['monthlyBudget'],
                        'maxAdoptionFee':   user['maxAdoptionFee'],
                    },
                    'petProfile': {
                        'size':                  pet_traits['size'],
                        'energyLevel':           pet_traits['energyLevel'],
                        'exerciseNeeds':         pet_traits['exerciseNeeds'],
                        'trainingNeeds':         pet_traits['trainingNeeds'],
                        'trainedLevel':          pet_traits['trainedLevel'],
                        'childFriendlyScore':    pet_traits['childFriendlyScore'],
                        'petFriendlyScore':      pet_traits['petFriendlyScore'],
                        'strangerFriendlyScore': pet_traits['strangerFriendlyScore'],
                        'needsYard':             pet_traits['needsYard'],
                        'canLiveInApartment':    pet_traits['canLiveInApartment'],
                        'groomingNeeds':         pet_traits['groomingNeeds'],
                        'estimatedMonthlyCost':  pet_traits['estimatedMonthlyCost'],
                        'noiseLevel':            pet_traits['noiseLevel'],
                        'canBeLeftAlone':        pet_traits['canBeLeftAlone'],
                        'maxHoursAlone':         pet_traits['maxHoursAlone'],
                        'requiresExperiencedOwner': pet_traits['requiresExperiencedOwner'],
                    },
                    'matchScore':          match_score,
                    'successfulAdoption':  success,
                    # Extra metadata for analysis (not used in training)
                    '_source':             'petfinder',
                    '_adoptionSpeed':      actual_speed,
                    '_breed_id':           int(row.get('Breed1', 0)),
                    '_species':            'Dog' if int(row.get('Type', 1)) == 1 else 'Cat',
                })

        success_count = sum(1 for r in records if r['successfulAdoption'])
        logger.info(
            f"✅ Generated {len(records):,} XGBoost records from {len(self._df):,} real pets "
            f"({n_user_samples} user samples each)\n"
            f"   Success: {success_count:,} ({100*success_count/len(records):.1f}%) | "
            f"   Failed:  {len(records)-success_count:,} ({100*(len(records)-success_count)/len(records):.1f}%)"
        )
        return records

    # =========================================================================
    # KMEANS PET RECORDS
    # =========================================================================

    def get_kmeans_pets(self) -> List[Dict]:
        """
        Generate K-Means pet clustering records.

        Returns:
            List of dicts matching PetClusterer training format
            (same as generate_kmeans_pet_data in bootstrap_training.py)
        """
        self._load()
        pets = []

        for i, (_, row) in enumerate(self._df.iterrows()):
            pet_traits = self._traits_list[i]

            species_type = int(row.get('Type', 1))
            species      = 'Dog' if species_type == 1 else 'Cat'
            breed_id     = int(row.get('Breed1', 307))
            name         = str(row.get('Name', '')) or f'{species}_{i}'

            pets.append({
                '_id':     f"pf_{str(row.get('PetID', i))[:12]}",
                'name':    name,
                'species': species,
                'breed':   f"breed_{breed_id}",  # Numeric ID as breed token
                'age':     int(row.get('Age', 12)),
                '_source': 'petfinder',
                'compatibilityProfile': {
                    'size':                  pet_traits['size'],
                    'energyLevel':           pet_traits['energyLevel'],
                    'exerciseNeeds':         pet_traits['exerciseNeeds'],
                    'trainingNeeds':         pet_traits['trainingNeeds'],
                    'trainedLevel':          pet_traits['trainedLevel'],
                    'childFriendlyScore':    pet_traits['childFriendlyScore'],
                    'petFriendlyScore':      pet_traits['petFriendlyScore'],
                    'strangerFriendlyScore': pet_traits['strangerFriendlyScore'],
                    'needsYard':             pet_traits['needsYard'],
                    'canLiveInApartment':    pet_traits['canLiveInApartment'],
                    'groomingNeeds':         pet_traits['groomingNeeds'],
                    'estimatedMonthlyCost':  pet_traits['estimatedMonthlyCost'],
                    'noiseLevel':            pet_traits['noiseLevel'],
                    'canBeLeftAlone':        pet_traits['canBeLeftAlone'],
                    'maxHoursAlone':         pet_traits['maxHoursAlone'],
                    'requiresExperiencedOwner': pet_traits['requiresExperiencedOwner'],
                }
            })

        logger.info(f"✅ Prepared {len(pets):,} real pets for K-Means clustering")
        return pets

    # =========================================================================
    # QUICK STATS
    # =========================================================================

    def print_stats(self):
        """Print a quick summary of the loaded dataset and imputed traits."""
        self._load()
        df = self._df

        print(f"\n{'='*55}")
        print(f"  PetFinder Dataset Summary")
        print(f"{'='*55}")
        print(f"  Total pets:         {len(df):,}")
        print(f"  Dogs:               {(df['Type']==1).sum():,} ({100*(df['Type']==1).mean():.1f}%)")
        print(f"  Cats:               {(df['Type']==2).sum():,} ({100*(df['Type']==2).mean():.1f}%)")
        print(f"\n  Adoption Speed:")
        for spd, label in [(0,'Same day'), (1,'1 week'), (2,'1 month'), (3,'3 months'), (4,'Never')]:
            n = (df['AdoptionSpeed'] == spd).sum()
            print(f"    Speed {spd} ({label}): {n:,} ({100*n/len(df):.1f}%)")

        adopted = (df['AdoptionSpeed'] <= 2).sum()
        print(f"\n  SUCCESS (speed 0-2): {adopted:,} ({100*adopted/len(df):.1f}%)")
        print(f"  FAILED  (speed 3-4): {len(df)-adopted:,} ({100*(len(df)-adopted)/len(df):.1f}%)")

        print(f"\n  Imputed trait sample (first pet):")
        sample = self._traits_list[0]
        for k, v in sample.items():
            print(f"    {k}: {v}")
        print(f"{'='*55}\n")

"""
Custom India-Focused Adoption Dataset Loader
=============================================
Reads data/custom_adoption_dataset.csv and converts it to the
exact format expected by SuccessPredictor and PetClusterer.

No imputation needed — the custom CSV already has all schema fields.

Usage:
    from modules.adoption.custom_data_loader import CustomDataLoader

    loader = CustomDataLoader()
    xgboost_records = loader.get_xgboost_records()   # ~2,500 records
    kmeans_pets     = loader.get_kmeans_pets()         # 845 pet profiles
    loader.print_stats()
"""

import os
import csv
import random
import logging

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', 'data', 'custom_adoption_dataset.csv'
)

# ─────────────────────────────────────────────────────────────────────────────
# USER ARCHETYPES — same as PetFinderDataLoader for consistency
# ─────────────────────────────────────────────────────────────────────────────
USER_ARCHETYPES = [
    {
        'id': 'archetype_active_family',
        'hasChildren': True,
        'hasOtherPets': True,
        'activityLevel': 5,
        'livingSituation': 'house_with_yard',
        'experienceLevel': 'intermediate',
        'budget': 6000,
        'hoursAway': 5,
        'preferredSpecies': 'any',
    },
    {
        'id': 'archetype_single_apartment',
        'hasChildren': False,
        'hasOtherPets': False,
        'activityLevel': 2,
        'livingSituation': 'apartment',
        'experienceLevel': 'beginner',
        'budget': 2500,
        'hoursAway': 9,
        'preferredSpecies': 'cat',
    },
    {
        'id': 'archetype_retired_couple',
        'hasChildren': False,
        'hasOtherPets': False,
        'activityLevel': 2,
        'livingSituation': 'house_no_yard',
        'experienceLevel': 'intermediate',
        'budget': 3000,
        'hoursAway': 3,
        'preferredSpecies': 'dog',
    },
    {
        'id': 'archetype_young_professional',
        'hasChildren': False,
        'hasOtherPets': True,
        'activityLevel': 3,
        'livingSituation': 'apartment',
        'experienceLevel': 'beginner',
        'budget': 4000,
        'hoursAway': 8,
        'preferredSpecies': 'any',
    },
    {
        'id': 'archetype_outdoor_person',
        'hasChildren': False,
        'hasOtherPets': False,
        'activityLevel': 5,
        'livingSituation': 'house_with_yard',
        'experienceLevel': 'expert',
        'budget': 5000,
        'hoursAway': 4,
        'preferredSpecies': 'dog',
    },
    {
        'id': 'archetype_family_kids',
        'hasChildren': True,
        'hasOtherPets': False,
        'activityLevel': 3,
        'livingSituation': 'house_with_yard',
        'experienceLevel': 'intermediate',
        'budget': 4500,
        'hoursAway': 5,
        'preferredSpecies': 'dog',
    },
    {
        'id': 'archetype_elderly_single',
        'hasChildren': False,
        'hasOtherPets': False,
        'activityLevel': 1,
        'livingSituation': 'apartment',
        'experienceLevel': 'intermediate',
        'budget': 2500,
        'hoursAway': 2,
        'preferredSpecies': 'cat',
    },
    {
        'id': 'archetype_first_time_owner',
        'hasChildren': True,
        'hasOtherPets': False,
        'activityLevel': 3,
        'livingSituation': 'apartment',
        'experienceLevel': 'beginner',
        'budget': 3000,
        'hoursAway': 6,
        'preferredSpecies': 'any',
    },
]

EXPERIENCE_ORDER = {'beginner': 1, 'intermediate': 2, 'expert': 3}

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _bool(val):
    """Parse a boolean from CSV string."""
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ('true', '1', 'yes')


def _int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _compute_compatibility(user: dict, pet: dict) -> float:
    """
    Score a user-pet pair on 0-100.
    pet dict contains raw CSV columns (snake_case).
    """
    score = 50.0

    # 1. Activity level vs energy
    activity_diff = abs(user['activityLevel'] - pet['energy_level'])
    score -= activity_diff * 5

    # 2. Living situation vs space needs
    needs_yard      = _bool(pet['needs_yard'])
    can_apartment   = _bool(pet['can_live_in_apartment'])
    living          = user['livingSituation']

    if needs_yard and 'apartment' in living:
        score -= 20
    elif can_apartment and 'apartment' in living:
        score += 10
    elif 'yard' in living and not needs_yard:
        score += 5

    # 3. Children
    if user['hasChildren']:
        child_sc = _float(pet['child_friendly_score'])
        score += (child_sc - 5) * 2.5

    # 4. Other pets
    if user['hasOtherPets']:
        pet_sc = _float(pet['pet_friendly_score'])
        score += (pet_sc - 5) * 2.0

    # 5. Budget
    cost = _float(pet['estimated_monthly_cost'])
    if cost > user['budget']:
        score -= min(20, (cost - user['budget']) / user['budget'] * 30)
    else:
        score += 5

    # 6. Hours alone
    user_away  = user['hoursAway']
    max_alone  = _float(pet['max_hours_alone'])
    can_alone  = _bool(pet['can_be_left_alone'])
    if user_away > max_alone:
        score -= min(15, (user_away - max_alone) * 3)
    if not can_alone and user_away > 4:
        score -= 10

    # 7. Experience
    exp_val     = EXPERIENCE_ORDER.get(user['experienceLevel'], 1)
    needs_exp   = _bool(pet['requires_experienced_owner'])
    if needs_exp and exp_val < 2:
        score -= 15
    elif not needs_exp and exp_val >= 2:
        score += 5

    # 8. Species preference
    pref = user.get('preferredSpecies', 'any')
    if pref != 'any' and pref != pet['species'].lower():
        score -= 12


    # 9. Health
    health = pet.get('health_status', 'healthy')
    if health == 'serious_condition':
        score -= 10
    elif health == 'healthy':
        score += 5

    # 10. Noise
    noise = pet.get('noise_level', 'moderate')
    if noise == 'vocal' and 'apartment' in living:
        score -= 8

    return max(0.0, min(100.0, score))


# ─────────────────────────────────────────────────────────────────────────────
# LOADER CLASS
# ─────────────────────────────────────────────────────────────────────────────

class CustomDataLoader:
    """
    Load the India-focused custom CSV and produce training records for:
      • SuccessPredictor  (XGBoost)
      • PetClusterer      (K-Means)
    """

    def __init__(self, csv_path: str = CSV_PATH):
        self.csv_path = csv_path
        self._pets: list[dict] = []
        self._load()

    # ── Internal ──────────────────────────────────────────────────────────

    def _load(self):
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(
                f"Custom dataset CSV not found at:\n  {self.csv_path}\n"
                f"Run generate_custom_dataset.py first."
            )

        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Parse types
                row['age_months']               = _int(row.get('age_months', 12))
                row['energy_level']             = _int(row.get('energy_level', 3))
                row['child_friendly_score']     = _float(row.get('child_friendly_score', 5))
                row['pet_friendly_score']       = _float(row.get('pet_friendly_score', 5))
                row['stranger_friendly_score']  = _float(row.get('stranger_friendly_score', 5))
                row['needs_yard']               = _bool(row.get('needs_yard', False))
                row['can_live_in_apartment']    = _bool(row.get('can_live_in_apartment', True))
                row['estimated_monthly_cost']   = _float(row.get('estimated_monthly_cost', 2000))
                row['can_be_left_alone']        = _bool(row.get('can_be_left_alone', True))
                row['max_hours_alone']          = _float(row.get('max_hours_alone', 6))
                row['requires_experienced_owner'] = _bool(row.get('requires_experienced_owner', False))
                row['adoption_success']         = _bool(row.get('adoption_success', True))
                # Normalize species to 'Dog' or 'Cat' (Title-case) so comparisons are consistent
                raw_species = str(row.get('species', '')).strip()
                row['species'] = raw_species[0].upper() + raw_species[1:].lower() if raw_species else 'Dog'
                self._pets.append(row)

        logger.info(f"CustomDataLoader: loaded {len(self._pets)} pet records from custom CSV")

    # ── Public API ─────────────────────────────────────────────────────────

    def get_dataframe(self):
        """Return raw list of dicts (one per CSV row)."""
        return list(self._pets)

    def get_xgboost_records(self, n_user_samples: int = 3) -> list[dict]:
        """
        Build XGBoost training records — same format as bootstrap_training.py.

        Each pet is paired with `n_user_samples` random user archetypes,
        producing len(pets) * n_user_samples rows (≈2,500 with default 3).

        Record shape:
          {
            userProfile: {...},
            petProfile:  {...},
            matchScore:  float,
            successfulAdoption: bool,
            _source:     'custom_india',
            ...
          }
        """
        records = []
        for pet in self._pets:
            users = random.sample(USER_ARCHETYPES,
                                  min(n_user_samples, len(USER_ARCHETYPES)))
            for user in users:
                match_score = _compute_compatibility(user, pet)

                record = {
                    'userProfile': {
                        'hasChildren':       user['hasChildren'],
                        'hasOtherPets':      user['hasOtherPets'],
                        'activityLevel':     user['activityLevel'],
                        'livingSituation':   user['livingSituation'],
                        'experienceLevel':   user['experienceLevel'],
                        'budget':            user['budget'],
                        'hoursAway':         user['hoursAway'],
                        'preferredSpecies':  user.get('preferredSpecies', 'any'),
                    },
                    'petProfile': {
                        'species':                   pet['species'],
                        'breed':                     pet['breed'],
                        'age':                       pet['age_months'],
                        'size':                      pet['size'],
                        'energyLevel':               pet['energy_level'],
                        'exerciseNeeds':             pet['exercise_needs'],
                        'trainingNeeds':             pet['training_needs'],
                        'trainedLevel':              pet['trained_level'],
                        'childFriendlyScore':        pet['child_friendly_score'],
                        'petFriendlyScore':          pet['pet_friendly_score'],
                        'strangerFriendlyScore':     pet['stranger_friendly_score'],
                        'needsYard':                 pet['needs_yard'],
                        'canLiveInApartment':        pet['can_live_in_apartment'],
                        'groomingNeeds':             pet['grooming_needs'],
                        'estimatedMonthlyCost':      pet['estimated_monthly_cost'],
                        'noiseLevel':                pet['noise_level'],
                        'canBeLeftAlone':            pet['can_be_left_alone'],
                        'maxHoursAlone':             pet['max_hours_alone'],
                        'requiresExperiencedOwner':  pet['requires_experienced_owner'],
                    },
                    'matchScore':          match_score,
                    'successfulAdoption':  pet['adoption_success'],
                    '_source':             'custom_india',
                    '_breed':              pet['breed'],
                    '_species':            pet['species'],
                    '_origin':             pet.get('origin', 'Unknown'),
                }
                records.append(record)

        logger.info(f"CustomDataLoader: generated {len(records):,} XGBoost training records")
        return records

    def get_kmeans_pets(self) -> list[dict]:
        """
        Build K-Means pet profiles — same format used by PetClusterer.

        Shape per pet:
          {
            _id:  str,
            name: str,
            species: str,
            breed: str,
            age: int,
            compatibilityProfile: {...}
          }
        """
        pets = []
        for idx, pet in enumerate(self._pets):
            pets.append({
                '_id':     f'custom_{idx:04d}',
                'name':    pet.get('name', 'Unknown'),
                'species': pet['species'],
                'breed':   pet['breed'],
                'age':     pet['age_months'],
                'compatibilityProfile': {
                    'energyLevel':               pet['energy_level'],
                    'exerciseNeeds':             pet['exercise_needs'],
                    'trainingNeeds':             pet['training_needs'],
                    'trainedLevel':              pet['trained_level'],
                    'childFriendlyScore':        pet['child_friendly_score'],
                    'petFriendlyScore':          pet['pet_friendly_score'],
                    'strangerFriendlyScore':     pet['stranger_friendly_score'],
                    'needsYard':                 pet['needs_yard'],
                    'canLiveInApartment':        pet['can_live_in_apartment'],
                    'groomingNeeds':             pet['grooming_needs'],
                    'estimatedMonthlyCost':      pet['estimated_monthly_cost'],
                    'noiseLevel':                pet['noise_level'],
                    'canBeLeftAlone':            pet['can_be_left_alone'],
                    'maxHoursAlone':             pet['max_hours_alone'],
                    'requiresExperiencedOwner':  pet['requires_experienced_owner'],
                },
            })
        logger.info(f"CustomDataLoader: generated {len(pets):,} K-Means pet profiles")
        return pets

    def print_stats(self):
        total   = len(self._pets)
        if total == 0:
            print("No records loaded."); return

        dogs    = sum(1 for p in self._pets if p['species'] == 'Dog')
        cats    = sum(1 for p in self._pets if p['species'] == 'Cat')
        indian  = sum(1 for p in self._pets if p.get('origin') == 'Indian')
        success = sum(1 for p in self._pets if p['adoption_success'])

        # Species consistency check — must only be 'Dog' or 'Cat'
        species_set = set(p['species'] for p in self._pets)
        species_ok  = species_set <= {'Dog', 'Cat'}

        mongo_breeds = ['British Shorthair', 'German Shepherd', 'Golden Retriever', 'Persian Cats']

        breeds  = {}
        for p in self._pets:
            breeds[p['breed']] = breeds.get(p['breed'], 0) + 1

        div = '-' * 60
        print('\n' + div)
        print('  Custom India Dataset - Loader Stats')
        print(div)
        print(f"  Total pets:      {total:,}")
        print(f"  Dogs:            {dogs:,}  ({100*dogs/total:.1f}%)")
        print(f"  Cats:            {cats:,}  ({100*cats/total:.1f}%)")
        print(f"  Indian origin:   {indian:,} ({100*indian/total:.1f}%)")
        print(f"  Adopted:         {success:,} ({100*success/total:.1f}%)")
        print(f"  Not adopted:     {total-success:,} ({100*(total-success)/total:.1f}%)")
        print(f"  Unique breeds:   {len(breeds)}")
        print(f"  Species values:  {sorted(species_set)}  ({'OK' if species_ok else 'ERROR - unexpected!'})")
        print("\n  MongoDB coverage:")
        for b in mongo_breeds:
            cnt    = breeds.get(b, 0)
            status = 'OK' if cnt > 0 else 'MISSING'
            print(f"    [{status}]  {b}  ({cnt} records)")
        print("\n  Top 10 breeds by count:")
        for breed, count in sorted(breeds.items(), key=lambda x: -x[1])[:10]:
            print(f"    {breed:<35} {count:>4} records")
        print(div + '\n')
